"use client";

export default function AuthError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md text-center">
        <h1 className="text-6xl font-bold text-neutral-300">500</h1>
        <p className="mt-4 text-lg text-neutral-600">Authentication error</p>
        <p className="mt-1 text-sm text-neutral-400">Something went wrong on this page. Please try again.</p>
        <button onClick={reset} className="mt-6 rounded-md bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark">
          Try Again
        </button>
      </div>
    </div>
  );
}
