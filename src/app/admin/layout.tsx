"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Truck,
  Wallet,
  LifeBuoy,
  ArrowLeftRight,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  FileText,
  Activity,
  Mail,
  Receipt,
  BookOpen,
} from "lucide-react";
import { useState } from "react";

const adminNav = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { divider: "Management" },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Listings", href: "/admin/listings", icon: Truck },
  { label: "Bookings", href: "/admin/bookings", icon: FileText },
  { divider: "Finance" },
  { label: "Transactions", href: "/admin/transactions", icon: Receipt },
  { label: "Financials", href: "/admin/financials", icon: Wallet },
  { label: "Fees", href: "/admin/fees", icon: Receipt },
  { label: "Withdrawals", href: "/admin/withdrawals", icon: ArrowLeftRight },
  { label: "Reversals", href: "/admin/reversals", icon: Shield },
  { divider: "Support" },
  { label: "Support", href: "/admin/support", icon: LifeBuoy },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: Activity },
  { divider: "Configuration" },
  { label: "Content", href: "/admin/content", icon: BookOpen },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r border-neutral-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-accent">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-heading text-lg font-bold text-neutral-900">
              Admin
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
          {adminNav.map((item) => {
            if ("divider" in item) {
              return (
                <p key={item.divider} className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                  {item.divider}
                </p>
              );
            }
            const Icon = item.icon!;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-neutral-600 hover:bg-neutral-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
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

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
              {session?.user?.name?.charAt(0) || "A"}
            </div>
            <span className="hidden text-sm font-medium text-neutral-700 sm:block">
              {session?.user?.name || "Admin"}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayoutInner>{children}</AdminLayoutInner>
  );
}
