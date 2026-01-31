import { supabase } from "@/lib/supabase";
import ProductClient from "@/components/ProductClient";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;

    // Fetch product details for SEO/Metadata on server
    const { data: item } = await supabase
        .from('items')
        .select('title, price, description, images')
        .eq('id', id)
        .single();

    if (!item) {
        return {
            title: "Product Not Found",
        };
    }

    const title = `${item.title} - Vastra Mandir`;
    const description = `₹${item.price} - ${item.description.slice(0, 150)}...`;
    const imageUrl = item.images?.[0] || "/og-image.jpg";

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [imageUrl],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [imageUrl],
        },
    };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { data: item } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .eq('is_deleted', false)
        .single();

    if (!item) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white p-6 text-center">
                <div className="space-y-4">
                    <h1 className="text-2xl font-serif italic text-gray-400">Product Not Found</h1>
                    <p className="text-xs uppercase tracking-widest text-gray-400">The collection is constantly evolving.</p>
                </div>
            </div>
        );
    }

    return <ProductClient initialItem={item} />;
}
