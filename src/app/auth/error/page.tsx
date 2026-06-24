import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthErrorPage() {
  return (
    <div className="space-y-6 text-center" suppressHydrationWarning>
      <h1 className="text-3xl font-bold text-neutral-900">Authentication Error</h1>
      <p className="text-neutral-500">
        Something went wrong during authentication. Please try again.
      </p>
      <Button asChild>
        <Link href="/auth/login">Back to login</Link>
      </Button>
    </div>
  );
}
