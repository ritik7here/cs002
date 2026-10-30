import React from 'react';
import {
  TrendingUp,
  MapPin,
  Calendar,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Package,
  Layers,
  Heart,
} from 'lucide-react';
import { Donation, NGO, Requirement } from '../../types';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  subtext?: string;
  icon?: React.ElementType;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  subtext,
  icon: Icon,
}) => {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
      <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2 text-xs font-medium">
        <span>{label}</span>
        {Icon && <Icon className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />}
      </div>
      <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white tracking-tight">
        {value}
      </div>
      {(change || subtext) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          {change && (
            <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingUp className="w-3 h-3" />
              {change}
            </span>
          )}
          {change && subtext && <span aria-hidden="true">·</span>}
          {subtext && <span>{subtext}</span>}
        </div>
      )}
    </div>
  );
};

interface DonationCardProps {
  donation: Donation;
  onViewDetails?: (donation: Donation) => void;
  onTrack?: (donation: Donation) => void;
}

export const DonationCard: React.FC<DonationCardProps> = ({
  donation,
  onViewDetails,
  onTrack,
}) => {
  const getStatusColor = (status: Donation['status']) => {
    switch (status) {
      case 'Distributed':
        return 'text-emerald-700 dark:text-emerald-400';
      case 'Received by NGO':
        return 'text-blue-700 dark:text-blue-400';
      case 'In Transit':
      case 'Pickup Scheduled':
        return 'text-amber-700 dark:text-amber-400';
      case 'Matched':
        return 'text-indigo-700 dark:text-indigo-400';
      case 'Submitted':
        return 'text-neutral-600 dark:text-neutral-400';
      default:
        return 'text-neutral-500';
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors flex flex-col justify-between">
      <div>
        {/* Unboxed clean metadata header */}
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
          <div className="flex items-center gap-1.5">
            <span>{donation.category}</span>
            <span aria-hidden="true">·</span>
            <span>{donation.condition}</span>
          </div>
          <span className={`font-medium flex items-center gap-1 ${getStatusColor(donation.status)}`}>
            {donation.status === 'Distributed' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )}
            {donation.status}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-neutral-900 dark:text-white text-base leading-snug mb-2 line-clamp-2">
          {donation.title}
        </h3>

        {/* Quantity & Location */}
        <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1 mb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono tabular-nums font-semibold text-neutral-800 dark:text-neutral-200">
              {donation.quantity} {donation.unit}
            </span>
            {donation.estimatedValue && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-neutral-500">
                  Est. ${donation.estimatedValue}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{donation.city}, {donation.state}</span>
          </div>
          {donation.matchedNgoName && (
            <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 pt-1">
              <Building2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="truncate">Allocated: {donation.matchedNgoName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action footer */}
      <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
        <span className="text-neutral-400 dark:text-neutral-500 font-mono text-[11px]">
          ID #{donation.id}
        </span>
        <div className="flex items-center gap-2">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(donation)}
              className="px-2.5 py-1 text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
            >
              Details
            </button>
          )}
          {onTrack && (
            <button
              onClick={() => onTrack(donation)}
              className="px-3 py-1 font-medium text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-1"
            >
              <span>Track</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface NGOCardProps {
  ngo: NGO;
  onSelect?: (ngo: NGO) => void;
  onDonateTo?: (ngo: NGO) => void;
}

export const NGOCard: React.FC<NGOCardProps> = ({ ngo, onSelect, onDonateTo }) => {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors flex flex-col justify-between">
      {/* Banner / Header Image or Gradient */}
      <div className="relative h-32 bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        {ngo.bannerImage ? (
          <img
            src={ngo.bannerImage}
            alt={ngo.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-emerald-900/30 to-neutral-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
              {ngo.logoInitial}
            </div>
            <div>
              <span className="text-xs font-semibold text-white truncate max-w-[200px] block">
                {ngo.city}, {ngo.state}
              </span>
            </div>
          </div>
          {ngo.verified && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-300 bg-emerald-950/70 px-2 py-0.5 rounded backdrop-blur-xs">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-neutral-900 dark:text-white text-base mb-1.5 leading-snug">
            {ngo.name}
          </h3>

          <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3 leading-relaxed">
            {ngo.description}
          </p>

          {/* Causes unboxed list */}
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 flex flex-wrap gap-x-2 gap-y-1">
            {ngo.causes.map((c, i) => (
              <React.Fragment key={c}>
                <span>{c}</span>
                {i < ngo.causes.length - 1 && <span aria-hidden="true">·</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-2 gap-2 text-xs mb-4">
          <div>
            <div className="text-neutral-400 text-[11px]">Beneficiaries</div>
            <div className="font-mono tabular-nums font-semibold text-neutral-800 dark:text-neutral-200">
              {ngo.beneficiariesCount.toLocaleString()}+
            </div>
          </div>
          <div>
            <div className="text-neutral-400 text-[11px]">Trust Score</div>
            <div className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
              {ngo.trustScore}% Verified
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          {onSelect && (
            <button
              onClick={() => onSelect(ngo)}
              className="flex-1 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              View Profile
            </button>
          )}
          {onDonateTo && (
            <button
              onClick={() => onDonateTo(ngo)}
              className="flex-1 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1"
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Pledge Aid</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface RequirementCardProps {
  requirement: Requirement;
  onContribute?: (requirement: Requirement) => void;
}

export const RequirementCard: React.FC<RequirementCardProps> = ({
  requirement,
  onContribute,
}) => {
  const percentFulfilled = Math.min(
    100,
    Math.round((requirement.fulfilledQuantity / requirement.targetQuantity) * 100)
  );

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors flex flex-col justify-between">
      <div>
        {/* Unboxed Metadata header */}
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
          <div className="flex items-center gap-1.5">
            <span>{requirement.cause}</span>
            <span aria-hidden="true">·</span>
            <span>{requirement.category}</span>
          </div>
          <span className="font-medium text-amber-700 dark:text-amber-400">
            {requirement.urgency}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-neutral-900 dark:text-white text-base leading-snug mb-1.5">
          {requirement.title}
        </h3>

        {/* NGO Byline */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 mb-3">
          <Building2 className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-medium">{requirement.ngoName}</span>
          <span aria-hidden="true">·</span>
          <span>{requirement.ngoCity}</span>
        </div>

        {/* Description */}
        <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed mb-4">
          {requirement.description}
        </p>

        {/* Progress Bar */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500 dark:text-neutral-400">
              Fulfilled <strong className="font-mono tabular-nums text-neutral-900 dark:text-white">{requirement.fulfilledQuantity}</strong> of {requirement.targetQuantity} {requirement.unit}
            </span>
            <span className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
              {percentFulfilled}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${percentFulfilled}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
          <span>Needed by {requirement.neededByDate}</span>
        </div>
        {onContribute && (
          <button
            onClick={() => onContribute(requirement)}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1"
          >
            <span>Fulfill Need</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
