import Link from "next/link";

const services = [
  {
    title: "Truck Hire",
    icon: "\u{1F69A}",
    description:
      "Access a wide range of trucks for any job — from dump trucks and tippers to flatbeds, lowbeds, and water tankers. All assets are verified and maintained to the highest safety standards.",
    features: [
      "Dump Trucks (20–40 ton)",
      "Tipper Trucks",
      "Flatbed & Lowbed Trailers",
      "Water Tankers & Fuel Trucks",
    ],
    cta: "Browse Trucks",
    href: "/listings?type=Truck",
  },
  {
    title: "Equipment Hire",
    icon: "\u{1F4E6}",
    description:
      "Heavy equipment for construction, mining, and industrial projects. Excavators, bulldozers, graders, cranes, and more available with or without operators.",
    features: [
      "Excavators & Bulldozers",
      "Concrete Mixers & Pavers",
      "Mobile Cranes & Forklifts",
      "Compactors & Graders",
    ],
    cta: "Browse Equipment",
    href: "/listings?type=Equipment",
  },
  {
    title: "Materials Supply",
    icon: "\u{1F3D7}\uFE0F",
    description:
      "Reliable supply of construction materials delivered to your site. Granite, laterite, stone base, sand, and more with flexible payment and delivery scheduling.",
    features: [
      "Granite (various sizes)",
      "Laterite & Sharp Sand",
      "Stone Base & Dust",
      "Direct Site Delivery",
    ],
    cta: "View Pricing",
    href: "/materials",
  },
];

export default function ServicesPage() {
  return (
    <div>
      <div className="brand-header-band bg-accent -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">Our Services</h1>
          <p className="mt-2 text-neutral-200">Comprehensive truck hire, equipment leasing, and materials supply across Nigeria.</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 space-y-24">
        {services.map((service, i) => (
          <section key={service.title} className="grid items-center gap-12 lg:grid-cols-2">
            <div className={i % 2 === 1 ? "lg:order-2" : ""}>
              <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-3xl">
                {service.icon}
              </span>
              <h2 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">{service.title}</h2>
              <p className="mt-4 text-neutral-600 leading-relaxed">{service.description}</p>
              <ul className="mt-6 space-y-2">
                {service.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-neutral-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={service.href} className="btn-primary mt-6 inline-flex">
                {service.cta}
              </Link>
            </div>
            <div className={`flex h-64 items-center justify-center rounded-xl bg-neutral-100 lg:h-80 ${i % 2 === 1 ? "lg:order-1" : ""}`}>
              <span className="font-heading text-6xl text-neutral-300">{service.icon}</span>
            </div>
          </section>
        ))}
      </div>

      <div className="bg-accent -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">Need a custom solution?</h2>
          <p className="mt-3 text-neutral-200">Contact our team for fleet booking, long-term leases, or bulk material supply.</p>
          <Link href="/contact" className="btn-primary mt-6 inline-flex bg-white text-primary hover:bg-neutral-100">
            Get in touch
          </Link>
        </div>
      </div>
    </div>
  );
}
