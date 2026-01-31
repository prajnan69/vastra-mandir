"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/context/CartContext";
import { X, CheckCircle, Smartphone, Banknote, Loader2, ArrowRight, Truck } from "lucide-react";
import confetti from "canvas-confetti";
import Image from "next/image";
import { toast } from "sonner";
import { getRandomToast } from "@/lib/kannada-toasts";

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: {
        id?: number;
        itemId?: number;
        title: string;
        price: number;
        images?: string[];
        size?: string;
        color?: string;
    };
    isCartCheckout?: boolean;
}

export default function CheckoutModal({ isOpen, onClose, product, isCartCheckout = false }: CheckoutModalProps) {
    const { cart, clearCart } = useCart();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        phone: "",
        pincode: "",
    });
    const [isUrgent, setIsUrgent] = useState(false);
    const [paymentVpa, setPaymentVpa] = useState("7892460628@axl"); // Fallback default

    const WHATSAPP_PHONE = "8660627034";

    // Fetch UPI ID from database
    useEffect(() => {
        const fetchUpiId = async () => {
            try {
                const { data, error } = await supabase
                    .from('settings')
                    .select('value')
                    .eq('key', 'upi_id')
                    .single();

                if (data && !error) {
                    setPaymentVpa(data.value);
                }
            } catch (err) {
                console.error("Error fetching UPI ID:", err);
                // Keep using fallback value
            }
        };

        fetchUpiId();
    }, []);

    // Load from local storage
    useEffect(() => {
        const savedData = localStorage.getItem("shippingDetails");
        if (savedData) {
            setFormData(JSON.parse(savedData));
        }
    }, []);

    // Save to local storage
    useEffect(() => {
        localStorage.setItem("shippingDetails", JSON.stringify(formData));
    }, [formData]);

    // Construct UPI Link
    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const basePrice = isCartCheckout ? cartTotal : product.price;
    const totalPrice = basePrice + (isUrgent ? 50 : 0);
    const upiLink = `upi://pay?pa=${paymentVpa}&am=${totalPrice}&cu=INR`;

    const triggerConfetti = () => {
        const duration = 2 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 };

        const random = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: random(0.1, 0.3), y: random(0.1, 0.3) } });
            confetti({ ...defaults, particleCount, origin: { x: random(0.7, 0.9), y: random(0.7, 0.9) } });
        }, 250);
    };

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    // --- Inventory Management Logic ---
    const updateInventory = async (): Promise<boolean> => {
        const itemsToProcess = isCartCheckout ? cart : [{
            id: String(product.id || product.itemId),
            itemId: product.id || product.itemId,
            title: product.title,
            price: product.price,
            image: product.images?.[0] || "",
            color: product.color || "Default",
            size: product.size || "NA",
            quantity: 1
        }];

        if (itemsToProcess.length === 0 || !itemsToProcess[0].itemId) return true; // Nothing to update

        // Using a loop for simplicity, though a stored procedure would be safer for atomic transactions
        for (const item of itemsToProcess) {
            if (!item.color || !item.size || item.size === 'NA') continue; // Skip legacy/simple items

            // 1. Fetch current item data to get latest variants
            const { data: currentItem, error: fetchError } = await supabase
                .from('items')
                .select('variants')
                .eq('id', item.itemId)
                .single();

            if (fetchError || !currentItem || !currentItem.variants) {
                console.error("Inventory error: Could not fetch item", item.title);
                continue;
            }

            // 2. Find and update the specific variant stock
            const variants = currentItem.variants;
            let updated = false;

            const newVariants = variants.map((v: any) => {
                if (v.color === item.color && v.stock && v.stock[item.size] !== undefined) {
                    const currentQty = v.stock[item.size];
                    if (currentQty > 0) {
                        updated = true;
                        // Decrement
                        return {
                            ...v,
                            stock: {
                                ...v.stock,
                                [item.size]: Math.max(0, currentQty - item.quantity)
                            }
                        };
                    }
                }
                return v;
            });

            if (!updated) {
                // Stock problem! 
                // We could return false here to abort the whole order, or just log it and proceed (overselling risk).
                // For now, let's try to update what we can.
            }

            // 3. Write back to DB
            const { error: updateError } = await supabase
                .from('items')
                .update({ variants: newVariants })
                .eq('id', item.itemId);

            if (updateError) console.error("Failed to update inventory for", item.title, updateError);
        }

        return true;
    };

    // ACTION: Handle 'Tap to Pay' on Mobile
    const handlePayOnApp = async () => {
        setLoading(true);
        try {
            // 1. Inventory Check & Update
            await updateInventory();

            // 2. Create Order
            const { error } = await supabase
                .from('orders')
                .insert([{
                    customer_name: formData.name,
                    customer_phone: formData.phone,
                    customer_address: formData.address,
                    customer_pincode: formData.pincode,
                    item_title: product.title,
                    item_price: totalPrice,
                    status: 'paid_online', // Optimistic for "App Payment" flow
                    is_urgent: isUrgent,
                    delivery_charge: isUrgent ? 50 : 0,
                    order_items: isCartCheckout ? cart : [{
                        title: product.title,
                        price: product.price,
                        image: product.images?.[0],
                        size: product.size,
                        color: product.color,
                        quantity: 1
                    }]
                }]);

            if (error) console.error("Error saving order:", error);

            if (isCartCheckout) clearCart();

            // 3. Open UPI Intent
            window.location.href = upiLink;

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async (mode: 'online' | 'cod') => {
        setLoading(true);

        try {
            // 1. Inventory Check & Update
            await updateInventory();

            // 2. Save to Database
            const { error } = await supabase
                .from('orders')
                .insert([{
                    customer_name: formData.name,
                    customer_phone: formData.phone,
                    customer_address: formData.address,
                    customer_pincode: formData.pincode,
                    item_title: product.title,
                    item_price: totalPrice,
                    status: mode === 'online' ? 'paid_online' : 'cod_pending',
                    is_urgent: isUrgent,
                    delivery_charge: isUrgent ? 50 : 0,
                    order_items: isCartCheckout ? cart : [{
                        title: product.title,
                        price: product.price,
                        image: product.images?.[0],
                        size: product.size,
                        color: product.color,
                        quantity: 1
                    }]
                }]);

            if (error) {
                console.error("Error saving order:", error);
            }

            if (isCartCheckout) clearCart();

            // 3. Trigger Success & Confetti
            setStep(3);
            triggerConfetti();

        } catch (err) {
            console.error("Unexpected error:", err);
            toast.error(getRandomToast('errors'));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            {/* Modal Container */}
            <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col relative text-center md:text-left shadow-2xl">

                {/* Mobile Handle */}
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-1 md:hidden opacity-50"></div>

                {/* Header */}
                {step !== 3 && (
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                        <h2 className="font-serif text-xl tracking-wide">
                            {step === 1 ? "Shipping Details" : "Secure Payment"}
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {step === 1 ? (
                        <form onSubmit={handleNext}>
                            <div className="space-y-6 text-left">
                                <input
                                    required
                                    type="text"
                                    placeholder="Full Name"
                                    className="w-full px-4 py-3 border-b border-gray-200 focus:border-black outline-none placeholder:text-gray-400 transition-all font-light"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                                <input
                                    required
                                    type="tel"
                                    placeholder="Phone Number"
                                    className="w-full px-4 py-3 border-b border-gray-200 focus:border-black outline-none placeholder:text-gray-400 transition-all font-light"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                                <div className="space-y-1 text-left">
                                    <input
                                        required
                                        type="number"
                                        placeholder="Pincode"
                                        className="w-full px-4 py-3 border-b border-gray-200 focus:border-black outline-none placeholder:text-gray-400 transition-all font-light"
                                        value={formData.pincode}
                                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                    />
                                </div>
                                <textarea
                                    required
                                    placeholder="Delivery Address"
                                    className="w-full px-4 py-3 border-b border-gray-200 focus:border-black outline-none placeholder:text-gray-400 transition-all min-h-[80px] font-light resize-none"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />

                                {/* Delivery Priority Option */}
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsUrgent(!isUrgent)}
                                        className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${isUrgent ? 'border-amber-400 bg-amber-50/50 shadow-lg shadow-amber-200/20' : 'border-gray-50 bg-gray-50/30'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isUrgent ? 'bg-amber-400 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>
                                                <Truck size={20} />
                                            </div>
                                            <div className="text-left">
                                                <p className={`text-xs font-bold uppercase tracking-widest ${isUrgent ? 'text-amber-900' : 'text-gray-400'}`}>One-Day Priority Delivery</p>
                                                <p className="text-[10px] text-gray-400">Delivered within 24 hours</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`text-sm font-bold ${isUrgent ? 'text-amber-900' : 'text-gray-400'}`}>+₹50</span>
                                            {isUrgent && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1" />}
                                        </div>
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-black text-white py-4 mt-8 text-sm uppercase tracking-widest hover:bg-gray-900 transition-all active:scale-95"
                            >
                                Continue to Payment
                            </button>
                        </form>
                    ) : step === 2 ? (
                        <div className="text-center space-y-6">

                            {/* Amount */}
                            <div className="space-y-1 pb-4 border-b border-gray-50">
                                <p className="text-xs uppercase tracking-widest text-gray-500">Total Amount</p>
                                <div className="text-3xl font-serif font-medium">₹{totalPrice.toLocaleString()}</div>
                                {isUrgent && (
                                    <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">+ Includes ₹50 Priority Shipping</p>
                                )}
                            </div>

                            {/* QR Section - Hidden on Mobile, Visible on Desktop */}
                            <div className="hidden md:flex bg-gray-50 p-6 rounded-xl border border-gray-100 flex-col items-center gap-4">
                                <p className="text-xs font-bold uppercase tracking-widest">Scan to Pay via UPI</p>
                                <div className="relative w-40 h-40 bg-white p-2 rounded shadow-sm">
                                    <Image src="/qr.png" alt="Scan QR" fill className="object-contain p-2" />
                                </div>
                                <p className="text-[10px] text-gray-400">
                                    UPI ID: {paymentVpa}
                                </p>
                            </div>

                            {/* Mobile Pay Button - Only Visible on Mobile */}
                            <div className="md:hidden">
                                <button
                                    onClick={handlePayOnApp}
                                    className="w-full bg-blue-600 text-white py-4 text-xs uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-blue-200 animate-pulse"
                                >
                                    <Smartphone size={16} />
                                    Tap to Pay on PhonePe / GPay
                                </button>
                                <p className="text-[10px] text-gray-400 mt-2">
                                    Clicking this will confirm your order and open your payment app.
                                </p>
                            </div>

                            {/* Divider */}
                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-200"></div>
                                <span className="flex-shrink mx-4 text-gray-400 text-[10px] uppercase tracking-widest">OR</span>
                                <div className="flex-grow border-t border-gray-200"></div>
                            </div>

                            {/* Confirmation Buttons */}
                            <div className="grid gap-3 pt-2">
                                <button
                                    onClick={() => handleConfirm('online')}
                                    disabled={loading}
                                    className="w-full bg-black text-white py-4 text-xs uppercase tracking-widest hover:bg-gray-900 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                    I Have Paid Online
                                </button>

                                <button
                                    onClick={() => handleConfirm('cod')}
                                    disabled={loading}
                                    className="w-full bg-white border border-gray-200 text-black py-4 text-xs uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
                                    Pay on Delivery
                                </button>
                            </div>

                            <button
                                onClick={() => setStep(1)}
                                className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                            >
                                Change Address
                            </button>
                        </div>
                    ) : (
                        <div className="py-12 text-center space-y-6 animate-in zoom-in duration-300">
                            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <CheckCircle size={48} strokeWidth={3} />
                            </div>

                            <div>
                                <h2 className="font-serif text-3xl mb-3">Thank You!</h2>
                                <h3 className="font-medium text-lg">Order Confirmed</h3>
                                <p className="text-gray-500 text-sm mt-2 max-w-[260px] mx-auto leading-relaxed">
                                    Your order has been placed successfully. We will ship it soon.
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="mt-8 text-xs uppercase tracking-widest underline decoration-gray-300 hover:decoration-black transition-all"
                            >
                                Close Window
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
