"use client";
import React, { useContext, useState } from "react";
import axios from "axios";
import { GlobalContext } from "@/context/Global";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Alert from "./Alert";

type propType = {
  id: string;
  src: string;
  productName: string;
  productPrice: number;
  cancelledPrice: number;
  status: string;
  description?: string;
  materials?: string;
  packaging?: string;
  shipping?: string;
  productInfo?: string;
  type?: string;
};

const domain = process.env.NEXT_PUBLIC_DOMAIN;

export default function Card({
  id,
  src,
  productName,
  productPrice,
  cancelledPrice,
  status,
}: propType) {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("GlobalContext is not provided.");
  }

  const user = useUser();

  const { GlobalWishlist, changeGlobalWishlist, GlobalCart, changeGlobalCart } =
    context;

  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [loadingCart, setLoadingCart] = useState(false);
  const [alert, setAlert] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const showAlert = (message: string, type: "success" | "error") => {
    setAlert({ show: true, message, type });
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, show: false }));
  };

  const handleWishlistPresence = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user.isSignedIn) {
      showAlert("Please sign in to access wishlist", "error");
      setTimeout(() => {
        window.location.href = "/sign-in";
      }, 2000);
      return;
    }

    setLoadingWishlist(true);
    const isPresent = GlobalWishlist.some(item => item.id === id);

    try {
      const response = await axios.post("/api/propagation", {
        type: isPresent ? "remove_from_wishlist" : "add_to_wishlist",
        productId: id,
      });

      if (response.status === 200) {
        await changeGlobalWishlist(id, !isPresent);
        
        showAlert(
          isPresent ? "Removed from wishlist" : "Added to wishlist",
          "success"
        );
      } else {
        throw new Error("Failed to update wishlist");
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      showAlert("Failed to update wishlist. Please try again.", "error");
    } finally {
      setLoadingWishlist(false);
    }
  };

  const handleAddToCart = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user.isSignedIn) {
      showAlert("Please sign in to access cart", "error");
      setTimeout(() => {
        window.location.href = "/sign-in";
      }, 2000);
      return;
    }

    setLoadingCart(true);
    const isPresent = GlobalCart.some(item => item.id === id);

    try {
      const response = await axios.post("/api/propagation", {
        type: isPresent ? "remove_from_cart" : "add_to_cart",
        productId: id,
      });

      if (response.data === 200) {
        await changeGlobalCart(id, isPresent ? 0 : 1);
        setLoadingCart(false);
        showAlert(
          isPresent ? "Removed from cart" : "Added to cart",
          "success"
        );
      } else {
        throw new Error("Failed to update cart");
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      showAlert("Failed to update cart. Please try again.", "error");
    } finally {
      setLoadingCart(false);
    }
  };

  // Check if the product is already in the wishlist
  const isInWishlist = GlobalWishlist.some(item => item.id === id);

  return (
    <>
      {alert.show && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={hideAlert}
        />
      )}
      <div
        onClick={() => (window.location.href = `/ProductDetails/${id}`)}
        className="w-[165px] overflow-hidden sm:w-[100px] md:w-[300px] lg:w-[220px] xl:w-[320px] 2xl:w-[550px] relative flex flex-col gap-4 cursor-pointer group"
      >
        <div className="card-body flex sm:justify-evenly justify-center relative sm:w-full sm:h-[500px] md:h-[370px] lg:h-[400px] xl:h-[530px] 2xl:h-[780px] h-[230px] w-[160px] mx-auto rounded-lg">
          <img
            src={src}
            alt={productName}
            className="sm:w-full h-full w-[160px] object-cover relative bg-[#F5F5F5]"
          />
          {status === "new" && (
            <h1 className="absolute top-1 left-1 rounded-lg bg-black px-3 py-1 text-white text-sm font-bold">
              NEW
            </h1>
          )}

          <button
            onClick={handleWishlistPresence}
            disabled={loadingWishlist}
            className={`absolute rounded-full top-2 right-3 w-[30px] h-[30px] bg-transparent ${
              loadingWishlist ? "opacity-50" : "opacity-100"
            } hover:opacity-100 transition-opacity`}
          >
            {loadingWishlist ? (
              "⏳"
            ) : (
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill={isInWishlist ? "#DB4444" : "none"}
                xmlns="http://www.w3.org/2000/svg"
                className="transition-colors duration-200"
              >
                <path
                  d="M8 5C5.7912 5 4 6.73964 4 8.88594C4 10.6185 4.7 14.7305 11.5904 18.8873C11.7138 18.961 11.8555 19 12 19C12.1445 19 12.2862 18.961 12.4096 18.8873C19.3 14.7305 20 10.6185 20 8.88594C20 6.73964 18.2088 5 16 5C13.7912 5 12 7.35511 12 7.35511C12 7.35511 10.2088 5 8 5Z"
                  stroke={isInWishlist ? "none" : "#DB4444"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <button
            onClick={handleAddToCart}
            disabled={loadingCart}
            className={`absolute bottom-0 sm:left-1/2 left-[72px] transform -translate-x-1/2 font-bold bg-black text-white sm:w-[270px] w-[145px] py-2 px-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
          >
            {loadingCart
              ? "⏳"
              : GlobalCart.some(item => item.id === id)
              ? "Remove from cart"
              : "Add to cart"}
          </button>
        </div>
        <div className="card-details flex flex-col gap-3 text-center uppercase">
          <h1 className="font-extrabold text-black text-lg sm:text-xl md:text-2xl line-clamp-2">{productName}</h1>
          <div className="flex gap-2 text-center mx-auto w-fit uppercase">
            <h1 className="text-[#DB4444] font-extrabold text-base sm:text-lg md:text-xl">Rs. {productPrice}</h1>
            <h1 className="line-through text-gray-500 font-extrabold text-sm sm:text-base md:text-lg">
              Rs. {cancelledPrice}
            </h1>
          </div>
        </div>
      </div>
    </>
  );
}
