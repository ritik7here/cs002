import React from "react";
import {
  Layers,
  PlusCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Requirement } from "../../types";

export const ActiveRequirements: React.FC = () => {
  const {
    requirements,
    ngos,
    currentUser,
    setCurrentView,
    fulfillRequirement,
    showToast,
  } = useApp();
  const currentNgo = ngos.find((n) => n.id === currentUser?.organizationId);
  const myRequirements = currentNgo
    ? requirements.filter((r) => r.ngoId === currentNgo.id)
    : [];

  if (!currentNgo) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Your linked NGO organization is not available. Please refresh or
        complete NGO registration first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            Campaign Ledger
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Active Community Requirements
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
            Manage your live material broadcasts, track fulfilled batches, and
            adjust target dates.
          </p>
        </div>

        <button
          onClick={() => setCurrentView("ngo-create-requirement")}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Requirement</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {myRequirements.map((req) => {
          const percent = Math.min(
            100,
            Math.round((req.fulfilledQuantity / req.targetQuantity) * 100),
          );

          return (
            <div
              key={req.id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span>{req.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{req.cause}</span>
                  </div>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {req.urgency}
                  </span>
                </div>

                <h3 className="font-semibold text-neutral-900 dark:text-white text-base mb-1.5">
                  {req.title}
                </h3>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4 line-clamp-3">
                  {req.description}
                </p>

                {/* Progress Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">
                      Fulfilled{" "}
                      <strong className="font-mono tabular-nums text-neutral-900 dark:text-white">
                        {req.fulfilledQuantity}
                      </strong>{" "}
                      of {req.targetQuantity} {req.unit}
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-blue-600 dark:text-blue-400">
                      {percent}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="text-xs text-neutral-500 flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Needed by {req.neededByDate}</span>
                  </div>
                  <span>Beneficiaries: {req.beneficiaryGroup}</span>
                </div>
              </div>

              {/* Action Strip */}
              <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {req.status}
                </span>

                {req.status !== "Fulfilled" && (
                  <button
                    onClick={() => {
                      void fulfillRequirement(req.id, 25).catch((error) => {
                        console.error(
                          "Failed to update requirement fulfillment:",
                          error,
                        );
                        showToast(
                          error instanceof Error
                            ? error.message
                            : "Could not update fulfillment.",
                          "error",
                        );
                      });
                    }}
                    className="px-3 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    + Log 25 Received
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
