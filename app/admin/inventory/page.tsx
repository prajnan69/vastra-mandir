"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Item {
    id: number;
    title: string;
    price: number;
    images: string[];
    is_sold_out: boolean;
}

export default function InventoryPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingId, setTogglingId] = useState<number | null>(null);

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
                                    <p className="text-sm font-semibold text-gray-500">₹{item.price.toLocaleString()}</p>
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
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
