import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.platformSettings.findFirst();
    if (!settings) {
      return NextResponse.json({
        success: true,
        data: {
          companyName: "TruckLease Pro",
          appName: "TruckLease Pro",
          logoUrl: null,
          faviconUrl: null,
          contactAddress: "42 Awolowo Road, Ikoyi, Lagos",
          contactPhone: "+234 800 TRUCKLEASE",
          contactEmail: "support@truckleasepro.com",
          contactHours: "Mon\u2013Fri: 8:00 AM \u2013 6:00 PM, Sat: 9:00 AM \u2013 3:00 PM",
        },
      });
    }
    return NextResponse.json({
      success: true,
      data: {
        companyName: settings.companyName,
        appName: settings.appName,
        logoUrl: settings.logoUrl,
        faviconUrl: settings.faviconUrl,
        contactAddress: settings.contactAddress,
        contactPhone: settings.contactPhone,
        contactEmail: settings.contactEmail,
        contactHours: settings.contactHours,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load settings" }, { status: 500 });
  }
}
