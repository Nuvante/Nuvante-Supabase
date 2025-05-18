import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import supabase from "@/lib/supabase"; // Import your supabase client from the lib

export async function GET(request: any) {
  const user = await currentUser();

  if (!user) {
    console.log("No sign in found.");
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const clerk_id = user.id;

  try {
    // Delete client row by clerk_id in supabase
    const { error } = await supabase
      .from("client")
      .delete()
      .eq("clerk_id", clerk_id);

    if (error) {
      console.error("Supabase delete client error:", error);
      return new NextResponse("Failed to delete client", { status: 500 });
    }

    return new NextResponse("Client deleted", { status: 200 });
  } catch (error) {
    console.error("Error in delete GET:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
