import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Package,
  Building2,
  Heart,
  Layers,
  MapPin,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { StatCard } from "../shared/Cards";
import {
  distributionsApi,
  type DistributionRecord,
} from "../../api/distributions";

const barColors = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-cyan-500",
  "bg-rose-500",
  "bg-teal-500",
];

const monthKey = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const SystemAnalytics: React.FC = () => {
  const { currentUser, donations, ngos, requirements } = useApp();
  const [distributionRecords, setDistributionRecords] = useState<
    DistributionRecord[] | null
  >(null);
  const [distributionError, setDistributionError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDistributionRecords(null);
    setDistributionError(false);
    if (!currentUser || currentUser.role !== "admin") {
      setDistributionError(true);
      return () => {
        cancelled = true;
      };
    }
    distributionsApi
      .listMine()
      .then((records) => {
        if (!cancelled) setDistributionRecords(records);
      })
      .catch((error) => {
        console.error("Failed to load live distribution analytics:", error);
        if (!cancelled) setDistributionError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.role]);

  const totalBeneficiaries = (distributionRecords || []).reduce(
    (sum, record) => sum + (record.beneficiaries_reached || 0),
    0,
  );
  const distributedDonations = donations.filter(
    (donation) => donation.status === "Distributed",
  ).length;
  const fulfillmentRate = donations.length
    ? Math.round((distributedDonations / donations.length) * 100)
    : 0;
  const openRequirements = requirements.filter(
    (requirement) =>
      requirement.status === "Open" ||
      requirement.status === "Partially Fulfilled",
  ).length;

  const categories = useMemo(() => {
    const counts = donations.reduce<Record<string, number>>((acc, donation) => {
      const name = donation.category || "Uncategorized";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        pct: donations.length
          ? Math.round((count / donations.length) * 100)
          : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [donations]);

  const monthlyGrowth = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return {
        key,
        month: date.toLocaleDateString(undefined, { month: "short" }),
        pledged: donations.filter(
          (donation) => monthKey(donation.createdAt) === key,
        ).length,
        distributed: (distributionRecords || []).filter(
          (record) => monthKey(record.distribution_date) === key,
        ).length,
      };
    });
  }, [donations, distributionRecords]);

  const regionalReach = useMemo(() => {
    const locations = new Map<
      string,
      { events: number; beneficiaries: number }
    >();
    (distributionRecords || []).forEach((record) => {
      const city = record.location?.trim() || "Location not specified";
      const current = locations.get(city) || { events: 0, beneficiaries: 0 };
      current.events += 1;
      current.beneficiaries += record.beneficiaries_reached || 0;
      locations.set(city, current);
    });
    return Array.from(locations.entries())
      .map(([location, values]) => ({ location, ...values }))
      .sort((a, b) => b.beneficiaries - a.beneficiaries)
      .slice(0, 8);
  }, [distributionRecords]);

  const distributionMetric = distributionError
    ? "Unavailable"
    : distributionRecords === null
      ? "Loading…"
      : distributionRecords.length.toLocaleString();
  const beneficiaryMetric = distributionError
    ? "Unavailable"
    : distributionRecords === null
      ? "Loading…"
      : totalBeneficiaries.toLocaleString();

  return (
    <div className="space-y-8">
      <header>
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
          Operational Intelligence
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          System Analytics &amp; Impact Metrics
        </h1>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          Live summaries calculated from donations, NGO records, requirements,
          and saved distribution reports.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Donations"
          value={donations.length}
          subtext="Live donation records"
          icon={Package}
        />
        <StatCard
          label="Verified NGOs"
          value={ngos.filter((ngo) => ngo.verified).length}
          subtext="Current verification status"
          icon={Building2}
        />
        <StatCard
          label="Open Community Needs"
          value={openRequirements}
          subtext="Open or partially fulfilled"
          icon={Layers}
        />
        <StatCard
          label="Reported Beneficiary Reach"
          value={beneficiaryMetric}
          subtext="Sum of saved distribution reports"
          icon={Heart}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-7">
          <div className="border-b border-neutral-100 pb-3 dark:border-neutral-800">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Donation Categories
            </h2>
            <p className="text-xs text-neutral-500">
              Counts and share of current live donation records
            </p>
          </div>
          {categories.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-500">
              No donation records are available yet.
            </p>
          ) : (
            <div className="space-y-4">
              {categories.map((category, index) => (
                <div key={category.name} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      {category.name}
                    </span>
                    <span className="shrink-0 font-mono tabular-nums text-neutral-500">
                      {category.count} ({category.pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <div
                      className={`h-full rounded-full ${barColors[index % barColors.length]}`}
                      style={{ width: `${category.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-5">
          <div className="border-b border-neutral-100 pb-3 dark:border-neutral-800">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Monthly Activity
            </h2>
            <p className="text-xs text-neutral-500">
              Donation records created vs. saved distribution events
            </p>
          </div>
          {distributionError ? (
            <p
              role="status"
              className="py-8 text-center text-sm text-amber-700 dark:text-amber-300"
            >
              Distribution analytics could not be loaded.
            </p>
          ) : distributionRecords === null ? (
            <p className="py-8 text-center text-sm text-neutral-500">
              Loading distribution analytics…
            </p>
          ) : (
            <>
              <div className="flex h-56 items-end justify-between gap-3 px-2 pt-4">
                {monthlyGrowth.map((item) => {
                  const maxVal = Math.max(
                    1,
                    ...monthlyGrowth.flatMap((month) => [
                      month.pledged,
                      month.distributed,
                    ]),
                  );
                  const pledgeHeight = Math.round(
                    (item.pledged / maxVal) * 100,
                  );
                  const distHeight = Math.round(
                    (item.distributed / maxVal) * 100,
                  );
                  return (
                    <div
                      key={item.key}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      <div className="flex h-40 w-full items-end justify-center gap-1">
                        <div
                          className="w-1/2 rounded-t bg-neutral-300 dark:bg-neutral-700"
                          style={{ height: `${pledgeHeight}%` }}
                          title={`Donations created: ${item.pledged}`}
                        />
                        <div
                          className="w-1/2 rounded-t bg-emerald-500"
                          style={{ height: `${distHeight}%` }}
                          title={`Distribution events: ${item.distributed}`}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-medium text-neutral-500">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-6 border-t border-neutral-100 pt-3 text-[11px] text-neutral-500 dark:border-neutral-800">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-neutral-300 dark:bg-neutral-700" />
                  Donations created
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" />
                  Distribution events
                </span>
              </div>
            </>
          )}
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-neutral-100 p-4 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Recorded Distribution Reach by Location
          </h2>
          <p className="text-xs text-neutral-500">
            Grouped from actual saved distribution records; locations are
            entered by NGOs.
          </p>
        </div>
        {distributionError ? (
          <p
            role="status"
            className="p-6 text-center text-sm text-amber-700 dark:text-amber-300"
          >
            Distribution records could not be loaded. Refresh to retry.
          </p>
        ) : distributionRecords === null ? (
          <p className="p-6 text-center text-sm text-neutral-500">
            Loading distribution records…
          </p>
        ) : regionalReach.length === 0 ? (
          <p className="p-6 text-center text-sm text-neutral-500">
            No distribution events have been recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/70 font-medium text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/40">
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={13} />
                      Distribution location
                    </span>
                  </th>
                  <th className="px-4 py-3">Distribution events</th>
                  <th className="px-4 py-3 text-right">
                    Beneficiaries reached
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {regionalReach.map((region) => (
                  <tr
                    key={region.location}
                    className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40"
                  >
                    <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">
                      {region.location}
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-300">
                      {region.events}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {region.beneficiaries.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Donation Fulfillment Rate"
          value={donations.length ? `${fulfillmentRate}%` : "—"}
          subtext={`${distributedDonations} of ${donations.length} donations marked Distributed`}
          icon={BarChart3}
        />
        <StatCard
          label="Distribution Events"
          value={distributionMetric}
          subtext="Persisted event records"
          icon={Package}
        />
      </div>
    </div>
  );
};
