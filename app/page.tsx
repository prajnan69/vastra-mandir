"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
import { ShoppingBag, ChevronDown, SlidersHorizontal, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Item {
  id: number;
  title: string;
  price: number;
  description: string;
  images: string[];
  category?: string;
  is_sold_out?: boolean;
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [scrolled, setScrolled] = useState(false);
  const { cart, setCartOpen } = useCart();

  useEffect(() => {
    fetchItems();

    const parent = document.querySelector('.snap-parent');
    const handleScroll = () => {
      if (parent) setScrolled(parent.scrollTop > 50);
    };
    parent?.addEventListener("scroll", handleScroll);
    return () => parent?.removeEventListener("scroll", handleScroll);
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

  const categories = ["All", ...Array.from(new Set(items.map(item => item.category).filter(Boolean)))];

  const filteredItems = items.filter(item => {
    const isCategoryMatch = selectedCategory === "All" || item.category === selectedCategory;
    const isAvailabilityMatch = !showAvailableOnly || !item.is_sold_out;
    return isCategoryMatch && isAvailabilityMatch;
  });

  return (
    <main className="snap-parent bg-[#FCFCFC]">
      {/* Premium Sticky Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-gray-100 py-3'
          : 'bg-transparent py-6'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="w-10 md:hidden"></div> {/* Balance for mobile */}

          <div className="hidden md:flex items-center gap-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-black cursor-pointer transition-colors">Collection</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-black cursor-pointer transition-colors">About</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center flex-1"
          >
            <h1 className="text-xl md:text-3xl font-serif tracking-[0.2em] sm:tracking-[0.3em] uppercase text-black">Vastra Mandir</h1>
            {!scrolled && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[7px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.4em] text-gray-400 mt-1"
              >
                The Essence of Tradition
              </motion.span>
            )}
          </motion.div>

          <button
            onClick={() => setCartOpen(true)}
            className="w-10 h-10 flex items-center justify-center relative hover:bg-gray-100/50 rounded-full transition-all group scale-100 active:scale-90"
          >
            <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" strokeWidth={1.5} />
            <AnimatePresence>
              {cart.length > 0 && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute top-1 right-1 w-4 h-4 bg-black text-white text-[9px] font-bold flex items-center justify-center rounded-full ring-2 ring-white"
                >
                  {cart.length}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </header>

      {/* Elegant Hero Section */}
      <section className="snap-child relative h-[100dvh] w-full flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-50/50 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-50/50 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto px-6 relative z-10 flex flex-col items-center justify-center flex-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div className="w-8 h-[1px] bg-black/10"></div>
            <Sparkles size={12} className="text-orange-300" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 pl-1">Handpicked Luxury</span>
            <div className="w-8 h-[1px] bg-black/10"></div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl md:text-8xl font-serif italic text-gray-900 leading-[1.1] tracking-tight"
          >
            Crafting Elegance <br className="sm:hidden" /> In Every Thread
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="flex flex-col items-center gap-8 mt-12"
          >
            <p className="max-w-md text-gray-500 font-light leading-relaxed text-sm md:text-base">
              Discover a curated collection where traditional craftsmanship meets modern sophistication.
            </p>

            {categories.length > 1 && (
              <div className="flex flex-col items-center gap-6 w-full max-w-2xl animate-fade-in">
                <div className="w-full">
                  {/* Category Filter Chips - Scrollable on mobile */}
                  <div className="flex overflow-x-auto sm:flex-wrap items-center justify-start sm:justify-center gap-2 md:gap-3 w-full pb-4 sm:pb-0 px-2 scrollbar-hide">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat as string)}
                        className={`px-5 py-2 md:px-7 md:py-2.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 flex-shrink-0 h-10 md:h-12 flex items-center shadow-sm ${selectedCategory === cat
                          ? 'bg-black text-white shadow-xl shadow-black/10'
                          : 'bg-white/50 backdrop-blur-md text-gray-400 border border-gray-100 hover:border-black/10 hover:text-black'
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Cinematic Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 flex flex-col items-center gap-4 cursor-pointer group"
          onClick={() => {
            const container = document.querySelector('.snap-parent');
            if (container) {
              container.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
            }
          }}
        >
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400 group-hover:text-black transition-colors">Experience High-End</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-gray-300 group-hover:text-black transition-colors"
          >
            <ChevronDown size={20} strokeWidth={1} />
          </motion.div>
        </motion.div>
      </section>

      {/* Refined Product Grid */}
      <div className="snap-child max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-32">
        <div className="flex items-center justify-between mb-12 md:mb-20 px-2">
          <div>
            <h3 className="text-2xl md:text-4xl font-serif italic">Our Collection</h3>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mt-2">Selected Wearables</p>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">
            {filteredItems.length} Products
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-12 md:gap-x-12 md:gap-y-24">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[3/4] bg-gray-100 animate-pulse rounded-2xl" />
                <div className="h-4 w-2/3 bg-gray-100 animate-pulse rounded mx-auto" />
                <div className="h-3 w-1/3 bg-gray-50 animate-pulse rounded mx-auto" />
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-12 md:gap-x-12 md:gap-y-24">
            {filteredItems.map((item, index) => (
              <ProductCard key={item.id} product={item} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-32 glass border-none rounded-[3rem] max-w-xl mx-auto"
          >
            <p className="text-2xl font-serif italic text-gray-400 mb-4 px-8">
              {showAvailableOnly ? "The collection is flying off the shelves. Check back shortly." : "We're curating something special for you."}
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-medium">Coming Soon</p>
          </motion.div>
        )}
      </div>

      {/* Premium Footer */}
      <footer className="pt-32 pb-16 bg-white border-t border-gray-50 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-8 relative z-10 flex flex-col items-center">
          <h2 className="text-2xl md:text-5xl font-serif tracking-[0.4em] uppercase mb-4">Vastra Mandir</h2>
          <p className="text-xs text-gray-400 uppercase tracking-[0.3em] mb-12">Wear the Essence of Tradition</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 w-full max-w-3xl mb-24 text-center md:text-left">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-black">Shop</h4>
              <ul className="text-xs text-gray-400 space-y-2 font-light">
                <li className="hover:text-black cursor-pointer transition-colors">New Arrivals</li>
                <li className="hover:text-black cursor-pointer transition-colors">Collection</li>
                <li className="hover:text-black cursor-pointer transition-colors">Sale</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-black">Info</h4>
              <ul className="text-xs text-gray-400 space-y-2 font-light">
                <li className="hover:text-black cursor-pointer transition-colors">Our Story</li>
                <li className="hover:text-black cursor-pointer transition-colors">Terms</li>
                <li className="hover:text-black cursor-pointer transition-colors">Privacy</li>
              </ul>
            </div>
            <div className="space-y-4 col-span-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-black">Connect</h4>
              <a href="tel:9743174487" className="inline-block border border-black/5 rounded-full px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-black hover:text-white hover:border-black active:scale-95 shadow-sm">
                Call +91 9743174487
              </a>
            </div>
          </div>

          <div className="w-full h-[1px] bg-black/5 mb-8"></div>

          <p className="text-gray-300 text-[9px] uppercase tracking-[0.5em] font-medium">
            © {new Date().getFullYear()} Vastra Mandir. Designed for Excellence.
          </p>
        </div>
      </footer>
    </main>
  );
}
