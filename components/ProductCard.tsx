"use client";

import Image from "next/image";
import { useState } from "react";
import CheckoutModal from "./CheckoutModal";

interface Product {
    id: number;
    title: string;
    price: number;
    description: string;
    images: string[];
}

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div className="group cursor-pointer" onClick={() => setIsModalOpen(true)}>
                <div className="aspect-[3/4] relative overflow-hidden bg-[#F0F0F0] mb-4">
                    {product.images?.[0] ? (
                        <Image
                            src={product.images[0]}
                            alt={product.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-300 font-serif italic">
                            Vastra Mandir
                        </div>
                    )}
                    {/* Overlay Button on Desktop */}
                    <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:block">
                        <button
                            className="w-full bg-white/90 backdrop-blur text-black py-3 text-xs uppercase tracking-widest font-medium hover:bg-black hover:text-white transition-colors"
                        >
                            Add to Bag
                        </button>
                    </div>
                </div>

                <div className="space-y-1 text-center">
                    <h3 className="font-serif text-lg text-gray-900 group-hover:text-gray-600 transition-colors">
                        {product.title}
                    </h3>
                    <p className="text-xs font-serif italic text-gray-500">
                        {product.price.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </p>

                    {/* Mobile Button - Visible but subtle */}
                    <button
                        className="md:hidden w-full mt-2 border border-black/10 text-black py-3 text-[10px] uppercase tracking-widest font-mediumActive:bg-gray-50"
                    >
                        Add to Bag
                    </button>
                </div>
            </div>

            <CheckoutModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={product}
            />
        </>
    );
}
