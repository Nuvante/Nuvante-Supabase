import Navbar from "@/components/Navbar";
import React from "react";
import MajorLayout from "./major_layout";
import Hero from "@/components/Hero";
import Arrivals from "@/components/Arrivals";
import Footer from "@/components/Footer";
import supabase from "@/lib/supabase";

interface Product {
  id: string;
  product_name: string;
  product_images: string[];  // array of image URLs
  product_price: number;
  cancelled_product_price?: number | null;
  latest: boolean;
  description?: string;
  materials?: string;
  packaging?: string;
  shipping?: string;
  product_info?: string;
  type?: string;
}

export default async function Page() {
  const { data: products, error } = await supabase.from("product").select("*");

  if (error) {
    console.error("Supabase Error:", error.message);
  }

  // Map Supabase data to props expected by Arrivals component
  const productsFormatted = (products ?? []).map((p) => ({
    id: p.id,
    productName: p.product_name,
    productImages: p.product_images ?? [],
    productPrice: p.product_price.toString(),
    cancelledProductPrice: p.cancelled_product_price ? p.cancelled_product_price.toString() : "0",
    latest: p.latest,
  }));

  return (
    <>
      <Navbar />
      <Hero />
      <MajorLayout>
        <Arrivals fragment={productsFormatted} />
        {/* <Services /> */}
      </MajorLayout>
      <Footer />
    </>
  );
}
