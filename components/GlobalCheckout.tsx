"use client";

import { useCart } from "@/context/CartContext";
import CheckoutModal from "./CheckoutModal";

export default function GlobalCheckout() {
    const { isCheckoutOpen, setCheckoutOpen, cart } = useCart();

    // Use the first item in cart as a reference product if available, 
    // or a dummy placeholder. This is mainly to satisfy the prop type.
    const referenceProduct = cart.length > 0 ? {
        id: cart[0].itemId,
        title: cart[0].title,
        price: cart[0].price,
        images: [cart[0].image],
        size: cart[0].size,
        color: cart[0].color
    } : {
        title: "Your Bag",
        price: 0
    };

    return (
        <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setCheckoutOpen(false)}
            product={referenceProduct}
            isCartCheckout={true}
        />
    );
}
