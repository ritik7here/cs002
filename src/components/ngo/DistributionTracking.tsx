import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, RefreshCw } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { donationsApi } from "../../api/donations";
import type { Donation } from "../../types";
import {
  distributionsApi,
  type DistributionRecord,
} from "../../api/distributions";

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950";
const labelClass =
  "block space-y-1 text-sm font-medium text-neutral-700 dark:text-neutral-300";

export const DistributionTracking: React.FC = () => {
  const { currentUser, showToast } = useApp();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [records, setRecords] = useState<DistributionRecord[]>([]);
  const [selectedDonationId, setSelectedDonationId] = useState("");
  const [distributionDate, setDistributionDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [quantity, setQuantity] = useState(1);
  const [beneficiaries, setBeneficiaries] = useState(0);
  const [location, setLocation] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [impactReport, setImpactReport] = useState("");
  const [notesToDonor, setNotesToDonor] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isNgo = currentUser?.role === "ngo";
  const isAdmin = currentUser?.role === "admin";
  const canRecord = Boolean(isNgo || isAdmin);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError("");
    try {
      const recordResult = await distributionsApi.listMine();
      setRecords(recordResult);
      if (isNgo) {
        const donationResult = await donationsApi.listForNGO();
        setDonations(donationResult);
        setSelectedDonationId((current) => {
          const eligible = donationResult.filter(
            (d) => d.status === "Received by NGO" || d.status === "In Transit",
          );
          if (
            current &&
            eligible.some(
              (d) => d.id === current && d.status === "Received by NGO",
            )
          )
            return current;
          return (
            eligible.find((d) => d.status === "Received by NGO")?.id ||
            eligible.find((d) => d.status === "In Transit")?.id ||
            ""
          );
        });
      } else {
        setDonations([]);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not load distribution records.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [currentUser, isNgo]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedDonation = useMemo(
    () => donations.find((d) => d.id === selectedDonationId),
    [donations, selectedDonationId],
  );
  const distributionTotal = useMemo(
    () =>
      records
        .filter((r) => r.donation_id === selectedDonationId)
        .reduce((sum, r) => sum + r.quantity_distributed, 0),
    [records, selectedDonationId],
  );
  const remaining = selectedDonation
    ? Math.max(0, selectedDonation.quantity - distributionTotal)
    : 0;

  const handleReceive = async (donation: Donation) => {
    setSaving(true);
    setError("");
    try {
      await distributionsApi.confirmReceived(donation.id);
      showToast("Donation receipt confirmed and saved.", "success");
      await loadData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not confirm receipt.";
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedDonation) return;
    setSaving(true);
    setError("");
    try {
      await distributionsApi.create({
        donation_id: selectedDonation.id,
        distribution_date: distributionDate,
        quantity_distributed: quantity,
        location: location.trim(),
        beneficiaries_reached: beneficiaries,
        proof_image_url: proofUrl.trim() || undefined,
        impact_report: impactReport.trim(),
        notes_to_donor: notesToDonor.trim(),
      });
      showToast("Distribution record saved.", "success");
      setImpactReport("");
      setNotesToDonor("");
      setProofUrl("");
      await loadData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save distribution.";
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
          Proof of distribution
        </p>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Distribution Tracking
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Confirm receipt, record actual quantities distributed, and retain an
          auditable impact history.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
        >
          {error}
        </div>
      )}

      {isNgo && (
        <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="font-semibold">Incoming donations</h2>
          {loading ? (
            <p className="text-sm text-neutral-500">Loading donations…</p>
          ) : donations.filter(
              (d) =>
                d.status === "In Transit" || d.status === "Received by NGO",
            ).length === 0 ? (
            <p className="text-sm text-neutral-500">
              No donations awaiting receipt or distribution.
            </p>
          ) : (
            donations
              .filter(
                (d) =>
                  d.status === "In Transit" || d.status === "Received by NGO",
              )
              .map((donation) => (
                <div
                  key={donation.id}
                  className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800"
                >
                  <div>
                    <p className="font-medium">{donation.title}</p>
                    <p className="text-xs text-neutral-500">
                      {donation.quantity} {donation.unit} · {donation.status}
                    </p>
                  </div>
                  {donation.status === "In Transit" && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleReceive(donation)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      <CheckCircle2 size={15} />{" "}
                      {saving ? "Saving…" : "Confirm received"}
                    </button>
                  )}
                  {donation.status === "Received by NGO" && (
                    <button
                      type="button"
                      onClick={() => setSelectedDonationId(donation.id)}
                      className="rounded-lg border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                    >
                      Record distribution
                    </button>
                  )}
                </div>
              ))
          )}
        </section>
      )}

      {isNgo && (
        <section className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 font-semibold">Record a distribution event</h2>
          {donations.filter((d) => d.status === "Received by NGO").length ===
          0 ? (
            <p className="text-sm text-neutral-500">
              Confirm receipt of an incoming donation before recording a
              distribution.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className={labelClass}>
                Donation
                <select
                  className={inputClass}
                  value={selectedDonationId}
                  onChange={(e) => setSelectedDonationId(e.target.value)}
                  required
                >
                  {donations
                    .filter((d) => d.status === "Received by NGO")
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} — {d.quantity} {d.unit}
                      </option>
                    ))}
                </select>
              </label>
              {selectedDonation && (
                <p className="text-xs text-neutral-500">
                  Already distributed: {distributionTotal}{" "}
                  {selectedDonation.unit}; remaining: {remaining}{" "}
                  {selectedDonation.unit}.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  Distribution date
                  <input
                    className={inputClass}
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={distributionDate}
                    onChange={(e) => setDistributionDate(e.target.value)}
                    required
                  />
                </label>
                <label className={labelClass}>
                  Quantity distributed
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    max={remaining || undefined}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    required
                  />
                </label>
                <label className={labelClass}>
                  Beneficiaries reached
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    value={beneficiaries}
                    onChange={(e) => setBeneficiaries(Number(e.target.value))}
                    required
                  />
                </label>
                <label className={labelClass}>
                  Distribution location
                  <input
                    className={inputClass}
                    minLength={2}
                    maxLength={300}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    placeholder="Community center / ward"
                  />
                </label>
              </div>
              <label className={labelClass}>
                Evidence image URL (optional)
                <input
                  className={inputClass}
                  type="url"
                  maxLength={2000}
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://…"
                />
              </label>
              <label className={labelClass}>
                Impact summary
                <textarea
                  className={inputClass}
                  rows={3}
                  minLength={3}
                  maxLength={5000}
                  value={impactReport}
                  onChange={(e) => setImpactReport(e.target.value)}
                  required
                  placeholder="Describe what was distributed and how delivery was verified."
                />
              </label>
              <label className={labelClass}>
                Message to donor (optional)
                <textarea
                  className={inputClass}
                  rows={2}
                  maxLength={3000}
                  value={notesToDonor}
                  onChange={(e) => setNotesToDonor(e.target.value)}
                  placeholder="Thank the donor or share a concise update."
                />
              </label>
              <button
                type="submit"
                disabled={
                  saving ||
                  !selectedDonation ||
                  quantity < 1 ||
                  quantity > remaining ||
                  !location.trim() ||
                  impactReport.trim().length < 3
                }
                className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save distribution record"}
              </button>
            </form>
          )}
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Distribution history</h2>
            <p className="text-xs text-neutral-500">
              Records are loaded from the backend and persist across sessions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading || saving}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold disabled:opacity-50 dark:border-neutral-800"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{" "}
            Refresh
          </button>
        </div>
        {loading ? (
          <p className="rounded-xl border border-neutral-200 p-5 text-sm text-neutral-500">
            Loading distribution history…
          </p>
        ) : records.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
            No distribution records yet.
          </div>
        ) : (
          records.map((record) => (
            <article
              key={record.id}
              className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex flex-col justify-between gap-2 sm:flex-row">
                <div>
                  <h3 className="font-semibold">
                    {record.donation_title || "Donation distribution"}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {record.ngo_name ? `NGO: ${record.ngo_name} · ` : ""}
                    {record.donor_name ? `Donor: ${record.donor_name} · ` : ""}
                    {formatDate(record.distribution_date)}
                  </p>
                </div>
                <span className="self-start rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  {record.quantity_distributed}{" "}
                  {record.donation_unit || "units"} distributed
                </span>
              </div>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                {record.impact_report}
              </p>
              <p className="text-xs text-neutral-500">
                {record.beneficiaries_reached} beneficiaries · {record.location}
              </p>
              {record.proof_image_url && (
                <a
                  href={record.proof_image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-blue-600 underline dark:text-blue-400"
                >
                  View evidence
                </a>
              )}
              {record.notes_to_donor && (
                <p className="rounded-lg bg-neutral-50 p-3 text-sm dark:bg-neutral-800/60">
                  {record.notes_to_donor}
                </p>
              )}
            </article>
          ))
        )}
      </section>
      {!canRecord && (
        <p className="text-xs text-neutral-500">
          This view is read-only. Only the assigned NGO or an administrator can
          confirm receipt or record distributions.
        </p>
      )}
      <div className="flex items-center gap-2 text-xs text-neutral-400">
        <ClipboardList size={14} /> Distribution entries are auditable records;
        photos are referenced by URL and are not uploaded by this form.
      </div>
    </div>
  );
};
