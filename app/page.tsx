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
  is_sold_out?: boolean;
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

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

  const filteredItems = showAvailableOnly
    ? items.filter(item => !item.is_sold_out)
    : items;

  return (
    <main className="min-h-screen">
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 md:py-6 flex items-center justify-center">
          <h1 className="text-xl md:text-3xl font-serif tracking-widest uppercase text-black">Vastra Mandir</h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 py-10 md:py-20 text-center bg-[#FDFBF7]">
        <div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
          <div className="w-16 h-[1px] bg-black/20 mx-auto mb-4 md:mb-8"></div>
          <h2 className="text-3xl md:text-6xl font-serif italic text-gray-900 leading-tight">
            Wear the Essence of Tradition
          </h2>
          <p className="text-gray-500 font-light tracking-wide text-xs md:text-lg uppercase pl-1">
            Premium Handpicked Collection
          </p>
          <div className="w-16 h-[1px] bg-black/20 mx-auto mt-8"></div>
          <div className="w-16 h-[1px] bg-black/20 mx-auto mt-8"></div>
        </div>

        {/* Filter Toggle */}
        <div className="flex justify-center mt-12">
          <button
            onClick={() => setShowAvailableOnly(!showAvailableOnly)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${showAvailableOnly
              ? 'bg-black text-white shadow-lg'
              : 'bg-white text-gray-900 border border-gray-200 hover:border-black'
              }`}
          >
            {showAvailableOnly ? (
              <>
                <span>Showing Available</span>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              </>
            ) : (
              <>
                <span>Show Available Only</span>
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-8 md:py-20">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-8 md:gap-x-8 md:gap-y-12">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-8 md:gap-x-8 md:gap-y-12">
            {filteredItems.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-gray-100 bg-white p-12 max-w-md mx-auto">
            <p className="text-xl font-serif italic text-gray-400 mb-2">
              {showAvailableOnly ? "No available items found." : "The collection is currently empty."}
            </p>
            <p className="text-sm text-gray-400 uppercase tracking-widest">Check back soon for new arrivals</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-12 text-center border-t border-gray-100 bg-white">
        <p className="font-serif text-xl mb-3 text-black">Vastra Mandir</p>
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-6">Wear the Essence of Tradition</p>

        <a href="tel:9743174487" className="inline-block border border-gray-200 rounded-full px-5 py-2 text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all hover:border-black mb-8">
          Need Help? Call +91 9743174487
        </a>

        <p className="text-gray-300 text-[10px] uppercase tracking-widest">
          © {new Date().getFullYear()} Vastra Mandir. All Rights Reserved.
        </p>
      </footer>
    </main>
  );
}
