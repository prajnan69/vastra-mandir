"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Loader2, Eye, EyeOff, Share2, Edit2, Check, X, Trash2, Package, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { getRandomToast } from "@/lib/kannada-toasts";

interface Item {
    id: number;
    title: string;
    price: number;
    mrp: number | null;
    images: string[];
    category?: string;
    is_sold_out: boolean;
}

export default function InventoryPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editMrp, setEditMrp] = useState("");
    const [savingMrp, setSavingMrp] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setItems(data);
        } catch (error) {
            console.error("Error fetching items:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSoldOut = async (id: number, currentStatus: boolean) => {
        setTogglingId(id);
        try {
            const { error } = await supabase
                .from('items')
                .update({ is_sold_out: !currentStatus })
                .eq('id', id);

            if (error) throw error;

            // Update local state
            setItems(items.map(item =>
                item.id === id ? { ...item, is_sold_out: !currentStatus } : item
            ));

            // Track Action
            const adminName = localStorage.getItem("admin_name") || "Unknown";
            const currentItem = items.find(i => i.id === id);
            await supabase.from('admin_logs').insert([{
                admin_name: adminName,
                action: !currentStatus ? "MARKED_SOLD_OUT" : "MARKED_AVAILABLE",
                details: { product_id: id, title: currentItem?.title }
            }]);
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error(getRandomToast('errors'));
        } finally {
            setTogglingId(null);
        }
    };

    const startEditing = (item: Item) => {
        setEditingId(item.id);
        setEditMrp(item.mrp?.toString() || "");
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditMrp("");
    };

    const saveMrp = async (id: number) => {
        setSavingMrp(true);
        try {
            const newMrp = editMrp ? parseFloat(editMrp) : null;
            const { error } = await supabase
                .from('items')
                .update({ mrp: newMrp })
                .eq('id', id);

            if (error) throw error;

            setItems(items.map(item =>
                item.id === id ? { ...item, mrp: newMrp } : item
            ));
            setEditingId(null);

            // Track Action
            const adminName = localStorage.getItem("admin_name") || "Unknown";
            const currentItem = items.find(i => i.id === id);
            await supabase.from('admin_logs').insert([{
                admin_name: adminName,
                action: "UPDATE_MRP",
                details: { product_id: id, title: currentItem?.title, old_mrp: currentItem?.mrp, new_mrp: newMrp }
            }]);
        } catch (error) {
            console.error("Error updating MRP:", error);
            toast.error(getRandomToast('errors'));
        } finally {
            setSavingMrp(false);
        }
    };

    const deleteItem = async (id: number) => {
        if (!confirm("Are you sure you want to delete this item? This cannot be undone.")) return;

        try {
            const { error } = await supabase
                .from('items')
                .delete()
                .eq('id', id);

            if (error) throw error;

            const deletedItem = items.find(i => i.id === id);
            setItems(prev => prev.filter(item => item.id !== id));

            // Track Action
            const adminName = localStorage.getItem("admin_name") || "Unknown";
            await supabase.from('admin_logs').insert([{
                admin_name: adminName,
                action: "DELETE_PRODUCT",
                details: { product_id: id, title: deletedItem?.title }
            }]);
        } catch (error) {
            console.error("Error deleting item:", error);
            alert("Failed to delete item");
        }
    };

    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#FDFDFD] pb-32">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md px-6 py-6 sticky top-0 z-10 border-b border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                    <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors relative top-0.5">
                        <ArrowLeft size={20} className="text-zinc-600" />
                    </Link>
                    <div>
                        <h1 className="font-serif text-2xl text-zinc-900">Inventory</h1>
                        <p className="text-xs text-zinc-400 uppercase tracking-widest mt-0.5">{items.length} Products</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-500/10 transition-all font-medium"
                    />
                </div>
            </div>

            {/* List */}
            <div className="p-6 space-y-4 animate-enter">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
                        <Loader2 className="animate-spin" size={32} />
                        <span className="text-sm font-medium">Loading inventory...</span>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-300">
                            <Package size={24} />
                        </div>
                        <p className="text-zinc-400 text-sm">No items found.</p>
                    </div>
                ) : (
                    filteredItems.map((item, index) => (
                        <div
                            key={item.id}
                            style={{ animationDelay: `${index * 50}ms` }}
                            className={`bg-white p-4 rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border flex gap-4 transition-all group animate-enter ${item.is_sold_out ? 'border-red-100 bg-red-50/20' : 'border-gray-50'}`}
                        >
                            {/* Image */}
                            <div className="w-24 h-28 relative rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-inner">
                                {item.images?.[0] && (
                                    <Image src={item.images[0]} alt={item.title} fill className={`object-cover transition-transform duration-500 group-hover:scale-105 ${item.is_sold_out ? 'grayscale' : ''}`} />
                                )}
                                {item.is_sold_out && (
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wider transform -rotate-12 border border-white/20">Sold Out</span>
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                <div>
                                    <h3 className={`font-medium text-lg leading-tight truncate ${item.is_sold_out ? 'text-gray-500' : 'text-gray-900'}`}>{item.title}</h3>
                                    {item.category && (
                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-zinc-50 border border-zinc-100 rounded-md text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                                            {item.category}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                        <p className="text-sm font-bold text-zinc-700">₹{item.price.toLocaleString()}</p>

                                        {/* MRP Editable Section */}
                                        {editingId === item.id ? (
                                            <div className="flex items-center gap-1 ml-2 bg-zinc-100 p-1 rounded-lg">
                                                <input
                                                    type="number"
                                                    value={editMrp}
                                                    onChange={(e) => setEditMrp(e.target.value)}
                                                    className="w-16 px-1 py-0.5 text-xs bg-white border border-gray-200 rounded outline-none text-center"
                                                    placeholder="MRP"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => saveMrp(item.id)}
                                                    disabled={savingMrp}
                                                    className="p-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 shadow-sm"
                                                >
                                                    {savingMrp ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                                                </button>
                                                <button
                                                    onClick={cancelEditing}
                                                    className="p-1.5 bg-gray-200 text-gray-500 rounded-md hover:bg-gray-300"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 cursor-pointer transition-opacity opacity-70 hover:opacity-100" onClick={() => startEditing(item)}>
                                                {item.mrp ? (
                                                    <p className="text-xs text-gray-400 line-through decoration-gray-300">
                                                        ₹{item.mrp.toLocaleString()}
                                                    </p>
                                                ) : (
                                                    <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100 font-medium">
                                                        + MRP
                                                    </span>
                                                )}
                                                <div className="bg-zinc-100 p-1 rounded-full">
                                                    <Edit2 size={8} className="text-zinc-500" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 mt-3">
                                    <button
                                        onClick={() => toggleSoldOut(item.id, item.is_sold_out)}
                                        disabled={togglingId === item.id}
                                        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${item.is_sold_out
                                            ? 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 shadow-sm'
                                            : 'bg-zinc-900 text-white hover:bg-black shadow-lg shadow-zinc-900/10'
                                            }`}
                                    >
                                        {togglingId === item.id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : item.is_sold_out ? (
                                            <>Mark Available <Eye size={14} /></>
                                        ) : (
                                            <>Mark Sold Out <EyeOff size={14} /></>
                                        )}
                                    </button>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                const link = `https://vastra-mandir.vercel.app/product/${item.id}`;
                                                // Clean description - remove line breaks to avoid messy preview
                                                const text = `*${item.title}*\n\n${item.mrp ? `*MRP: ~₹${item.mrp}~* ` : ''}*Price: ₹${item.price.toLocaleString()}*\n\n🛒 Buy Here: ${link}`;
                                                navigator.clipboard.writeText(text);
                                                alert("Product link and details copied!");
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-100 transition-colors"
                                        >
                                            Share <Share2 size={12} />
                                        </button>

                                        <button
                                            onClick={() => deleteItem(item.id)}
                                            className="flex items-center justify-center px-4 rounded-xl text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors"
                                            title="Delete Item"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
