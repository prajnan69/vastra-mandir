"use client";

import Image from "next/image";
import Link from "next/link";

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
}

export default function ProductCard({ product }: ProductCardProps) {
    return (
        <Link
            href={`/product/${product.id}`}
            className={`group cursor-pointer block ${product.is_sold_out ? 'opacity-75 pointer-events-none' : ''}`}
        >
            <div className="aspect-[3/4] relative overflow-hidden bg-[#F0F0F0] mb-2 md:mb-4">
                {product.images?.[0] ? (
                    <Image
                        src={product.images[0]}
                        alt={product.title}
                        fill
                        className={`object-cover transition-transform duration-700 ease-out ${product.is_sold_out ? 'grayscale' : 'group-hover:scale-105'}`}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-300 font-serif italic">
                        Vastra Mandir
                    </div>
                )}

                {product.is_sold_out && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-grayscale">
                        <span className="bg-black text-white text-xs font-bold uppercase px-3 py-1 tracking-widest">
                            Sold Out
                        </span>
                    </div>
                )}

                {/* Overlay Button on Desktop - Only if available */}
                {!product.is_sold_out && (
                    <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:block">
                        <div className="w-full bg-white/90 backdrop-blur text-black py-3 text-xs uppercase tracking-widest font-medium text-center">
                            View Details
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-1 text-center">
                <h3 className="font-serif text-sm md:text-lg text-gray-900 group-hover:text-gray-600 transition-colors truncate px-1">
                    {product.title}
                </h3>
                <div className="flex items-center justify-center gap-2">
                    {/* MRP Logic */}
                    {product.mrp && product.mrp > product.price && (
                        <p className="text-[10px] md:text-xs font-serif line-through text-gray-400">
                            {product.mrp.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </p>
                    )}
                    <p className="text-[10px] md:text-xs font-serif italic text-gray-500">
                        {product.price.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </p>
                </div>

                {/* Show Discount Badge if MRP is present */}
                {product.mrp && product.mrp > product.price && (
                    <span className="text-[9px] text-green-600 font-bold uppercase tracking-widest">
                        {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                    </span>
                )}

                {/* Mobile Button - Visible but subtle */}
                {!product.is_sold_out ? (
                    <div className="md:hidden w-full mt-2 border border-black/10 text-black py-3 text-[10px] uppercase tracking-widest font-medium">
                        View Details
                    </div>
                ) : (
                    <p className="md:hidden w-full mt-2 text-center text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                        Sold Out
                    </p>
                )}
            </div>
        </Link>
    );
}
