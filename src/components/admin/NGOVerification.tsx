import React, { useState } from "react";
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  Search,
  ExternalLink,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { NGO } from "../../types";
import { VerifyNgoModal } from "../shared/Modals";

export const NGOVerification: React.FC = () => {
  const { ngos, updateNgoVerification } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedNgoForAudit, setSelectedNgoForAudit] = useState<NGO | null>(
    null,
  );

  const statuses = ["All", "pending", "verified", "under_review", "rejected"];

  const filteredNgos = ngos.filter((ngo) => {
    const matchesStatus =
      statusFilter === "All" || ngo.verificationStatus === statusFilter;
    const matchesSearch =
      ngo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ngo.registrationNumber
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      ngo.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
          Accreditation Board
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          NGO Verification & Legal Compliance
        </h1>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
          Audit statutory registration documents, FCRA credentials, 80G tax
          exemptions, and operational integrity.
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
            placeholder="Search by NGO name, registration code, or city..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md font-medium whitespace-nowrap capitalize transition-colors cursor-pointer text-xs ${
                statusFilter === st
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* NGO List */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 text-neutral-500 font-medium">
                <th className="px-4 py-3">NGO Organization</th>
                <th className="px-4 py-3">Govt Registration</th>
                <th className="px-4 py-3">80G / Tax ID</th>
                <th className="px-4 py-3">Audit Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredNgos.map((ngo) => (
                <tr
                  key={ngo.id}
                  className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-neutral-900 dark:text-white">
                      {ngo.name}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      {ngo.city}, {ngo.state} · {ngo.contactEmail}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-neutral-700 dark:text-neutral-300">
                    {ngo.registrationNumber}
                  </td>
                  <td className="px-4 py-3 font-mono text-neutral-700 dark:text-neutral-300">
                    {ngo.taxExemptId}
                  </td>
                  <td className="px-4 py-3">
                    {ngo.verificationStatus === "verified" && (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    )}
                    {ngo.verificationStatus === "pending" && (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" /> Pending Audit
                      </span>
                    )}
                    {ngo.verificationStatus === "under_review" && (
                      <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                        Under Review
                      </span>
                    )}
                    {ngo.verificationStatus === "rejected" && (
                      <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                        <XCircle className="w-3.5 h-3.5" /> Rejected
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedNgoForAudit(ngo)}
                      className="px-3 py-1 text-xs font-semibold text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      Audit & Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Modal */}
      <VerifyNgoModal
        isOpen={Boolean(selectedNgoForAudit)}
        onClose={() => setSelectedNgoForAudit(null)}
        ngo={selectedNgoForAudit}
        onSetStatus={(ngoId, status, reason) =>
          updateNgoVerification(ngoId, status, reason)
        }
      />
    </div>
  );
};
