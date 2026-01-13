"use client";

export const dynamic = 'force-dynamic';

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
    <main className="min-h-screen">
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-center">
          <h1 className="text-3xl font-serif tracking-widest uppercase text-black">Vastra Mandir</h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 py-20 text-center bg-[#FDFBF7]">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-[1px] bg-black/20 mx-auto mb-8"></div>
          <h2 className="text-5xl md:text-6xl font-serif italic text-gray-900 leading-tight">
            Wear the Essence of Tradition
          </h2>
          <p className="text-gray-500 font-light tracking-wide text-lg uppercase pl-1">
            Premium Handpicked Collection
          </p>
          <div className="w-16 h-[1px] bg-black/20 mx-auto mt-8"></div>
        </div>
      </section>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {items.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-gray-100 bg-white p-12 max-w-md mx-auto">
            <p className="text-xl font-serif italic text-gray-400 mb-2">The collection is currently empty.</p>
            <p className="text-sm text-gray-400 uppercase tracking-widest">Check back soon for new arrivals</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-12 text-center text-gray-400 text-xs uppercase tracking-widest border-t border-gray-100">
        © {new Date().getFullYear()} Vastra Mandir. All Rights Reserved.
      </footer>
    </main>
  );
}
