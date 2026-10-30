import React from "react";
import {
  ShieldCheck,
  Building2,
  Package,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { StatCard } from "../shared/Cards";

export const AdminDashboard: React.FC = () => {
  const { ngos, donations, requirements, setCurrentView, setSelectedNgoId } =
    useApp();

  const pendingNgos = ngos.filter(
    (n) => n.verificationStatus === "pending" || !n.verified,
  );
  const completedCount = donations.filter(
    (d) => d.status === "Distributed",
  ).length;
  const fulfillmentRate =
    donations.length > 0
      ? `${Math.round((completedCount / donations.length) * 100)}%`
      : "—";

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
            Platform Integrity & Governance
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Administrative Control Center
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
            Monitor non-profit compliance audits, cross-regional logistics
            flows, and user permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView("admin-ngo-verification")}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Queue ({pendingNgos.length})</span>
          </button>
          <button
            onClick={() => setCurrentView("admin-analytics")}
            className="px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            System Analytics
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Registered NGOs"
          value={ngos.length}
          subtext={`${ngos.filter((n) => n.verified).length} verified & audited`}
          icon={Building2}
        />
        <StatCard
          label="Pending Legal Verifications"
          value={pendingNgos.length}
          change={pendingNgos.length > 0 ? "Requires review" : "Up to date"}
          icon={AlertTriangle}
        />
        <StatCard
          label="Platform Delivery Rate"
          value={fulfillmentRate}
          subtext="Distributed donations / all donations"
          icon={CheckCircle2}
        />
        <StatCard
          label="Total Donations"
          value={donations.length}
          subtext="Live donation records"
          icon={Package}
        />
      </div>

      {/* 2-Column: Verification Action Queue & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Verification Queue */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                NGO Compliance & Verification Queue
              </h3>
              <p className="text-xs text-neutral-500">
                Review uploaded 80G tax exemptions and registration paperwork
              </p>
            </div>
            <button
              onClick={() => setCurrentView("admin-ngo-verification")}
              className="text-xs text-amber-600 dark:text-amber-400 font-medium hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {ngos.slice(0, 4).map((ngo) => (
              <div
                key={ngo.id}
                className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {ngo.name}
                    </span>
                    {ngo.verified ? (
                      <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                        Verified
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-medium bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                        Pending Review
                      </span>
                    )}
                  </div>
                  <div className="text-neutral-500 text-[11px] mt-0.5 font-mono">
                    Reg: {ngo.registrationNumber} · {ngo.city}, {ngo.state}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedNgoId(ngo.id);
                    setCurrentView("admin-ngo-verification");
                  }}
                  className="px-3 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg shrink-0"
                >
                  Audit Files
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 cols: Platform Activity & Quick Shortcuts */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-neutral-900 dark:text-white text-sm pb-3 border-b border-neutral-100 dark:border-neutral-800">
            Governance Management Shortcuts
          </h3>

          <div className="space-y-2.5 text-xs">
            <button
              onClick={() => setCurrentView("admin-user-management")}
              className="w-full p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left flex items-center justify-between transition-colors"
            >
              <div>
                <div className="font-semibold text-neutral-900 dark:text-white">
                  User Accounts & Roles
                </div>
                <div className="text-neutral-500 text-[11px]">
                  Review account records and roles
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400" />
            </button>

            <button
              onClick={() => setCurrentView("admin-donation-management")}
              className="w-full p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left flex items-center justify-between transition-colors"
            >
              <div>
                <div className="font-semibold text-neutral-900 dark:text-white">
                  Donation Transit Audit
                </div>
                <div className="text-neutral-500 text-[11px]">
                  {donations.length} total shipments tracked
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400" />
            </button>

            <button
              onClick={() => setCurrentView("admin-requirement-management")}
              className="w-full p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left flex items-center justify-between transition-colors"
            >
              <div>
                <div className="font-semibold text-neutral-900 dark:text-white">
                  Community Needs Moderation
                </div>
                <div className="text-neutral-500 text-[11px]">
                  {requirements.length} field campaigns active
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
