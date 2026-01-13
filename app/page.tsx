"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";

interface Item {
  id: number;
  title: string;
  price: number;
  description: string;
  images: string[];
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setItems(data);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">STORE NAME</h1>
          {/* Add optional cart or contact link here */}
        </div>
      </header>

      {/* Hero Section (Optional) */}
      <section className="py-12 px-4 text-center bg-white border-b">
        <h2 className="text-4xl font-extrabold mb-4">Discover Unique Items</h2>
        <p className="text-gray-500 max-w-xl mx-auto">
          Handpicked collection available for manual booking.
        </p>
      </section>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500">No items available yet.</p>
          </div>
        )}
      </div>
    </main>
  );
}
