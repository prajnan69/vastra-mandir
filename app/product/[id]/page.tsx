"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Share2, ShoppingBag, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import CheckoutModal from "@/components/CheckoutModal";
import { useCart } from "@/context/CartContext";

interface Variant {
    color: string;
    sizes?: string[]; // Legacy support
    stock?: { [size: string]: number }; // New quantity map
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
    size?: string; // Legacy
    color?: string; // Legacy
}

export default function ProductPage() {
    const params = useParams();
    const { addToCart, setCartOpen } = useCart();
    const [item, setItem] = useState<Item | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    // Selection State
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
    const [selectedSize, setSelectedSize] = useState<string>("");
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Derived State
    const currentImages = selectedVariant ? selectedVariant.images : (item?.images || []);

    const PRODUCT_URL_BASE = "https://vastra-mandir.vercel.app/product/";

    useEffect(() => {
        if (params?.id) {
            fetchItem(params.id as string);
        }
    }, [params]);

    // Auto-select first variant on load
    useEffect(() => {
        if (item?.variants && item.variants.length > 0 && !selectedVariant) {
            setSelectedVariant(item.variants[0]);
        }
    }, [item]);

    // Reset size when variant changes
    useEffect(() => {
        if (selectedVariant) {
            // Logic to check if current selected size is valid/in-stock for new variant
            // If we have stock data, check if qty > 0. If legacy 'sizes' array, check inclusion.

            let isValid = false;
            if (selectedVariant.stock) {
                isValid = (selectedVariant.stock[selectedSize] || 0) > 0;
            } else if (selectedVariant.sizes) {
                isValid = selectedVariant.sizes.includes(selectedSize);
            }

            if (!isValid) {
                setSelectedSize("");
            }
            setActiveImageIndex(0);
        }
    }, [selectedVariant]);

    const fetchItem = async (id: string) => {
        try {
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) setItem(data);
        } catch (error) {
            console.error("Error fetching item:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (): boolean => {
        if (!item) return false;

        // Validation for new variant system
        if (item.variants && item.variants.length > 0) {
            if (!selectedVariant) {
                alert("Please select a color");
                return false;
            }
            if (!selectedSize) {
                alert("Please select a size");
                return false;
            }
        }

        const sizeToUse = selectedSize || item.size || "NA";
        const colorToUse = selectedVariant?.color || item.color || "NA";
        const imageToUse = currentImages[0] || "/placeholder.jpg";

        addToCart({
            id: `${item.id}-${colorToUse}-${sizeToUse}`, // Unique for this combination
            itemId: item.id,
            title: item.title,
            price: item.price,
            image: imageToUse,
            color: colorToUse,
            size: sizeToUse,
            quantity: 1
        });

        setCartOpen(true);
        return true;
    };

    const handleShare = () => {
        const url = `${PRODUCT_URL_BASE}${item?.id}`;
        const text = `Check out this ${item?.title} on Vastra Mandir!\n\nPrice: ₹${item?.price}\n\n${url}`;
        if (navigator.share) {
            navigator.share({
                title: item?.title,
                text: text,
                url: url,
            });
        } else {
            navigator.clipboard.writeText(text);
            alert("Link copied to clipboard!");
        }
    };

    // Helper to get available sizes for current variant
    const getAvailableSizes = () => {
        if (!selectedVariant) return [];

        // New System: Stock Map
        if (selectedVariant.stock) {
            // Return all sizes that exist in the map (even with 0 stock, so we can show them disabled)
            return Object.keys(selectedVariant.stock);
        }

        // Legacy System: Sizes Array
        return selectedVariant.sizes || [];
    };

    const getStockForSize = (size: string) => {
        if (!selectedVariant?.stock) return 999; // Assume in stock if legacy
        return selectedVariant.stock[size] || 0;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 text-center">
                <h2 className="font-serif text-2xl mb-2">Item Not Found</h2>
                <p className="text-gray-400 text-sm mb-6">This item may have been removed or sold out.</p>
                <Link href="/" className="bg-black text-white px-6 py-3 rounded-full text-xs uppercase tracking-widest hover:bg-gray-800 transition-all">
                    Back to Collection
                </Link>
            </div>
        );
    }

    const hasVariants = item.variants && item.variants.length > 0;

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center justify-between">
                <Link href="/" className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <span className="font-serif text-lg tracking-wide">Vastra Mandir</span>
                <button onClick={handleShare} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                    <Share2 size={20} />
                </button>
            </div>

            <div className="max-w-4xl mx-auto p-4 md:p-8 grid md:grid-cols-2 gap-8 lg:gap-12">
                {/* Images */}
                <div className="space-y-4">
                    <div className="relative aspect-[3/4] bg-gray-50 rounded-2xl overflow-hidden shadow-sm">
                        {currentImages[activeImageIndex] && (
                            <Image
                                src={currentImages[activeImageIndex]}
                                alt={item.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        )}
                    </div>
                    {currentImages.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {currentImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImageIndex(idx)}
                                    className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-black opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                >
                                    <Image src={img} alt="Thumbnail" fill className="object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="flex flex-col justify-center">
                    <div className="space-y-6 mb-8">
                        <div>
                            <h1 className="font-serif text-3xl md:text-4xl text-gray-900 leading-tight mb-2">{item.title}</h1>
                            <div className="flex items-end gap-3">
                                <p className="text-2xl font-light">
                                    ₹{item.price.toLocaleString('en-IN')}
                                </p>
                                {item.mrp && item.mrp > item.price && (
                                    <>
                                        <p className="text-lg text-gray-400 line-through mb-1">
                                            ₹{item.mrp.toLocaleString('en-IN')}
                                        </p>
                                        <span className="mb-1 text-green-600 text-sm font-bold uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded">
                                            {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% OFF
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="w-12 h-[1px] bg-black/10"></div>

                        {/* Variants Logic (New) */}
                        {hasVariants && (
                            <div className="space-y-6">
                                {/* Colors (Only show if multiple variants) */}
                                {item.variants!.length > 1 && (
                                    <div className="space-y-2">
                                        <span className="text-xs uppercase tracking-widest text-gray-500">
                                            Color: <span className="text-black font-bold">{selectedVariant?.color}</span>
                                        </span>
                                        <div className="flex flex-wrap gap-3">
                                            {item.variants!.map((variant) => (
                                                <button
                                                    key={variant.color}
                                                    onClick={() => setSelectedVariant(variant)}
                                                    className={`relative w-12 h-16 rounded-lg overflow-hidden border-2 transition-all ${selectedVariant?.color === variant.color ? 'border-black ring-1 ring-black ring-offset-2' : 'border-transparent opacity-80 hover:opacity-100'}`}
                                                >
                                                    <Image src={variant.images[0]} alt={variant.color} fill className="object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Single Color Label (Optional) */}
                                {item.variants!.length === 1 && selectedVariant?.color && !['Standard', 'Default'].includes(selectedVariant.color) && (
                                    <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 inline-block">
                                        <span className="text-[10px] uppercase tracking-widest text-gray-500 block">Color</span>
                                        <span className="font-serif text-lg">{selectedVariant.color}</span>
                                    </div>
                                )}

                                {/* Sizes */}
                                <div className="space-y-2">
                                    <span className="text-xs uppercase tracking-widest text-gray-500">
                                        Size: <span className="text-black font-bold">{selectedSize}</span>
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {getAvailableSizes().map((s) => {
                                            const stock = getStockForSize(s);
                                            const isOutOfStock = stock <= 0;

                                            return (
                                                <button
                                                    key={s}
                                                    onClick={() => !isOutOfStock && setSelectedSize(s)}
                                                    disabled={isOutOfStock}
                                                    className={`min-w-[40px] px-3 py-2 text-sm border rounded-lg transition-all relative ${selectedSize === s
                                                        ? 'bg-black text-white border-black'
                                                        : isOutOfStock
                                                            ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed decoration-slice'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-black'
                                                        }`}
                                                >
                                                    {s}
                                                    {isOutOfStock && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="w-full h-[1px] bg-gray-400 rotate-45 transform"></div>
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {selectedVariant?.stock && selectedSize && getStockForSize(selectedSize) < 5 && getStockForSize(selectedSize) > 0 && (
                                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest animate-pulse">
                                            Only {getStockForSize(selectedSize)} left!
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Legacy Display (Old Items) */}
                        {!hasVariants && (item.size || item.color) && (
                            <div className="flex gap-4 pt-2">
                                {item.size && item.size !== 'NA' && (
                                    <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                                        <span className="text-[10px] uppercase tracking-widest text-gray-500 block">Size</span>
                                        <span className="font-serif text-lg">{item.size}</span>
                                    </div>
                                )}
                                {item.color && (
                                    <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                                        <span className="text-[10px] uppercase tracking-widest text-gray-500 block">Color</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-serif text-lg">{item.color}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <p className="text-gray-600 leading-relaxed font-light whitespace-pre-line pt-2 border-t border-gray-100">
                            {item.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sticky bottom-4 md:static">
                        <button
                            onClick={handleAddToCart}
                            className="w-full bg-white border border-black text-black py-4 rounded-full text-xs uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                        >
                            <ShoppingBag size={16} />
                            Add to Bag
                        </button>
                        <button
                            onClick={() => {
                                const success = handleAddToCart(); // Add to cart first
                                if (success) {
                                    setIsCheckoutOpen(true); // Only open checkout if validation passed
                                }
                            }}
                            className="w-full bg-black text-white py-4 rounded-full text-xs uppercase tracking-widest hover:bg-gray-900 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                        >
                            Buy Now
                        </button>
                    </div>
                </div>
            </div>

            {/* Checkout Modal */}
            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                product={item}
                isCartCheckout={true} // Since we added to cart, we checkout as cart
            />
        </div>
    );
}
