"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Share2, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import CheckoutModal from "@/components/CheckoutModal";

interface Item {
    id: number;
    title: string;
    price: number;
    description: string;
    images: string[];
    size?: string;
    color?: string;
}

export default function ProductPage() {
    const params = useParams();
    const [item, setItem] = useState<Item | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const PRODUCT_URL_BASE = "https://vastra-mandir.vercel.app/product/";

    useEffect(() => {
        if (params?.id) {
            fetchItem(params.id as string);
        }
    }, [params]);

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
                        <Image
                            src={item.images[activeImageIndex]}
                            alt={item.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                    {item.images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {item.images.map((img, idx) => (
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
                    <div className="space-y-4 mb-8">
                        <div>
                            <h1 className="font-serif text-3xl md:text-4xl text-gray-900 leading-tight mb-2">{item.title}</h1>
                            <p className="text-2xl font-light">₹{item.price.toLocaleString()}</p>
                        </div>

                        <div className="w-12 h-[1px] bg-black/10"></div>

                        <p className="text-gray-600 leading-relaxed font-light whitespace-pre-line">
                            {item.description}
                        </p>

                        {(item.size || item.color) && (
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
                    </div>

                    <div className="space-y-3 sticky bottom-4 md:static">
                        <button
                            onClick={() => setIsCheckoutOpen(true)}
                            className="w-full bg-black text-white py-4 rounded-full text-sm uppercase tracking-widest hover:bg-gray-900 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
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
            />
        </div>
    );
}
