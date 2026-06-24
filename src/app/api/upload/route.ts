import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const assetId = formData.get("assetId") as string | null;

    if (!assetId) {
      return NextResponse.json({ success: false, error: "assetId is required" }, { status: 400 });
    }

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset || (asset.ownerId !== session.user.id && session.user.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    const files = formData.getAll("files") as File[];
    if (files.length === 0) {
      return NextResponse.json({ success: false, error: "No files provided" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const existingCount = await prisma.assetImage.count({ where: { assetId } });
    const uploaded: Array<{ id: string; url: string; isPrimary: boolean; sortOrder: number }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop() || "jpg";
      const filename = `${crypto.randomUUID()}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(uploadDir, filename), buffer);

      const sortOrder = existingCount + i;
      const image = await prisma.assetImage.create({
        data: {
          assetId,
          url: `/uploads/${filename}`,
          isPrimary: sortOrder === 0,
          sortOrder,
        },
      });

      uploaded.push(image);
    }

    return NextResponse.json({ success: true, data: uploaded }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
