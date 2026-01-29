"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Loader2, Eye, EyeOff, Share2, Edit2, Check, X, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Item {
    id: number;
    title: string;
    price: number;
    mrp: number | null;
    images: string[];
    is_sold_out: boolean;
}

export default function InventoryPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editMrp, setEditMrp] = useState("");
    const [savingMrp, setSavingMrp] = useState(false);

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
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
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
        } catch (error) {
            console.error("Error updating MRP:", error);
            alert("Failed to update MRP");
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

            setItems(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error("Error deleting item:", error);
            alert("Failed to delete item");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-200 shadow-sm flex items-center gap-4">
                <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="font-serif text-lg">Inventory</h1>
                    <p className="text-xs text-gray-500">{items.length} Items</p>
                </div>
            </div>

            {/* List */}
            <div className="p-4 space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-400">Loading inventory...</div>
                ) : items.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">No items found.</div>
                ) : (
                    items.map((item) => (
                        <div key={item.id} className={`bg-white p-4 rounded-xl border flex gap-4 transition-all ${item.is_sold_out ? 'border-red-100 bg-red-50/30' : 'border-gray-100'}`}>
                            {/* Image */}
                            <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                {item.images?.[0] && (
                                    <Image src={item.images[0]} alt={item.title} fill className={`object-cover ${item.is_sold_out ? 'grayscale' : ''}`} />
                                )}
                                {item.is_sold_out && (
                                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">SOLD</span>
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                <div>
                                    <h3 className={`font-medium truncate ${item.is_sold_out ? 'text-gray-500' : 'text-gray-900'}`}>{item.title}</h3>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-gray-500">₹{item.price.toLocaleString()}</p>

                                        {/* MRP Editable Section */}
                                        {editingId === item.id ? (
                                            <div className="flex items-center gap-1 ml-2">
                                                <input
                                                    type="number"
                                                    value={editMrp}
                                                    onChange={(e) => setEditMrp(e.target.value)}
                                                    className="w-20 px-2 py-1 text-sm border border-black rounded"
                                                    placeholder="MRP"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => saveMrp(item.id)}
                                                    disabled={savingMrp}
                                                    className="p-1 bg-black text-white rounded hover:bg-gray-800"
                                                >
                                                    {savingMrp ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                                </button>
                                                <button
                                                    onClick={cancelEditing}
                                                    className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 ml-2 group cursor-pointer" onClick={() => startEditing(item)}>
                                                {item.mrp ? (
                                                    <p className="text-xs text-gray-400 line-through decoration-gray-400">
                                                        ₹{item.mrp.toLocaleString()}
                                                    </p>
                                                ) : (
                                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded border border-dashed border-gray-300">
                                                        + MRP
                                                    </span>
                                                )}
                                                <Edit2 size={10} className="text-gray-300 group-hover:text-black opacity-0 group-hover:opacity-100 transition-all" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => toggleSoldOut(item.id, item.is_sold_out)}
                                    disabled={togglingId === item.id}
                                    className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${item.is_sold_out
                                        ? 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                        : 'bg-black text-white hover:bg-gray-800'
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
                                            const text = `*${item.title}*\n\n${item.mrp ? `*MRP: ~₹${item.mrp}~* ` : ''}*Price: ₹${item.price.toLocaleString()}*\n\n🛒 Buy Here: ${link}`;
                                            navigator.clipboard.writeText(text);
                                            alert("Link copied!");
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    >
                                        Copy <Share2 size={14} />
                                    </button>

                                    <button
                                        onClick={() => deleteItem(item.id)}
                                        className="flex items-center justify-center px-4 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors"
                                        title="Delete Item"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
