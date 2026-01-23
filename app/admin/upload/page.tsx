"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, X, Loader2, Plus, Image as ImageIcon, Trash2 } from "lucide-react";
import Image from "next/image";

interface Variant {
    id: string; // temp id for UI
    color: string;
    stock: { [size: string]: number }; // New: Map size -> quantity
    imageFiles: File[];
    imageUrls: string[]; // previews
}

export default function AdminUploadPage() {
    const [pin, setPin] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);

    // Basic Info
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [mrp, setMrp] = useState("");
    const [description, setDescription] = useState("");

    // Variants State
    const [variants, setVariants] = useState<Variant[]>([]);

    // Quick Add Variant State
    const [newVariantColor, setNewVariantColor] = useState("");
    const [newVariantStock, setNewVariantStock] = useState<{ [size: string]: number }>({});
    const [newVariantFiles, setNewVariantFiles] = useState<File[]>([]);
    const [newVariantPreviews, setNewVariantPreviews] = useState<string[]>([]);

    // Success State
    const [uploadedItem, setUploadedItem] = useState<{ id: number; title: string; price?: number; mrp?: number; description?: string; color?: string; variants?: Variant[] } | null>(null);

    const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];

    // --- Auth ---
    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === "6090") {
            setIsAuthenticated(true);
        } else {
            alert("Incorrect PIN");
        }
    };

    // --- Variant Logic ---
    const handleVariantImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setNewVariantFiles(prev => [...prev, ...files]);

            const urls = files.map(f => URL.createObjectURL(f));
            setNewVariantPreviews(prev => [...prev, ...urls]);
        }
    };

    const removeVariantPreview = (index: number) => {
        setNewVariantFiles(prev => prev.filter((_, i) => i !== index));
        URL.revokeObjectURL(newVariantPreviews[index]);
        setNewVariantPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleStockChange = (size: string, qtyStr: string) => {
        const qty = parseInt(qtyStr) || 0;
        setNewVariantStock(prev => {
            if (qty > 0) {
                return { ...prev, [size]: qty };
            } else {
                const newState = { ...prev };
                delete newState[size];
                return newState;
            }
        });
    };

    const addVariant = () => {
        if (!newVariantColor) return alert("Please enter a color name");
        if (newVariantFiles.length === 0) return alert("Please add at least one image for this color");
        if (Object.keys(newVariantStock).length === 0) return alert("Please add stock for at least one size");

        const variant: Variant = {
            id: Date.now().toString(),
            color: newVariantColor,
            stock: newVariantStock,
            imageFiles: newVariantFiles,
            imageUrls: newVariantPreviews
        };

        setVariants([...variants, variant]);

        // Reset inputs
        setNewVariantColor("");
        setNewVariantStock({});
        setNewVariantFiles([]);
        setNewVariantPreviews([]);
    };

    const removeVariant = (id: string) => {
        setVariants(prev => prev.filter(v => v.id !== id));
    };

    // --- Submit ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (variants.length === 0) return alert("Please add at least one variant");
        setLoading(true);

        try {
            const allUploadedImageUrls: string[] = []; // Collect all for the 'images' column
            const finalVariants = [];

            // Process each variant
            for (const variant of variants) {
                const variantImageUrls: string[] = [];

                // Upload images for this variant
                for (const file of variant.imageFiles) {
                    const fileName = `${Date.now()}-${variant.color}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
                    const { error: uploadError } = await supabase.storage
                        .from('products')
                        .upload(fileName, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('products')
                        .getPublicUrl(fileName);

                    variantImageUrls.push(publicUrl);
                    allUploadedImageUrls.push(publicUrl);
                }

                // IMPORTANT: We now store object `stock` instead of array `sizes`
                finalVariants.push({
                    color: variant.color,
                    stock: variant.stock, // { "S": 5, "M": 2 }
                    images: variantImageUrls
                });
            }

            const sizesList = Array.from(new Set(variants.flatMap(v => Object.keys(v.stock)))).join(", ");
            const colorsList = variants.map(v => v.color).join(", ");

            // Insert into DB
            const { data, error } = await supabase
                .from('items')
                .insert([{
                    title,
                    price: parseFloat(price),
                    mrp: mrp ? parseFloat(mrp) : null,
                    description,
                    images: allUploadedImageUrls,
                    variants: finalVariants,
                    size: sizesList, // Legacy
                    color: colorsList // Legacy
                }])
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setUploadedItem({ ...data, variants: finalVariants });
            }

            // Note: We do NOT clear form here anymore, so we can use the data for the copy function if needed, 
            // or we use the data we just set in uploadedItem. 
            // Let's clear the INPUTS but keep the variants in `uploadedItem` for the success screen.
            setTitle(""); setPrice(""); setMrp(""); setDescription("");
            setVariants([]);
        } catch (error: any) {
            console.error(error);
            alert("Error uploading: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const copyForWhatsApp = () => {
        if (!uploadedItem) return;

        const link = `https://vastra-mandir.vercel.app/product/${uploadedItem.id}`;

        // Extract colors
        let colorText = "";
        if (variants.length > 0) {
            const colors = variants.map(v => v.color).join(", ");
            colorText = `*Available Colors: ${colors}*`;
        } else if (uploadedItem.color) {
            colorText = `*Color: ${uploadedItem.color}*`;
        }

        const text = `*${uploadedItem.title}*\n\n${uploadedItem.description}\n\n${colorText}\n*MRP: ~₹${mrp}~* *Price: ₹${price}*\n\n🛒 Buy Here: ${link}`;

        navigator.clipboard.writeText(text);
        alert("Copied to clipboard! Ready to paste in WhatsApp.");
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4">
                <form onSubmit={handlePinSubmit} className="space-y-4 w-full max-w-xs text-center">
                    <h1 className="font-serif text-xl uppercase tracking-widest">Admin</h1>
                    <input
                        type="password"
                        value={pin} onChange={e => setPin(e.target.value)}
                        className="w-full text-center border-b border-gray-300 py-2 focus:border-black outline-none tracking-widest"
                        placeholder="PIN"
                    />
                </form>
            </div>
        );
    }

    if (uploadedItem) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <Loader2 className="hidden" /> {/* Import keeper */}
                    <Plus className="rotate-45" size={32} />
                </div>
                <h2 className="font-serif text-2xl">Published!</h2>
                <p className="text-gray-500">{uploadedItem.title}</p>
                <button onClick={copyForWhatsApp} className="bg-black text-white px-8 py-3 rounded-xl text-xs uppercase tracking-widest">
                    Copy WhatsApp Message
                </button>
                <button onClick={() => setUploadedItem(null)} className="text-xs uppercase tracking-widest text-gray-400">
                    Upload Another
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] p-4 md:p-12 pb-32">
            <div className="max-w-3xl mx-auto bg-white p-6 md:p-12 shadow-sm rounded-2xl">
                <h1 className="font-serif text-3xl mb-8 text-center">New Collection</h1>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Details */}
                    <div className="space-y-6">
                        <input className="w-full py-2 border-b border-gray-200 focus:border-black outline-none font-serif text-xl"
                            placeholder="Product Title" value={title} onChange={e => setTitle(e.target.value)} required />

                        <div className="flex gap-4">
                            <input className="w-1/2 py-2 border-b border-gray-200 focus:border-black outline-none font-serif text-lg"
                                type="number" placeholder="Price (₹)" value={price} onChange={e => setPrice(e.target.value)} required />
                            <input className="w-1/2 py-2 border-b border-gray-200 focus:border-black outline-none font-serif text-lg"
                                type="number" placeholder="MRP (₹)" value={mrp} onChange={e => setMrp(e.target.value)} />
                        </div>

                        <textarea className="w-full py-2 border-b border-gray-200 focus:border-black outline-none min-h-[80px]"
                            placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>

                    {/* Variants Manager */}
                    <div className="bg-gray-50 p-6 rounded-xl space-y-6 border border-gray-100">
                        <h3 className="font-serif text-lg">Variants (Colors)</h3>

                        {/* List Added Variants */}
                        <div className="space-y-2">
                            {variants.map((v) => (
                                <div key={v.id} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="w-10 h-10 relative bg-gray-100 rounded overflow-hidden">
                                        <Image src={v.imageUrls[0]} alt={v.color} fill className="object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm">{v.color}</p>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {Object.entries(v.stock).map(([size, qty]) => (
                                                <span key={size} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200">
                                                    {size}: {qty}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => removeVariant(v.id)} className="text-red-400 hover:text-red-600 p-2">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add New Variant */}
                        <div className="space-y-4 pt-4 border-t border-gray-200">
                            <p className="text-xs uppercase tracking-widest text-gray-400">Add New Color Variant</p>

                            <div className="flex gap-4 items-center">
                                <input
                                    className="flex-1 py-2 px-3 border border-gray-200 rounded focus:border-black outline-none text-sm"
                                    placeholder="Color Name (e.g. Royal Blue)"
                                    value={newVariantColor} onChange={e => setNewVariantColor(e.target.value)}
                                />
                            </div>

                            {/* Sizes & Stock */}
                            <div>
                                <p className="text-[10px] uppercase text-gray-400 mb-2">Available Quantity per Size</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {ALL_SIZES.map(s => (
                                        <div key={s} className={`flex items-center border rounded-lg p-2 transition-all ${newVariantStock[s] ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                                            <label className="text-xs font-bold w-8">{s}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="Qty"
                                                value={newVariantStock[s] || ""}
                                                onChange={(e) => handleStockChange(s, e.target.value)}
                                                className="w-full bg-transparent text-sm focus:outline-none text-right"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2">* Leave empty for 0 stock</p>
                            </div>

                            {/* Images */}
                            <div>
                                <p className="text-[10px] uppercase text-gray-400 mb-2">Images for this color</p>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {newVariantPreviews.map((url, i) => (
                                        <div key={i} className="relative w-16 h-20 flex-shrink-0 rounded overflow-hidden border">
                                            <Image src={url} alt="p" fill className="object-cover" />
                                            <button type="button" onClick={() => removeVariantPreview(i)} className="absolute top-0 right-0 bg-white/80 p-0.5 rounded-bl">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="w-16 h-20 flex-shrink-0 border border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-gray-50 transition-colors">
                                        <Plus size={16} className="text-gray-400" />
                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleVariantImageSelect} />
                                    </label>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={addVariant}
                                className="w-full py-3 bg-gray-900 text-white rounded-lg text-xs uppercase tracking-widest hover:bg-black transition-all"
                            >
                                Add Variant
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-4 text-sm font-bold uppercase tracking-widest hover:bg-green-700 transition-all shadow-xl shadow-green-100 rounded-xl"
                    >
                        {loading ? "Uploading..." : "Publish Item"}
                    </button>
                </form>
            </div>
        </div>
    );
}
