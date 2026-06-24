"use client";

import Link from "next/link";

export default function PublicError({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-neutral-300">500</h1>
        <p className="mt-4 text-lg text-neutral-600">Something went wrong</p>
        <p className="mt-1 text-sm text-neutral-400">Please try again or return to the homepage.</p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <button onClick={reset} className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark">
            Try Again
          </button>
          <Link href="/" className="rounded-md border border-neutral-200 bg-white px-6 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
