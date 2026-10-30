import React, { useState } from "react";
import {
  Building2,
  ShieldCheck,
  Award,
  Save,
  Mail,
  Phone,
  Globe,
  MapPin,
  CheckCircle2,
  FileCheck,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { CauseCategory } from "../../types";

export const NGOProfile: React.FC = () => {
  const { ngos, currentUser, showToast, updateNGOProfile } = useApp();
  const currentNgo = ngos.find((n) => n.id === currentUser?.organizationId);

  const [name, setName] = useState(currentNgo?.name ?? "");
  const [mission, setMission] = useState(currentNgo?.missionStatement ?? "");
  const [description, setDescription] = useState(currentNgo?.description ?? "");
  const [contactEmail, setContactEmail] = useState(
    currentNgo?.contactEmail ?? currentUser?.email ?? "",
  );
  const [phone, setPhone] = useState(
    currentNgo?.phone ?? currentUser?.phone ?? "",
  );
  const [website, setWebsite] = useState(currentNgo?.website ?? "");
  const [address, setAddress] = useState(currentNgo?.address ?? "");
  const [city, setCity] = useState(currentNgo?.city ?? "");
  const [state, setState] = useState(currentNgo?.state ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentNgo) return;
    setSaving(true);
    try {
      await updateNGOProfile(currentNgo.id, {
        name: name.trim(),
        mission_statement: mission.trim(),
        description: description.trim(),
        contact_email: contactEmail.trim(),
        phone: phone.trim(),
        website: website.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
      });
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Could not save NGO profile changes.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!currentNgo) {
    return (
      <div className="max-w-2xl mx-auto rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        This account is not linked to an organization yet. Complete NGO
        organization registration before editing its profile.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            Organization Identity
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            NGO Profile & Legal Accreditation
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
            Maintain your public directory listing, verified trust score, and
            compliance certificates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentNgo.verified ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified & Audited</span>
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-800">
              Verification In Review
            </span>
          )}
        </div>
      </div>

      {/* Compliance Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs">
        <div>
          <span className="text-neutral-400 block text-[11px]">
            Govt Society / Trust Reg
          </span>
          <span className="font-mono font-semibold text-neutral-900 dark:text-white">
            {currentNgo.registrationNumber}
          </span>
        </div>
        <div>
          <span className="text-neutral-400 block text-[11px]">
            80G Tax Exemption Certificate
          </span>
          <span className="font-mono font-semibold text-neutral-900 dark:text-white">
            {currentNgo.taxExemptId}
          </span>
        </div>
        <div>
          <span className="text-neutral-400 block text-[11px]">
            Community Trust Score
          </span>
          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
            {currentNgo.trustScore}/100 Verified
          </span>
        </div>
      </div>

      {/* Profile Form */}
      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6 text-xs"
      >
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white pb-2 border-b border-neutral-100 dark:border-neutral-800">
            Core Organization Information
          </h3>

          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Legal Organization Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Mission Statement
            </label>
            <input
              type="text"
              required
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Full Program Overview & Activities
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white pb-2 border-b border-neutral-100 dark:border-neutral-800">
            Field Dispatch & Communication Contacts
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Official Email
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Dispatch Phone / Helpline
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Official Website URL
              </label>
              <input
                type="url"
                required
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Headquarters Depot Address
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                City & State
              </label>
              <input
                type="text"
                required
                value={`${city}, ${state}`}
                onChange={(e) => {
                  const parts = e.target.value.split(",");
                  setCity(parts[0]?.trim() || city);
                  setState(parts[1]?.trim() || state);
                }}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Profile Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
