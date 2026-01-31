"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Share2, ShoppingBag, Check, ChevronRight, ChevronLeft, Sparkles, ShieldCheck, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getRandomToast } from "@/lib/kannada-toasts";
import CheckoutModal from "@/components/CheckoutModal";
import { useCart } from "@/context/CartContext";

interface Variant {
    color: string;
    sizes?: string[];
    stock?: { [size: string]: number };
    images: string[];
}

interface Item {
    id: number;
    title: string;
    price: number;
    mrp?: number;
    description: string;
    images: string[];
    variants?: Variant[];
    size?: string;
    color?: string;
}

interface ProductClientProps {
    initialItem: Item;
}

export default function ProductClient({ initialItem }: ProductClientProps) {
    const { cart, addToCart, setCartOpen } = useCart();
    const [item] = useState<Item>(initialItem);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isPriority, setIsPriority] = useState(false);
    const [showPriorityOptions, setShowPriorityOptions] = useState(false);
    const [isAdded, setIsAdded] = useState(false);

    // Selection State
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
    const [selectedSize, setSelectedSize] = useState<string>("");
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const PRODUCT_URL_BASE = "https://vastra-mandir.vercel.app/product/";

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 100);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (item?.variants && item.variants.length > 0 && !selectedVariant) {
            setSelectedVariant(item.variants[0]);
        }
    }, [item]);

    useEffect(() => {
        if (selectedVariant) {
            let isValid = false;
            if (selectedVariant.stock) {
                isValid = (selectedVariant.stock[selectedSize] || 0) > 0;
            } else if (selectedVariant.sizes) {
                isValid = selectedVariant.sizes.includes(selectedSize);
            }
            if (!isValid) setSelectedSize("");
            setActiveImageIndex(0);
        }
    }, [selectedVariant]);

    const validateSelection = (): boolean => {
        if (!item) return false;
        if (item.variants && item.variants.length > 0) {
            if (!selectedVariant) {
                toast.error(getRandomToast('validation', 'color'));
                return false;
            }
            if (!selectedSize) {
                toast.error(getRandomToast('validation', 'size'));
                return false;
            }
        }
        return true;
    };

    const handleAddToCart = (): boolean => {
        if (!validateSelection() || !item) return false;

        const sizeToUse = selectedSize || item.size || "NA";
        const colorToUse = selectedVariant?.color || item.color || "NA";
        const currentImages = selectedVariant ? selectedVariant.images : (item?.images || []);
        const imageToUse = currentImages[0] || "/placeholder.jpg";

        addToCart({
            id: `${item.id}-${colorToUse}-${sizeToUse}`,
            itemId: item.id,
            title: item.title,
            price: item.price,
            image: imageToUse,
            color: colorToUse,
            size: sizeToUse,
            quantity: 1
        });

        setIsAdded(true);
        toast.success(getRandomToast('success', 'cart'));
        setTimeout(() => setIsAdded(false), 2000);
        return true;
    };

    const handleShare = () => {
        const url = `${PRODUCT_URL_BASE}${item?.id}`;
        const text = `Check out this ${item?.title} on Vastra Mandir!\n\nPrice: ₹${item?.price}\n\n${url}`;
        if (navigator.share) {
            navigator.share({ title: item?.title, text: text, url: url });
        } else {
            navigator.clipboard.writeText(text);
            toast.success(getRandomToast('success', 'share'));
        }
    };

    const getAvailableSizes = () => {
        if (!selectedVariant) return [];
        if (selectedVariant.stock) return Object.keys(selectedVariant.stock);
        return selectedVariant.sizes || [];
    };

    const getStockForSize = (size: string) => {
        if (!selectedVariant?.stock) return 999;
        return selectedVariant.stock[size] || 0;
    };

    const currentImages = selectedVariant ? selectedVariant.images : (item?.images || []);
    const hasVariants = item.variants && item.variants.length > 0;

    return (
        <div className="min-h-screen bg-[#FDFDFD]">
            {/* Native-style Floating Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`sticky top-0 z-[60] px-4 py-4 md:py-6 flex items-center justify-between transition-all duration-500 ${isScrolled ? 'bg-white/80 backdrop-blur-xl border-b border-gray-100' : 'bg-transparent'
                    }`}
            >
                <Link href="/" className="w-10 h-10 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all active:scale-90">
                    <ArrowLeft size={20} />
                </Link>

                <AnimatePresence>
                    {isScrolled && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="flex-1 text-center"
                        >
                            <h2 className="font-serif text-sm tracking-wide truncate px-4">{item.title}</h2>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">₹{item.price.toLocaleString('en-IN')}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!isScrolled && <span className="font-serif text-lg tracking-[0.2em] uppercase">Vastra Mandir</span>}

                <div className="flex items-center gap-2">
                    <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all active:scale-90">
                        <Share2 size={18} />
                    </button>
                    <button onClick={() => setCartOpen(true)} className="w-10 h-10 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all active:scale-90 relative">
                        <ShoppingBag size={18} />
                        <AnimatePresence>
                            {cart.length > 0 && (
                                <motion.span
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="absolute top-1 right-1 w-4 h-4 bg-black text-white text-[9px] font-bold flex items-center justify-center rounded-full ring-2 ring-white"
                                >
                                    {cart.length}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </motion.header>

            <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 grid lg:grid-cols-2 gap-8 lg:gap-20 py-4 md:py-8 lg:py-12 items-start">
                {/* Visuals - High End Gallery */}
                <div className="space-y-6 lg:sticky lg:top-32">
                    <motion.div
                        layoutId={`product-image-${item.id}`}
                        className="relative aspect-[3/4] lg:max-h-[80vh] bg-gray-50 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/5"
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentImages[activeImageIndex]}
                                initial={{ opacity: 0, scale: 1.05 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                className="absolute inset-0"
                            >
                                <Image
                                    src={currentImages[activeImageIndex]}
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </motion.div>
                        </AnimatePresence>

                        {/* Gallery Pagination Overlay */}
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                            {currentImages.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImageIndex(i)}
                                    className={`h-1.5 transition-all duration-500 rounded-full ${activeImageIndex === i ? 'w-8 bg-white' : 'w-1.5 bg-white/40'}`}
                                />
                            ))}
                        </div>

                        <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                            <button
                                onClick={(e) => { e.preventDefault(); setActiveImageIndex(prev => prev > 0 ? prev - 1 : currentImages.length - 1) }}
                                className="pointer-events-auto w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                onClick={(e) => { e.preventDefault(); setActiveImageIndex(prev => prev < currentImages.length - 1 ? prev + 1 : 0) }}
                                className="pointer-events-auto w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </motion.div>

                    {/* Thumbnails */}
                    <div className="flex gap-4 overflow-x-auto py-2 px-2 scrollbar-hide">
                        {currentImages.map((img, idx) => (
                            <motion.button
                                key={idx}
                                whileHover={{ y: -4 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setActiveImageIndex(idx)}
                                className={`relative w-24 h-32 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-500 ${activeImageIndex === idx ? 'border-black shadow-lg shadow-black/5' : 'border-transparent opacity-40 hover:opacity-100'}`}
                            >
                                <Image src={img} alt="Thumbnail" fill className="object-cover" />
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Information Layer */}
                <div className="flex flex-col pt-4 lg:pt-12 pb-32 lg:pb-0">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-12"
                    >
                        {/* Title & Pricing */}
                        <div className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="flex items-center gap-2 text-emerald-600"
                            >
                                <Sparkles size={14} className="animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Premium Collection</span>
                            </motion.div>

                            <h1 className="font-serif text-4xl md:text-6xl text-gray-900 leading-[1.1] tracking-tight">{item.title}</h1>

                            <div className="flex items-end gap-4 pt-2">
                                <span className="text-3xl md:text-4xl font-light">₹{item.price.toLocaleString('en-IN')}</span>
                                {item.mrp && item.mrp > item.price && ((item.mrp - item.price) / item.mrp) >= 0.5 && (
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-lg text-gray-400 line-through font-serif decoration-gray-300">₹{item.mrp.toLocaleString('en-IN')}</span>
                                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-100">
                                            {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% Savings
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Delivery Highlight */}
                            <div className="flex flex-col gap-2 mt-2">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-emerald-50/50 rounded-xl border border-emerald-100/50 w-fit"
                                >
                                    <div className="w-5 h-5 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm">
                                        <Truck size={12} className="text-white" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-900">Delivery in 2 days - FREE</span>
                                </motion.div>

                                {!showPriorityOptions && (
                                    <button
                                        onClick={() => {
                                            setShowPriorityOptions(true);
                                            setIsPriority(true);
                                        }}
                                        className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-amber-600 hover:text-amber-700 transition-colors pl-1 group"
                                    >
                                        <Sparkles size={10} className="animate-pulse" />
                                        Need it faster?⚡
                                        <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Interaction: Variants */}
                        {hasVariants && (
                            <div className="space-y-10">
                                {/* Color Selection */}
                                {item.variants!.length > 1 && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Select Color</span>
                                            <span className="text-sm font-serif italic text-gray-900">{selectedVariant?.color}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-4">
                                            {item.variants!.map((variant) => (
                                                <motion.button
                                                    key={variant.color}
                                                    whileHover={{ y: -2 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setSelectedVariant(variant)}
                                                    className={`relative w-16 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-500 ${selectedVariant?.color === variant.color ? 'border-black ring-4 ring-black/5 shadow-xl' : 'border-transparent opacity-60'}`}
                                                >
                                                    <Image src={variant.images[0]} alt={variant.color} fill className="object-cover" />
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Size Selection */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Select Size</span>
                                        {selectedSize && <span className="text-sm font-serif italic text-gray-900">Size {selectedSize}</span>}
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {getAvailableSizes().map((s) => {
                                            const stock = getStockForSize(s);
                                            const isOutOfStock = stock <= 0;
                                            return (
                                                <motion.button
                                                    key={s}
                                                    whileHover={!isOutOfStock ? { y: -2 } : {}}
                                                    whileTap={!isOutOfStock ? { scale: 0.95 } : {}}
                                                    onClick={() => !isOutOfStock && setSelectedSize(s)}
                                                    className={`min-w-[60px] h-14 rounded-2xl border text-xs font-bold uppercase tracking-widest transition-all duration-500 relative ${selectedSize === s
                                                        ? 'bg-black text-white border-black shadow-lg shadow-black/10'
                                                        : isOutOfStock
                                                            ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                                            : 'bg-white text-gray-600 border-gray-100 hover:border-black'
                                                        }`}
                                                >
                                                    {s}
                                                    {isOutOfStock && <div className="absolute inset-0 flex items-center justify-center"><div className="w-8 h-[1px] bg-gray-300 rotate-45" /></div>}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                    <AnimatePresence>
                                        {selectedVariant?.stock && selectedSize && getStockForSize(selectedSize) < 5 && getStockForSize(selectedSize) > 0 && (
                                            <motion.p
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.2em] animate-pulse"
                                            >
                                                Limited Edition: Only {getStockForSize(selectedSize)} Remaining
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}

                        {/* Legacy Specs */}
                        {!hasVariants && (item.size || item.color) && (
                            <div className="flex gap-4">
                                {item.size && item.size !== 'NA' && (
                                    <div className="bg-white p-4 rounded-3xl border border-gray-50 shadow-sm flex-1 text-center">
                                        <span className="text-[9px] uppercase tracking-widest text-gray-400 block mb-1">Standard Size</span>
                                        <span className="font-serif text-xl italic">{item.size}</span>
                                    </div>
                                )}
                                {item.color && (
                                    <div className="bg-white p-4 rounded-3xl border border-gray-50 shadow-sm flex-1 text-center">
                                        <span className="text-[9px] uppercase tracking-widest text-gray-400 block mb-1">Primary Color</span>
                                        <span className="font-serif text-xl italic">{item.color}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Shipping Mode Selection */}
                        <AnimatePresence>
                            {showPriorityOptions && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div id="shipping-options" className="space-y-6 pt-8 scroll-mt-32">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Shipping Experience</span>
                                            <span className="text-[9px] text-gray-300 uppercase tracking-widest font-medium">Select Speed</span>
                                        </div>
                                        <div className="grid gap-3">
                                            {/* Standard Free */}
                                            <button
                                                onClick={() => setIsPriority(false)}
                                                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${!isPriority ? 'border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-200/10' : 'border-gray-50 bg-gray-50/30'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${!isPriority ? 'bg-emerald-500 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>
                                                        <Truck size={18} />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className={`text-[11px] font-bold uppercase tracking-widest ${!isPriority ? 'text-emerald-900' : 'text-gray-400'}`}>Standard Delivery</p>
                                                        <p className="text-[10px] text-gray-400">Delivered within 2-3 days</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${!isPriority ? 'text-emerald-600' : 'text-gray-400'}`}>FREE</span>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${!isPriority ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200'}`}>
                                                        {!isPriority && <Check size={12} className="text-white" />}
                                                    </div>
                                                </div>
                                            </button>

                                            {/* Priority Express */}
                                            <button
                                                onClick={() => {
                                                    setIsPriority(true);
                                                }}
                                                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${isPriority ? 'border-amber-400 bg-amber-50/50 shadow-lg shadow-amber-200/20' : 'border-gray-50 bg-gray-50/30'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isPriority ? 'bg-amber-400 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>
                                                        <Sparkles size={18} />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className={`text-[11px] font-bold uppercase tracking-widest ${isPriority ? 'text-amber-900' : 'text-gray-400'}`}>One-Day Express</p>
                                                        <p className="text-[10px] text-gray-400">Priority 24h fulfillment</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isPriority ? 'text-amber-600' : 'text-gray-400'}`}>+₹50</span>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isPriority ? 'bg-amber-400 border-amber-400' : 'border-gray-200'}`}>
                                                        {isPriority && <Check size={12} className="text-white" />}
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Product Utility Info */}
                        <div className="grid grid-cols-2 gap-4 py-8 border-y border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <ShieldCheck size={14} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Authentic Batte</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Truck size={14} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">2-Day Express Delivery</span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-4">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">The Narrative</span>
                            <p className="text-gray-600 leading-relaxed font-light text-sm md:text-base whitespace-pre-line">
                                {item.description}
                            </p>
                        </div>

                        {/* Global Actions */}
                        <div className="fixed bottom-0 left-0 right-0 p-4 lg:p-0 lg:relative lg:block z-[70] bg-white/80 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none border-t border-gray-100 lg:border-none pb-safe">
                            <div className="max-w-md mx-auto flex gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    animate={isAdded ? { scale: [1, 1.05, 1] } : {}}
                                    onClick={handleAddToCart}
                                    className={`flex-1 h-16 rounded-[2rem] text-[11px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group border-2 ${isAdded
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : 'bg-white border-black text-black hover:bg-black hover:text-white'
                                        }`}
                                >
                                    {isAdded ? (
                                        <>
                                            <Check size={18} />
                                            Added!
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingBag size={18} className="group-hover:translate-y-[-1px] transition-transform" />
                                            Add to Bag
                                        </>
                                    )}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => validateSelection() && setIsCheckoutOpen(true)}
                                    className="flex-[1.5] bg-black text-white h-16 rounded-[2rem] text-[11px] font-bold uppercase tracking-[0.2em] shadow-2xl shadow-black/20 flex items-center justify-center gap-3 group"
                                >
                                    Secure Checkout
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                product={{
                    ...item!,
                    color: selectedVariant?.color || item?.color,
                    size: selectedSize || item?.size
                }}
                isCartCheckout={false}
                initialIsUrgent={isPriority}
            />
        </div>
    );
}
