"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle } from "lucide-react";

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: {
        title: string;
        price: number;
    };
}

export default function CheckoutModal({ isOpen, onClose, product }: CheckoutModalProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        phone: "",
        pincode: "",
    });

    const VALID_PINCODES = ["581333", "581343"];

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

    if (!isOpen) return null;

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    const handleConfirmPayment = () => {
        // Construct WhatsApp Message
        const phoneNumber = "8660627034";
        const message = `*New Order Placed*
    
*Item*: ${product.title}
*Price*: ₹${product.price}

*Customer Details*:
Name: ${formData.name}
Phone: ${formData.phone}
Pincode: ${formData.pincode}
Address: ${formData.address}

*Payment Mode*: Pay on Delivery (COD)
    `;

        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            {/* Modal/Sheet Container */}
            <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[90vh] md:max-h-auto flex flex-col">

                {/* Mobile Handle */}
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-1 md:hidden opacity-50"></div>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                    <h2 className="font-serif text-xl tracking-wide">
                        {step === 1 ? "Shipping Details" : "Confirm Order"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 overflow-y-auto">
                    {step === 1 ? (
                        <form onSubmit={handleNext}>
                            <div className="space-y-6">
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
                                <div className="space-y-1">
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
                                Continue
                            </button>
                        </form>
                    ) : (
                        <div className="text-center space-y-8 py-4">
                            <div className="space-y-2">
                                <p className="text-xs uppercase tracking-widest text-gray-500">Total Amount</p>
                                <div className="text-4xl font-serif font-medium">₹{product.price.toLocaleString()}</div>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-2">
                                <h3 className="font-serif text-lg">Pay on Delivery</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Place your order now via WhatsApp. You can pay via Cash or UPI when the item arrives.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={handleConfirmPayment}
                                    className="w-full bg-black text-white py-4 text-sm uppercase tracking-widest hover:bg-gray-900 transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <CheckCircle size={18} />
                                    Place Order on WhatsApp
                                </button>

                                <button
                                    onClick={() => setStep(1)}
                                    className="text-xs uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
                                >
                                    Edit Details
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
