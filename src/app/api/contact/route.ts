import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const message = formData.get("message") as string;

    if (!name || !email || !message) {
      return NextResponse.redirect(new URL("/contact?error=missing-fields", request.url));
    }

    console.log("Contact form submission:", { name, email, phone, message });

    return NextResponse.redirect(new URL("/contact?success=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/contact?error=internal", request.url));
  }
}
