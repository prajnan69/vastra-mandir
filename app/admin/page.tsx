"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ShoppingBag, Package, PlusCircle, Loader2, LayoutDashboard, Settings, Lock, ChevronRight, LogOut, Sparkles } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { getRandomToast } from "@/lib/kannada-toasts";

export default function AdminHubPage() {
    const [pin, setPin] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(true);
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
                fetchStats();
            }
        } catch (e) {
            console.error("Local storage access failed", e);
        } finally {
            setIsCheckingAuth(false);
        }
    }, []);

    const fetchStats = async () => {
        try {
            const { count, error } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .in('status', ['pending', 'paid_online', 'cod_pending']);

            if (count !== null) setPendingCount(count);
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePinSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (pin === "6090") {
            localStorage.setItem("admin_session", "true");
            setIsAuthenticated(true);
            fetchStats();
        } else {
            setShake(true);
            setTimeout(() => setShake(false), 500);
            setPin("");
            toast.error(getRandomToast('auth'));
        }
    };

    // Auto-submit when pin length is 4
    useEffect(() => {
        if (pin.length === 4) {
            handlePinSubmit();
        }
    }, [pin]);

    const handleKeypadPress = (num: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
        }
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        const salute = hour < 12 ? "Good Morning ☀️" : hour < 18 ? "Good Afternoon 🌤️" : "Good Evening 🌙";
        return adminName ? `${salute}, ${adminName}` : salute;
    };

    if (isCheckingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="relative">
                    <div className="absolute inset-0 bg-purple-200 blur-xl opacity-20 rounded-full animate-pulse"></div>
                    <Loader2 className="animate-spin text-zinc-400 relative z-10" size={32} />
                </div>
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
                        <div className="w-20 h-20 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/10 rotate-3 transform transition-transform hover:rotate-0">
                            <Lock size={28} />
                        </div>
                        <h1 className="font-serif text-2xl tracking-wide text-zinc-800">Welcome Back</h1>
                        <p className="text-sm text-zinc-400 font-medium">Enter PIN to access dashboard</p>
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
                        <h1 className="font-serif text-3xl text-zinc-800 tracking-tight">Welcome to Hub</h1>
                        <p className="text-sm text-zinc-400 mt-2 font-medium uppercase tracking-widest">Identify Yourself</p>
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
                                        action: "LOGGED_IN",
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
                                    action: "LOGGED_IN",
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
                            Start Dashboard
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
        <div className="min-h-screen bg-[#FDFDFD] pb-safe">
            {/* Header with Greeting */}
            <div className="bg-white px-6 pt-12 pb-8 border-b border-gray-100 sticky top-0 z-10 bg-white/80 backdrop-blur-md">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="text-xs font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-2 py-1 rounded-md">Admin</span>
                        <h1 className="font-serif text-3xl mt-3 text-zinc-900">{getGreeting()}</h1>
                        <p className="text-sm text-zinc-500 mt-1">Here's what's happening today.</p>
                    </div>
                </div>
            </div>

            {/* Menu Grid - Staggered Fade In */}
            <div className="px-6 py-8 grid gap-4 animate-enter">

                {/* 1. Pending Orders - Hero Card */}
                <Link href="/admin/orders" className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-800 text-white p-6 rounded-[2rem] shadow-xl shadow-zinc-200 group active:scale-[0.98] transition-transform duration-300">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShoppingBag size={80} />
                    </div>

                    <div className="relative z-10 flex flex-col h-full justify-between min-h-[140px]">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                <ShoppingBag size={20} className="text-white" />
                            </div>
                            {pendingCount > 0 && (
                                <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-lg shadow-orange-500/30">
                                    {pendingCount} New
                                </span>
                            )}
                        </div>

                        <div>
                            <h3 className="font-medium text-xl">Orders</h3>
                            <div className="flex items-center gap-2 mt-1 text-zinc-400 text-sm group-hover:text-white transition-colors">
                                <span>Manage & Process</span>
                                <ChevronRight size={14} />
                            </div>
                        </div>
                    </div>
                </Link>

                <div className="grid grid-cols-2 gap-4">
                    {/* 2. Manage Inventory */}
                    <Link href="/admin/inventory" className="bg-white p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 group active:scale-[0.98] transition-transform duration-300">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Package size={22} />
                        </div>
                        <h3 className="font-medium text-lg text-zinc-800">Inventory</h3>
                        <p className="text-xs text-zinc-400 mt-1">Stock Levels</p>
                    </Link>

                    {/* 3. Add Listing */}
                    <Link href="/admin/upload" className="bg-white p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 group active:scale-[0.98] transition-transform duration-300">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <PlusCircle size={22} />
                        </div>
                        <h3 className="font-medium text-lg text-zinc-800">Add Item</h3>
                        <p className="text-xs text-zinc-400 mt-1">New Product</p>
                    </Link>
                </div>

                {/* 4. Settings Card - Full Width */}
                <Link href="/admin/settings" className="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex items-center justify-between group active:scale-[0.98] transition-transform duration-300">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Settings size={22} />
                        </div>
                        <div>
                            <h3 className="font-medium text-lg text-zinc-800">Settings</h3>
                            <p className="text-xs text-zinc-400">App Configuration</p>
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                </Link>

                {/* Decorative End Badge */}
                <div className="mt-8 flex justify-center">
                    <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 rounded-full border border-zinc-100">
                        <Sparkles size={12} className="text-orange-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Admin Mode Active</span>
                    </div>
                </div>
            </div>

            {/* Logout Button */}
            <div className="mt-12 text-center pb-8">
                <button
                    onClick={() => {
                        if (confirm('Are you sure you want to logout?')) {
                            localStorage.removeItem("admin_session");
                            window.location.reload();
                        }
                    }}
                    className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-600 transition-colors px-6 py-3 rounded-full hover:bg-zinc-50"
                >
                    <LogOut size={14} />
                    <span>Secure Logout</span>
                </button>
            </div>
        </div>
    );
}
