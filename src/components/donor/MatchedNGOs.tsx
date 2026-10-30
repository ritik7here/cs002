import React, { useEffect, useState } from "react";
import {
  HeartHandshake,
  Sparkles,
  Building2,
  MapPin,
  ShieldCheck,
  Package,
  RefreshCw,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import {
  donationMatchesApi,
  type DonationMatchRecommendation,
} from "../../api/donationMatches";

export const MatchedNGOs: React.FC = () => {
  const { currentUser, setCurrentView, setSelectedDonationId } = useApp();
  const [matches, setMatches] = useState<DonationMatchRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    donationMatchesApi
      .listRecommendations()
      .then((items) => {
        if (active) setMatches(items);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Could not load donation matches.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [currentUser?.id]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
          Transparent matching
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Donation Matches
        </h1>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 max-w-3xl">
          Recommendations compare your submitted donations with open
          requirements from verified NGOs. Category is required; city, state,
          urgency, and quantity compatibility contribute to the score. A
          recommendation does not reserve or assign a donation.
        </p>
      </div>

      {loading && (
        <div className="p-8 text-center text-sm text-neutral-500">
          Finding suitable requirements for your donations…
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {!loading && !error && matches.length === 0 && (
        <div className="p-10 text-center rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <HeartHandshake className="w-9 h-9 text-neutral-400 mx-auto mb-3" />
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            No donation matches yet
          </h3>
          <p className="text-sm text-neutral-500 mt-2 max-w-xl mx-auto">
            Matches appear when you have a Submitted donation whose category
            matches an open requirement from a verified NGO. Existing matched,
            cancelled, or completed donations are excluded.
          </p>
          <button
            onClick={() => setCurrentView("donor-create-donation")}
            className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
          >
            Create a donation
          </button>
        </div>
      )}

      {!loading && !error && matches.length > 0 && (
        <div className="space-y-4">
          {matches.map((match) => {
            const req = match.requirement;
            const donation = match.donation;
            const remaining = Math.max(
              0,
              req.target_quantity - req.fulfilled_quantity,
            );
            return (
              <article
                key={`${donation.id}-${req.id}`}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      {match.score}% match
                    </span>
                    <span className="text-neutral-400">·</span>
                    <span className="text-neutral-500">
                      {donation.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">
                    {req.title}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    {req.description ||
                      "No additional requirement details provided."}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                    <span className="inline-flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
                      <Building2 className="w-3.5 h-3.5" />
                      {req.ngo_name}
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    </span>
                    {req.ngo_city && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {req.ngo_city}
                      </span>
                    )}
                    <span>
                      Need: {remaining} {req.unit} remaining
                    </span>
                  </div>
                  <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800/70 px-3 py-2 text-[11px] text-neutral-600 dark:text-neutral-300">
                    <span className="font-semibold">Why it matches: </span>
                    {match.reasons.join(" · ")}
                  </div>
                </div>
                <div className="w-full md:w-60 shrink-0 border-t md:border-t-0 md:border-l border-neutral-100 dark:border-neutral-800 pt-4 md:pt-0 md:pl-5 space-y-3">
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 mt-0.5 text-neutral-400" />
                    <div>
                      <div className="text-[10px] text-neutral-500">
                        Your donation
                      </div>
                      <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {donation.title}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {donation.quantity} {donation.unit} · {donation.city},{" "}
                        {donation.state}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDonationId(donation.id);
                      setCurrentView("donor-my-donations");
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    View my donation
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
