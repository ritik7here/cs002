import React, { useEffect, useState } from "react";
import {
  Inbox,
  Search,
  MapPin,
  Package,
  Calendar,
  Building2,
  CheckCircle2,
  HandHelping,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Donation } from "../../types";
import { ClaimDonationModal } from "../shared/Modals";
import {
  donationRequestsApi,
  DonationRequest,
} from "../../api/donationRequests";
import {
  donationMatchesApi,
  type DonationMatchRecommendation,
} from "../../api/donationMatches";

export const AvailableDonations: React.FC = () => {
  const { donations, ngos, currentUser, claimDonation } = useApp();
  const currentNgo = ngos.find((n) => n.id === currentUser?.organizationId);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [claimTarget, setClaimTarget] = useState<Donation | null>(null);
  const [myRequests, setMyRequests] = useState<DonationRequest[]>([]);
  const [recommendations, setRecommendations] = useState<
    DonationMatchRecommendation[]
  >([]);

  useEffect(() => {
    let active = true;
    donationRequestsApi
      .listMine()
      .then((items) => {
        if (active) setMyRequests(items);
      })
      .catch((error) =>
        console.error("Could not load your donation requests:", error),
      );
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!currentNgo || currentNgo.verificationStatus !== "verified") {
      setRecommendations([]);
      return () => {
        active = false;
      };
    }
    donationMatchesApi
      .listRecommendations()
      .then((items) => {
        if (active) setRecommendations(items);
      })
      .catch((error) =>
        console.error("Could not load donation match recommendations:", error),
      );
    return () => {
      active = false;
    };
  }, [currentUser?.id, currentNgo?.id, currentNgo?.verificationStatus]);

  const bestMatchByDonation = new Map<string, DonationMatchRecommendation>();
  for (const recommendation of recommendations) {
    const current = bestMatchByDonation.get(recommendation.donation.id);
    if (!current || recommendation.score > current.score) {
      bestMatchByDonation.set(recommendation.donation.id, recommendation);
    }
  }

  const activeRequestDonationIds = new Set(
    myRequests
      .filter(
        (request) =>
          request.status === "pending" || request.status === "accepted",
      )
      .map((request) => request.donation_id),
  );

  // Only genuinely requestable, unassigned donations belong in this list.
  const availableList = donations.filter(
    (d) => d.status === "Submitted" && !d.matchedNgoId,
  );

  const categories = [
    "All",
    "Food & Groceries",
    "Clothing & Blankets",
    "Medical Supplies",
    "Educational Material",
    "Electronics & Devices",
  ];

  const filtered = availableList.filter((d) => {
    const matchesCategory =
      selectedCategory === "All" || d.category === selectedCategory;
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
          Open Exchange
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Available Donor Pledges
        </h1>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
          Browse citizen and corporate aid offerings ready for NGO claim and
          pickup scheduling.
        </p>
      </div>

      {!currentNgo && (
        <div
          role="alert"
          className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800"
        >
          Your account is not linked to an NGO organization. Complete NGO
          onboarding before requesting donations.
        </div>
      )}
      {currentNgo && currentNgo.verificationStatus !== "verified" && (
        <div
          role="status"
          className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800"
        >
          Your NGO is {currentNgo.verificationStatus.replace("_", " ")}.
          Donation requests are available after admin verification.
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search donations by item name, city, or keywords..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer text-xs ${
                selectedCategory === c
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Available List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <Inbox className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
            No unclaimed pledges available right now
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            New donations are listed daily. Check back soon or post a custom
            requirement.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((donation) => (
            <div
              key={donation.id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span>{donation.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{donation.condition}</span>
                  </div>
                  <span className="font-medium text-amber-700 dark:text-amber-400">
                    {donation.urgency}
                  </span>
                </div>

                <h3 className="font-semibold text-neutral-900 dark:text-white text-base leading-snug mb-2">
                  {donation.title}
                </h3>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3 leading-relaxed">
                  {donation.description ||
                    "Pledged by verified community supporter."}
                </p>

                <div className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums font-semibold">
                      {donation.quantity} {donation.unit}
                    </span>
                    {donation.estimatedValue && (
                      <>
                        <span aria-hidden="true" className="text-neutral-400">
                          ·
                        </span>
                        <span className="text-neutral-500 font-mono">
                          Est. ${donation.estimatedValue}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    <span>
                      Pickup: {donation.city}, {donation.state}
                    </span>
                  </div>
                  <div className="text-neutral-400 text-[11px]">
                    Offered by: {donation.donorName}
                  </div>
                  {bestMatchByDonation.get(donation.id) && (
                    <div className="mt-2 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2">
                      <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                        {bestMatchByDonation.get(donation.id)!.score}% match ·{" "}
                        {
                          bestMatchByDonation.get(donation.id)!.requirement
                            .title
                        }
                      </div>
                      <div className="mt-1 text-[10px] text-emerald-800 dark:text-emerald-200">
                        {bestMatchByDonation
                          .get(donation.id)!
                          .reasons.slice(0, 2)
                          .join(" · ")}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  onClick={() => setClaimTarget(donation)}
                  disabled={
                    !currentNgo ||
                    currentNgo.verificationStatus !== "verified" ||
                    activeRequestDonationIds.has(donation.id)
                  }
                  className="w-full py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <HandHelping className="w-4 h-4" />
                  <span>
                    {activeRequestDonationIds.has(donation.id)
                      ? "Request Already Submitted"
                      : "Request Donation"}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Claim Modal */}
      <ClaimDonationModal
        isOpen={Boolean(claimTarget)}
        onClose={() => setClaimTarget(null)}
        donation={claimTarget}
        onConfirmClaim={(donationId, proposedDate, notes) => {
          if (
            !currentNgo ||
            currentNgo.verificationStatus !== "verified" ||
            !currentUser?.organizationId
          ) {
            throw new Error(
              "A verified NGO account linked to an organization is required to request donations.",
            );
          }
          return claimDonation(donationId, currentNgo.id, proposedDate, notes);
        }}
      />
    </div>
  );
};
