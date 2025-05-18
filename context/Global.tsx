"use client";

import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "@clerk/nextjs";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface GlobalContextType {
  GlobalWishlist: WishlistItem[];
  GlobalCart: CartItem[];
  changeGlobalWishlist: (itemId: string, append: boolean) => Promise<void>;
  changeGlobalCart: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
}

export const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [GlobalWishlist, setGlobalWishlist] = useState<WishlistItem[]>([]);
  const [GlobalCart, setGlobalCart] = useState<CartItem[]>([]);
  const { isSignedIn } = useUser();

  const fetchCartData = async () => {
    try {
      const response = await axios.get("/api/cart");
      if (response.status === 200) {
        setGlobalCart(response.data as CartItem[]);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  const fetchWishlistData = async () => {
    try {
      const response = await axios.get("/api/wishlist");
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
        await axios.post("/api/wishlist", { itemId });
      } else {
        await axios.delete(`/api/wishlist?itemId=${itemId}`);
      }
      await fetchWishlistData();
    } catch (error) {
      console.error("Error updating wishlist:", error);
    }
  };

  const changeGlobalCart = async (itemId: string, quantity: number) => {
    try {
      await axios.put("/api/cart", { itemId, quantity });
      await fetchCartData();
    } catch (error) {
      console.error("Error updating cart:", error);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      await axios.delete(`/api/cart?itemId=${itemId}`);
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
