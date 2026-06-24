"use client";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <div className="flex items-center justify-center px-4 py-24">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-neutral-300">500</h1>
        <p className="mt-4 text-lg text-neutral-600">Something went wrong</p>
        <p className="mt-1 text-sm text-neutral-400">An unexpected error occurred. Please try again.</p>
        <button onClick={reset} className="mt-6 rounded-md bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark">
          Try Again
        </button>
      </div>
    </div>
  );
}
