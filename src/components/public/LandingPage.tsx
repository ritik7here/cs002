import React from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Heart,
  Building2,
  Package,
  Activity,
  CheckCircle2,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RequirementCard, NGOCard } from '../shared/Cards';

export const LandingPage: React.FC = () => {
  const { setCurrentView, requirements, ngos, setSelectedNgoId, setSelectedRequirementId } = useApp();

  const urgentRequirements = requirements.filter(r => r.status !== 'Fulfilled').slice(0, 3);
  const featuredNgos = ngos.filter(n => n.verified).slice(0, 3);

  return (
    <div className="space-y-16 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-12 sm:pb-16 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Mission Prose */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Audited & Transparent Community Aid Network
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white leading-[1.15] text-balance">
                Connecting Generous Donors With Verified Grassroots NGOs
              </h1>

              <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-2xl">
                Directly channel food rations, medical relief, refurbished electronics, and learning kits
                to local non-profits with end-to-end doorstep logistics and digital proof of beneficiary delivery.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setCurrentView('donor-create-donation')}
                  className="px-6 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"
                >
                  <Heart className="w-4 h-4" />
                  <span>Pledge a Donation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentView('public-directory')}
                  className="px-5 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/60 transition-colors"
                >
                  Browse Verified NGOs
                </button>
                <button
                  onClick={() => setCurrentView('auth-register')}
                  className="px-4 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                >
                  Register as NGO →
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center gap-6 text-xs text-neutral-500 dark:text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>100% 80G / FCRA Verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Live Beneficiary Handover Proof</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>Zero Intermediary Leakage</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Asset */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-xl bg-neutral-100 dark:bg-neutral-800 aspect-4/3 group">
                <img
                  src="/src/assets/images/hero_ngo_community_1790438450195.jpg"
                  alt="Community volunteers distributing humanitarian aid kits"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-xs font-semibold text-emerald-300 mb-0.5">
                    Field Verification: Mumbai Outreach Hub
                  </div>
                  <p className="text-xs text-neutral-200 leading-snug">
                    Over 42,000+ meals and emergency kits delivered with certified donor tracking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quantitative Proof Grid (Claim-to-Proof Adjacency) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              Beneficiaries Reached
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
              164,800+
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Documented across 6 states
            </div>
          </div>
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              Supplies Dispatched
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              1,240+ Tons
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Food, medical, electronics
            </div>
          </div>
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              Verified Grassroots NGOs
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
              84 Organizations
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Passed financial & legal audits
            </div>
          </div>
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              Delivery Completion Rate
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
              99.2%
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Pledge-to-recipient fidelity
            </div>
          </div>
        </div>
      </section>

      {/* 3. Urgent Active Requirements Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
              Immediate Needs
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Urgent Community Requirements
            </h2>
          </div>
          <button
            onClick={() => setCurrentView('public-directory')}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Requirements in Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {urgentRequirements.map(req => (
            <RequirementCard
              key={req.id}
              requirement={req}
              onContribute={r => {
                setSelectedRequirementId(r.id);
                setCurrentView('donor-create-donation');
              }}
            />
          ))}
        </div>
      </section>

      {/* 4. Three-Step Transparent Architecture */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div className="max-w-2xl mb-8">
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
              Transparent Framework
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
              How KindredBridge Closes the Philanthropy Loop
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              Unlike traditional black-box charity donations, every supply donation is tracked
              from doorstep pickup to the hands of the end-beneficiary.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-sm text-neutral-900 dark:text-white">
                01
              </div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                Pledge In-Kind or Funds
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                List unused computers, warm blankets, ration boxes, or school supplies with pickup
                address and condition rating.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-sm text-neutral-900 dark:text-white">
                02
              </div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                Algorithmic Need Matching
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                System pairs your pledge directly with verified NGOs whose active field requests
                match your category, proximity, and urgency.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-sm text-neutral-900 dark:text-white">
                03
              </div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                Audited Handover & Photos
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Once distributed, NGOs log beneficiary recipient counts and upload verified field photos
                directly into your personal tracking console.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Featured Verified NGOs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
              Field Tested
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Featured Verified Grassroots Partners
            </h2>
          </div>
          <button
            onClick={() => setCurrentView('public-directory')}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Explore Full NGO Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredNgos.map(ngo => (
            <NGOCard
              key={ngo.id}
              ngo={ngo}
              onSelect={n => {
                setSelectedNgoId(n.id);
                setCurrentView('public-directory');
              }}
              onDonateTo={n => {
                setSelectedNgoId(n.id);
                setCurrentView('donor-create-donation');
              }}
            />
          ))}
        </div>
      </section>

      {/* 6. Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Are you an NGO serving a vulnerable community?
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 dark:text-neutral-600 leading-relaxed">
              Get verified, list your urgent monthly material requirements, and access our vetted
              network of corporate and individual donors across the region.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setCurrentView('auth-register')}
              className="px-6 py-3 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm"
            >
              Apply for NGO Accreditation
            </button>
            <button
              onClick={() => setCurrentView('public-about')}
              className="px-5 py-3 text-xs sm:text-sm font-medium rounded-xl border border-neutral-700 dark:border-neutral-300 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
            >
              Learn Verification Standards
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
