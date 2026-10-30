import React from "react";
import {
  Activity,
  ArrowLeft,
  Download,
  Share2,
  Building2,
  CheckCircle2,
  Package,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { StatusTracker } from "../shared/StatusTracker";

export const DonationTracking: React.FC = () => {
  const {
    donations,
    selectedDonationId,
    setSelectedDonationId,
    setCurrentView,
    showToast,
  } = useApp();

  const currentDonation =
    donations.find((d) => d.id === selectedDonationId) || donations[0];

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast("Tracking link copied to clipboard!", "info");
    } else {
      showToast("Live tracking URL ready to share", "info");
    }
  };

  const handleDownloadProof = () => {
    showToast(
      `Downloading verified audit certificate for #${currentDonation.id}`,
      "success",
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setCurrentView("donor-my-donations")}
            className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Donations</span>
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Live Donation Tracking
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
            Transparent verification ledger from doorstep pickup to beneficiary
            receipt
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors"
            title="Share Tracking Link"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {currentDonation.status === "Distributed" && (
            <button
              onClick={handleDownloadProof}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Impact Certificate</span>
            </button>
          )}
        </div>
      </div>

      {/* Donation Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-200 dark:border-neutral-800 text-xs">
        <span className="text-neutral-400 shrink-0 mr-1">Switch Donation:</span>
        {donations.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDonationId(d.id)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer text-xs flex items-center gap-1.5 ${
              d.id === currentDonation.id
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            <span>{d.title.slice(0, 24)}...</span>
            <span className="text-[10px] font-mono opacity-80">
              ({d.status})
            </span>
          </button>
        ))}
      </div>

      {/* Selected Item Summary Card */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-neutral-500">
            <span className="font-mono text-neutral-400">
              ID #{currentDonation.id}
            </span>
            <span aria-hidden="true">·</span>
            <span>{currentDonation.category}</span>
            <span aria-hidden="true">·</span>
            <span>{currentDonation.condition}</span>
          </div>
          <div className="text-base font-bold text-neutral-900 dark:text-white">
            {currentDonation.title}
          </div>
          <div className="text-neutral-600 dark:text-neutral-400">
            Total Pledged:{" "}
            <strong className="font-mono tabular-nums text-neutral-800 dark:text-neutral-200">
              {currentDonation.quantity} {currentDonation.unit}
            </strong>
            {currentDonation.matchedNgoName && (
              <>
                {" "}
                · Allocated to:{" "}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {currentDonation.matchedNgoName}
                </strong>
              </>
            )}
          </div>
        </div>

        <div className="text-left sm:text-right shrink-0">
          <div className="text-neutral-400 text-[11px]">
            Current Tracking Status
          </div>
          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
            {currentDonation.status}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">
            Updated {new Date(currentDonation.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Primary Stepper View */}
      <StatusTracker
        timeline={currentDonation.trackingTimeline}
        statusHistory={currentDonation.statusHistory}
        currentStatus={currentDonation.status}
        proofPhotos={currentDonation.proofPhotos}
        beneficiaryNotes={currentDonation.beneficiaryNotes}
      />
    </div>
  );
};
