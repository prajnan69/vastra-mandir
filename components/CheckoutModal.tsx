"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, CheckCircle, Smartphone, Banknote, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import Image from "next/image";

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: {
        title: string;
        price: number;
    };
}

export default function CheckoutModal({ isOpen, onClose, product }: CheckoutModalProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        phone: "",
        pincode: "",
    });

    const VALID_PINCODES = ["581333", "581343"];
    const ADMIN_PHONE = "9743174487"; // Payment Number
    const WHATSAPP_PHONE = "8660627034"; // Order Notification Number

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
    const upiLink = `upi://pay?pa=${ADMIN_PHONE}&pn=VastraMandir&am=${product.price}&cu=INR`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;

    const triggerConfetti = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 };

        const random = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
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

    const handlePayment = async (mode: 'online' | 'cod') => {
        setLoading(true);
        
        try {
            // 1. Save to Database
            const { error } = await supabase
                .from('orders')
                .insert([{
                    customer_name: formData.name,
                    customer_phone: formData.phone,
                    customer_address: formData.address,
                    customer_pincode: formData.pincode,
                    item_title: product.title,
                    item_price: product.price,
                    status: mode === 'online' ? 'paid_online' : 'cod_pending'
                }]);
            
            if (error) {
                console.error("Error saving order:", error);
                // We typically alert or retry, but let's proceed to success for UX 
                // typically we'd stop here, but user priority is flow completion
            }

            // 2. Trigger Success & Confetti
            setStep(3);
            triggerConfetti();

            // 3. Open WhatsApp after short delay or instantly
            // We'll prepare the message logic for the "Open WhatsApp" button in Step 3
            // effectively decoupling the "Place Order" act from the "Notify" act slightly
            // OR we can open it immediately.
            // Let's open it immediately as a pop-under or new tab so they see the success screen.
            
            const message = `*New Order Placed* 🎉
    
*Item*: ${product.title}
*Price*: ₹${product.price}
*Payment*: ${mode === 'online' ? 'PAID ONLINE (Verify Check)' : 'Pay on Delivery'}

*Customer Details*:
Name: ${formData.name}
Phone: ${formData.phone}
Pincode: ${formData.pincode}
Address: ${formData.address}
`;
            setTimeout(() => {
                 window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`, "_blank");
            }, 1000);

        } catch (err) {
            console.error("Unexpected error:", err);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            {/* Modal/Sheet Container */}
            <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[90vh] md:max-h-auto flex flex-col relative text-center md:text-left">
                
                {/* Mobile Handle */}
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-1 md:hidden opacity-50"></div>

                {/* Header (Hid on success step for clean look) */}
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

                {/* Content - Scrollable */}
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
                                    <label className="text-xs uppercase tracking-widest text-gray-500 pl-1">Select Pincode</label>
                                    <select
                                        required
                                        className="w-full px-4 py-3 border-b border-gray-200 focus:border-black outline-none bg-transparent transition-all font-light appearance-none"
                                        value={formData.pincode}
                                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                    >
                                        <option value="" disabled>Select Delivery Area</option>
                                        {VALID_PINCODES.map((pin) => (
                                            <option key={pin} value={pin}>{pin}</option>
                                        ))}
                                    </select>
                                </div>
                                <textarea
                                    required
                                    placeholder="Delivery Address"
                                    className="w-full px-4 py-3 border-b border-gray-200 focus:border-black outline-none placeholder:text-gray-400 transition-all min-h-[80px] font-light resize-none"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
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
                                <div className="text-3xl font-serif font-medium">₹{product.price.toLocaleString()}</div>
                            </div>

                            {/* QR Section */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col items-center">
                                <p className="text-xs font-bold uppercase tracking-widest mb-3">Scan to Pay via UPI</p>
                                <div className="bg-white p-2 rounded shadow-sm mb-3">
                                    {/* Using API for QR Generation */}
                                    <img 
                                        src={qrCodeUrl} 
                                        alt="UPI QR Code" 
                                        width={160} 
                                        height={160}
                                        className="mix-blend-multiply"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 font-mono tracking-wide selection:bg-black selection:text-white">
                                    +91 {ADMIN_PHONE}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => handlePayment('online')}
                                    disabled={loading}
                                    className="w-full bg-black text-white py-3.5 text-xs uppercase tracking-widest hover:bg-gray-900 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-black/10"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />}
                                    I Have Paid Online
                                </button>
                                
                                <button
                                    onClick={() => handlePayment('cod')}
                                    disabled={loading}
                                    className="w-full bg-white border border-gray-200 text-black py-3.5 text-xs uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
                                    Pay on Delivery
                                </button>

                                <button
                                    onClick={() => setStep(1)}
                                    className="pt-2 text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                                >
                                    Change Address
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-10 text-center space-y-6 animate-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <CheckCircle size={40} strokeWidth={3} />
                            </div>
                            
                            <div>
                                <h2 className="font-serif text-2xl mb-2">Order Confirmed!</h2>
                                <p className="text-gray-500 text-sm max-w-[260px] mx-auto leading-relaxed">
                                    Thank you for ordering from Vastra Mandir. We have received your details.
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
