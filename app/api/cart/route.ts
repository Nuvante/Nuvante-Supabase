import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import supabase from "@/lib/supabase";

// Cache duration in seconds
const CACHE_DURATION = 60; // 1 minute

type CartItem = {
  id: string; // UUID from product table
  quantity: number;
};

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: client, error: clientError } = await supabase
      .from("client")
      .select("cart")
      .eq("clerk_id", user.id)
      .single();

    if (clientError) {
      console.error("Error fetching cart:", clientError);
      return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
    }

    if (!client?.cart) {
      return NextResponse.json([], { status: 200 });
    }

    // Fetch product details for each item in cart
    const cartItems = await Promise.all(
      (client.cart as CartItem[]).map(async (item) => {
        const { data: product, error: productError } = await supabase
          .from("product")
          .select("*")
          .eq("id", item.id)
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
          quantity: item.quantity,
        };
      })
    );

    const validCartItems = cartItems.filter((item): item is NonNullable<typeof item> => item !== null);
    return NextResponse.json(validCartItems, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/cart:", error);
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

    // Get current cart
    const { data: client, error: clientError } = await supabase
      .from("client")
      .select("cart")
      .eq("clerk_id", user.id)
      .single();

    if (clientError) {
      console.error("Error fetching client:", clientError);
      return NextResponse.json({ error: "Failed to fetch client data" }, { status: 500 });
    }

    const currentCart = (client?.cart as CartItem[]) || [];
    const existingItemIndex = currentCart.findIndex((item) => item.id === itemId);

    if (existingItemIndex !== -1) {
      // Update quantity if item exists
      currentCart[existingItemIndex].quantity += 1;
    } else {
      // Add new item
      currentCart.push({ id: itemId, quantity: 1 });
    }

    // Update cart in database
    const { error: updateError } = await supabase
      .from("client")
      .update({ cart: currentCart })
      .eq("clerk_id", user.id);

    if (updateError) {
      console.error("Error updating cart:", updateError);
      return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
    }

    return NextResponse.json(200, { status: 200 });
  } catch (error) {
    console.error("Error in POST /api/cart:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, quantity } = body;

    if (!itemId || quantity === undefined) {
      return NextResponse.json({ error: "Item ID and quantity are required" }, { status: 400 });
    }

    // Get current cart
    const { data: client, error: clientError } = await supabase
      .from("client")
      .select("cart")
      .eq("clerk_id", user.id)
      .single();

    if (clientError) {
      console.error("Error fetching client:", clientError);
      return NextResponse.json({ error: "Failed to fetch client data" }, { status: 500 });
    }

    const currentCart = (client?.cart as CartItem[]) || [];
    const existingItemIndex = currentCart.findIndex((item) => item.id === itemId);

    if (existingItemIndex === -1) {
      return NextResponse.json({ error: "Item not found in cart" }, { status: 404 });
    }

    // Update quantity
    currentCart[existingItemIndex].quantity = quantity;

    // Update cart in database
    const { error: updateError } = await supabase
      .from("client")
      .update({ cart: currentCart })
      .eq("clerk_id", user.id);

    if (updateError) {
      console.error("Error updating cart:", updateError);
      return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
    }

    return NextResponse.json(200, { status: 200 });
  } catch (error) {
    console.error("Error in PUT /api/cart:", error);
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

    // Get current cart
    const { data: client, error: clientError } = await supabase
      .from("client")
      .select("cart")
      .eq("clerk_id", user.id)
      .single();

    if (clientError) {
      console.error("Error fetching client:", clientError);
      return NextResponse.json({ error: "Failed to fetch client data" }, { status: 500 });
    }

    const currentCart = (client?.cart as CartItem[]) || [];
    const updatedCart = currentCart.filter((item) => item.id !== itemId);

    // Update cart in database
    const { error: updateError } = await supabase
      .from("client")
      .update({ cart: updatedCart })
      .eq("clerk_id", user.id);

    if (updateError) {
      console.error("Error updating cart:", updateError);
      return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
    }

    return NextResponse.json(200, { status: 200 });
  } catch (error) {
    console.error("Error in DELETE /api/cart:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
