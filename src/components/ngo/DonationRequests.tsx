import React, { useEffect, useState } from "react";
import {
  Truck,
  Package,
  Calendar,
  CheckCircle2,
  Building2,
  Clock,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Donation } from "../../types";
import {
  donationRequestsApi,
  DonationRequest,
} from "../../api/donationRequests";

export const DonationRequests: React.FC = () => {
  const {
    donations,
    ngos,
    currentUser,
    setSelectedDonationId,
    setCurrentView,
  } = useApp();

  const currentNgo = ngos.find((n) => n.id === currentUser?.organizationId);

  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    let active = true;
    donationRequestsApi
      .listMine()
      .then((items) => {
        if (active) setRequests(items);
      })
      .catch((error) => {
        if (active)
          setRequestError(
            error instanceof Error
              ? error.message
              : "Could not load donation requests.",
          );
      });
    return () => {
      active = false;
    };
  }, []);

  const acceptedDonationIds = requests
    .filter((request) => request.status === "accepted")
    .map((request) => request.donation_id);
  const claimedDonations = donations.filter(
    (d) =>
      (currentNgo && d.matchedNgoId === currentNgo.id) ||
      acceptedDonationIds.includes(d.id),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
          Fulfillment Logistics
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Claimed Donations & Inbound Pipeline
        </h1>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
          Advance donations across the fulfillment pipeline as goods are
          collected and checked into your depot.
        </p>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            My Donation Requests
          </h2>
          <p className="text-xs text-neutral-500">
            Requests are persisted in Supabase. A pending request is not a
            confirmed allocation.
          </p>
        </div>
        {requestError && (
          <p role="alert" className="text-xs text-red-600">
            {requestError}
          </p>
        )}
        {requests.length === 0 ? (
          <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500">
            You have not submitted any donation requests yet.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {request.donation_title || "Donation request"}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    {request.donation_category || "Donation"} ·{" "}
                    {request.donation_quantity ?? "—"}{" "}
                    {request.donation_unit || ""} ·{" "}
                    {request.donation_city || "Location not listed"}
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
                <span
                  className={`self-start rounded-full px-2.5 py-1 text-xs font-semibold ${request.status === "accepted" ? "bg-emerald-50 text-emerald-700" : request.status === "declined" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}
                >
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {claimedDonations.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <Truck className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
            No active claims or inbound shipments
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Browse available donor gifts to request aid for your community
            programs.
          </p>
          <button
            onClick={() => setCurrentView("ngo-available-donations")}
            className="mt-4 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg"
          >
            Browse Available Donations
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {claimedDonations.map((donation) => (
            <div
              key={donation.id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span className="font-mono text-neutral-400">
                    ID #{donation.id}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{donation.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Status: {donation.status}
                  </span>
                </div>

                <h3 className="font-semibold text-neutral-900 dark:text-white text-base">
                  {donation.title}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
                  <span className="font-mono tabular-nums font-medium">
                    {donation.quantity} {donation.unit}
                  </span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    <span>
                      {donation.pickupAddress}, {donation.city}
                    </span>
                  </div>
                  <div>
                    Donor:{" "}
                    <strong className="text-neutral-800 dark:text-neutral-200">
                      {donation.donorName}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="w-full md:w-56 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-neutral-100 dark:border-neutral-800 md:pl-5 space-y-2">
                {(donation.status === "Matched" ||
                  donation.status === "Pickup Scheduled") && (
                  <button
                    onClick={() => setCurrentView("pickup-coordination")}
                    className="w-full py-2 px-3 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Schedule / Manage Pickup</span>
                  </button>
                )}

                {donation.status === "Received by NGO" && (
                  <button
                    onClick={() => {
                      setSelectedDonationId(donation.id);
                      setCurrentView("ngo-distribution-tracking");
                    }}
                    className="w-full py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Proceed to Distribution</span>
                  </button>
                )}

                {donation.status === "Distributed" && (
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium text-center">
                    <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    Distribution Loop Completed
                  </div>
                )}

                <button
                  onClick={() => {
                    setSelectedDonationId(donation.id);
                    setCurrentView("donor-tracking");
                  }}
                  className="w-full py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-center hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded"
                >
                  View Live Tracking Stepper
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
