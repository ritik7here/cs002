import React, { useState } from 'react';
import {
  Search,
  Building2,
  ShieldCheck,
  MapPin,
  ExternalLink,
  Heart,
  SlidersHorizontal,
  X,
  Phone,
  Mail,
  Award,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NGO, CauseCategory } from '../../types';
import { NGOCard } from '../shared/Cards';

export const NGODirectory: React.FC = () => {
  const { ngos, setCurrentView, setSelectedNgoId } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCause, setSelectedCause] = useState<string>('All');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [selectedNgoDetail, setSelectedNgoDetail] = useState<NGO | null>(null);

  const causesList = [
    'All',
    'Hunger & Nutrition',
    'Education & Youth',
    'Healthcare & Medical',
    'Shelter & Clothing',
    'Environment & Animal Welfare',
    'Women Empowerment',
  ];

  const citiesList = ['All', 'Mumbai', 'Jaipur', 'New Delhi', 'Bengaluru', 'Kolkata', 'Pune'];

  // Filtered NGOs
  const filteredNgos = ngos.filter(ngo => {
    const matchesSearch =
      ngo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ngo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ngo.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCause =
      selectedCause === 'All' || ngo.causes.includes(selectedCause as CauseCategory);

    const matchesCity = selectedCity === 'All' || ngo.city === selectedCity;

    return matchesSearch && matchesCause && matchesCity;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
          Accredited Partners
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Verified NGO Directory
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
          Search and verify vetted grassroots organizations. Every listed NGO has undergone legal,
          tax-exemption, and on-ground operational screening.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by NGO name, keywords, or focus area..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* City Selector */}
          <div className="w-full md:w-52">
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              {citiesList.map(city => (
                <option key={city} value={city}>
                  {city === 'All' ? 'All Locations' : city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cause Filter Buttons (Interactive filter tabs per zero-pill guideline) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          <span className="text-neutral-400 text-xs shrink-0 mr-1">Cause:</span>
          {causesList.map(cause => (
            <button
              key={cause}
              onClick={() => setSelectedCause(cause)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer text-xs ${
                selectedCause === cause
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {cause}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of NGOs */}
      {filteredNgos.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12 text-center">
          <Building2 className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
            No NGOs match your filter criteria
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Try adjusting your search query or selecting "All" causes.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCause('All');
              setSelectedCity('All');
            }}
            className="mt-4 px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNgos.map(ngo => (
            <NGOCard
              key={ngo.id}
              ngo={ngo}
              onSelect={n => setSelectedNgoDetail(n)}
              onDonateTo={n => {
                setSelectedNgoId(n.id);
                setCurrentView('donor-create-donation');
              }}
            />
          ))}
        </div>
      )}

      {/* NGO Detail Modal */}
      {selectedNgoDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="relative h-40 bg-neutral-100 dark:bg-neutral-800">
              {selectedNgoDetail.bannerImage ? (
                <img
                  src={selectedNgoDetail.bannerImage}
                  alt={selectedNgoDetail.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-emerald-900/40 to-neutral-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <button
                onClick={() => setSelectedNgoDetail(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-4 left-6 right-6 text-white flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{selectedNgoDetail.name}</span>
                    {selectedNgoDetail.verified && (
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                  <div className="text-xs text-neutral-300 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{selectedNgoDetail.city}, {selectedNgoDetail.state}</span>
                    <span aria-hidden="true">·</span>
                    <span>Founded {selectedNgoDetail.foundedYear}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto text-xs text-neutral-600 dark:text-neutral-300">
              <div>
                <h4 className="font-semibold text-neutral-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">
                  Mission Statement
                </h4>
                <p className="leading-relaxed">{selectedNgoDetail.missionStatement}</p>
              </div>

              <div>
                <h4 className="font-semibold text-neutral-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">
                  About Organization
                </h4>
                <p className="leading-relaxed">{selectedNgoDetail.description}</p>
              </div>

              {/* Legal & Compliance Strip */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                <div>
                  <div className="text-neutral-400 text-[11px]">Govt Reg ID</div>
                  <div className="font-mono text-neutral-900 dark:text-white font-medium">
                    {selectedNgoDetail.registrationNumber}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-400 text-[11px]">80G Tax Exemption ID</div>
                  <div className="font-mono text-neutral-900 dark:text-white font-medium">
                    {selectedNgoDetail.taxExemptId}
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div>
                <h4 className="font-semibold text-neutral-900 dark:text-white uppercase tracking-wider text-[11px] mb-1.5">
                  Audited Certifications
                </h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  {selectedNgoDetail.certifications.map((cert, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact details */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap gap-4 text-xs text-neutral-500">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{selectedNgoDetail.contactEmail}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{selectedNgoDetail.phone}</span>
                </div>
                <a
                  href={selectedNgoDetail.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-emerald-600 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Official Website</span>
                </a>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedNgoDetail(null)}
                className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedNgoId(selectedNgoDetail.id);
                  setSelectedNgoDetail(null);
                  setCurrentView('donor-create-donation');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5"
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Pledge Donation to this NGO</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
