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
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { data: client, error: clientError } = await supabase
      .from("client")
      .select("cart")
      .eq("clerk_id", user.id)
      .single();

    if (clientError) {
      console.error("Error fetching cart:", clientError);
      return new NextResponse("Error fetching cart", { status: 500 });
    }

    if (!client?.cart) {
      return new NextResponse(JSON.stringify([]), { status: 200 });
    }

    // Fetch product details for each item in cart
    const cartItems = await Promise.all(
      client.cart.map(async (item: { id: string; quantity: number }) => {
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
          name: product.product_name,
          price: product.product_price,
          image: product.product_images[0],
          quantity: item.quantity,
        };
      })
    );

    const validCartItems = cartItems.filter((item): item is NonNullable<typeof item> => item !== null);

    return new NextResponse(JSON.stringify(validCartItems), { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/cart:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return new NextResponse("Item ID is required", { status: 400 });
    }

    // Get current cart
    const { data: client, error: clientError } = await supabase
      .from("client")
      .select("cart")
      .eq("clerk_id", user.id)
      .single();

    if (clientError) {
      console.error("Error fetching client:", clientError);
      return new NextResponse("Error fetching client data", { status: 500 });
    }

    const currentCart = client?.cart || [];
    const existingItemIndex = currentCart.findIndex((item: { id: string }) => item.id === itemId);

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
      return new NextResponse("Error updating cart", { status: 500 });
    }

    return new NextResponse("Cart updated successfully", { status: 200 });
  } catch (error) {
    console.error("Error in POST /api/cart:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { itemId, quantity } = body;

    if (!itemId || quantity === undefined) {
      return new NextResponse("Item ID and quantity are required", { status: 400 });
    }

    // Get current cart
    const { data: client, error: clientError } = await supabase
      .from("client")
      .select("cart")
      .eq("clerk_id", user.id)
      .single();

    if (clientError) {
      console.error("Error fetching client:", clientError);
      return new NextResponse("Error fetching client data", { status: 500 });
    }

    const currentCart = client?.cart || [];
    const existingItemIndex = currentCart.findIndex((item: { id: string }) => item.id === itemId);

    if (existingItemIndex === -1) {
      return new NextResponse("Item not found in cart", { status: 404 });
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
      return new NextResponse("Error updating cart", { status: 500 });
    }

    return new NextResponse("Cart updated successfully", { status: 200 });
  } catch (error) {
    console.error("Error in PUT /api/cart:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return new NextResponse("Item ID is required", { status: 400 });
    }

    // Get current cart
    const { data: client, error: clientError } = await supabase
      .from("client")
      .select("cart")
      .eq("clerk_id", user.id)
      .single();

    if (clientError) {
      console.error("Error fetching client:", clientError);
      return new NextResponse("Error fetching client data", { status: 500 });
    }

    const currentCart = client?.cart || [];
    const updatedCart = currentCart.filter((item: { id: string }) => item.id !== itemId);

    // Update cart in database
    const { error: updateError } = await supabase
      .from("client")
      .update({ cart: updatedCart })
      .eq("clerk_id", user.id);

    if (updateError) {
      console.error("Error updating cart:", updateError);
      return new NextResponse("Error updating cart", { status: 500 });
    }

    return new NextResponse("Item removed from cart", { status: 200 });
  } catch (error) {
    console.error("Error in DELETE /api/cart:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
