import React from "react";
import {
  Check,
  Clock,
  Truck,
  Building2,
  Package,
  HeartHandshake,
  MapPin,
} from "lucide-react";
import {
  TimelineEvent,
  DonationStatus,
  DonationStatusHistoryEvent,
} from "../../types";

interface StatusTrackerProps {
  timeline: TimelineEvent[];
  currentStatus: DonationStatus;
  proofPhotos?: string[];
  beneficiaryNotes?: string;
  statusHistory?: DonationStatusHistoryEvent[];
}

export const StatusTracker: React.FC<StatusTrackerProps> = ({
  timeline,
  currentStatus,
  proofPhotos,
  beneficiaryNotes,
  statusHistory = [],
}) => {
  const getStepIcon = (stepName: string, isCompleted: boolean) => {
    if (isCompleted) {
      return <Check className="w-4 h-4 text-white" />;
    }
    switch (stepName) {
      case "Submitted":
        return <Package className="w-4 h-4 text-neutral-400" />;
      case "Matched":
        return <HeartHandshake className="w-4 h-4 text-neutral-400" />;
      case "Pickup Scheduled":
      case "In Transit":
        return <Truck className="w-4 h-4 text-neutral-400" />;
      case "Received by NGO":
        return <Building2 className="w-4 h-4 text-neutral-400" />;
      case "Distributed":
        return <MapPin className="w-4 h-4 text-neutral-400" />;
      default:
        return <Clock className="w-4 h-4 text-neutral-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <h4 className="text-base font-semibold text-neutral-900 dark:text-white">
            Live Fulfillment Tracker
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Real-time auditable verification from pledge to beneficiary handover
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-neutral-400">Current Milestone</span>
          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {currentStatus}
          </div>
        </div>
      </div>

      {/* Stepper Timeline */}
      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200 dark:before:bg-neutral-800">
        {timeline.map((event, index) => {
          const isDone = event.completed;
          const isCurrent =
            !isDone && (index === 0 || timeline[index - 1]?.completed);

          return (
            <div
              key={`${event.step}-${index}`}
              className="relative flex items-start gap-4"
            >
              {/* Stepper Icon Node */}
              <div
                className={`absolute -left-6 sm:-left-8 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isDone
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                    : isCurrent
                      ? "bg-white dark:bg-neutral-900 border-amber-500 text-amber-500 animate-pulse"
                      : "bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-400"
                }`}
              >
                {getStepIcon(event.step, isDone)}
              </div>

              {/* Event Content */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-1">
                  <h5
                    className={`text-sm font-semibold ${
                      isDone
                        ? "text-neutral-900 dark:text-white"
                        : isCurrent
                          ? "text-amber-700 dark:text-amber-400 font-bold"
                          : "text-neutral-400 dark:text-neutral-500"
                    }`}
                  >
                    {event.title}
                  </h5>
                  <span className="text-xs font-mono text-neutral-400">
                    {event.timestamp}
                  </span>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-1.5">
                  {event.description}
                </p>

                {(event.actor || event.location) && (
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                    {event.actor && (
                      <span>
                        Handled by:{" "}
                        <strong className="font-medium text-neutral-700 dark:text-neutral-300">
                          {event.actor}
                        </strong>
                      </span>
                    )}
                    {event.actor && event.location && (
                      <span aria-hidden="true">·</span>
                    )}
                    {event.location && <span>Location: {event.location}</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <section
        className="mt-8 border-t border-neutral-100 pt-6 dark:border-neutral-800"
        aria-labelledby="status-history-heading"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h5
            id="status-history-heading"
            className="text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-white"
          >
            Recorded Status History
          </h5>
          <span className="text-[11px] text-neutral-500">
            Saved transition timestamps
          </span>
        </div>
        {statusHistory.length === 0 ? (
          <p className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600 dark:bg-neutral-950 dark:text-neutral-400">
            No persisted status transitions are available yet. Earlier
            transitions made before status history was enabled cannot be
            assigned reliable timestamps.
          </p>
        ) : (
          <ol className="space-y-3">
            {statusHistory.map((event, index) => (
              <li
                key={`${event.changedAt}-${index}`}
                className="flex flex-col gap-1 rounded-lg border border-neutral-100 p-3 dark:border-neutral-800 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <p className="text-xs font-medium text-neutral-900 dark:text-white">
                    {event.fromStatus
                      ? `${event.fromStatus} → ${event.toStatus}`
                      : `Donation created: ${event.toStatus}`}
                  </p>
                  <p className="mt-0.5 text-[11px] text-neutral-500">
                    Recorded by the system when the saved status changed.
                  </p>
                </div>
                <time
                  dateTime={event.changedAt}
                  className="shrink-0 text-[11px] font-mono text-neutral-500"
                >
                  {new Date(event.changedAt).toLocaleString()}
                </time>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Proof of Distribution section if available */}
      {(proofPhotos && proofPhotos.length > 0) || beneficiaryNotes ? (
        <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
              Beneficiary Distribution Verification
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Verified by Field Auditor
            </span>
          </div>

          {beneficiaryNotes && (
            <div className="p-4 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs text-neutral-700 dark:text-neutral-300 mb-4 leading-relaxed">
              <strong className="block text-emerald-800 dark:text-emerald-300 font-medium mb-1">
                Field Coordinator Note:
              </strong>
              {beneficiaryNotes}
            </div>
          )}

          {proofPhotos && proofPhotos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {proofPhotos.map((url, idx) => (
                <div
                  key={idx}
                  className="rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 aspect-video relative group"
                >
                  <img
                    src={url}
                    alt={`Distribution proof ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                    Verified Field Proof
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
