import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: client, error: clientError } = await supabase
      .from("client")
      .select("wishlist")
      .eq("clerk_id", user.id)
      .single();

    if (clientError) {
      console.error("Error fetching wishlist:", clientError);
      return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 });
    }

    if (!client?.wishlist) {
      return NextResponse.json([], { status: 200 });
    }

    // Fetch product details for each item in wishlist
    const wishlistItems = await Promise.all(
      client.wishlist.map(async (itemId: string) => {
        const { data: product, error: productError } = await supabase
          .from("product")
          .select("*")
          .eq("id", itemId)
          .single();

        if (productError) {
          console.error("Error fetching product:", productError);
          return null;
        }

        return {
          id: product.id,
          product_name: product.product_name,
          product_price: product.product_price,
          product_images: product.product_images,
        };
      })
    );

    const validWishlistItems = wishlistItems.filter((item): item is NonNullable<typeof item> => item !== null);

    return NextResponse.json(validWishlistItems, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/wishlist:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    // Get current wishlist
    const { data: client, error: clientError } = await supabase
      .from("client")
      .select("wishlist")
      .eq("clerk_id", user.id)
      .single();

    if (clientError) {
      console.error("Error fetching client:", clientError);
      return NextResponse.json({ error: "Failed to fetch client data" }, { status: 500 });
    }

    const currentWishlist = client?.wishlist || [];
    
    // Check if item already exists in wishlist
    if (currentWishlist.includes(itemId)) {
      return NextResponse.json({ error: "Item already in wishlist" }, { status: 400 });
    }

    // Add item to wishlist
    currentWishlist.push(itemId);

    // Update wishlist in database
    const { error: updateError } = await supabase
      .from("client")
      .update({ wishlist: currentWishlist })
      .eq("clerk_id", user.id);

    if (updateError) {
      console.error("Error updating wishlist:", updateError);
      return NextResponse.json({ error: "Failed to update wishlist" }, { status: 500 });
    }

    return NextResponse.json({ message: "Item added to wishlist" }, { status: 200 });
  } catch (error) {
    console.error("Error in POST /api/wishlist:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    // Get current wishlist
    const { data: client, error: clientError } = await supabase
      .from("client")
      .select("wishlist")
      .eq("clerk_id", user.id)
      .single();

    if (clientError) {
      console.error("Error fetching client:", clientError);
      return NextResponse.json({ error: "Failed to fetch client data" }, { status: 500 });
    }

    const currentWishlist = client?.wishlist || [];
    const updatedWishlist = currentWishlist.filter((id: string) => id !== itemId);

    // Update wishlist in database
    const { error: updateError } = await supabase
      .from("client")
      .update({ wishlist: updatedWishlist })
      .eq("clerk_id", user.id);

    if (updateError) {
      console.error("Error updating wishlist:", updateError);
      return NextResponse.json({ error: "Failed to update wishlist" }, { status: 500 });
    }

    return NextResponse.json({ message: "Item removed from wishlist" }, { status: 200 });
  } catch (error) {
    console.error("Error in DELETE /api/wishlist:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
