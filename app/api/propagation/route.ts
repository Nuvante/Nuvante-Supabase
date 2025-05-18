import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Cache duration in seconds
const CACHE_DURATION = 60; // 1 minute

// Helper function to handle public routes (no auth required)
async function handlePublicRoutes({ id, every }: { id?: string; every?: boolean }) {
  const headers = {
    'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
  };

  // Handle fetching a single product
  if (id && !every) {
    const { data: product, error: productError } = await supabase
      .from("products")
      .select(`
        id,
        product_name,
        product_price,
        product_images,
        cancelled_product_price,
        latest,
        description,
        materials,
        packaging,
        shipping,
        product_info,
        type
      `)
      .eq("id", id)
      .single();

    if (productError) {
      console.error("Error fetching product");
      return NextResponse.json(
        { error: "Failed to fetch product" },
        { status: 500, headers }
      );
    }

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404, headers }
      );
    }

    return NextResponse.json(product, { status: 200, headers });
  }

  // Handle fetching all products
  if (every) {
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(`
        id,
        product_name,
        product_price,
        product_images,
        cancelled_product_price,
        latest,
        description,
        materials,
        packaging,
        shipping,
        product_info,
        type
      `);

    if (productsError) {
      console.error("Error fetching products");
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500, headers }
      );
    }

    return NextResponse.json(products || [], { status: 200, headers });
  }
}

export async function POST(request: Request) {
  try {
    const { type, productId, productIds, id, every } = await request.json();

    // If this is a public route (product fetching), handle it without authentication
    if (id || every) {
      return handlePublicRoutes({ id, every });
    }

    // For protected routes (wishlist, cart, etc.), require authentication
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Add cache control headers for protected routes
    const headers = {
      'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
    };

    // Handle protected routes
    switch (type) {
      case "wishlist":
        const { data: wishlistData, error: wishlistError } = await supabase
          .from("client")
          .select("wishlist")
          .eq("clerk_id", user.id)
          .single();

        if (wishlistError) {
          console.error("Error fetching wishlist");
          return NextResponse.json(
            { error: "Failed to fetch wishlist" },
            { status: 500, headers }
          );
        }

        if (!wishlistData || !wishlistData.wishlist?.length) {
          return NextResponse.json([], { status: 200, headers });
        }

        // Fetch the complete product data
        const { data: wishlistProducts, error: productsError } = await supabase
          .from("product")
          .select(`
            id,
            product_name,
            product_price,
            product_images,
            cancelled_product_price,
            latest,
            description,
            materials,
            packaging,
            shipping,
            product_info,
            type
          `)
          .in("id", wishlistData.wishlist.map((item: { id: string }) => item.id));

        if (productsError) {
          console.error("Error fetching wishlist products");
          return NextResponse.json(
            { error: "Failed to fetch wishlist products" },
            { status: 500, headers }
          );
        }

        if (!wishlistProducts || wishlistProducts.length === 0) {
          return NextResponse.json([], { status: 200, headers });
        }

        // Transform the data to match the expected format
        const transformedProducts = wishlistProducts.map(product => ({
          _id: product.id,
          name: product.product_name || "Unknown Product",
          price: product.product_price || 0,
          image: Array.isArray(product.product_images) && product.product_images.length > 0
            ? product.product_images[0]
            : "/placeholder.png",
          status: product.latest ? "new" : "regular",
          description: product.description || "",
          materials: product.materials || "",
          cancelled_price: product.cancelled_product_price || 0
        }));

        return NextResponse.json(transformedProducts, { status: 200, headers });

      case "cart":
        const { data: cartData, error: cartError } = await supabase
          .from("client")
          .select("cart")
          .eq("clerk_id", user.id)
          .single();

        if (cartError) {
          console.error("Error fetching cart");
          return NextResponse.json(
            { error: "Failed to fetch cart" },
            { status: 500, headers }
          );
        }

        if (!cartData?.cart?.length) {
          return NextResponse.json([], { status: 200, headers });
        }

        const { data: cartProducts, error: cartProductsError } = await supabase
          .from("product")
          .select("*")
          .in("id", cartData.cart.map((item: { id: string }) => item.id));

        if (cartProductsError) {
          console.error("Error fetching cart products");
          return NextResponse.json(
            { error: "Failed to fetch cart products" },
            { status: 500, headers }
          );
        }

        return NextResponse.json(cartProducts, { status: 200, headers });

      case "add_to_wishlist":
        if (!productId) {
          return NextResponse.json(
            { error: "Product ID is required" },
            { status: 400, headers }
          );
        }

        const { data: clientData, error: clientError } = await supabase
          .from("client")
          .select("wishlist")
          .eq("clerk_id", user.id)
          .single();

        if (clientError) {
          console.error("Error fetching client:", clientError);
          return NextResponse.json(
            { error: "Failed to fetch client data" },
            { status: 500, headers }
          );
        }

        const currentWishlist = clientData?.wishlist || [];
        if (currentWishlist.some((item: { id: string }) => item.id === productId)) {
          return NextResponse.json(
            { message: "Product already in wishlist" },
            { status: 200, headers }
          );
        }

        const { error: updateError } = await supabase
          .from("client")
          .update({
            wishlist: [...currentWishlist, { id: productId }],
            updated_at: new Date().toISOString(),
          })
          .eq("clerk_id", user.id);

        if (updateError) {
          console.error("Error updating wishlist:", updateError);
          return NextResponse.json(
            { error: "Failed to update wishlist" },
            { status: 500, headers }
          );
        }

        return NextResponse.json(
          { message: "Product added to wishlist" },
          { status: 200, headers }
        );

      case "remove_from_wishlist":
        if (!productId) {
          return NextResponse.json(
            { error: "Product ID is required" },
            { status: 400, headers }
          );
        }

        const { data: clientWishlist, error: clientWishlistError } = await supabase
          .from("client")
          .select("wishlist")
          .eq("clerk_id", user.id)
          .single();

        if (clientWishlistError) {
          console.error("Error fetching client wishlist:", clientWishlistError);
          return NextResponse.json(
            { error: "Failed to fetch client wishlist" },
            { status: 500, headers }
          );
        }

        const updatedWishlist = (clientWishlist?.wishlist || []).filter(
          (item: { id: string }) => item.id !== productId
        );

        const { error: removeError } = await supabase
          .from("client")
          .update({
            wishlist: updatedWishlist,
            updated_at: new Date().toISOString(),
          })
          .eq("clerk_id", user.id);

        if (removeError) {
          console.error("Error removing from wishlist:", removeError);
          return NextResponse.json(
            { error: "Failed to remove from wishlist" },
            { status: 500, headers }
          );
        }

        return NextResponse.json(
          { message: "Product removed from wishlist" },
          { status: 200, headers }
        );

      case "add_to_cart":
        if (!productId) {
          return NextResponse.json(
            { error: "Product ID is required" },
            { status: 400, headers }
          );
        }

        const { data: clientCart, error: clientCartError } = await supabase
          .from("clients")
          .select("cart")
          .eq("clerk_id", user.id)
          .single();

        if (clientCartError) {
          console.error("Error fetching client cart:", clientCartError);
          return NextResponse.json(
            { error: "Failed to fetch client cart" },
            { status: 500, headers }
          );
        }

        const currentCart = clientCart?.cart || [];
        if (currentCart.includes(productId)) {
          return NextResponse.json(
            { message: "Product already in cart" },
            { status: 200, headers }
          );
        }

        const { error: addToCartError } = await supabase
          .from("clients")
          .update({
            cart: [...currentCart, productId],
            updated_at: new Date().toISOString(),
          })
          .eq("clerk_id", user.id);

        if (addToCartError) {
          console.error("Error adding to cart:", addToCartError);
          return NextResponse.json(
            { error: "Failed to add to cart" },
            { status: 500, headers }
          );
        }

        return NextResponse.json(
          { message: "Product added to cart" },
          { status: 200, headers }
        );

      case "remove_from_cart":
        if (!productId) {
          return NextResponse.json(
            { error: "Product ID is required" },
            { status: 400, headers }
          );
        }

        const { data: clientCartData, error: clientCartDataError } = await supabase
          .from("clients")
          .select("cart")
          .eq("clerk_id", user.id)
          .single();

        if (clientCartDataError) {
          console.error("Error fetching client cart:", clientCartDataError);
          return NextResponse.json(
            { error: "Failed to fetch client cart" },
            { status: 500, headers }
          );
        }

        const updatedCart = (clientCartData?.cart || []).filter(
          (id: string) => id !== productId
        );

        const { error: removeFromCartError } = await supabase
          .from("clients")
          .update({
            cart: updatedCart,
            updated_at: new Date().toISOString(),
          })
          .eq("clerk_id", user.id);

        if (removeFromCartError) {
          console.error("Error removing from cart:", removeFromCartError);
          return NextResponse.json(
            { error: "Failed to remove from cart" },
            { status: 500, headers }
          );
        }

        return NextResponse.json(
          { message: "Product removed from cart" },
          { status: 200, headers }
        );

      case "add_all_to_cart":
        if (!productIds || !Array.isArray(productIds)) {
          return NextResponse.json(
            { error: "Product IDs array is required" },
            { status: 400, headers }
          );
        }

        const { data: clientCartAll, error: clientCartAllError } = await supabase
          .from("clients")
          .select("cart")
          .eq("clerk_id", user.id)
          .single();

        if (clientCartAllError) {
          console.error("Error fetching client cart:", clientCartAllError);
          return NextResponse.json(
            { error: "Failed to fetch client cart" },
            { status: 500, headers }
          );
        }

        const currentCartAll = clientCartAll?.cart || [];
        const newCartItems = productIds.filter(
          (id: string) => !currentCartAll.includes(id)
        );

        if (newCartItems.length === 0) {
          return NextResponse.json(
            { message: "All products are already in cart" },
            { status: 200, headers }
          );
        }

        const { error: addAllToCartError } = await supabase
          .from("clients")
          .update({
            cart: [...currentCartAll, ...newCartItems],
            updated_at: new Date().toISOString(),
          })
          .eq("clerk_id", user.id);

        if (addAllToCartError) {
          console.error("Error adding all to cart:", addAllToCartError);
          return NextResponse.json(
            { error: "Failed to add all to cart" },
            { status: 500, headers }
          );
        }

        return NextResponse.json(
          { message: "Products added to cart" },
          { status: 200, headers }
        );

      default:
        return NextResponse.json(
          { error: "Invalid request type" },
          { status: 400, headers }
        );
    }
  } catch (error) {
    console.error("Internal server error occurred");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
