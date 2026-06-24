import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAssetSchema } from "@/lib/validations";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")));
    const type = searchParams.get("type");
    const state = searchParams.get("state");
    const availability = searchParams.get("availability");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const search = searchParams.get("search");

    const where: Prisma.AssetWhereInput = {
      isApproved: true,
      availabilityStatus: { not: "INACTIVE" },
    };

    if (type) where.type = type as any;
    if (state) where.state = state;
    if (availability) where.availabilityStatus = availability as any;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { make: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
      ];
    }
    if (minPrice || maxPrice) {
      where.OR = [
        ...(where.OR || []),
        {
          AND: [
            ...(minPrice ? [{ pricePerDay: { gte: parseFloat(minPrice) } }] : []),
            ...(maxPrice ? [{ pricePerDay: { lte: parseFloat(maxPrice) } }] : []),
          ],
        },
      ];
      if (where.OR && where.OR.length === 1) delete where.OR;
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          owner: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.asset.count({ where }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: assets,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("List assets error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const validated = createAssetSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const asset = await prisma.asset.create({
      data: {
        ...validated.data,
        ownerId: session.user.id,
      },
      include: {
        images: true,
      },
    });

    return NextResponse.json(
      { success: true, data: asset, message: "Asset created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create asset error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
