"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, X, Loader2, Plus, Image as ImageIcon, Trash2, ArrowLeft, Check, Sparkles, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { getRandomToast } from "@/lib/kannada-toasts";

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
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [loading, setLoading] = useState(false);
    // Helper state for shake animation logic (consistent with other pages if needed)
    const [shake, setShake] = useState(false);
    const [adminName, setAdminName] = useState("");
    const [tempName, setTempName] = useState("");

    useEffect(() => {
        try {
            const session = localStorage.getItem("admin_session");
            const name = localStorage.getItem("admin_name");
            if (session === "true") {
                setIsAuthenticated(true);
                if (name) setAdminName(name);
            }
        } catch (e) {
            console.error("Local storage access failed", e);
        } finally {
            setIsCheckingAuth(false);
        }
    }, []);

    // Basic Info
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [mrp, setMrp] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Saree"); // Default
    const [customCategory, setCustomCategory] = useState("");
    const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
    const [existingCategories, setExistingCategories] = useState<string[]>(["Saree", "Shirt", "Accessories"]);

    useEffect(() => {
        const fetchCategories = async () => {
            const { data, error } = await supabase
                .from('items')
                .select('category')
                .eq('is_deleted', false);

            if (data && !error) {
                const unique = Array.from(new Set(data.map(i => i.category?.trim()).filter(Boolean))) as string[];
                if (unique.length > 0) {
                    // Combine with defaults and set
                    const combined = Array.from(new Set([...unique, "Saree", "Shirt", "Accessories"]));
                    setExistingCategories(combined);
                }
            }
        };
        fetchCategories();
    }, []);

    // Variants State
    const [variants, setVariants] = useState<Variant[]>([]);
    const [isSimpleMode, setIsSimpleMode] = useState(false); // New Toggle

    // Quick Add Variant State (Also used for Simple Mode main variant)
    const [newVariantColor, setNewVariantColor] = useState("");
    const [newVariantStock, setNewVariantStock] = useState<{ [size: string]: number }>({});
    const [newVariantFiles, setNewVariantFiles] = useState<File[]>([]);
    const [newVariantPreviews, setNewVariantPreviews] = useState<string[]>([]);

    // Success State
    const [uploadedItem, setUploadedItem] = useState<{ id: number; title: string; price?: number; mrp?: number; description?: string; color?: string; variants?: Variant[] } | null>(null);

    const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];

    const handleKeypadPress = (num: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
        }
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
    };

    // Auto-submit when pin length is 4
    useEffect(() => {
        if (pin.length === 4) {
            handlePinSubmit();
        }
    }, [pin]);

    const handlePinSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (pin === "6090") {
            try {
                localStorage.setItem("admin_session", "true");
            } catch (e) {
                console.error("Failed to save session", e);
            }
            setIsAuthenticated(true);
        } else {
            setShake(true);
            setTimeout(() => setShake(false), 500);
            setPin("");
            toast.error(getRandomToast('auth'));
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

        // Validation
        if (!isSimpleMode && variants.length === 0) return alert("Please add at least one variant");
        if (isSimpleMode) {
            if (newVariantFiles.length === 0) return alert("Please add at least one image");
            if (Object.keys(newVariantStock).length === 0) return alert("Please add stock for at least one size");
        }

        setLoading(true);

        try {
            const allUploadedImageUrls: string[] = []; // Collect all for the 'images' column
            const finalVariants = [];

            // Helper to process a variant (or the simple mode item)
            const processVariant = async (color: string, stock: { [s: string]: number }, files: File[]) => {
                const variantImageUrls: string[] = [];
                for (const file of files) {
                    const fileName = `${Date.now()}-${color || 'default'}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
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
                return { color: color || "Standard", stock, images: variantImageUrls };
            };

            if (isSimpleMode) {
                // Process single simple variant
                const simpleVariant = await processVariant(newVariantColor, newVariantStock, newVariantFiles);
                finalVariants.push(simpleVariant);
            } else {
                // Process list
                for (const variant of variants) {
                    const processed = await processVariant(variant.color, variant.stock, variant.imageFiles);
                    finalVariants.push(processed);
                }
            }

            const sizesArray = Array.from(new Set(finalVariants.flatMap(v => Object.keys(v.stock))));
            const colorsList = finalVariants.map(v => v.color).join(", ");

            // Insert into DB
            const { data, error } = await supabase
                .from('items')
                .insert([{
                    title,
                    price: parseFloat(price),
                    mrp: mrp ? parseFloat(mrp) : null,
                    description,
                    category: isAddingCustomCategory ? customCategory : category,
                    images: allUploadedImageUrls,
                    variants: finalVariants,
                    size: sizesArray, // JSONB compatible
                    color: colorsList // Legacy
                }])
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setUploadedItem({ ...data, variants: finalVariants });

                // Track Action
                const adminName = localStorage.getItem("admin_name") || "Unknown";
                await supabase.from('admin_logs').insert([{
                    admin_name: adminName,
                    action: "UPLOAD_PRODUCT",
                    details: { product_id: data.id, title: data.title }
                }]);

                // Celebrate
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#34D399', '#10B981', '#059669']
                });
            }

            // Cleanup
            setTitle(""); setPrice(""); setMrp(""); setDescription("");
            setCategory("Saree"); setCustomCategory(""); setIsAddingCustomCategory(false);
            setVariants([]);
            setNewVariantColor(""); setNewVariantStock({}); setNewVariantFiles([]); setNewVariantPreviews([]);

        } catch (error: any) {
            console.error(error);
            // alert("Error uploading: " + error.message);
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

        // Use uploadedItem data because local state is cleared
        const itemMrp = uploadedItem.mrp ? `*MRP: ~₹${uploadedItem.mrp}~* ` : "";
        const itemPrice = uploadedItem.price ? `*Price: ₹${uploadedItem.price}*` : "";

        const text = `*${uploadedItem.title}*\n\n${uploadedItem.description}\n\n${colorText}\n${itemMrp}${itemPrice}\n\n🛒 Buy Here: ${link}`;

        navigator.clipboard.writeText(text);
        alert("Copied to clipboard! Ready to paste in WhatsApp.");
    };

    if (isCheckingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-gray-300" size={32} />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-6 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-purple-200/30 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-orange-100/30 rounded-full blur-3xl pointer-events-none"></div>

                <div className={`w-full max-w-sm transition-transform duration-300 ${shake ? 'animate-shake' : ''}`}>
                    <div className="text-center mb-12 space-y-2">
                        <div className="w-20 h-20 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/10 rotate-3 transition-transform hover:rotate-0">
                            <Lock size={28} />
                        </div>
                        <h1 className="font-serif text-2xl tracking-wide text-zinc-800">Admin Verify</h1>
                        <p className="text-sm text-zinc-400 font-medium">Enter PIN to proceed with upload</p>
                    </div>

                    {/* PIN Dots */}
                    <div className="flex justify-center gap-4 mb-12">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length
                                    ? 'bg-black scale-110 shadow-lg shadow-black/20'
                                    : 'bg-zinc-200'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-6 max-w-[280px] mx-auto relative z-20">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                                key={num}
                                onClick={() => handleKeypadPress(num.toString())}
                                className="w-16 h-16 rounded-full text-xl font-medium text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 transition-colors flex items-center justify-center"
                            >
                                {num}
                            </button>
                        ))}
                        <div className="w-16 h-16"></div> {/* Spacer */}
                        <button
                            onClick={() => handleKeypadPress("0")}
                            className="w-16 h-16 rounded-full text-xl font-medium text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 transition-colors flex items-center justify-center"
                        >
                            0
                        </button>
                        <button
                            onClick={handleBackspace}
                            className="w-16 h-16 rounded-full text-sm font-medium text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 active:bg-zinc-100 transition-colors flex items-center justify-center"
                        >
                            ⌫
                        </button>
                    </div>
                </div>

                <p className="absolute bottom-8 text-[10px] text-zinc-300 uppercase tracking-widest pointer-events-none">
                    Vastra Mandir Admin Secure
                </p>
            </div>
        );
    }

    if (uploadedItem) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center space-y-8 animate-enter">
                <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center shadow-xl shadow-green-100 mb-2">
                    <Check size={48} className="animate-in zoom-in duration-500" />
                </div>
                <div>
                    <h2 className="font-serif text-3xl text-zinc-900">Successfully Published!</h2>
                    <p className="text-zinc-500 mt-2">{uploadedItem.title}</p>
                </div>

                <div className="space-y-3 w-full max-w-xs">
                    <button onClick={copyForWhatsApp} className="w-full bg-zinc-900 text-white px-8 py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-black transition-transform hover:scale-[1.02] shadow-lg shadow-zinc-200">
                        Copy Description & Link
                    </button>
                    <button onClick={() => setUploadedItem(null)} className="w-full py-3 text-xs uppercase tracking-widest text-zinc-400 hover:text-zinc-600">
                        Upload Another Item
                    </button>
                </div>
            </div>
        )
    }

    // Step 2: Name Collection
    if (isAuthenticated && !adminName) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-6 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-blue-100/30 rounded-full blur-3xl pointer-events-none"></div>

                <div className="w-full max-w-sm text-center space-y-8 animate-enter">
                    <div className="w-20 h-20 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 rotate-12 transition-transform hover:rotate-0">
                        <Sparkles size={32} />
                    </div>
                    <div>
                        <h1 className="font-serif text-3xl text-zinc-800 tracking-tight">Identity Required</h1>
                        <p className="text-sm text-zinc-400 mt-2 font-medium uppercase tracking-widest">Who is uploading today?</p>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Enter Your Name"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && tempName.trim()) {
                                    const savedName = tempName.trim();
                                    localStorage.setItem("admin_name", savedName);
                                    setAdminName(savedName);
                                    supabase.from('admin_logs').insert([{
                                        admin_name: savedName,
                                        action: "LOGGED_IN_FOR_UPLOAD",
                                        details: { time: new Date().toISOString() }
                                    }]).then();

                                    // Welcome Celebration
                                    confetti({
                                        particleCount: 100,
                                        spread: 70,
                                        origin: { y: 0.6 },
                                        colors: ['#FFD1DC', '#E0BBE4', '#957DAD', '#D291BC', '#FEC8D8']
                                    });
                                }
                            }}
                            className="w-full bg-white border-2 border-zinc-100 rounded-3xl py-5 px-6 text-center text-xl font-medium outline-none focus:border-emerald-400 transition-all shadow-sm focus:shadow-emerald-500/5 placeholder:text-zinc-200"
                        />
                        <button
                            disabled={!tempName.trim()}
                            onClick={() => {
                                const savedName = tempName.trim();
                                localStorage.setItem("admin_name", savedName);
                                setAdminName(savedName);
                                supabase.from('admin_logs').insert([{
                                    admin_name: savedName,
                                    action: "LOGGED_IN_FOR_UPLOAD",
                                    details: { time: new Date().toISOString() }
                                }]).then();

                                // Welcome Celebration
                                confetti({
                                    particleCount: 100,
                                    spread: 70,
                                    origin: { y: 0.6 },
                                    colors: ['#FFD1DC', '#E0BBE4', '#957DAD', '#D291BC', '#FEC8D8']
                                });
                            }}
                            className="w-full bg-zinc-900 text-white py-5 rounded-3xl font-bold uppercase tracking-[0.2em] text-xs shadow-xl shadow-zinc-200 active:scale-95 transition-all disabled:opacity-50 disabled:bg-zinc-200 disabled:shadow-none"
                        >
                            Start Uploading
                        </button>
                    </div>
                </div>

                <p className="absolute bottom-8 text-[10px] text-zinc-300 uppercase tracking-widest pointer-events-none">
                    Vastra Mandir Admin Secure
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFDFD] pb-32">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md px-6 py-6 sticky top-0 z-10 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors relative top-0.5">
                        <ArrowLeft size={20} className="text-zinc-600" />
                    </Link>
                    <div>
                        <h1 className="font-serif text-2xl text-zinc-900">New Collection</h1>
                        <p className="text-xs text-zinc-400 uppercase tracking-widest mt-0.5">Add Products</p>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-6 md:p-12 animate-enter">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Details Card */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 space-y-6">
                        <div>
                            <label className="text-xs uppercase text-zinc-400 font-bold tracking-wider ml-1 mb-2 block">Product Information</label>
                            <input className="w-full py-3 px-4 bg-zinc-50 rounded-xl border-none focus:ring-2 focus:ring-black/5 outline-none font-serif text-xl placeholder:text-zinc-300 transition-all"
                                placeholder="Product Title" value={title} onChange={e => setTitle(e.target.value)} required />
                        </div>

                        <div className="flex gap-4">
                            <input className="w-1/2 py-3 px-4 bg-zinc-50 rounded-xl border-none focus:ring-2 focus:ring-black/5 outline-none font-serif text-lg placeholder:text-zinc-300"
                                type="number" placeholder="Price (₹)" value={price} onChange={e => setPrice(e.target.value)} required />
                            <input className="w-1/2 py-3 px-4 bg-zinc-50 rounded-xl border-none focus:ring-2 focus:ring-black/5 outline-none font-serif text-lg placeholder:text-zinc-300"
                                type="number" placeholder="MRP (₹)" value={mrp} onChange={e => setMrp(e.target.value)} />
                        </div>

                        <textarea className="w-full py-3 px-4 bg-zinc-50 rounded-xl border-none focus:ring-2 focus:ring-black/5 outline-none min-h-[100px] text-sm placeholder:text-zinc-300"
                            placeholder="Product Description (Materials, fit, etc.)" value={description} onChange={e => setDescription(e.target.value)} />

                        <div className="pt-2">
                            <label className="text-xs uppercase text-zinc-400 font-bold tracking-wider ml-1 mb-2 block">Category</label>
                            {!isAddingCustomCategory ? (
                                <div className="flex flex-wrap gap-2">
                                    {existingCategories.map((cat) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setCategory(cat)}
                                            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${category === cat
                                                ? 'bg-black text-white shadow-lg'
                                                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingCustomCategory(true)}
                                        className="px-5 py-2.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-500 hover:bg-zinc-200 border border-dashed border-zinc-300"
                                    >
                                        + Add New
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        autoFocus
                                        className="flex-1 py-3 px-4 bg-zinc-50 rounded-xl border-none focus:ring-2 focus:ring-black/5 outline-none text-sm"
                                        placeholder="Enter Category Name"
                                        value={customCategory}
                                        onChange={(e) => setCustomCategory(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingCustomCategory(false)}
                                        className="p-3 bg-zinc-100 rounded-xl text-zinc-400 hover:text-black transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upload Mode Toggle */}
                    <div className="flex bg-zinc-100 p-1.5 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setIsSimpleMode(true)}
                            className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold rounded-lg transition-all ${isSimpleMode ? 'bg-white shadow-sm text-black' : 'text-zinc-400'}`}
                        >
                            Single Color
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsSimpleMode(false)}
                            className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold rounded-lg transition-all ${!isSimpleMode ? 'bg-white shadow-sm text-black' : 'text-zinc-400'}`}
                        >
                            Multi-Variant
                        </button>
                    </div>

                    {/* Active Upload Area */}
                    <div className="animate-fade-in">
                        {isSimpleMode ? (
                            <div className="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                    <Sparkles size={100} />
                                </div>

                                {/* Images */}
                                <div>
                                    <p className="text-xs uppercase text-zinc-400 font-bold tracking-wider mb-4">Product Images</p>
                                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                                        {newVariantPreviews.map((url, i) => (
                                            <div key={i} className="relative w-24 h-32 flex-shrink-0 rounded-xl overflow-hidden border border-zinc-100 shadow-sm group">
                                                <Image src={url} alt="p" fill className="object-cover" />
                                                <button type="button" onClick={() => removeVariantPreview(i)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        <label className="w-24 h-32 flex-shrink-0 border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-zinc-50 transition-all group">
                                            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-zinc-200">
                                                <Plus size={20} className="text-zinc-400 group-hover:text-zinc-600" />
                                            </div>
                                            <span className="text-[10px] text-zinc-400 uppercase tracking-wide">Add Img</span>
                                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleVariantImageSelect} />
                                        </label>
                                    </div>
                                </div>

                                {/* Optional Color Name */}
                                <div>
                                    <label className="text-xs uppercase text-zinc-400 font-bold tracking-wider mb-2 block">Color Name</label>
                                    <input
                                        className="w-full py-3 px-4 bg-zinc-50 rounded-xl border-none focus:ring-2 focus:ring-black/5 outline-none text-sm placeholder:text-zinc-300"
                                        placeholder="e.g. Red (Optional)"
                                        value={newVariantColor} onChange={e => setNewVariantColor(e.target.value)}
                                    />
                                </div>

                                {/* Stock */}
                                <div>
                                    <p className="text-xs uppercase text-zinc-400 font-bold tracking-wider mb-4">Stock By Size</p>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        {ALL_SIZES.map(s => (
                                            <div key={s} className={`flex flex-col items-center border rounded-xl p-3 transition-all ${newVariantStock[s] ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-100 bg-white'}`}>
                                                <label className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">{s}</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="0"
                                                    value={newVariantStock[s] || ""}
                                                    onChange={(e) => handleStockChange(s, e.target.value)}
                                                    className={`w-full bg-transparent text-lg font-bold text-center focus:outline-none ${newVariantStock[s] ? 'placeholder:text-zinc-600' : 'placeholder:text-zinc-200'}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Variants Manager (Existing) */
                            <div className="space-y-6">
                                {/* List Added Variants */}
                                <div className="grid gap-3">
                                    {variants.map((v) => (
                                        <div key={v.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                                            <div className="w-12 h-12 relative bg-gray-100 rounded-lg overflow-hidden">
                                                <Image src={v.imageUrls[0]} alt={v.color} fill className="object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-sm text-zinc-800">{v.color}</p>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {Object.entries(v.stock).map(([size, qty]) => (
                                                        <span key={size} className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded text-zinc-500 font-medium">
                                                            {size}: {qty}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => removeVariant(v.id)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add New Variant */}
                                <div className="bg-white p-6 rounded-[2rem] border border-zinc-200 shadow-sm relative overflow-hidden">
                                    <p className="text-xs uppercase tracking-widest text-zinc-900 font-bold mb-6">New Color Variant</p>

                                    <div className="space-y-6">
                                        <input
                                            className="w-full py-3 px-4 bg-zinc-50 rounded-xl border-none focus:ring-2 focus:ring-black/5 outline-none text-sm font-medium placeholder:text-zinc-300"
                                            placeholder="Color Name (e.g. Royal Blue)"
                                            value={newVariantColor} onChange={e => setNewVariantColor(e.target.value)}
                                        />

                                        {/* Sizes & Stock */}
                                        <div>
                                            <p className="text-xs uppercase text-zinc-400 font-bold tracking-wider mb-4">Stock By Size</p>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                {ALL_SIZES.map(s => (
                                                    <div key={s} className={`flex flex-col items-center border rounded-xl p-2 transition-all ${newVariantStock[s] ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-100 bg-white'}`}>
                                                        <label className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">{s}</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            placeholder="0"
                                                            value={newVariantStock[s] || ""}
                                                            onChange={(e) => handleStockChange(s, e.target.value)}
                                                            className={`w-full bg-transparent text-sm font-bold text-center focus:outline-none ${newVariantStock[s] ? 'placeholder:text-zinc-600' : 'placeholder:text-zinc-200'}`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Images */}
                                        <div>
                                            <p className="text-xs uppercase text-zinc-400 font-bold tracking-wider mb-4">Color Images</p>
                                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                                {newVariantPreviews.map((url, i) => (
                                                    <div key={i} className="relative w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-zinc-100">
                                                        <Image src={url} alt="p" fill className="object-cover" />
                                                        <button type="button" onClick={() => removeVariantPreview(i)} className="absolute top-0 right-0 bg-white/80 p-0.5 rounded-bl">
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                ))}
                                                <label className="w-16 h-20 flex-shrink-0 border-2 border-dashed border-zinc-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-zinc-50 transition-all">
                                                    <Plus size={16} className="text-zinc-400" />
                                                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleVariantImageSelect} />
                                                </label>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={addVariant}
                                            className="w-full py-3 bg-zinc-100 text-zinc-900 rounded-xl text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all font-bold"
                                        >
                                            Add Variant Logic
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-zinc-900 text-white py-5 rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-zinc-900/20 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="animate-spin" size={16} />
                                <span>Publishing...</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <CloudUploadIcon />
                                <span>Publish Collection</span>
                            </div>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

// Simple icon component helper
function CloudUploadIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
            <path d="M12 12v9" />
            <path d="m16 16-4-9-4 9" />
        </svg>
    )
}
