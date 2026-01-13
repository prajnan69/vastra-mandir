"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ShoppingBag, Package, PlusCircle, Loader2, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function AdminHubPage() {
    const [pin, setPin] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const session = localStorage.getItem("admin_session");
        if (session === "true") {
            setIsAuthenticated(true);
            fetchStats();
        }
    }, []);

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === "6090") {
            localStorage.setItem("admin_session", "true");
            setIsAuthenticated(true);
            fetchStats();
        } else {
            alert("Incorrect PIN");
        }
    };

    const fetchStats = async () => {
        try {
            const { count, error } = await supabase
            const { count, error } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .in('status', ['pending', 'paid_online', 'cod_pending']); // Count all active/unprocessed types

            if (count !== null) setPendingCount(count);
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-login during dev for convenience (optional, remove for prod security strictness)
    // useEffect(() => { if (process.env.NODE_ENV === 'development') setIsAuthenticated(true); }, []);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] text-center p-4">
                <div className="max-w-xs w-full space-y-8">
                    <div className="mb-6">
                        <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4">
                            <LayoutDashboard size={24} />
                        </div>
                        <h1 className="font-serif text-2xl tracking-widest uppercase">Admin Hub</h1>
                    </div>
                    <form onSubmit={handlePinSubmit} className="space-y-6">
                        <input
                            type="password"
                            placeholder="Enter PIN"
                            className="w-full text-center px-4 py-3 bg-transparent border-b border-gray-300 focus:border-black outline-none tracking-[0.5em] text-xl font-light placeholder:tracking-normal placeholder:text-sm"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="w-full bg-black text-white py-3 text-xs uppercase tracking-widest hover:bg-gray-900 transition-all"
                        >
                            Access Dashboard
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-safe">
            {/* Header */}
            <div className="bg-white px-6 py-8 border-b border-gray-100 mb-6">
                <h1 className="font-serif text-2xl text-black">Dashboard</h1>
                <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Vastra Mandir Admin</p>
            </div>

            {/* Menu Grid */}
            <div className="px-4 grid gap-4">

                {/* 1. Pending Orders */}
                <Link href="/admin/orders" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group active:scale-[0.98] transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                            <ShoppingBag size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-medium text-lg">Pending Orders</h3>
                            <p className="text-xs text-gray-400">View & Manage</p>
                        </div>
                    </div>
                    {pendingCount > 0 ? (
                        <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full min-w-[24px] text-center">
                            {pendingCount}
                        </div>
                    ) : (
                        <div className="bg-gray-100 text-gray-400 text-xs font-bold px-3 py-1 rounded-full min-w-[24px] text-center">
                            0
                        </div>
                    )}
                </Link>

                {/* 2. Manage Inventory */}
                <Link href="/admin/inventory" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group active:scale-[0.98] transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <Package size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-medium text-lg">Inventory</h3>
                            <p className="text-xs text-gray-400">Stock & Availability</p>
                        </div>
                    </div>
                </Link>

                {/* 3. Add Listing */}
                <Link href="/admin/upload" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group active:scale-[0.98] transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                            <PlusCircle size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-medium text-lg">Add Listing</h3>
                            <p className="text-xs text-gray-400">New Products</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Quick Actions / Footer */}
            <div className="mt-12 text-center">
                <button onClick={() => window.location.reload()} className="text-xs text-gray-400 underline">
                    Logout
                </button>
            </div>
        </div>
    );
}
