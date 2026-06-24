"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NavAuth() {
  const { data: session } = useSession();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (!session?.user) return;
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
        .catch((e) => console.error("nav-auth: cart fetch failed", e));
    }
    refresh();
    window.addEventListener("cart:updated", refresh);
    return () => {
      mounted = false;
      window.removeEventListener("cart:updated", refresh);
    };
  }, [session?.user]);

  return (
    <>
      {session?.user && (
        <Link href="/dashboard/client/cart" className="relative text-sm font-medium text-neutral-700 hover:text-primary" title="Cart">
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
              {cartCount}
            </span>
          )}
        </Link>
      )}
      {session?.user ? (
        <Link
          href={
            session.user.role === "ADMIN"
              ? "/admin/dashboard"
              : session.user.role === "OWNER"
                ? "/dashboard/owner/overview"
                : "/dashboard/client/overview"
          }
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
        >
          Dashboard
        </Link>
      ) : (
        <>
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/auth/register">Get started</Link>
          </Button>
        </>
      )}
    </>
  );
}
