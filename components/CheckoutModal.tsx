"use client";

import { useState } from "react";
import { X, CheckCircle } from "lucide-react";
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
    const [step, setStep] = useState<1 | 2>(1);
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        phone: "",
    });

    if (!isOpen) return null;

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    const handleConfirmPayment = () => {
        // Construct WhatsApp Message
        const phoneNumber = "YOUR_PHONE_NUMBER"; // REPLACE THIS WITH USER'S NUMBER
        const message = `*New Order Placed*
    
*Item*: ${product.title}
*Price*: ₹${product.price}

*Customer Details*:
Name: ${formData.name}
Phone: ${formData.phone}
Address: ${formData.address}

*Status*: Payment Completed (Manual Verification Pending)
    `;

        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="font-semibold text-lg">
                        {step === 1 ? "Shipping Details" : "Payment"}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* content */}
                <div className="p-6">
                    {step === 1 ? (
                        <form onSubmit={handleNext} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="John Doe"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Phone Number</label>
                                <input
                                    required
                                    type="tel"
                                    placeholder="+91 9876543210"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Delivery Address</label>
                                <textarea
                                    required
                                    placeholder="Full address with pincode..."
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none transition-all min-h-[100px]"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-all active:scale-95"
                            >
                                Continue to Payment
                            </button>
                        </form>
                    ) : (
                        <div className="text-center space-y-6">
                            <div className="space-y-2">
                                <p className="text-sm text-gray-500">Scan QR to Pay</p>
                                <div className="text-3xl font-bold">₹{product.price}</div>
                            </div>

                            {/* QR Code Placeholder */}
                            <div className="relative w-48 h-48 mx-auto bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                                <p className="text-xs text-center text-gray-400 p-4">
                                    REPLACE WITH YOUR QR CODE IMAGE
                                </p>
                                {/* 
                 Uncomment and use actual image:
                 <Image src="/qr.jpg" alt="QR Code" fill className="object-cover rounded-xl" /> 
                 */}
                            </div>

                            <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm">
                                <p>After payment, click confirming below to verify via WhatsApp.</p>
                            </div>

                            <button
                                onClick={handleConfirmPayment}
                                className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={18} />
                                I Have Paid
                            </button>

                            <button
                                onClick={() => setStep(1)}
                                className="text-sm text-gray-500 hover:text-black underline"
                            >
                                Back to details
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
