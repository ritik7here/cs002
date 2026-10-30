import React, { useState } from "react";
import {
  Layers,
  PlusCircle,
  ArrowRight,
  Building2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { DonationCategory, CauseCategory, UrgencyLevel } from "../../types";

export const CreateRequirement: React.FC = () => {
  const { ngos, currentUser, addRequirement, setCurrentView, showToast } =
    useApp();
  const currentNgo = ngos.find((n) => n.id === currentUser?.organizationId);

  const [title, setTitle] = useState("");
  const [category, setCategory] =
    useState<DonationCategory>("Food & Groceries");
  const [cause, setCause] = useState<CauseCategory>("Hunger & Nutrition");
  const [targetQuantity, setTargetQuantity] = useState<number>(200);
  const [unit, setUnit] = useState("Family Care Kits");
  const [urgency, setUrgency] = useState<UrgencyLevel>("High");
  const [beneficiaryGroup, setBeneficiaryGroup] = useState(
    "Flood-affected rural households",
  );
  const [neededByDate, setNeededByDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split("T")[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [description, setDescription] = useState("");

  const categories: DonationCategory[] = [
    "Food & Groceries",
    "Clothing & Blankets",
    "Medical Supplies",
    "Educational Material",
    "Electronics & Devices",
    "Financial Aid",
    "Hygiene & Sanitation",
    "Other Essentials",
  ];

  const causes: CauseCategory[] = [
    "Hunger & Nutrition",
    "Education & Youth",
    "Healthcare & Medical",
    "Shelter & Clothing",
    "Disaster Relief",
    "Environment & Animal Welfare",
    "Women Empowerment",
    "Elderly Care",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentNgo) return;
    setIsSubmitting(true);
    try {
      await addRequirement({
        ngoId: currentNgo.id,
        ngoName: currentNgo.name,
        ngoCity: currentNgo.city,
        ngoVerified: currentNgo.verified,
        title,
        category,
        cause,
        targetQuantity: Number(targetQuantity),
        unit,
        urgency,
        description,
        beneficiaryGroup,
        neededByDate,
      });
      setCurrentView("ngo-active-requirements");
    } catch (error) {
      console.error("Failed to publish requirement:", error);
      showToast(
        error instanceof Error
          ? error.message
          : "Could not publish requirement. Please try again.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentNgo) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Your linked NGO organization is not available. Please refresh or
        complete NGO registration first.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
          Community Demands
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Post Field Material Requirement
        </h1>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
          Broadcast concrete shortages directly to our donor network. Pledges
          are matched automatically.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6 text-xs"
      >
        <div className="space-y-4">
          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Requirement Headline / Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 300 Emergency Winter Kits for Flood Evacuees"
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Material Category
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as DonationCategory)
                }
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Primary Humanitarian Cause
              </label>
              <select
                value={cause}
                onChange={(e) => setCause(e.target.value as CauseCategory)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                {causes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Target Quantity
              </label>
              <input
                type="number"
                min="1"
                required
                value={targetQuantity}
                onChange={(e) => setTargetQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Unit of Measure
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. Kits, Pairs, Boxes, Units"
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Urgency Priority
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
              >
                <option value="Low">Low (General Stock)</option>
                <option value="Medium">Medium (Scheduled Program)</option>
                <option value="High">High (Impending Crisis)</option>
                <option value="Critical / Emergency">
                  Critical / Emergency
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Target Beneficiary Demographic
              </label>
              <input
                type="text"
                required
                value={beneficiaryGroup}
                onChange={(e) => setBeneficiaryGroup(e.target.value)}
                placeholder="e.g. 150 single-mother households in Ward 9"
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Required By Target Date
              </label>
              <input
                type="date"
                required
                value={neededByDate}
                onChange={(e) => setNeededByDate(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Field Context & Justification
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the community situation, why this aid is urgent, and how your NGO volunteers will organize distribution..."
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentView("ngo-dashboard")}
            className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl shadow-xs flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>
              {isSubmitting ? "Publishing..." : "Publish Requirement"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
