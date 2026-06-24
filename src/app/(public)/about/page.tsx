import Link from "next/link";

export default function AboutPage() {
  return (
    <div>
      <div className="brand-header-band bg-accent -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">About TruckLease Pro</h1>
          <p className="mt-2 text-neutral-200">Nigeria&apos;s trusted platform for truck hire and equipment leasing.</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        <section>
          <h2 className="font-heading text-2xl font-bold text-neutral-900">Our Story</h2>
          <div className="mt-6 space-y-4 text-neutral-600 leading-relaxed">
            <p>
              TruckLease Pro was founded to solve a critical problem in Nigeria&apos;s logistics and construction
              industry — the difficulty of finding reliable trucks, heavy equipment, and quality construction
              materials when you need them.
            </p>
            <p>
              What started as a small network of fleet owners in Lagos has grown into a nationwide platform
              connecting hundreds of asset owners with businesses across all 36 states. We combine technology
              with deep industry knowledge to make hiring seamless, secure, and transparent.
            </p>
            <p>
              Our platform handles everything from listing and discovery to secure payments via Monnify-powered
              NUBAN wallets, dispute resolution, and comprehensive fleet management tools.
            </p>
          </div>
        </section>

        <section className="grid gap-8 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-neutral-200 bg-white p-6 text-center">
              <p className="font-heading text-3xl font-bold text-primary">{s.value}</p>
              <p className="mt-1 text-sm text-neutral-500">{s.label}</p>
            </div>
          ))}
        </section>

        <section>
          <h2 className="font-heading text-2xl font-bold text-neutral-900">Our Mission</h2>
          <p className="mt-4 text-neutral-600 leading-relaxed">
            To empower Nigerian businesses with reliable access to trucks, equipment, and materials through
            a trusted digital marketplace that prioritizes safety, transparency, and efficiency.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-bold text-neutral-900">Why Choose Us</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="brand-header-band rounded-lg border border-neutral-200 bg-white p-6">
                <h3 className="font-heading font-bold text-neutral-900">{f.title}</h3>
                <p className="mt-2 text-sm text-neutral-500">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-lg bg-accent p-8 text-center text-white">
          <h2 className="font-heading text-2xl font-bold">Ready to get started?</h2>
          <p className="mt-2 text-neutral-200">Join thousands of businesses using TruckLease Pro.</p>
          <Link href="/auth/register" className="btn-primary mt-6 inline-flex bg-white text-primary hover:bg-neutral-100">
            Create free account
          </Link>
        </div>
      </div>
    </div>
  );
}

const stats = [
  { value: "500+", label: "Verified Assets" },
  { value: "36", label: "States Covered" },
  { value: "10,000+", label: "Businesses Served" },
];

const features = [
  { title: "Verified Assets", description: "Every truck and equipment is verified before listing. Quality and safety guaranteed." },
  { title: "Secure Payments", description: "Monnify-powered escrow wallets protect both hirers and owners." },
  { title: "24/7 Support", description: "Our team is always available to resolve issues and answer questions." },
  { title: "Dispute Resolution", description: "Built-in arbitration system with SLA-backed escalation." },
];
