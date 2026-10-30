import React, { useState, useEffect } from "react";
import {
  Heart,
  Package,
  MapPin,
  Calendar,
  Building2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Info,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { DonationCategory, ItemCondition, UrgencyLevel } from "../../types";

export const CreateDonation: React.FC = () => {
  const {
    currentUser,
    addDonation,
    ngos,
    requirements,
    selectedRequirementId,
    selectedNgoId,
    setCurrentView,
    setSelectedDonationId,
  } = useApp();

  const targetReq = requirements.find((r) => r.id === selectedRequirementId);
  const targetNgo = ngos.find((n) => n.id === selectedNgoId);

  const [title, setTitle] = useState("");
  const [category, setCategory] =
    useState<DonationCategory>("Food & Groceries");
  const [condition, setCondition] = useState<ItemCondition>("Brand New");
  const [quantity, setQuantity] = useState<number>(50);
  const [unit, setUnit] = useState("Kits");
  const [estimatedValue, setEstimatedValue] = useState<number>(500);
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<UrgencyLevel>("Medium");

  // Address
  const [pickupAddress, setPickupAddress] = useState(
    "Flat 402, Green Meadows Apt, Worli",
  );
  const [city, setCity] = useState("Mumbai");
  const [state, setState] = useState("Maharashtra");
  const [pincode, setPincode] = useState("400018");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected NGO/Requirement match
  const [assignedNgoId, setAssignedNgoId] = useState<string>(
    targetNgo?.id || targetReq?.ngoId || "",
  );

  // Pre-fill from selected requirement if present
  useEffect(() => {
    if (targetReq) {
      setTitle(`${targetReq.category} for ${targetReq.ngoName}`);
      setCategory(targetReq.category);
      setUnit(targetReq.unit);
      setQuantity(
        Math.min(50, targetReq.targetQuantity - targetReq.fulfilledQuantity),
      );
      setAssignedNgoId(targetReq.ngoId);
      setDescription(`Dedicated contribution towards: ${targetReq.title}`);
    } else if (targetNgo) {
      setAssignedNgoId(targetNgo.id);
    }
  }, [targetReq, targetNgo]);

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

  const conditions: ItemCondition[] = [
    "Brand New",
    "Gently Used",
    "Used - Good Condition",
    "Not Applicable (Consumable/Cash)",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const chosenNgo = ngos.find((n) => n.id === assignedNgoId);

      const newDonation = await addDonation({
        title,
        category,
        condition,
        quantity,
        unit,
        estimatedValue,
        description,
        urgency,
        pickupAddress,
        city,
        state,
        pincode,
        matchedNgoId: chosenNgo?.id,
        matchedNgoName: chosenNgo?.name,
        targetRequirementId: targetReq?.id,
      });

      setSelectedDonationId(newDonation.id);
      setCurrentView("donor-donation-details");
    } catch {
      // AppContext displays the API error toast; keep the form open for retry.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
          Make a Difference
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Pledge a Donation
        </h1>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
          List physical supplies or support packages. Our network handles
          doorstep collection and delivers verified proof of beneficiary
          distribution.
        </p>
      </div>

      {/* Target requirement notice if applicable */}
      {targetReq && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs flex items-start gap-3">
          <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-emerald-900 dark:text-emerald-200">
              Fulfilling Community Need: {targetReq.title}
            </div>
            <p className="text-emerald-800 dark:text-emerald-300 mt-0.5 leading-relaxed">
              Recipient NGO: <strong>{targetReq.ngoName}</strong> (
              {targetReq.ngoCity}). They require{" "}
              {targetReq.targetQuantity - targetReq.fulfilledQuantity} more{" "}
              {targetReq.unit}.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6 text-xs"
      >
        {/* Section 1: Item Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white pb-2 border-b border-neutral-100 dark:border-neutral-800">
            1. Donation Item Specifications
          </h3>

          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Donation Title / Brief Headline
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 50 Winter Wool Blankets or 10 Laptops"
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as DonationCategory)
                }
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
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
                Item Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ItemCondition)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                {conditions.map((c) => (
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
                Quantity
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Unit (e.g. Kits, Pieces, Boxes)
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Est. Total Value ($ USD)
              </label>
              <input
                type="number"
                min="0"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Detailed Description & Packaging Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe package contents, expiry dates (if food/medical), brand, dimensions, etc."
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Section 2: Allocation & Recipient NGO */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white pb-2 border-b border-neutral-100 dark:border-neutral-800">
            2. Beneficiary Allocation & Recipient
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Direct to Specific NGO (or Leave Blank for Auto-Match)
              </label>
              <select
                value={assignedNgoId}
                onChange={(e) => setAssignedNgoId(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">
                  -- Let KindredBridge Match Best Need --
                </option>
                {ngos
                  .filter((n) => n.verified)
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({n.city})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Urgency Level
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
              >
                <option value="Low">Low (General Stock)</option>
                <option value="Medium">Medium (Scheduled Relief)</option>
                <option value="High">High (Impending Crisis)</option>
                <option value="Critical / Emergency">
                  Critical / Emergency
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Doorstep Pickup Location */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white pb-2 border-b border-neutral-100 dark:border-neutral-800">
            3. Doorstep Logistics Pickup Address
          </h3>

          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Building, Street & Landmark
            </label>
            <input
              type="text"
              required
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                City
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                State / Province
              </label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Postal Code (PIN)
              </label>
              <input
                type="text"
                required
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentView("donor-dashboard")}
            className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Heart className="w-4 h-4" />
            <span>
              {isSubmitting
                ? "Pledging Donation..."
                : "Confirm & List Donation"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
