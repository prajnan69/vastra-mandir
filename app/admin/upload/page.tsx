"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, X, Loader2, Plus, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

export default function AdminUploadPage() {
    const [pin, setPin] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [imageUrls, setImageUrls] = useState<string[]>([]);

    // Uploaded Item State for Success View
    const [uploadedItem, setUploadedItem] = useState<{ title: string, price: string, description: string, id: number } | null>(null);

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === "6090") {
            setIsAuthenticated(true);
        } else {
            alert("Incorrect PIN");
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newImages = Array.from(e.target.files);
            if (images.length + newImages.length > 5) {
                alert("Maximum 5 images allowed");
                return;
            }
            setImages([...images, ...newImages]);

            // Create preview URLs
            const newUrls = newImages.map(file => URL.createObjectURL(file));
            setImageUrls([...imageUrls, ...newUrls]);
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);

        const newUrls = [...imageUrls];
        URL.revokeObjectURL(newUrls[index]); // Cleanup
        newUrls.splice(index, 1);
        setImageUrls(newUrls);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const uploadedImageUrls: string[] = [];

            // 1. Upload Images to Supabase Storage
            for (const image of images) {
                const fileName = `${Date.now()}-${image.name}`;
                const { data, error } = await supabase.storage
                    .from('products')
                    .upload(fileName, image);

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('products')
                    .getPublicUrl(fileName);

                uploadedImageUrls.push(publicUrl);
            }

            // 2. Insert Item into Database
            const { data, error: insertError } = await supabase
                .from('items')
                .insert([{
                    title,
                    price: parseFloat(price),
                    description,
                    images: uploadedImageUrls
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            // 3. Show Success & Copy Option
            if (data) {
                setUploadedItem({
                    title,
                    price,
                    description,
                    id: data.id
                });
            }

            // Reset Form (Wait for user to dismiss success screen to fully reset logic if needed, but here we just clear state)
            setTitle("");
            setPrice("");
            setDescription("");
            setImages([]);
            setImageUrls([]);

        } catch (error: unknown) {
            console.error("Upload error:", error);
            if (error instanceof Error) {
                alert(`Error: ${error.message}`);
            } else {
                alert("An unknown error occurred during upload.");
            }
        } finally {
            setLoading(false);
        }
    };

    const copyForWhatsApp = () => {
        if (!uploadedItem) return;
        const link = `https://vastra-mandir.vercel.app/product/${uploadedItem.id}`;
        const text = `*${uploadedItem.title}*\n\n${uploadedItem.description}\n\n*Price: ₹${uploadedItem.price}*\n\n🛒 Buy Here: ${link}`;

        navigator.clipboard.writeText(text);
        alert("Copied to clipboard! Ready to paste in WhatsApp.");
    };

    const resetUpload = () => {
        setUploadedItem(null);
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] text-center p-4">
                <div className="max-w-xs w-full space-y-8">
                    <h1 className="font-serif text-2xl tracking-widest uppercase">Admin Access</h1>
                    <form onSubmit={handlePinSubmit} className="space-y-6">
                        <input
                            type="password"
                            placeholder="Enter PIN"
                            className="w-full text-center px-4 py-3 bg-transparent border-b border-gray-300 focus:border-black outline-none tracking-[0.5em] text-xl font-light placeholder:tracking-normal placeholder:text-sm"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="w-full bg-black text-white py-3 text-xs uppercase tracking-widest hover:bg-gray-900 transition-all"
                        >
                            Enter Verification
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (uploadedItem) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center space-y-6 animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                        <Loader2 size={0} className="hidden" /> {/* Dummy to keep import valid if unused */}
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>

                    <div>
                        <h2 className="font-serif text-2xl mb-2">Item Published!</h2>
                        <p className="text-gray-500 text-sm">Your item is now live on the store.</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl text-left text-sm space-y-2 border border-gray-100">
                        <p className="font-bold">{uploadedItem.title}</p>
                        <p className="text-gray-500 line-clamp-2">{uploadedItem.description}</p>
                        <p className="text-blue-600 underline text-xs break-all">https://vastra-mandir.vercel.app/product/{uploadedItem.id}</p>
                    </div>

                    <button
                        onClick={copyForWhatsApp}
                        className="w-full bg-green-600 text-white py-4 rounded-xl font-bold uppercase tracking-wide hover:bg-green-700 shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2"
                    >
                        Copy for WhatsApp
                    </button>

                    <button
                        onClick={resetUpload}
                        className="w-full text-gray-400 text-xs uppercase tracking-widest hover:text-black mt-4"
                    >
                        Upload Another Item
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] p-6 md:p-12">
            <div className="max-w-2xl mx-auto bg-white p-8 md:p-12 shadow-sm border border-gray-50">
                <div className="mb-12 text-center">
                    <h1 className="font-serif text-3xl mb-2">New Collection Item</h1>
                    <p className="text-gray-400 text-xs uppercase tracking-widest">Add details to the catalog</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-12">

                    {/* Basic Info */}
                    <div className="space-y-8">
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-widest text-gray-500">Product Title</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Royal Silk Saree"
                                className="w-full py-2 border-b border-gray-200 focus:border-black outline-none font-serif text-xl placeholder:font-sans placeholder:text-gray-300 transition-all"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-widest text-gray-500">Price (₹)</label>
                            <input
                                required
                                type="number"
                                placeholder="0.00"
                                className="w-full py-2 border-b border-gray-200 focus:border-black outline-none font-serif text-xl placeholder:font-sans placeholder:text-gray-300 transition-all"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-widest text-gray-500">Description</label>
                            <textarea
                                placeholder="Describe the fabric, work, and details..."
                                className="w-full py-2 border-b border-gray-200 focus:border-black outline-none font-light min-h-[100px] resize-none placeholder:text-gray-300 transition-all"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-4">
                        <label className="text-xs uppercase tracking-widest text-gray-500 block">Product Imagery</label>

                        <div className="grid grid-cols-3 gap-4">
                            {imageUrls.map((url, index) => (
                                <div key={index} className="relative aspect-[3/4] group">
                                    <Image
                                        src={url}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-2 right-2 p-1 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}

                            {images.length < 5 && (
                                <label className="aspect-[3/4] border border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-gray-50 transition-all group">
                                    <div className="p-3 rounded-full bg-gray-50 group-hover:bg-white mb-2 transition-colors">
                                        <Plus size={20} className="text-gray-400 group-hover:text-black" />
                                    </div>
                                    <span className="text-[10px] uppercase tracking-widest text-gray-400 group-hover:text-black">Add Image</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleImageSelect}
                                    />
                                </label>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-400 text-center">
                            Upload up to 5 images. First image will be the cover.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white py-4 text-xs uppercase tracking-widest hover:bg-gray-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                PUBLISHING...
                            </>
                        ) : (
                            "PUBLISH TO CATALOG"
                        )}
                    </button>

                    <div className="text-center">
                        <a href="/" className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-black border-b border-transparent hover:border-black transition-all pb-0.5">
                            Back to Store
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}
