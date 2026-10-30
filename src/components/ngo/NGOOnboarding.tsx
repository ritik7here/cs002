import React, { useState } from "react";
import { Building2, ArrowRight, LoaderCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import type { CauseCategory } from "../../types";
import type { NGOCreatePayload } from "../../api/ngos";

const CAUSES: CauseCategory[] = [
  "Disaster Relief",
  "Hunger & Nutrition",
  "Education & Youth",
  "Healthcare & Medical",
  "Shelter & Clothing",
  "Environment & Animal Welfare",
  "Women Empowerment",
  "Elderly Care",
];

export const NGOOnboarding: React.FC = () => {
  const { currentUser, registerNGOOrganization, logout } = useApp();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [taxExemptId, setTaxExemptId] = useState("");
  const [contactEmail, setContactEmail] = useState(currentUser?.email ?? "");
  const [phone, setPhone] = useState(currentUser?.phone ?? "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [website, setWebsite] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [description, setDescription] = useState("");
  const [mission, setMission] = useState("");
  const [causes, setCauses] = useState<CauseCategory[]>([]);
  const [error, setError] = useState("");

  if (!currentUser || currentUser.role !== "ngo") {
    return (
      <div className="max-w-xl mx-auto p-8">
        Sign in with an NGO representative account to continue.
      </div>
    );
  }

  const toggleCause = (cause: CauseCategory) =>
    setCauses((current) =>
      current.includes(cause)
        ? current.filter((item) => item !== cause)
        : [...current, cause],
    );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const payload: NGOCreatePayload = {
      name: name.trim(),
      registration_number: registrationNumber.trim(),
      tax_exempt_id: taxExemptId.trim(),
      contact_email: contactEmail.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      website: website.trim() || undefined,
      founded_year: foundedYear ? Number(foundedYear) : undefined,
      description: description.trim(),
      mission_statement: mission.trim(),
      causes,
    };
    try {
      await registerNGOOrganization(payload);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Organization registration failed. Please check your details and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white";
  const labelClass =
    "mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <Building2 />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Register your NGO</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Your representative account is ready. Complete your organization's
              details to continue. Verification will remain pending until an
              administrator reviews it.
            </p>
          </div>
        </div>
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>Legal organization name *</label>
              <input
                className={inputClass}
                required
                minLength={2}
                maxLength={200}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Registration number *</label>
              <input
                className={inputClass}
                required
                minLength={3}
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Tax exemption ID (80G/12A) *</label>
              <input
                className={inputClass}
                required
                minLength={3}
                value={taxExemptId}
                onChange={(e) => setTaxExemptId(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Official contact email *</label>
              <input
                className={inputClass}
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Phone *</label>
              <input
                className={inputClass}
                type="tel"
                required
                minLength={7}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Registered address *</label>
              <input
                className={inputClass}
                required
                minLength={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>City *</label>
              <input
                className={inputClass}
                required
                minLength={2}
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>State *</label>
              <input
                className={inputClass}
                required
                minLength={2}
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Website (optional)</label>
              <input
                className={inputClass}
                type="url"
                placeholder="https://"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Founded year (optional)</label>
              <input
                className={inputClass}
                type="number"
                min={1800}
                max={new Date().getFullYear()}
                value={foundedYear}
                onChange={(e) => setFoundedYear(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Mission statement</label>
              <textarea
                className={inputClass}
                rows={2}
                maxLength={2000}
                value={mission}
                onChange={(e) => setMission(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Organization description</label>
              <textarea
                className={inputClass}
                rows={3}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <fieldset>
            <legend className={labelClass}>Causes supported</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {CAUSES.map((cause) => (
                <label
                  key={cause}
                  className="flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={causes.includes(cause)}
                    onChange={() => toggleCause(cause)}
                  />
                  {cause}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 dark:border-neutral-800 pt-4">
            <button
              type="button"
              onClick={() => void logout()}
              className="text-sm text-neutral-500 hover:text-neutral-900"
            >
              Sign out
            </button>
            <button
              disabled={submitting}
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {submitting
                ? "Submitting…"
                : "Submit organization for verification"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
