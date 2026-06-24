import Link from "next/link";

async function getContactSettings() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const settings = await prisma.platformSettings.findFirst();
    return {
      address: settings?.contactAddress || "42 Awolowo Road, Ikoyi, Lagos",
      phone: settings?.contactPhone || "+234 800 TRUCKLEASE",
      email: settings?.contactEmail || "support@truckleasepro.com",
      hours: settings?.contactHours || "Mon\u2013Fri: 8:00 AM \u2013 6:00 PM, Sat: 9:00 AM \u2013 3:00 PM",
    };
  } catch {
    return {
      address: "42 Awolowo Road, Ikoyi, Lagos",
      phone: "+234 800 TRUCKLEASE",
      email: "support@truckleasepro.com",
      hours: "Mon\u2013Fri: 8:00 AM \u2013 6:00 PM, Sat: 9:00 AM \u2013 3:00 PM",
    };
  }
}

export default async function ContactPage() {
  const contact = await getContactSettings();
  const phoneLines = contact.phone.split(",").map((s: string) => s.trim());

  return (
    <div>
      <div className="brand-header-band bg-accent -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">Contact Us</h1>
          <p className="mt-2 text-neutral-200">Get in touch — we are here to help.</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <form className="space-y-6" action="/api/contact" method="POST">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-neutral-700">
                  Phone (optional)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light"
                  placeholder="+234 800 000 0000"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-neutral-700">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light"
                  placeholder="How can we help you?"
                />
              </div>

              <button type="submit" className="btn-primary">
                Send Message
              </button>
            </form>
          </div>

          <div>
            <div className="rounded-lg border border-neutral-200 bg-white p-6 space-y-6">
              <div>
                <h3 className="font-heading text-base font-bold text-neutral-900">Our Office</h3>
                <p className="mt-2 text-sm text-neutral-500 whitespace-pre-line">{contact.address}</p>
              </div>

              <div>
                <h3 className="font-heading text-base font-bold text-neutral-900">Phone</h3>
                <div className="mt-2 text-sm text-neutral-500">
                  {phoneLines.map((line: string, i: number) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-heading text-base font-bold text-neutral-900">Email</h3>
                <p className="mt-2 text-sm text-neutral-500">{contact.email}</p>
              </div>

              <div>
                <h3 className="font-heading text-base font-bold text-neutral-900">Working Hours</h3>
                <p className="mt-2 text-sm text-neutral-500 whitespace-pre-line">{contact.hours}</p>
              </div>

              <Link href="/faq" className="text-sm font-medium text-accent-light hover:text-accent">
                Visit our FAQ &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
