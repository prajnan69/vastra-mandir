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
            <div className="group relative border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300">
                <div className="aspect-square relative overflow-hidden bg-gray-100">
                    {product.images?.[0] ? (
                        <Image
                            src={product.images[0]}
                            alt={product.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            No Image
                        </div>
                    )}
                </div>

                <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-lg leading-tight truncate">
                        {product.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">
                        {product.description}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                        <span className="font-bold text-lg">
                            ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                            Buy Now
                        </button>
                    </div>
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
