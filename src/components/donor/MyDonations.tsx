import React, { useEffect, useState } from "react";
import {
  Package,
  PlusCircle,
  Search,
  ArrowRight,
  Eye,
  Activity,
  FileCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Donation, DonationStatus } from "../../types";
import { DonationCard } from "../shared/Cards";
import {
  donationRequestsApi,
  DonationRequest,
} from "../../api/donationRequests";

export const MyDonations: React.FC = () => {
  const { currentUser, donations, setCurrentView, setSelectedDonationId } =
    useApp();

  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [requestError, setRequestError] = useState("");
  const [decisionBusy, setDecisionBusy] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setRequests(await donationRequestsApi.listMine());
      setRequestError("");
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "Could not load donation requests.",
      );
    }
  };
  useEffect(() => {
    void loadRequests();
  }, []);

  const decideRequest = async (
    requestId: string,
    decision: "accepted" | "declined",
  ) => {
    setDecisionBusy(requestId);
    try {
      await donationRequestsApi.decide(requestId, decision);
      await loadRequests();
      window.location.reload();
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "Could not update request.",
      );
    } finally {
      setDecisionBusy(null);
    }
  };

  const myDonations = donations.filter((d) => d.donorId === currentUser?.id);

  const statuses = [
    "All",
    "Submitted",
    "Matched",
    "Pickup Scheduled",
    "Received by NGO",
    "Distributed",
  ];

  const filteredDonations = myDonations.filter((d) => {
    const matchesStatus = statusFilter === "All" || d.status === statusFilter;
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.matchedNgoName &&
        d.matchedNgoName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            Donor Portfolio
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            My Pledged Donations
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
            Monitor the physical movement and community impact of all your
            pledged items.
          </p>
        </div>

        <button
          onClick={() => setCurrentView("donor-create-donation")}
          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-xs flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Pledge</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, category, or recipient NGO..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer text-xs ${
                statusFilter === st
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {requestError && (
        <p role="alert" className="text-xs text-red-600">
          {requestError}
        </p>
      )}
      {requests.some(
        (request) =>
          request.donor_id === currentUser?.id && request.status === "pending",
      ) && (
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Incoming NGO Requests
            </h2>
            <p className="text-xs text-neutral-500">
              Accepting a request assigns the donation to that NGO. Other
              pending requests will be declined.
            </p>
          </div>
          {requestError && (
            <p role="alert" className="text-xs text-red-600">
              {requestError}
            </p>
          )}
          {requests
            .filter(
              (request) =>
                request.donor_id === currentUser?.id &&
                request.status === "pending",
            )
            .map((request) => (
              <div
                key={request.id}
                className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {request.donation_title || "Donation request"}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Requested by {request.ngo_name || "an NGO"} ·{" "}
                    {request.donation_quantity ?? "—"}{" "}
                    {request.donation_unit || ""}
                  </p>
                  {request.proposed_pickup_date && (
                    <p className="text-xs text-neutral-500 mt-1">
                      Proposed pickup: {request.proposed_pickup_date}
                    </p>
                  )}
                  {request.notes && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                      {request.notes}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={decisionBusy === request.id}
                    onClick={() => void decideRequest(request.id, "declined")}
                    className="px-3 py-2 text-xs font-semibold border border-neutral-200 dark:border-neutral-700 rounded-lg disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    disabled={decisionBusy === request.id}
                    onClick={() => void decideRequest(request.id, "accepted")}
                    className="px-3 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg disabled:opacity-50"
                  >
                    {decisionBusy === request.id ? "Saving…" : "Accept request"}
                  </button>
                </div>
              </div>
            ))}
        </section>
      )}

      {/* Grid of Donations */}
      {filteredDonations.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12 text-center">
          <Package className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
            No donations found
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            {myDonations.length === 0
              ? "You have not listed any donations yet."
              : "No items match your active search filters."}
          </p>
          <button
            onClick={() => setCurrentView("donor-create-donation")}
            className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg"
          >
            Create a Donation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDonations.map((donation) => (
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
  );
};
