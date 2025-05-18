"use client";

import React, { createContext, useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import axiosInstance from "@/lib/axios";

interface CartItem {
  id: string;
  product_name: string;
  product_price: number;
  product_images: string[];
  quantity: number;
}

interface WishlistItem {
  id: string;
  product_name: string;
  product_price: number;
  product_images: string[];
}

export const GlobalContext = createContext<{
  GlobalWishlist: WishlistItem[];
  GlobalCart: CartItem[];
  changeGlobalWishlist: (itemId: string, append: boolean) => Promise<void>;
  changeGlobalCart: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
}>({
  GlobalWishlist: [],
  GlobalCart: [],
  changeGlobalWishlist: async () => {},
  changeGlobalCart: async () => {},
  removeFromCart: async () => {},
});

export const GlobalContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [GlobalWishlist, setGlobalWishlist] = useState<WishlistItem[]>([]);
  const [GlobalCart, setGlobalCart] = useState<CartItem[]>([]);
  const { isSignedIn } = useUser();

  const fetchCartData = async () => {
    try {
      const response = await axiosInstance.get("/cart");
      if (response.status === 200) {
        setGlobalCart(response.data as CartItem[]);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  const fetchWishlistData = async () => {
    try {
      const response = await axiosInstance.get("/wishlist");
      if (response.status === 200) {
        setGlobalWishlist(response.data as WishlistItem[]);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchCartData();
      fetchWishlistData();
    } else {
      setGlobalWishlist([]);
      setGlobalCart([]);
    }
  }, [isSignedIn]);

  const changeGlobalWishlist = async (itemId: string, append: boolean) => {
    try {
      if (append) {
        await axiosInstance.post("/wishlist", { itemId });
      } else {
        await axiosInstance.delete(`/wishlist?itemId=${itemId}`);
      }
      await fetchWishlistData();
    } catch (error) {
      console.error("Error updating wishlist:", error);
    }
  };

  const changeGlobalCart = async (itemId: string, quantity: number) => {
    try {
      await axiosInstance.put("/cart", { itemId, quantity });
      await fetchCartData();
    } catch (error) {
      console.error("Error updating cart:", error);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      await axiosInstance.delete(`/cart?itemId=${itemId}`);
      await fetchCartData();
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  return (
    <GlobalContext.Provider
      value={{
        GlobalWishlist,
        GlobalCart,
        changeGlobalWishlist,
        changeGlobalCart,
        removeFromCart,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
