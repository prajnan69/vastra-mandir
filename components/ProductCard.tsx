"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface Product {
    id: number;
    title: string;
    price: number;
    mrp?: number;
    description: string;
    images: string[];
    is_sold_out?: boolean;
}

interface ProductCardProps {
    product: Product;
    index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.8,
                delay: index * 0.1,
                ease: [0.16, 1, 0.3, 1]
            }}
        >
            <Link
                href={`/product/${product.id}`}
                className={`group cursor-pointer block ${product.is_sold_out ? 'opacity-75 pointer-events-none' : ''}`}
            >
                <div className="aspect-[3/4] relative overflow-hidden bg-[#F0F0F0] mb-3 md:mb-5 rounded-2xl shadow-sm group-hover:shadow-md transition-shadow duration-500">
                    {product.images?.[0] ? (
                        <Image
                            src={product.images[0]}
                            alt={product.title}
                            fill
                            className={`object-cover transition-transform duration-1000 ease-[cubic-bezier(0.16, 1, 0.3, 1)] ${product.is_sold_out ? 'grayscale' : 'group-hover:scale-110'}`}
                            sizes="(max-width: 768px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-300 font-serif italic bg-gray-50 uppercase tracking-widest text-[10px]">
                            Vastra Mandir
                        </div>
                    )}

                    {/* Gradient Overlay for better text readability and depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {product.is_sold_out && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
                            <span className="bg-white/90 text-black text-[10px] font-bold uppercase px-4 py-2 tracking-[0.2em] shadow-sm">
                                Sold Out
                            </span>
                        </div>
                    )}

                    {/* Quality Badge / New Tag placeholder if needed */}
                    {!product.is_sold_out && product.mrp && product.mrp > product.price && ((product.mrp - product.price) / product.mrp) >= 0.5 && (
                        <div className="absolute top-4 left-4">
                            <span className="bg-black/80 backdrop-blur-sm text-white text-[9px] font-bold uppercase px-2 py-1 tracking-widest rounded-sm">
                                Sale
                            </span>
                        </div>
                    )}

                    {/* Desktop Hover Action */}
                    {!product.is_sold_out && (
                        <div className="absolute inset-x-0 bottom-6 px-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-[cubic-bezier(0.16, 1, 0.3, 1)] hidden md:block">
                            <div className="w-full bg-white text-black py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-center shadow-xl hover:bg-black hover:text-white transition-colors duration-300">
                                Explore Detail
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-2 text-center px-2">
                    <h3 className="font-serif text-base md:text-xl text-gray-900 group-hover:text-gray-500 transition-colors duration-300 truncate">
                        {product.title}
                    </h3>

                    <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center justify-center gap-2">
                            {product.mrp && product.mrp > product.price && ((product.mrp - product.price) / product.mrp) >= 0.5 && (
                                <span className="text-[10px] md:text-xs font-serif line-through text-gray-400 decoration-gray-300">
                                    ₹{product.mrp.toLocaleString('en-IN')}
                                </span>
                            )}
                            <span className="text-xs md:text-sm font-serif italic text-gray-700 font-medium">
                                ₹{product.price.toLocaleString('en-IN')}
                            </span>
                        </div>

                        {product.mrp && product.mrp > product.price && ((product.mrp - product.price) / product.mrp) >= 0.5 && (
                            <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-[0.15em] bg-emerald-50/50 px-2 py-0.5 rounded-full">
                                {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% Savings
                            </span>
                        )}
                    </div>

                    {/* Mobile Cta - Elegant bottom border reveal on scroll or just subtle always */}
                    {!product.is_sold_out && (
                        <div className="md:hidden pt-1">
                            <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-black border-b border-black/10 pb-1">
                                View Details
                            </span>
                        </div>
                    )}
                </div>
            </Link>
        </motion.div>
    );
}
