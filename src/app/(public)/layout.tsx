"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { NavAuth } from "@/components/nav-auth";

interface Branding {
  companyName: string;
  appName: string;
  logoUrl: string | null;
  contactAddress: string;
  contactEmail: string;
  contactPhone: string;
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [branding, setBranding] = useState<Branding>({
    companyName: "TruckLease Pro",
    appName: "TruckLease Pro",
    logoUrl: null,
    contactAddress: "42 Awolowo Road, Ikoyi, Lagos",
    contactEmail: "support@truckleasepro.com",
    contactPhone: "+234 800 TRUCKLEASE",
  });

  useEffect(() => {
    fetch("/api/settings/public")
      .then((r) => r.json())
      .then((res) => { if (res.success) setBranding(res.data); })
      .catch(() => {});
  }, []);

  return (
    <PublicLayoutInner mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} branding={branding}>
      {children}
    </PublicLayoutInner>
  );
}

function PublicLayoutInner({ children, mobileOpen, setMobileOpen, branding }: {
  children: React.ReactNode;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  branding: Branding;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="" className="h-8 w-8 rounded object-contain" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
                <span className="text-sm font-bold text-white">TL</span>
              </div>
            )}
            <span className="font-heading text-xl font-bold text-neutral-900">
              {branding.companyName}
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/listings" className="text-sm font-medium text-neutral-700 hover:text-primary">
              Browse
            </Link>
            <Link href="/services" className="text-sm font-medium text-neutral-700 hover:text-primary">
              Services
            </Link>
            <Link href="/materials" className="text-sm font-medium text-neutral-700 hover:text-primary">
              Materials
            </Link>
            <Link href="/contact" className="text-sm font-medium text-neutral-700 hover:text-primary">
              Contact
            </Link>
            <Link href="/about" className="text-sm font-medium text-neutral-700 hover:text-primary">
              About
            </Link>
            <Link href="/faq" className="text-sm font-medium text-neutral-700 hover:text-primary">
              FAQ
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 md:hidden"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <NavAuth />
          </div>
        </div>

        {mobileOpen && (
          <nav className="flex flex-col border-t border-neutral-200 px-4 py-4 md:hidden">
            <Link href="/listings" className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              onClick={() => setMobileOpen(false)}>Browse</Link>
            <Link href="/services" className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              onClick={() => setMobileOpen(false)}>Services</Link>
            <Link href="/materials" className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              onClick={() => setMobileOpen(false)}>Materials</Link>
            <Link href="/contact" className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              onClick={() => setMobileOpen(false)}>Contact</Link>
            <Link href="/about" className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              onClick={() => setMobileOpen(false)}>About</Link>
            <Link href="/faq" className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              onClick={() => setMobileOpen(false)}>FAQ</Link>
            <Link href="/auth/login" className="mt-2 rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              onClick={() => setMobileOpen(false)}>Sign in</Link>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-neutral-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
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
              </div>
              <p className="mt-3 text-sm text-neutral-500">
                The trusted marketplace connecting truck owners with renters across Nigeria.
              </p>
            </div>
            <div>
              <h3 className="font-heading text-sm font-bold text-neutral-900">Quick Links</h3>
              <ul className="mt-3 space-y-2">
                <li><Link href="/listings" className="text-sm text-neutral-500 hover:text-primary">Browse Listings</Link></li>
                <li><Link href="/services" className="text-sm text-neutral-500 hover:text-primary">Services</Link></li>
                <li><Link href="/materials" className="text-sm text-neutral-500 hover:text-primary">Materials</Link></li>
                <li><Link href="/about" className="text-sm text-neutral-500 hover:text-primary">About Us</Link></li>
                <li><Link href="/contact" className="text-sm text-neutral-500 hover:text-primary">Contact</Link></li>
                <li><Link href="/faq" className="text-sm text-neutral-500 hover:text-primary">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-heading text-sm font-bold text-neutral-900">Legal</h3>
              <ul className="mt-3 space-y-2">
                <li><Link href="/privacy" className="text-sm text-neutral-500 hover:text-primary">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-sm text-neutral-500 hover:text-primary">Terms &amp; Conditions</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-heading text-sm font-bold text-neutral-900">Contact</h3>
              <ul className="mt-3 space-y-2 text-sm text-neutral-500">
                <li>{branding.contactEmail}</li>
                <li>{branding.contactAddress}</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-neutral-200 pt-6 text-center">
            <p className="text-sm text-neutral-400">
              &copy; {new Date().getFullYear()} {branding.companyName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
