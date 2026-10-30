import React, { useState } from 'react';
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  FileCheck,
  Heart,
  Building2,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Eye,
  Camera,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AboutHowItWorks: React.FC = () => {
  const { setCurrentView } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does KindredBridge verify participating NGOs?',
      a: 'Every registered non-profit must submit legal incorporation documents, valid 80G/12A tax exemption certificates, audited financial returns for the past 2 years, and pass a physical field audit by our compliance team before receiving public donation pledges.',
    },
    {
      q: 'How does doorstep pickup work for physical donations?',
      a: 'When an NGO claims your donation, our verified logistics partners or the NGO’s designated fleet schedules a pickup window at your address. You receive the driver contact and OTP verification directly in your dashboard.',
    },
    {
      q: 'Do donors receive tax exemption receipts?',
      a: 'Yes. For financial donations and verified corporate in-kind pledges, automated 80G / 501(c)(3) compliant digital tax receipts are generated directly by the receiving verified NGO and downloadable from your donor dashboard.',
    },
    {
      q: 'What happens if a donation cannot be delivered or matched?',
      a: 'If no immediate match is made within 14 days, our platform coordinators actively triage your items to regional community relief storage centers, ensuring zero wasted gifts.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
          Transparency by Design
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
          How KindredBridge Works
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          A closed-loop community architecture connecting generous citizens with accredited
          grassroots NGOs through verified supply chains and auditable beneficiary handover.
        </p>
      </div>

      {/* 3 Pillars Workflow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
            <Heart className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-neutral-900 dark:text-white text-base">
            1. For Donors
          </h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Pledge excess goods, food parcels, refurbished laptops, or monetary aid. Choose whether
            to donate to a specific urgent requirement or allow our smart matching system to allocate
            your gift where need is highest.
          </p>
          <ul className="text-xs text-neutral-500 space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Doorstep pickup scheduling</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Real-time delivery stepper</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Tax exemption acknowledgment</span>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-neutral-900 dark:text-white text-base">
            2. For NGOs
          </h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Eliminate supply uncertainty. Publish your precise monthly material requirements
            (ration packs, medicines, blankets), browse available community donations, and coordinate
            logistics in one unified portal.
          </p>
          <ul className="text-xs text-neutral-500 space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Requirement demand broadcasts</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>One-click donation claims</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Beneficiary impact logging</span>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-neutral-900 dark:text-white text-base">
            3. Platform Governance
          </h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Our platform administrators enforce strict identity vetting, audit donation transit logs,
            and mandate photographic field evidence of distribution before marking any donation loop closed.
          </p>
          <ul className="text-xs text-neutral-500 space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>FCRA / 80G legal verification</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Beneficiary photo proof checks</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Public annual audit reports</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Visual Lifecycle Illustration Banner */}
      <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6 text-center">
          The 5 Milestones of Every KindredBridge Pledge
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 text-center">
          <div className="space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
              1
            </div>
            <div className="font-semibold text-xs text-neutral-900 dark:text-white">Pledge Submitted</div>
            <p className="text-[11px] text-neutral-500">Donor inputs details & address</p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
              2
            </div>
            <div className="font-semibold text-xs text-neutral-900 dark:text-white">Matched & Claimed</div>
            <p className="text-[11px] text-neutral-500">Verified NGO accepts item</p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
              3
            </div>
            <div className="font-semibold text-xs text-neutral-900 dark:text-white">Logistics Pickup</div>
            <p className="text-[11px] text-neutral-500">Transit fleet collects package</p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
              4
            </div>
            <div className="font-semibold text-xs text-neutral-900 dark:text-white">Warehouse Intake</div>
            <p className="text-[11px] text-neutral-500">NGO inspects & tallies inventory</p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
              5
            </div>
            <div className="font-semibold text-xs text-neutral-900 dark:text-white">Distribution Proof</div>
            <p className="text-[11px] text-neutral-500">Photos & note sent to donor</p>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-4 max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white text-center mb-6">
          Frequently Asked Questions
        </h2>

        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden transition-colors"
          >
            <button
              onClick={() => setOpenFaq(openFaq === index ? null : index)}
              className="w-full text-left px-5 py-4 flex items-center justify-between text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
            >
              <span>{faq.q}</span>
              <ChevronDown
                className={`w-4 h-4 text-neutral-400 transition-transform ${
                  openFaq === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openFaq === index && (
              <div className="px-5 pb-4 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800 pt-3">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="text-center pt-8 border-t border-neutral-100 dark:border-neutral-800">
        <button
          onClick={() => setCurrentView('donor-create-donation')}
          className="px-6 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
        >
          <span>Get Started & Pledge Aid Today</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
