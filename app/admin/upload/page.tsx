"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";

export default function AdminUploadPage() {
    const [pin, setPin] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === "6090") {
            setIsAuthenticated(true);
        } else {
            alert("Invalid PIN");
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            if (images.length + newFiles.length > 5) {
                alert("Max 5 images allowed");
                return;
            }

            setImages([...images, ...newFiles]);

            // Create previews
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setImagePreviews([...imagePreviews, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);

        const newPreviews = [...imagePreviews];
        // Revoke url to avoid memory leak
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        setImagePreviews(newPreviews);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !price || images.length === 0) {
            alert("Please fill all fields and add at least one image.");
            return;
        }

        setUploading(true);
        try {
            const uploadedImageUrls: string[] = [];

            // 1. Upload Images
            for (const file of images) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('products')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('products')
                    .getPublicUrl(filePath);

                uploadedImageUrls.push(publicUrl);
            }

            // 2. Insert Record
            const { error: insertError } = await supabase
                .from('items')
                .insert({
                    title,
                    price: parseFloat(price),
                    description,
                    images: uploadedImageUrls,
                });

            if (insertError) throw insertError;

            alert("Item uploaded successfully!");
            // Reset form
            setTitle("");
            setPrice("");
            setDescription("");
            setImages([]);
            setImagePreviews([]);

        } catch (error: any) {
            console.error("Upload error:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <form onSubmit={handlePinSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm space-y-4">
                    <h1 className="text-xl font-bold text-center">Admin Access</h1>
                    <input
                        type="password"
                        placeholder="Enter PIN"
                        className="w-full px-4 py-2 border rounded-lg text-center tracking-widest text-2xl"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        maxLength={4}
                        autoFocus
                    />
                    <button type="submit" className="w-full bg-black text-white py-2 rounded-lg font-semibold">
                        Unlock
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-6 md:p-8">
                <h1 className="text-2xl font-bold mb-6">Upload New Item</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="font-medium">Item Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg"
                            placeholder="e.g. Vintage leather bag"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="font-medium">Price (₹)</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg"
                            placeholder="e.g. 1500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="font-medium">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg h-32"
                            placeholder="Item details..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="font-medium">Images (Max 5)</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {imagePreviews.map((src, index) => (
                                <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                                    <Image src={src} alt="Preview" fill className="object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}

                            {images.length < 5 && (
                                <label className="border-2 border-dashed border-gray-300 rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-black transition-colors">
                                    <Upload className="text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-500">Add Image</span>
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
                    </div>

                    <button
                        type="submit"
                        disabled={uploading}
                        className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="animate-spin mr-2" />
                                Uploading...
                            </>
                        ) : (
                            "Publish Item"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
