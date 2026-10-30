import React, { useEffect, useState } from "react";
import {
  Building2,
  Package,
  Layers,
  Truck,
  PlusCircle,
  Inbox,
  ArrowRight,
  ShieldCheck,
  Clock,
  Heart,
  Calendar,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { StatCard } from "../shared/Cards";
import {
  distributionsApi,
  type DistributionRecord,
} from "../../api/distributions";

export const NGODashboard: React.FC = () => {
  const {
    currentUser,
    ngos,
    donations,
    donationsLoadStatus,
    requirements,
    requirementsLoadStatus,
    setCurrentView,
    setSelectedDonationId,
  } = useApp();

  const [distributionRecords, setDistributionRecords] = useState<
    DistributionRecord[] | null
  >(null);
  const [distributionLoadError, setDistributionLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDistributionRecords(null);
    setDistributionLoadError(false);
    if (!currentUser || currentUser.role !== "ngo")
      return () => {
        cancelled = true;
      };
    distributionsApi
      .listMine()
      .then((records) => {
        if (!cancelled) setDistributionRecords(records);
      })
      .catch((error) => {
        console.error("Failed to load NGO distribution impact:", error);
        if (!cancelled) setDistributionLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.role]);

  const myNgo = ngos.find((n) => n.id === currentUser?.organizationId);

  if (!myNgo) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Your NGO organization record is not available yet. Complete organization
        registration or refresh after the record loads.
      </div>
    );
  }

  const myRequirements = requirements.filter((r) => r.ngoId === myNgo.id);
  // Only open and partially fulfilled requirements are active community needs.
  const openReqs = myRequirements.filter(
    (r) => r.status === "Open" || r.status === "Partially Fulfilled",
  );

  // Cancelled and already distributed donations are not incoming work.
  const incomingDonations = donations.filter(
    (d) =>
      d.matchedNgoId === myNgo.id &&
      d.status !== "Distributed" &&
      d.status !== "Cancelled",
  );

  const verificationLabel =
    {
      verified: "Verified",
      pending: "Pending",
      under_review: "Under Review",
      rejected: "Rejected",
    }[myNgo.verificationStatus] || "Unknown";

  const verificationDescription =
    {
      verified: "Approved by an administrator",
      pending: "Awaiting administrator review",
      under_review: "Administrator review in progress",
      rejected: "Verification was not approved",
    }[myNgo.verificationStatus] || "Verification status unavailable";

  // Report only beneficiaries recorded in persisted distribution events.
  const totalBeneficiaries = (distributionRecords || []).reduce(
    (acc, record) => acc + (record.beneficiaries_reached || 0),
    0,
  );

  return (
    <div className="space-y-8">
      {/* Top Welcome Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
            <span>NGO Operations Portal</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />{" "}
              {verificationLabel === "Verified"
                ? "Accredited Partner"
                : `Verification: ${verificationLabel}`}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            {myNgo.name}
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
            HQ: {myNgo.address}, {myNgo.city} · Rep: {currentUser?.name}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setCurrentView("ngo-create-requirement")}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Requirement</span>
          </button>
          <button
            onClick={() => setCurrentView("ngo-available-donations")}
            className="px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1.5"
          >
            <Inbox className="w-4 h-4" />
            <span>Available Gifts</span>
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Community Needs"
          value={
            requirementsLoadStatus === "loading"
              ? "Loading…"
              : requirementsLoadStatus === "error"
                ? "Unavailable"
                : openReqs.length
          }
          subtext={
            requirementsLoadStatus === "error"
              ? "Could not load community needs"
              : "Open and partially fulfilled needs"
          }
          icon={Layers}
        />
        <StatCard
          label="Incoming Donated Batches"
          value={
            donationsLoadStatus === "loading"
              ? "Loading…"
              : donationsLoadStatus === "error"
                ? "Unavailable"
                : incomingDonations.length
          }
          subtext={
            donationsLoadStatus === "error"
              ? "Could not load donation records"
              : "Matched donations not cancelled or distributed"
          }
          icon={Truck}
        />
        <StatCard
          label="Reported Beneficiary Reach"
          value={
            distributionLoadError
              ? "Unavailable"
              : distributionRecords === null
                ? "Loading…"
                : totalBeneficiaries.toLocaleString()
          }
          subtext="Sum of saved distribution reports"
          icon={Heart}
        />
        <StatCard
          label="NGO Verification"
          value={verificationLabel}
          subtext={verificationDescription}
          icon={ShieldCheck}
        />
      </div>

      {/* 2-Column Workflow: Pending Action Items & Active Needs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Incoming Donation Allocations */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                Incoming Allocated Donations
              </h3>
              <p className="text-xs text-neutral-500">
                Pledges matched to your foundation requiring pickup or intake
              </p>
            </div>
            <button
              onClick={() => setCurrentView("ngo-donation-requests")}
              className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
            >
              <span>
                Manage All (
                {donationsLoadStatus === "loaded"
                  ? incomingDonations.length
                  : "—"}
                )
              </span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {incomingDonations.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              No pending incoming donations right now.{" "}
              <button
                onClick={() => setCurrentView("ngo-available-donations")}
                className="text-blue-600 hover:underline font-medium ml-1"
              >
                Browse open donor gifts
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {incomingDonations.slice(0, 3).map((d) => (
                <div
                  key={d.id}
                  className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-neutral-500 mb-0.5">
                      <span>{d.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {d.status}
                      </span>
                    </div>
                    <div className="font-semibold text-neutral-900 dark:text-white truncate">
                      {d.title}
                    </div>
                    <div className="text-neutral-500 text-[11px] mt-0.5">
                      Donor: {d.donorName} · {d.quantity} {d.unit}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {d.status === "Received by NGO" ? (
                      <button
                        onClick={() => {
                          setSelectedDonationId(d.id);
                          setCurrentView("ngo-distribution-tracking");
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                      >
                        Log Distribution
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedDonationId(d.id);
                          setCurrentView("ngo-donation-requests");
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        Update Logistics
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Active Field Requirements */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                Active Community Shortages
              </h3>
              <p className="text-xs text-neutral-500">
                Current campaigns broadcasting to donors
              </p>
            </div>
            <button
              onClick={() => setCurrentView("ngo-active-requirements")}
              className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {requirementsLoadStatus === "loading" ? (
            <div
              className="py-8 text-center text-xs text-neutral-500"
              role="status"
            >
              Loading community needs…
            </div>
          ) : requirementsLoadStatus === "error" ? (
            <div
              className="py-8 text-center text-xs text-rose-600"
              role="alert"
            >
              Community needs could not be loaded. Refresh the page or try again
              later.
            </div>
          ) : openReqs.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              No open community needs yet. Post a requirement to let donors know
              what is needed.
            </div>
          ) : (
            <div className="space-y-3">
              {openReqs.map((req) => {
                const pct =
                  req.targetQuantity > 0
                    ? Math.min(
                        100,
                        Math.max(
                          0,
                          Math.round(
                            (req.fulfilledQuantity / req.targetQuantity) * 100,
                          ),
                        ),
                      )
                    : 0;
                return (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-900 dark:text-white truncate max-w-[240px]">
                        {req.title}
                      </span>
                      <span className="font-mono tabular-nums text-neutral-500 font-medium">
                        {req.fulfilledQuantity}/{req.targetQuantity} {req.unit}
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Deadline: {req.neededByDate}</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {pct}% Fulfilled
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
