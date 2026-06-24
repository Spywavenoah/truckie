"use client";

import { useState } from "react";

const faqs = [
  {
    q: "How do I hire a truck or equipment?",
    a: "Browse listings on our marketplace, select the asset you need, and click 'Hire Now'. You will be guided through the booking, payment, and delivery process. Payment is held in escrow until the job is completed to your satisfaction.",
  },
  {
    q: "How do I list my assets as an owner?",
    a: "Create an owner account, complete your profile verification, and you can start listing your trucks, equipment, or materials. Each listing is reviewed by our team before going live.",
  },
  {
    q: "What is the NUBAN wallet and how does it work?",
    a: "Every user gets a Monnify-powered NUBAN virtual account. When you receive payments, funds go directly into your wallet. You can withdraw to your bank account at any time.",
  },
  {
    q: "How are disputes resolved?",
    a: "If there is a disagreement between a hirer and an owner, either party can open a dispute ticket. Our support team reviews evidence and issues a resolution within 48 hours. Funds in escrow are released based on the outcome.",
  },
  {
    q: "What documents do I need to register as an owner?",
    a: "You will need a valid government-issued ID, proof of business registration (if applicable), and vehicle documents (proof of ownership or authorization).",
  },
  {
    q: "Are there any fees for using TruckLease Pro?",
    a: "Creating an account and browsing listings is free. Owners pay a small commission on completed hires. Exact fee structures are shown during onboarding.",
  },
  {
    q: "What states do you operate in?",
    a: "We currently operate across all 36 states in Nigeria. Delivery and availability depend on the asset owner's location and coverage area.",
  },
  {
    q: "How do I reset my password?",
    a: "Click 'Forgot password' on the login page, enter your email, and follow the instructions sent to your inbox.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div>
      <div className="brand-header-band bg-accent -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">Frequently Asked Questions</h1>
          <p className="mt-2 text-neutral-200">Everything you need to know about TruckLease Pro.</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="rounded-lg border border-neutral-200 bg-white">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-heading text-base font-bold text-neutral-900">{faq.q}</span>
                  <span className={`ml-4 text-xl text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                    ▾
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-neutral-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-lg border border-neutral-200 bg-white p-6 text-center">
          <h2 className="font-heading text-lg font-bold text-neutral-900">Still have questions?</h2>
          <p className="mt-1 text-sm text-neutral-500">Our support team is happy to help.</p>
          <a href="mailto:support@truckleasepro.ng" className="btn-primary mt-4 inline-flex">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
