import React, { useEffect, useState } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  FileText,
  Upload,
  Building2,
  User,
} from "lucide-react";
import { Donation, NGO, Requirement } from "../../types";

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// 1. Claim Donation Modal
interface ClaimDonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  donation: Donation | null;
  onConfirmClaim: (
    donationId: string,
    proposedDate: string,
    notes: string,
  ) => Promise<void> | void;
}

export const ClaimDonationModal: React.FC<ClaimDonationModalProps> = ({
  isOpen,
  onClose,
  donation,
  onConfirmClaim,
}) => {
  const [proposedDate, setProposedDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [notes, setNotes] = useState(
    "Our logistics vehicle can collect directly from the donor location.",
  );

  if (!donation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      await onConfirmClaim(donation.id, proposedDate, notes);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Request could not be submitted.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Request Donation"
      subtitle={`Submit a request for: ${donation.title}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
          <div className="flex justify-between mb-1">
            <span className="text-neutral-500">Offered by:</span>
            <span className="font-semibold text-neutral-900 dark:text-white">
              {donation.donorName}
            </span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-neutral-500">Quantity:</span>
            <span className="font-mono tabular-nums text-neutral-900 dark:text-white">
              {donation.quantity} {donation.unit}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Location:</span>
            <span className="text-neutral-900 dark:text-white">
              {donation.city}, {donation.state}
            </span>
          </div>
        </div>

        <div>
          <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Proposed Logistics Pickup Date
          </label>
          <input
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={proposedDate}
            onChange={(e) => setProposedDate(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Coordination Note for Donor
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
            placeholder="E.g., Vehicle plate number, volunteer coordinator phone number..."
          />
        </div>

        {submitError && (
          <p role="alert" className="text-xs text-red-600">
            {submitError}
          </p>
        )}

        <div className="pt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 font-medium rounded-lg"
          >
            {submitting ? "Submitting Request…" : "Submit Donation Request"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

// 2. Log Distribution Modal
interface DistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  donation: Donation | null;
  onConfirmDistribution: (data: {
    donationId: string;
    donationTitle: string;
    ngoId: string;
    ngoName: string;
    distributionDate: string;
    location: string;
    beneficiariesReached: number;
    proofImageUrl: string;
    impactReport: string;
    notesToDonor: string;
  }) => void;
}

export const DistributionModal: React.FC<DistributionModalProps> = ({
  isOpen,
  onClose,
  donation,
  onConfirmDistribution,
}) => {
  const [distributionDate, setDistributionDate] = useState("2026-09-26");
  const [location, setLocation] = useState("Community Center, Ward 12");
  const [beneficiariesReached, setBeneficiariesReached] = useState(150);
  const [impactReport, setImpactReport] = useState(
    "Supplies directly handed over to families enrolled in our community relief program.",
  );
  const [notesToDonor, setNotesToDonor] = useState(
    "Thank you so much for this vital contribution! Your generosity made a tangible difference.",
  );
  const [proofImage, setProofImage] = useState(
    "/src/assets/images/community_food_aid_1790438468596.jpg",
  );

  if (!donation) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmDistribution({
      donationId: donation.id,
      donationTitle: donation.title,
      ngoId: donation.matchedNgoId || "ngo-1",
      ngoName: donation.matchedNgoName || "Verified NGO",
      distributionDate,
      location,
      beneficiariesReached: Number(beneficiariesReached),
      proofImageUrl: proofImage,
      impactReport,
      notesToDonor,
    });
    onClose();
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Log Beneficiary Distribution"
      subtitle={`Donation #${donation.id}: ${donation.title}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Distribution Date
            </label>
            <input
              type="date"
              required
              value={distributionDate}
              onChange={(e) => setDistributionDate(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Beneficiaries Reached
            </label>
            <input
              type="number"
              min="1"
              required
              value={beneficiariesReached}
              onChange={(e) => setBeneficiariesReached(Number(e.target.value))}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Distribution Location & Ward
          </label>
          <input
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Impact Report & Summary
          </label>
          <textarea
            rows={2}
            required
            value={impactReport}
            onChange={(e) => setImpactReport(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Personalized Note for Donor ({donation.donorName})
          </label>
          <textarea
            rows={2}
            required
            value={notesToDonor}
            onChange={(e) => setNotesToDonor(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Attach Distribution Proof Photo
          </label>
          <div className="flex items-center gap-3">
            <img
              src={proofImage}
              alt="Proof preview"
              className="w-16 h-12 rounded object-cover border border-neutral-200 dark:border-neutral-700"
            />
            <span className="text-[11px] text-neutral-500">
              Verified documentary photo will be added to the donor's live
              tracking timeline.
            </span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg"
          >
            Publish Distribution & Close Loop
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

// 3. NGO Verification Modal (Admin)
interface VerifyNgoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ngo: NGO | null;
  onSetStatus: (
    ngoId: string,
    status: "verified" | "rejected" | "pending" | "under_review",
    reason?: string,
  ) => Promise<void>;
}

export const VerifyNgoModal: React.FC<VerifyNgoModalProps> = ({
  isOpen,
  onClose,
  ngo,
  onSetStatus,
}) => {
  const [reason, setReason] = useState("");
  const [savingStatus, setSavingStatus] = useState<
    "verified" | "rejected" | "under_review" | null
  >(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setErrorMessage("");
      setSavingStatus(null);
    }
  }, [isOpen, ngo?.id]);

  const saveDecision = async (
    status: "verified" | "rejected" | "under_review",
  ) => {
    if (!ngo || savingStatus) return;
    setSavingStatus(status);
    setErrorMessage("");
    try {
      await onSetStatus(ngo.id, status, reason.trim() || undefined);
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not save the verification decision. Please try again.",
      );
    } finally {
      setSavingStatus(null);
    }
  };

  if (!ngo) return null;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={savingStatus ? () => undefined : onClose}
      title="Audit NGO Registration & Compliance"
      subtitle={ngo.name}
    >
      <div className="space-y-4 text-xs">
        <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-2">
          <div className="flex justify-between gap-3">
            <span className="text-neutral-500">Govt Reg Number:</span>
            <span className="font-mono text-neutral-900 dark:text-white font-semibold text-right">
              {ngo.registrationNumber}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-neutral-500">
              Tax Exemption ID (80G/12A):
            </span>
            <span className="font-mono text-neutral-900 dark:text-white font-semibold text-right">
              {ngo.taxExemptId}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-neutral-500">Official Website:</span>
            {ngo.website ? (
              <a
                href={ngo.website}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 hover:underline text-right"
              >
                {ngo.website}
              </a>
            ) : (
              <span className="text-neutral-400">Not provided</span>
            )}
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-neutral-500">Primary Contact:</span>
            <span className="text-neutral-800 dark:text-neutral-200 text-right">
              {ngo.contactEmail}
            </span>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-neutral-900 dark:text-white mb-1">
            Submitted Certifications
          </h4>
          {ngo.certifications.length ? (
            <ul className="list-disc list-inside space-y-0.5 text-neutral-600 dark:text-neutral-400">
              {ngo.certifications.map((cert, i) => (
                <li key={`${cert}-${i}`}>{cert}</li>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-500">No certifications listed.</p>
          )}
        </div>

        <div>
          <label
            htmlFor="ngo-verification-reason"
            className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1"
          >
            Review reason / notes (optional)
          </label>
          <textarea
            id="ngo-verification-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            rows={3}
            disabled={Boolean(savingStatus)}
            placeholder="Record why this NGO was approved, rejected, or needs further review..."
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-2 text-xs text-neutral-900 dark:text-white disabled:opacity-60"
          />
          <div className="text-right text-[10px] text-neutral-400 mt-1">
            {reason.length}/500
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300 p-3"
          >
            {errorMessage}
          </div>
        )}

        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            disabled={Boolean(savingStatus)}
            onClick={() => void saveDecision("rejected")}
            className="px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg font-medium disabled:opacity-50"
          >
            {savingStatus === "rejected" ? "Saving..." : "Reject Application"}
          </button>
          <button
            type="button"
            disabled={Boolean(savingStatus)}
            onClick={() => void saveDecision("under_review")}
            className="px-3 py-1.5 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg font-medium disabled:opacity-50"
          >
            {savingStatus === "under_review"
              ? "Saving..."
              : "Mark Under Review"}
          </button>
          <button
            type="button"
            disabled={Boolean(savingStatus)}
            onClick={() => void saveDecision("verified")}
            className="px-4 py-1.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium disabled:opacity-50"
          >
            {savingStatus === "verified" ? "Saving..." : "Approve & Verify"}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};
