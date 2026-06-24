"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Truck,
  Users,
  Wallet,
  CalendarDays,
  LifeBuoy,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  ClipboardList,
  ShoppingCart,
  Wrench,
  Fuel,
  Heart,
  Bell,
} from "lucide-react";
import { useState, useEffect } from "react";
import { NotificationBell } from "@/components/notification-bell";

interface Branding {
  companyName: string;
  logoUrl: string | null;
}

const ownerNav = [
  { label: "Overview", href: "/dashboard/owner/overview", icon: LayoutDashboard },
  { label: "My Listings", href: "/dashboard/owner/listings", icon: Truck },
  { label: "Maintenance", href: "/dashboard/owner/maintenance", icon: Wrench },
  { label: "Fuel", href: "/dashboard/owner/fuel", icon: Fuel },
  { label: "Fleet", href: "/dashboard/owner/fleet", icon: ClipboardList },
  { label: "Drivers", href: "/dashboard/owner/drivers", icon: Users },
  { label: "Financials", href: "/dashboard/owner/financials", icon: BarChart3 },
  { label: "Browse", href: "/dashboard/client/browse", icon: ShoppingCart },
  { label: "Cart", href: "/dashboard/client/cart", icon: ShoppingCart },
  { label: "Wallet", href: "/dashboard/owner/wallet", icon: Wallet },
  { label: "Bookings", href: "/dashboard/owner/bookings", icon: CalendarDays },
  { label: "Support", href: "/dashboard/owner/support", icon: LifeBuoy },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Settings", href: "/dashboard/owner/settings", icon: Settings },
];

const clientNav = [
  { label: "Overview", href: "/dashboard/client/overview", icon: LayoutDashboard },
  { label: "Browse", href: "/dashboard/client/browse", icon: Truck },
  { label: "Cart", href: "/dashboard/client/cart", icon: ShoppingCart },
  { label: "Saved", href: "/dashboard/client/saved", icon: Heart },
  { label: "My Bookings", href: "/dashboard/client/bookings", icon: CalendarDays },
  { label: "Financials", href: "/dashboard/client/financials", icon: BarChart3 },
  { label: "Wallet", href: "/dashboard/client/wallet", icon: Wallet },
  { label: "Support", href: "/dashboard/client/support", icon: LifeBuoy },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Settings", href: "/dashboard/client/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [branding, setBranding] = useState<Branding>({ companyName: "TruckLease Pro", logoUrl: null });
  const role = session?.user?.role || "CLIENT";

  useEffect(() => {
    fetch("/api/settings/public")
      .then((r) => r.json())
      .then((res) => { if (res.success) setBranding(res.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    function refresh() {
      if (!mounted) return;
      fetch("/api/cart")
        .then((r) => r.json())
        .then((res) => {
          if (!mounted) return;
          if (res.success && res.data?.items) setCartCount(res.data.items.length);
          else setCartCount(0);
        })
        .catch((e) => console.error("dashboard-layout: cart fetch failed", e));
    }
    refresh();
    window.addEventListener("cart:updated", refresh);
    return () => {
      mounted = false;
      window.removeEventListener("cart:updated", refresh);
    };
  }, []);
  const navItems = role === "OWNER" ? ownerNav : clientNav;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r border-neutral-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-4">
          <Link href="/" className="flex items-center gap-2">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="" className="h-8 w-8 rounded object-contain" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
                <span className="text-sm font-bold text-white">TL</span>
              </div>
            )}
            <span className="font-heading text-lg font-bold text-neutral-900">
              {branding.companyName}
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-neutral-600 hover:bg-neutral-100"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.label === "Cart" && cartCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-neutral-200 p-4">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-neutral-200 bg-white px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="flex items-center gap-3 ml-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                {session?.user?.name?.charAt(0) || "U"}
              </div>
              <span className="hidden text-sm font-medium text-neutral-700 sm:block">
                {session?.user?.name || "User"}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
