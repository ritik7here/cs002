import React from 'react';
import {
  ArrowLeft,
  Activity,
  Building2,
  Calendar,
  MapPin,
  ShieldCheck,
  Package,
  Download,
  Phone,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusTracker } from '../shared/StatusTracker';

export const DonationDetails: React.FC = () => {
  const { donations, selectedDonationId, setCurrentView, setSelectedDonationId, showToast } = useApp();

  const donation = donations.find(d => d.id === selectedDonationId) || donations[0];

  if (!donation) {
    return (
      <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <p className="text-xs text-neutral-500">No donation selected.</p>
        <button
          onClick={() => setCurrentView('donor-my-donations')}
          className="mt-3 px-3 py-1.5 text-xs text-emerald-600 font-semibold"
        >
          Back to My Donations
        </button>
      </div>
    );
  }

  const handleDownloadReceipt = () => {
    showToast(`Downloading official 80G tax receipt for donation #${donation.id}`, 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentView('donor-my-donations')}
          className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Donations</span>
        </button>

        <div className="flex items-center gap-2">
          {donation.status === 'Distributed' && (
            <button
              onClick={handleDownloadReceipt}
              className="px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tax Exemption Receipt (PDF)</span>
            </button>
          )}

          <button
            onClick={() => {
              setSelectedDonationId(donation.id);
              setCurrentView('donor-tracking');
            }}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Open Live Tracker</span>
          </button>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="border-b border-neutral-100 dark:border-neutral-800 pb-5">
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-neutral-400">ID #{donation.id}</span>
              <span aria-hidden="true">·</span>
              <span>{donation.category}</span>
              <span aria-hidden="true">·</span>
              <span>{donation.condition}</span>
            </div>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {donation.status}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white leading-tight">
            {donation.title}
          </h1>

          {donation.description && (
            <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2 leading-relaxed">
              {donation.description}
            </p>
          )}
        </div>

        {/* 2-Column Specs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Left: Inventory Specifications */}
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-900 dark:text-white uppercase tracking-wider text-[11px]">
              Item & Logistics Parameters
            </h3>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500">Pledged Volume:</span>
                <span className="font-mono tabular-nums font-semibold text-neutral-900 dark:text-white">
                  {donation.quantity} {donation.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Estimated Fair Value:</span>
                <span className="font-mono tabular-nums font-semibold text-neutral-900 dark:text-white">
                  ${donation.estimatedValue || '0'} USD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Urgency Level:</span>
                <span className="font-medium text-amber-700 dark:text-amber-400">
                  {donation.urgency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Pledge Timestamp:</span>
                <span className="text-neutral-700 dark:text-neutral-300">
                  {new Date(donation.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
              <div className="text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Pickup Address
              </div>
              <div className="text-neutral-800 dark:text-neutral-200 leading-relaxed font-medium">
                {donation.pickupAddress}, {donation.city}, {donation.state} - {donation.pincode}
              </div>
            </div>
          </div>

          {/* Right: Assigned Partner NGO */}
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-900 dark:text-white uppercase tracking-wider text-[11px]">
              Allocated Non-Profit Organization
            </h3>

            {donation.matchedNgoName ? (
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-neutral-900 dark:text-white">
                      {donation.matchedNgoName}
                    </div>
                    <div className="text-[11px] text-neutral-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Verified NGO Partner
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Authorized to receive and distribute this aid batch in strict accordance with
                  KindredBridge social audit guidelines.
                </p>

                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex flex-col gap-1 text-[11px] text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-neutral-400" />
                    <span>aid-coordination@kindredbridge.org</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-neutral-400" />
                    <span>+91 98201 54321 (Field Dispatch)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-dashed border-neutral-300 dark:border-neutral-700 text-center space-y-2">
                <Building2 className="w-6 h-6 text-neutral-400 mx-auto" />
                <div className="font-medium text-neutral-800 dark:text-neutral-200">
                  Awaiting NGO Matching
                </div>
                <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                  This donation is visible in the open community exchange. Once claimed by a verified
                  charity, full contact and pickup information will populate here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Embedded Live Status Stepper */}
        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <StatusTracker
            timeline={donation.trackingTimeline}
            currentStatus={donation.status}
            proofPhotos={donation.proofPhotos}
            beneficiaryNotes={donation.beneficiaryNotes}
          />
        </div>
      </div>
    </div>
  );
};
