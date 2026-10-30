import React, { useEffect, useState } from "react";
import {
  Heart,
  Package,
  Award,
  PlusCircle,
  ArrowRight,
  Clock,
  Building2,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { StatCard, DonationCard } from "../shared/Cards";
import {
  distributionsApi,
  type DistributionRecord,
} from "../../api/distributions";

export const DonorDashboard: React.FC = () => {
  const {
    currentUser,
    donations,
    donationsLoadStatus,
    requirements,
    requirementsLoadStatus,
    setCurrentView,
    setSelectedDonationId,
    setSelectedRequirementId,
  } = useApp();

  const [distributionRecords, setDistributionRecords] = useState<
    DistributionRecord[] | null
  >(null);
  const [distributionLoadError, setDistributionLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDistributionRecords(null);
    setDistributionLoadError(false);
    if (!currentUser || currentUser.role !== "donor")
      return () => {
        cancelled = true;
      };
    distributionsApi
      .listMine()
      .then((records) => {
        if (!cancelled) setDistributionRecords(records);
      })
      .catch((error) => {
        console.error("Failed to load donor distribution impact:", error);
        if (!cancelled) setDistributionLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.role]);

  const myDonations = donations.filter((d) => d.donorId === currentUser?.id);
  const openDonations = myDonations.filter(
    (d) => d.status !== "Distributed" && d.status !== "Cancelled",
  );
  // Beneficiary reach comes from persisted distribution events, not a donation field
  // that the donation API does not provide.
  const totalBeneficiaries = (distributionRecords || []).reduce(
    (acc, record) => acc + (record.beneficiaries_reached || 0),
    0,
  );

  const donationsWithEstimatedValue = myDonations.filter(
    (d) =>
      typeof d.estimatedValue === "number" && Number.isFinite(d.estimatedValue),
  ).length;
  const missingEstimatedValues =
    myDonations.length - donationsWithEstimatedValue;
  const totalValue = myDonations.reduce(
    (acc, d) => acc + (d.estimatedValue ?? 0),
    0,
  );

  const openNeeds = requirements
    .filter((r) => r.status === "Open" || r.status === "Partially Fulfilled")
    .slice(0, 2);

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Welcome back,
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            {currentUser?.name || "Generous Donor"}
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
            Manage your donations and follow confirmed distribution impact.
          </p>
        </div>

        <button
          onClick={() => setCurrentView("donor-create-donation")}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Donation</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Pledges Listed"
          value={
            donationsLoadStatus === "loading"
              ? "Loading…"
              : donationsLoadStatus === "error"
                ? "Unavailable"
                : myDonations.length
          }
          subtext={
            donationsLoadStatus === "error"
              ? "Could not load donation records"
              : "Saved donation records for your account"
          }
          icon={Package}
        />
        <StatCard
          label="Open Donations"
          value={
            donationsLoadStatus === "loading"
              ? "Loading…"
              : donationsLoadStatus === "error"
                ? "Unavailable"
                : openDonations.length
          }
          subtext="Not yet distributed or cancelled"
          icon={Clock}
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
          label="Estimated Donation Value"
          value={
            donationsLoadStatus === "loading"
              ? "Loading…"
              : donationsLoadStatus === "error"
                ? "Unavailable"
                : missingEstimatedValues === myDonations.length &&
                    myDonations.length > 0
                  ? "Not recorded"
                  : `$${totalValue.toLocaleString()} USD`
          }
          subtext={
            donationsLoadStatus === "error"
              ? "Could not load donation records"
              : missingEstimatedValues > 0
                ? `${donationsWithEstimatedValue} of ${myDonations.length} donations have a recorded estimate`
                : "Sum of saved estimated values; USD"
          }
          icon={Award}
        />
      </div>

      {/* Active Donations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Recent Pledges & Live Status
            </h2>
            <p className="text-xs text-neutral-500">
              Track fulfillment progress and inspection milestones
            </p>
          </div>
          <button
            onClick={() => setCurrentView("donor-my-donations")}
            className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1"
          >
            <span>
              View All (
              {donationsLoadStatus === "loaded" ? myDonations.length : "—"})
            </span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {donationsLoadStatus === "loading" ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 text-center text-xs text-neutral-500">
            Loading your donation records…
          </div>
        ) : donationsLoadStatus === "error" ? (
          <div
            role="alert"
            className="bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-900 rounded-xl p-8 text-center text-xs text-neutral-600 dark:text-neutral-300"
          >
            Your donations could not be loaded. Please refresh or try again
            later.
          </div>
        ) : myDonations.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 text-center">
            <Package className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              You haven't listed any donations yet.
            </p>
            <button
              onClick={() => setCurrentView("donor-create-donation")}
              className="mt-3 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg"
            >
              List your first donation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myDonations.slice(0, 3).map((donation) => (
              <DonationCard
                key={donation.id}
                donation={donation}
                onViewDetails={(d) => {
                  setSelectedDonationId(d.id);
                  setCurrentView("donor-donation-details");
                }}
                onTrack={(d) => {
                  setSelectedDonationId(d.id);
                  setCurrentView("donor-tracking");
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Live open community needs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Open Community Needs
            </h2>
            <p className="text-xs text-neutral-500">
              Open and partially fulfilled requests currently listed by NGOs
            </p>
          </div>
          <button
            onClick={() => setCurrentView("donor-matched-ngos")}
            className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1"
          >
            <span>Explore Matching Hub</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {requirementsLoadStatus === "loading" ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 text-xs text-neutral-500">
            Loading community needs…
          </div>
        ) : requirementsLoadStatus === "error" ? (
          <div
            role="alert"
            className="bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-900 rounded-xl p-6 text-xs text-neutral-600 dark:text-neutral-300"
          >
            Community needs could not be loaded. Please try again later.
          </div>
        ) : openNeeds.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 text-xs text-neutral-500">
            No open community needs are currently listed.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openNeeds.map((req) => (
              <div
                key={req.id}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                    <span>{req.category}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      {req.urgency}
                    </span>
                  </div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                    {req.title}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3">
                    {req.description}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{req.ngoName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{req.ngoCity}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-xs text-neutral-500">
                    Need:{" "}
                    <strong className="text-neutral-900 dark:text-white">
                      {Math.max(0, req.targetQuantity - req.fulfilledQuantity)}
                    </strong>{" "}
                    {req.unit} left
                  </span>
                  <button
                    onClick={() => {
                      setSelectedRequirementId(req.id);
                      setCurrentView("donor-create-donation");
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1"
                  >
                    <span>Pledge This Need</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
