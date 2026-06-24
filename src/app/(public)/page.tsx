import Link from "next/link";

export default function HomePage() {
  return <>
        <section className="relative overflow-hidden bg-accent py-20 sm:py-32">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center rounded-full bg-primary/20 px-3 py-1 text-sm text-white">
                Nigeria&apos;s Trusted Leasing Platform
              </div>
              <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Hire Trucks & Equipment with Confidence
              </h1>
              <p className="mt-6 text-lg leading-8 text-neutral-200">
                The secure platform connecting asset owners with businesses
                needing trucks, heavy equipment, and construction materials
                across Nigeria.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Link
                  href="/auth/register?role=CLIENT"
                  className="btn-primary bg-white text-primary hover:bg-neutral-100 px-6 py-3 text-base"
                >
                  I want to hire
                </Link>
                <Link
                  href="/auth/register?role=OWNER"
                  className="btn-secondary border-white text-white hover:bg-white hover:text-accent px-6 py-3 text-base"
                >
                  List my assets
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="font-heading text-3xl font-bold text-neutral-900 sm:text-4xl">
                Everything you need to manage your fleet
              </h2>
              <p className="mt-4 text-lg text-neutral-500">
                From listing assets to getting paid — we handle the heavy lifting.
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="brand-header-band rounded-lg border border-neutral-200 bg-white p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <span className="text-2xl">{feature.icon}</span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-neutral-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-500">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-accent py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
                Ready to get started?
              </h2>
              <p className="mt-4 text-lg text-neutral-200">
                Join thousands of businesses across Nigeria using TruckLease Pro.
              </p>
              <div className="mt-8 flex items-center justify-center gap-4">
                <Link
                  href="/auth/register"
                  className="btn-primary bg-white text-primary hover:bg-neutral-100 px-8 py-3 text-base"
                >
                  Create free account
                </Link>
              </div>
            </div>
          </div>
        </section>
    </>
;
}

const features = [
  {
    icon: "\u{1F69A}",
    title: "Truck & Equipment Hire",
    description:
      "Browse and hire trucks, trailers, and heavy equipment from verified owners across Nigeria.",
  },
  {
    icon: "\u{1F4B0}",
    title: "Secure Wallet Payments",
    description:
      "Monnify-powered NUBAN wallets for instant payments, escrow protection, and fast withdrawals.",
  },
  {
    icon: "📊",
    title: "Fleet Management",
    description:
      "Track maintenance, fuel, drivers, and profitability for every asset in your fleet.",
  },
  {
    icon: "🛡️",
    title: "Dispute Resolution",
    description:
      "Built-in reversal system and support ticketing with SLA-backed escalation.",
  },
  {
    icon: "👨‍💻",
    title: "Owner Dashboard",
    description:
      "Complete financial overview, expense tracking, and income reports at your fingertips.",
  },
  {
    icon: "🔐",
    title: "Secure & Verified",
    description:
      "2FA, email verification, and admin approval on all listings for a trusted marketplace.",
  },
];
