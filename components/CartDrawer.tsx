"use client";

import { useCart } from "@/context/CartContext";
import { X, ShoppingBag, Trash2, ArrowRight, Minus, Plus } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function CartDrawer() {
    const { cart, cartOpen, setCartOpen, removeFromCart, updateQuantity, setCheckoutOpen } = useCart();

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <AnimatePresence>
            {cartOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setCartOpen(false)}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
                    >
                        {/* Header */}
                        <div className="px-6 py-6 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-50 flex items-center justify-center rounded-full">
                                    <ShoppingBag size={20} className="text-gray-900" />
                                </div>
                                <div>
                                    <h2 className="font-serif text-xl">Your Bag</h2>
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                                        {cart.length} {cart.length === 1 ? 'item' : 'items'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setCartOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-90"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scrollbar-hide">
                            <AnimatePresence mode="popLayout">
                                {cart.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="h-full flex flex-col items-center justify-center text-center space-y-4"
                                    >
                                        <div className="w-20 h-20 bg-gray-50 flex items-center justify-center rounded-3xl mb-4">
                                            <ShoppingBag size={32} className="text-gray-200" />
                                        </div>
                                        <p className="font-serif text-xl italic text-gray-400">Your bag is empty.</p>
                                        <button
                                            onClick={() => setCartOpen(false)}
                                            className="text-[10px] font-bold uppercase tracking-widest text-black border-b border-black pb-1 hover:text-gray-500 hover:border-gray-500 transition-colors"
                                        >
                                            Continue Browsing
                                        </button>
                                    </motion.div>
                                ) : (
                                    cart.map((item, index) => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20, scale: 0.95 }}
                                            transition={{ duration: 0.4, delay: index * 0.05 }}
                                            className="flex gap-5 group"
                                        >
                                            <div className="relative w-24 h-32 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden shadow-sm">
                                                <Image
                                                    src={item.image}
                                                    alt={item.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>

                                            <div className="flex-1 flex flex-col">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="font-serif text-base text-gray-900 leading-tight">
                                                        {item.title}
                                                    </h3>
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-4">
                                                    <span>{item.color}</span>
                                                    <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                                    <span>{item.size}</span>
                                                </div>

                                                <div className="mt-auto flex items-center justify-between">
                                                    <div className="flex items-center bg-gray-50 rounded-full px-2 py-1 gap-4 border border-gray-100">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-full transition-all active:scale-90"
                                                        >
                                                            <Minus size={12} />
                                                        </button>
                                                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-full transition-all active:scale-90"
                                                        >
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>
                                                    <span className="font-serif text-lg font-medium">
                                                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        {cart.length > 0 && (
                            <div className="p-6 bg-white border-t border-gray-100 space-y-4 pb-safe">
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Subtotal</p>
                                        <p className="text-[10px] text-gray-400 font-medium">Taxes and shipping calculated at checkout</p>
                                    </div>
                                    <p className="text-3xl font-serif">₹{total.toLocaleString('en-IN')}</p>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        setCartOpen(false);
                                        setCheckoutOpen(true);
                                    }}
                                    className="w-full bg-black text-white py-5 rounded-[2rem] text-xs font-bold uppercase tracking-[0.2em] shadow-xl shadow-black/10 flex items-center justify-center gap-3 group"
                                >
                                    Proceed to Checkout
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </motion.button>

                                <p className="text-center text-[9px] uppercase tracking-widest text-gray-300 font-medium pb-2">
                                    Secure Checkout Guaranteed
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
