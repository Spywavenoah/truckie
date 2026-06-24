import Link from "next/link";

const materials = [
  { name: "Granite 3/4 inch", pricePerTon: "₦35,000", pricePerLoad: "₦175,000", pricePerTrip: "₦210,000" },
  { name: "Granite 1/2 inch", pricePerTon: "₦38,000", pricePerLoad: "₦190,000", pricePerTrip: "₦228,000" },
  { name: "Laterite (Red)", pricePerTon: "₦5,000", pricePerLoad: "₦25,000", pricePerTrip: "₦30,000" },
  { name: "Laterite (Brown)", pricePerTon: "₦4,500", pricePerLoad: "₦22,500", pricePerTrip: "₦27,000" },
  { name: "Stone Base 1 inch", pricePerTon: "₦30,000", pricePerLoad: "₦150,000", pricePerTrip: "₦180,000" },
  { name: "Stone Base 3/4 inch", pricePerTon: "₦32,000", pricePerLoad: "₦160,000", pricePerTrip: "₦192,000" },
  { name: "Sharp Sand", pricePerTon: "₦4,000", pricePerLoad: "₦20,000", pricePerTrip: "₦24,000" },
  { name: "Dust (Stone Dust)", pricePerTon: "₦28,000", pricePerLoad: "₦140,000", pricePerTrip: "₦168,000" },
];

export default function MaterialsPage() {
  return (
    <div>
      <div className="brand-header-band bg-accent -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">Material Pricing</h1>
          <p className="mt-2 text-neutral-200">Construction material prices per ton, load, and trip.</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-3 md:px-6 md:py-4 font-heading font-bold text-neutral-900">Material</th>
                <th className="px-4 py-3 md:px-6 md:py-4 font-heading font-bold text-neutral-900">Per Ton</th>
                <th className="px-4 py-3 md:px-6 md:py-4 font-heading font-bold text-neutral-900">Per Load (5 ton)</th>
                <th className="hidden sm:table-cell px-4 py-3 md:px-6 md:py-4 font-heading font-bold text-neutral-900">Per Trip (6 ton)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {materials.map((m) => (
                <tr key={m.name} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 md:px-6 md:py-4 font-medium text-neutral-900">{m.name}</td>
                  <td className="px-4 py-3 md:px-6 md:py-4 font-mono text-success">{m.pricePerTon}</td>
                  <td className="px-4 py-3 md:px-6 md:py-4 font-mono text-success">{m.pricePerLoad}</td>
                  <td className="hidden sm:table-cell px-4 py-3 md:px-6 md:py-4 font-mono text-success">{m.pricePerTrip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-neutral-400">
          Prices are estimates and may vary by location. Contact us for a formal quote.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-6">
          <div>
            <h3 className="font-heading text-lg font-bold text-neutral-900">Need a custom quote?</h3>
            <p className="text-sm text-neutral-500">Large orders or recurring supply — we offer volume discounts.</p>
          </div>
          <Link href="/contact" className="btn-primary">
            Request Quote
          </Link>
        </div>
      </div>
    </div>
  );
}
