import React, { useState } from 'react';
import { Layers, Search, Building2, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const RequirementManagement: React.FC = () => {
  const { requirements } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = requirements.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.ngoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
          Demand Moderation
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Community Requirement Moderation
        </h1>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
          Audit field needs broadcasted by verified NGOs and prevent duplicate aid requests.
        </p>
      </div>

      {/* Search Input */}
      <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search requirement titles, NGO names, or material categories..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 text-neutral-500 font-medium">
                <th className="px-4 py-3">Requirement Title</th>
                <th className="px-4 py-3">Originating NGO</th>
                <th className="px-4 py-3">Fulfillment Progress</th>
                <th className="px-4 py-3">Urgency</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Target Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filtered.map(req => {
                const pct = Math.min(100, Math.round((req.fulfilledQuantity / req.targetQuantity) * 100));
                return (
                  <tr key={req.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-neutral-900 dark:text-white">
                        {req.title}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {req.category} · {req.cause}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-800 dark:text-neutral-200">
                        {req.ngoName}
                      </div>
                      <div className="text-[11px] text-neutral-500">{req.ngoCity}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="font-mono tabular-nums text-neutral-500">
                          {req.fulfilledQuantity}/{req.targetQuantity}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-amber-700 dark:text-amber-400">
                      {req.urgency}
                    </td>
                    <td className="px-4 py-3 font-semibold text-neutral-800 dark:text-neutral-200">
                      {req.status}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-neutral-500">
                      {req.neededByDate}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
