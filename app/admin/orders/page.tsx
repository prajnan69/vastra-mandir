"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { MessageCircle, MapPin, Package, CheckCircle, ArrowLeft, Truck, IndianRupee } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getRandomToast } from "@/lib/kannada-toasts";
import { motion, AnimatePresence } from "framer-motion";

interface OrderItem {
    id?: string;
    itemId?: number;
    title: string;
    price: number;
    color?: string;
    size?: string;
    quantity?: number;
    image?: string;
}

interface Order {
    id: number;
    created_at: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    customer_pincode: string;
    item_title: string;
    item_price: number;
    status: string;
    order_items?: OrderItem[];
}

type TabType = 'pending' | 'confirmed' | 'delivered';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('pending');

    useEffect(() => {
        fetchOrders();
    }, [activeTab]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            let statusFilter: string[] = [];

            if (activeTab === 'pending') {
                statusFilter = ['pending', 'paid_online', 'cod_pending'];
            } else if (activeTab === 'confirmed') {
                statusFilter = ['confirmed'];
            } else {
                statusFilter = ['delivered'];
            }

            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .in('status', statusFilter)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setOrders(data);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: number, phone: string, item: string, name: string, newStatus: 'confirmed' | 'declined') => {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            toast.error(getRandomToast('errors'));
            console.error(error);
            return;
        }

        fetchOrders();

        // Track Action
        const adminName = localStorage.getItem("admin_name") || "Unknown";
        await supabase.from('admin_logs').insert([{
            admin_name: adminName,
            action: newStatus === 'confirmed' ? "CONFIRMED_ORDER" : "DECLINED_ORDER",
            details: { order_id: id, customer: name, product: item }
        }]);

        let message = "";
        if (newStatus === 'confirmed') {
            message = `Hello ${name}! 🌸

Your order for *${item}* from Vastra Mandir has been *CONFIRMED* ✅.

We will pack and ship it shortly. Thank you for shopping with us!`;
        } else {
            message = `Hello ${name}. 

Regarding your order for *${item}* at Vastra Mandir.

Unfortunately, we cannot fulfill this order at this time ❌.

Please contact us for more details or a refund if applicable.`;
        }

        // Optimistic UI: Remove from current view after re-fetch or immediately
        setOrders(prev => prev.filter(o => o.id !== id));
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
    };

    const handleMarkDelivered = async (id: number, phone: string, name: string) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: 'delivered' })
            .eq('id', id);

        if (error) {
            alert("Error marking order as delivered");
            console.error(error);
            return;
        }

        fetchOrders();

        // Track Action
        const adminName = localStorage.getItem("admin_name") || "Unknown";
        await supabase.from('admin_logs').insert([{
            admin_name: adminName,
            action: "DELIVERED_ORDER",
            details: { order_id: id, customer: name }
        }]);

        const message = `Hello ${name}! 🎉

Your order from Vastra Mandir has been *DELIVERED* successfully! ✅

Thank you for shopping with us. We hope you love your purchase!`;

        // Optimistic UI: Remove from current view
        setOrders(prev => prev.filter(o => o.id !== id));
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
    };

    const calculateTotal = () => {
        return orders.reduce((sum, order) => sum + order.item_price, 0);
    };

    const renderOrderCard = (order: Order) => {
        const items = order.order_items || [{ title: order.item_title, price: order.item_price }];

        return (
            <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 50, transition: { duration: 0.3 } }}
                className="bg-white rounded-2xl p-6 shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-gray-100 relative overflow-hidden"
            >
                {/* Status Badge */}
                <div className="absolute top-0 right-0 p-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${activeTab === 'pending' ? 'bg-orange-100 text-orange-700' :
                        activeTab === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                        }`}>
                        {activeTab}
                    </span>
                </div>

                {/* Header: ID */}
                <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-3 pr-20">
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order #{order.id}</span>
                        <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                </div>

                {/* Order Items */}
                <div className="space-y-3 mb-4 border-b border-gray-50 pb-4">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className="font-medium text-sm leading-tight">{item.title}</h3>
                                {item.color && item.size && (
                                    <div className="flex gap-3 mt-1.5">
                                        <span className="text-xs text-gray-500">
                                            Color: <span className="font-medium text-gray-700">{item.color}</span>
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Size: <span className="font-medium text-gray-700">{item.size}</span>
                                        </span>
                                        {item.quantity && item.quantity > 1 && (
                                            <span className="text-xs text-gray-500">
                                                Qty: <span className="font-medium text-gray-700">{item.quantity}</span>
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <span className="font-serif text-sm font-medium ml-3">₹{item.price.toLocaleString()}</span>
                        </div>
                    ))}
                </div>

                {/* Customer Details */}
                <div className="space-y-4 mb-6">
                    {/* Name & Phone */}
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                            <MessageCircle size={14} />
                        </div>
                        <div>
                            <p className="font-medium text-sm">{order.customer_name}</p>
                            <p className="text-gray-400 text-xs font-mono">{order.customer_phone}</p>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                            <MapPin size={14} />
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg w-full">
                            <p className="text-sm text-gray-600 leading-relaxed text-xs">
                                {order.customer_address}
                            </p>
                            <p className="font-mono text-xs text-black mt-1 font-bold">
                                PIN: {order.customer_pincode}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Total & Actions */}
                <div className="flex items-center justify-between pt-2 mb-4">
                    <span className="font-serif text-xl font-medium">₹{order.item_price.toLocaleString()}</span>
                </div>

                {/* Action Buttons */}
                {activeTab === 'pending' && (
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleUpdateStatus(order.id, order.customer_phone, order.item_title, order.customer_name, 'confirmed')}
                            className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-green-700 shadow-sm transition-all active:scale-95"
                        >
                            <CheckCircle size={14} />
                            Accept Order
                        </button>
                        <button
                            onClick={() => handleUpdateStatus(order.id, order.customer_phone, order.item_title, order.customer_name, 'declined')}
                            className="flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-100 py-3 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-red-100 transition-all active:scale-95"
                        >
                            <Package size={14} />
                            Decline Order
                        </button>
                    </div>
                )}

                {activeTab === 'confirmed' && (
                    <button
                        onClick={() => handleMarkDelivered(order.id, order.customer_phone, order.customer_name)}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-blue-700 shadow-sm transition-all active:scale-95"
                    >
                        <Truck size={14} />
                        Mark as Delivered
                    </button>
                )}
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-200 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                    <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="font-serif text-lg">Orders</h1>
                        <p className="text-xs text-gray-500">{orders.length} {activeTab}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                    {(['pending', 'confirmed', 'delivered'] as TabType[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 relative py-2.5 px-4 text-[10px] font-bold uppercase tracking-[0.15em] rounded-lg transition-colors z-10 ${activeTab === tab
                                ? 'text-black'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-white rounded-lg shadow-sm z-[-1]"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative">
                                {tab}
                                {tab === 'pending' && orders.length > 0 && activeTab === 'pending' && (
                                    <span className="absolute -top-1 -right-4 w-2 h-2 bg-orange-500 rounded-full border-2 border-white" />
                                )}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Total Amount for Delivered Orders */}
            {activeTab === 'delivered' && orders.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="mx-4 mt-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 shadow-lg text-white"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-widest opacity-90 mb-1">Total Revenue</p>
                            <div className="flex items-center gap-2">
                                <IndianRupee size={24} />
                                <span className="font-serif text-3xl font-bold">{calculateTotal().toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold">{orders.length}</p>
                            <p className="text-xs opacity-90">Orders</p>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="p-4 space-y-4">
                {loading && orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                            <Package size={40} className="text-zinc-200" />
                        </motion.div>
                        <p className="text-zinc-400 font-medium text-sm">Getting your orders...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {orders.length === 0 ? (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-12 text-gray-400"
                                >
                                    <Package size={48} className="mx-auto mb-4 opacity-10" />
                                    <p className="text-sm font-medium">No {activeTab} orders found</p>
                                </motion.div>
                            ) : (
                                orders.map(renderOrderCard)
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
