"use client";

import { useCart } from "@/context/CartContext";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import CheckoutModal from "./CheckoutModal";

export default function CartDrawer() {
    const { cart, cartOpen, setCartOpen, removeFromCart, addToCart, cartTotal } = useCart();
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    if (!cartOpen) return null;

    const handleCheckout = () => {
        setIsCheckoutOpen(true);
        // We don't close the cart drawer here, the checkout modal will overlay it
    };

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => setCartOpen(false)}
            ></div>

            {/* Sidebar */}
            <div className="relative w-full max-w-sm bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShoppingBag size={20} />
                        <h2 className="font-serif text-lg tracking-wide">Your Cart ({cart.length})</h2>
                    </div>
                    <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                            <ShoppingBag size={48} className="text-gray-300" />
                            <p className="text-gray-400 font-serif">Your cart is empty</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.id} className="flex gap-4">
                                <div className="relative w-20 h-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                        <h3 className="font-serif text-sm text-gray-900 line-clamp-2 leading-tight">{item.title}</h3>
                                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                                            {item.size !== 'NA' && <span className="mr-2">Size: {item.size}</span>}
                                            {item.color && <span>Color: {item.color}</span>}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="font-medium text-sm">₹{item.price.toLocaleString()}</p>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-widest text-gray-500">Subtotal</span>
                            <span className="font-serif text-xl">₹{cartTotal.toLocaleString()}</span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            className="w-full bg-black text-white py-4 text-xs uppercase tracking-widest hover:bg-gray-900 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </div>

            {/* Checkout Modal Overlay - Passing a dummy product for now, will refactor CheckoutModal next */}
            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                // We will modify CheckoutModal to handle cart items internally if product prop is missing or special flag is set
                product={{ title: `Cart Order (${cart.length} items)`, price: cartTotal }}
                isCartCheckout={true}
            />
        </div>
    );
}
