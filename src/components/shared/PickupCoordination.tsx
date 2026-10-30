import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  PackageCheck,
  RefreshCw,
  Truck,
  XCircle,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { pickupsApi, PickupRecord, PickupStatus } from "../../api/pickups";
import { donationRequestsApi } from "../../api/donationRequests";
import { Donation } from "../../types";

const statusLabel: Record<PickupStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  picked_up: "Picked up · In transit",
  cancelled: "Cancelled",
};

function toLocalInputValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export const PickupCoordination: React.FC = () => {
  const { currentUser, donations, updateDonationStatus, showToast } = useApp();
  const [pickups, setPickups] = useState<PickupRecord[]>([]);
  const [acceptedDonationIds, setAcceptedDonationIds] = useState<string[]>([]);
  const [selectedDonationId, setSelectedDonationId] = useState("");
  const [scheduledDate, setScheduledDate] = useState(() =>
    toLocalInputValue(new Date(Date.now() + 86400000)),
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const eligibleDonations = useMemo(
    () =>
      donations.filter(
        (donation) =>
          (donation.status === "Matched" ||
            donation.status === "Pickup Scheduled") &&
          (currentUser?.role !== "ngo" ||
            acceptedDonationIds.includes(donation.id)),
      ),
    [donations, currentUser?.role, acceptedDonationIds],
  );

  const loadPickups = async () => {
    setLoading(true);
    setError("");
    try {
      setPickups(await pickupsApi.listMine());
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not load pickup records.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPickups();
    if (currentUser?.role === "ngo") {
      donationRequestsApi
        .listMine()
        .then((requests) =>
          setAcceptedDonationIds(
            requests
              .filter((request) => request.status === "accepted")
              .map((request) => request.donation_id),
          ),
        )
        .catch((err) =>
          setError(
            err instanceof Error
              ? err.message
              : "Could not load accepted donation requests.",
          ),
        );
    } else {
      setAcceptedDonationIds([]);
    }
    // Reload when the authenticated account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.role]);

  const handleSchedule = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedDonationId || !scheduledDate) {
      setError("Choose a matched donation and pickup date/time.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const selected = donations.find((item) => item.id === selectedDonationId);
      await pickupsApi.schedule({
        donation_id: selectedDonationId,
        scheduled_date: new Date(scheduledDate).toISOString(),
        notes: notes.trim(),
      });
      if (selected && selected.status !== "Pickup Scheduled") {
        await updateDonationStatus(
          selected.id,
          "Pickup Scheduled",
          "Pickup scheduled and saved.",
        );
      }
      setNotes("");
      showToast("Pickup schedule saved.", "success");
      await loadPickups();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not schedule pickup.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (
    pickup: PickupRecord,
    nextStatus: PickupStatus,
  ) => {
    setSaving(true);
    setError("");
    try {
      const updated = await pickupsApi.updateStatus(pickup.id, nextStatus);
      setPickups((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      const donation = donations.find((item) => item.id === pickup.donation_id);
      if (donation && nextStatus === "picked_up") {
        await updateDonationStatus(
          donation.id,
          "In Transit",
          "Pickup handoff recorded.",
        );
      } else if (
        donation &&
        nextStatus === "cancelled" &&
        donation.status === "Pickup Scheduled"
      ) {
        await updateDonationStatus(
          donation.id,
          "Matched",
          "Pickup cancelled; donation remains matched.",
        );
      }
      showToast(
        `Pickup status updated to ${statusLabel[nextStatus]}.`,
        "success",
      );
      await loadPickups();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update pickup status.",
      );
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value?: string | null) =>
    value
      ? new Date(value).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "Not scheduled";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600">
          <Truck className="h-4 w-4" /> Fulfillment logistics
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Pickup Coordination
        </h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Schedule collections with the matched donor or NGO, confirm the
          handoff, and keep pickup progress synchronized with the donation
          record.
        </p>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        >
          {error}
        </p>
      )}

      <form
        onSubmit={handleSchedule}
        className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-amber-600" />
          <h2 className="font-semibold">Schedule or reschedule a pickup</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Matched donation</span>
            <select
              value={selectedDonationId}
              onChange={(event) => setSelectedDonationId(event.target.value)}
              required
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            >
              <option value="">Select a donation</option>
              {eligibleDonations.map((donation: Donation) => (
                <option key={donation.id} value={donation.id}>
                  {donation.title} · {donation.city} · {donation.status}
                </option>
              ))}
            </select>
            {eligibleDonations.length === 0 && (
              <span className="block text-xs text-neutral-500">
                No matched donations are currently available to schedule.
              </span>
            )}
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Pickup date and time</span>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(event) => setScheduledDate(event.target.value)}
              required
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Coordination notes (optional)</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={2000}
            rows={2}
            placeholder="Pickup window, contact arrangement, vehicle/access details…"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
          />
        </label>
        <button
          type="submit"
          disabled={saving || eligibleDonations.length === 0}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save pickup schedule"}
        </button>
      </form>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Pickup records</h2>
            <p className="text-xs text-neutral-500">
              Only pickups connected to your own donations or your assigned NGO
              are shown.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadPickups()}
            disabled={loading || saving}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />{" "}
            Refresh
          </button>
        </div>
        {loading ? (
          <p className="rounded-xl border border-neutral-200 p-5 text-sm text-neutral-500 dark:border-neutral-800">
            Loading pickup records…
          </p>
        ) : pickups.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
            No pickup has been scheduled yet. Once a donation is accepted,
            schedule its collection above.
          </div>
        ) : (
          pickups.map((pickup) => (
            <article
              key={pickup.id}
              className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0 space-y-1">
                  <h3 className="font-semibold text-neutral-900 dark:text-white">
                    {pickup.donation_title || "Donation pickup"}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {pickup.donation_city || "Location not listed"}
                    {pickup.ngo_name ? ` · NGO: ${pickup.ngo_name}` : ""}
                    {pickup.donor_name ? ` · Donor: ${pickup.donor_name}` : ""}
                  </p>
                  <p className="flex items-center gap-1.5 text-sm text-neutral-700 dark:text-neutral-300">
                    <Clock3 className="h-4 w-4 text-amber-600" />{" "}
                    {formatDate(pickup.scheduled_date)}
                  </p>
                  {pickup.notes && (
                    <p className="whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-400">
                      {pickup.notes}
                    </p>
                  )}
                  {pickup.picked_up_at && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      Handoff recorded: {formatDate(pickup.picked_up_at)}
                    </p>
                  )}
                </div>
                <span
                  className={`self-start rounded-full px-2.5 py-1 text-xs font-semibold ${pickup.status === "picked_up" ? "bg-emerald-100 text-emerald-800" : pickup.status === "cancelled" ? "bg-red-100 text-red-800" : pickup.status === "confirmed" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}
                >
                  {statusLabel[pickup.status]}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                {pickup.status === "scheduled" && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleStatus(pickup, "confirmed")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Confirm pickup
                  </button>
                )}
                {pickup.status === "confirmed" && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleStatus(pickup, "picked_up")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    <PackageCheck className="h-3.5 w-3.5" /> Record handoff /
                    picked up
                  </button>
                )}
                {(pickup.status === "scheduled" ||
                  pickup.status === "confirmed") && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleStatus(pickup, "cancelled")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Cancel pickup
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
};
