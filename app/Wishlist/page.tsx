"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
}

const WishlistPage = () => {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      fetchWishlistItems();
    }
  }, [isSignedIn]);

  const fetchWishlistItems = async () => {
    try {
      const response = await axios.get("/api/wishlist");
      if (response.status === 200) {
        setWishlistItems(response.data as WishlistItem[]);
      }
    } catch (err) {
      setError("Failed to fetch wishlist items");
      console.error("Error fetching wishlist:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (itemId: string) => {
    try {
      await axios.delete(`/api/wishlist/${itemId}`);
      setWishlistItems(prevItems => prevItems.filter(item => item.id !== itemId));
    } catch (err) {
      setError("Failed to remove item from wishlist");
      console.error("Error removing from wishlist:", err);
    }
  };

  const addToCart = async (itemId: string) => {
    setAddingToCart(itemId);
    try {
      await axios.post("/api/cart", { itemId });
      await removeFromWishlist(itemId);
    } catch (err) {
      setError("Failed to add item to cart");
      console.error("Error adding to cart:", err);
    } finally {
      setAddingToCart(null);
    }
  };

  const addAllToCart = async () => {
    try {
      await Promise.all(wishlistItems.map(item => addToCart(item.id)));
      setWishlistItems([]);
    } catch (err) {
      setError("Failed to add all items to cart");
      console.error("Error adding all to cart:", err);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-4">Please sign in to view your wishlist</h1>
            <button
              onClick={() => router.push("/sign-in")}
              className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800"
            >
              Sign In
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Image
              src="/logo.png"
              alt="Loading..."
              width={50}
              height={50}
              className="animate-spin"
            />
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Wishlist</h1>
          {wishlistItems.length > 0 && (
            <button
              onClick={addAllToCart}
              className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 flex items-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              Add All to Cart
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {wishlistItems.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl mb-4">Your wishlist is empty</h2>
            <button
              onClick={() => router.push("/Products")}
              className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <div
                key={item.id}
                className="group relative bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="relative aspect-square">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium mb-2">{item.name}</h3>
                  <p className="text-gray-600 mb-4">${item.price.toFixed(2)}</p>
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => addToCart(item.id)}
                      disabled={addingToCart === item.id}
                      className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      {addingToCart === item.id ? "Adding..." : "Add to Cart"}
                    </button>
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="p-2 text-gray-500 hover:text-red-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default WishlistPage;
