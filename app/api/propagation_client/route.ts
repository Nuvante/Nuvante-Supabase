import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import supabase from "@/lib/supabase";

export async function GET() {
  const user = await currentUser();
  const global_user_email = user?.emailAddresses[0]?.emailAddress?.toLowerCase();

  if (!user || !global_user_email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: clientData, error } = await supabase
      .from("clients")
      .select("*")
      .eq("email", global_user_email)
      .maybeSingle();

    if (error) {
      console.error("Database error occurred");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (!clientData) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Map Supabase field names to the expected response format
    const response = {
      firstName: clientData.first_name || "",
      lastName: clientData.last_name || "",
      address: clientData.address || "",
      wishlist: clientData.wishlist || [],
      cart: clientData.cart || [],
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Internal server error occurred");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
