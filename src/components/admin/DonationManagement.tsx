import React, { useState } from "react";
import {
  Package,
  Search,
  Activity,
  Building2,
  User,
  MapPin,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export const DonationManagement: React.FC = () => {
  const { donations, setSelectedDonationId, setCurrentView } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const statuses = [
    "All",
    "Submitted",
    "Matched",
    "Pickup Scheduled",
    "In Transit",
    "Received by NGO",
    "Distributed",
    "Cancelled",
  ];

  const filtered = donations.filter((d) => {
    const matchesStatus = statusFilter === "All" || d.status === statusFilter;
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.matchedNgoName &&
        d.matchedNgoName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
          Master Ledger
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Donation Audit & Logistics Management
        </h1>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
          Live platform ledger. Donation status changes are recorded through the
          verified request, pickup, receipt, and distribution workflows.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, donor name, recipient NGO, or item category..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500"
          />
        </div>

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

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 text-neutral-500 font-medium">
                <th className="px-4 py-3">Pledge Title & Category</th>
                <th className="px-4 py-3">Donor</th>
                <th className="px-4 py-3">Recipient NGO</th>
                <th className="px-4 py-3">Volume</th>
                <th className="px-4 py-3">Current Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filtered.map((donation) => (
                <tr
                  key={donation.id}
                  className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-neutral-900 dark:text-white truncate max-w-[200px]">
                      {donation.title}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      ID #{donation.id} · {donation.category}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-800 dark:text-neutral-200">
                      {donation.donorName}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      {donation.city}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {donation.matchedNgoName ? (
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {donation.matchedNgoName}
                      </span>
                    ) : (
                      <span className="text-neutral-400 italic">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
                    {donation.quantity} {donation.unit}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-md border border-neutral-200 bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                      {donation.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedDonationId(donation.id);
                        setCurrentView("donor-tracking");
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors inline-flex items-center gap-1"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Track</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
