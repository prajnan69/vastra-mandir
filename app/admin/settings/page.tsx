"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Save, Loader2, CheckCircle, Settings, CreditCard, ShieldCheck } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { getRandomToast } from "@/lib/kannada-toasts";

export default function AdminSettingsPage() {
    const [upiId, setUpiId] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'upi_id')
                .single();

            if (error) throw error;
            if (data) setUpiId(data.value);
        } catch (err) {
            console.error("Error fetching settings:", err);
            toast.error(getRandomToast('errors'));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);
        setError("");

        try {
            const { error } = await supabase
                .from('settings')
                .update({ value: upiId })
                .eq('key', 'upi_id');

            if (error) throw error;

            setSuccess(true);

            // Track Action
            const adminName = localStorage.getItem("admin_name") || "Unknown";
            await supabase.from('admin_logs').insert([{
                admin_name: adminName,
                action: "UPDATE_SETTING",
                details: { key: "upi_id", value: upiId }
            }]);

            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.8 },
                colors: ['#A78BFA', '#8B5CF6', '#7C3AED'] // Purple theme
            });
            toast.success(getRandomToast('success', 'share')); // Reusing share success for saving logic
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Error saving settings:", err);
            toast.error(getRandomToast('errors'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] pb-20">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md px-6 py-6 sticky top-0 z-10 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors relative top-0.5">
                        <ArrowLeft size={20} className="text-zinc-600" />
                    </Link>
                    <div>
                        <h1 className="font-serif text-2xl text-zinc-900">Settings</h1>
                        <p className="text-xs text-zinc-400 uppercase tracking-widest mt-0.5">Configuration</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 max-w-xl mx-auto animate-enter">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
                        <Loader2 className="animate-spin" size={32} />
                        <span className="text-sm font-medium">Loading settings...</span>
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 space-y-8 relative overflow-hidden">

                        {/* Decorative background element */}
                        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-purple-100/50 rounded-full blur-3xl pointer-events-none"></div>

                        {/* Icon Header */}
                        <div className="flex items-center gap-5 pb-6 border-b border-gray-50 relative z-10">
                            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-100">
                                <CreditCard size={32} />
                            </div>
                            <div>
                                <h2 className="font-medium text-xl text-zinc-900">Payment Gateway</h2>
                                <p className="text-sm text-zinc-400 mt-1">Configure your UPI collection ID</p>
                            </div>
                        </div>

                        {/* UPI ID Input */}
                        <div className="space-y-3 relative z-10">
                            <label className="text-xs uppercase text-zinc-400 font-bold tracking-wider ml-1">
                                Merchant UPI ID
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="example@upi"
                                className="w-full px-5 py-4 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500/10 focus:bg-white outline-none transition-all text-lg font-medium placeholder:text-zinc-300"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                            />
                            <div className="flex items-center gap-2 text-[10px] text-zinc-400 px-1">
                                <ShieldCheck size={12} className="text-green-500" />
                                <span>Securely stored & used for checkout</span>
                            </div>
                        </div>

                        {/* Success Message */}
                        {success && (
                            <div className="flex items-center gap-3 bg-green-50 text-green-700 px-5 py-4 rounded-xl border border-green-100 animate-fade-in">
                                <CheckCircle size={20} className="text-green-500" />
                                <span className="text-sm font-medium">Settings saved successfully!</span>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 text-red-700 px-5 py-4 rounded-xl border border-red-100 animate-shake">
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}

                        {/* Save Button */}
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-zinc-900 text-white py-4 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-zinc-900/10 active:scale-[0.98]"
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Saving changes...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Configuration
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
