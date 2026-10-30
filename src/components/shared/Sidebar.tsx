import React from "react";
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  FileText,
  Building2,
  Activity,
  UserCheck,
  Users,
  BarChart3,
  Layers,
  HeartHandshake,
  CheckCircle,
  Truck,
  Sparkles,
  ShieldCheck,
  Inbox,
  ArrowRightLeft,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const {
    currentUser,
    currentView,
    setCurrentView,
    donations,
    requirements,
    ngos,
  } = useApp();

  if (!currentUser) return null;

  // Counts for badges
  const myDonationsCount = donations.filter(
    (d) => d.donorId === currentUser.id,
  ).length;
  const pendingVerificationCount = ngos.filter(
    (n) => n.verificationStatus === "pending",
  ).length;
  const openRequirementsCount = requirements.filter(
    (r) => r.status === "Open" || r.status === "Partially Fulfilled",
  ).length;

  const donorNavItems = [
    { id: "donor-dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      id: "donor-create-donation",
      label: "Create Donation",
      icon: PlusCircle,
      highlight: true,
    },
    {
      id: "donor-my-donations",
      label: "My Donations",
      icon: Package,
      badge: myDonationsCount,
    },
    { id: "donor-donation-details", label: "Donation Details", icon: FileText },
    { id: "donor-matched-ngos", label: "Matched NGOs", icon: HeartHandshake },
    { id: "donor-tracking", label: "Donation Tracking", icon: Activity },
    {
      id: "donor-distribution-tracking",
      label: "Distribution Records",
      icon: FileText,
    },
    { id: "pickup-coordination", label: "Pickup Coordination", icon: Truck },
  ];

  const ngoNavItems = [
    { id: "ngo-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "ngo-profile", label: "NGO Profile", icon: Building2 },
    {
      id: "ngo-create-requirement",
      label: "Create Requirement",
      icon: PlusCircle,
      highlight: true,
    },
    {
      id: "ngo-active-requirements",
      label: "Active Requirements",
      icon: Layers,
      badge: openRequirementsCount,
    },
    {
      id: "ngo-available-donations",
      label: "Available Donations",
      icon: Inbox,
    },
    {
      id: "ngo-donation-requests",
      label: "Donation Requests",
      icon: ArrowRightLeft,
    },
    { id: "pickup-coordination", label: "Pickup Coordination", icon: Truck },
    {
      id: "ngo-distribution-tracking",
      label: "Distribution Tracking",
      icon: Truck,
    },
  ];

  const adminNavItems = [
    { id: "admin-dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      id: "admin-ngo-verification",
      label: "NGO Verification",
      icon: UserCheck,
      badge: pendingVerificationCount,
    },
    { id: "admin-user-management", label: "User Management", icon: Users },
    { id: "admin-donation-management", label: "Donation Audit", icon: Package },
    {
      id: "admin-requirement-management",
      label: "Requirement Audit",
      icon: Layers,
    },
    { id: "admin-analytics", label: "System Analytics", icon: BarChart3 },
    {
      id: "admin-distribution-tracking",
      label: "Distribution Records",
      icon: FileText,
    },
    { id: "pickup-coordination", label: "Pickup Coordination", icon: Truck },
  ];

  let items = donorNavItems;
  let roleTitle = "Donor Portal";
  let roleColor = "text-emerald-600 dark:text-emerald-400";

  if (currentUser.role === "ngo") {
    items = ngoNavItems;
    roleTitle = "NGO Operations";
    roleColor = "text-blue-600 dark:text-blue-400";
  } else if (currentUser.role === "admin") {
    items = adminNavItems;
    roleTitle = "Governance Console";
    roleColor = "text-amber-600 dark:text-amber-400";
  }

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 h-[calc(100vh-4rem)] sticky top-16 select-none">
      {/* Section Header */}
      <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        <div>
          <span
            className={`text-xs font-bold uppercase tracking-wider ${roleColor}`}
          >
            {roleTitle}
          </span>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[180px]">
            {currentUser.name}
          </p>
        </div>
        {currentUser.verified && (
          <span title="Identity Verified">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          </span>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-xs"
                  : item.highlight
                    ? "text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? "text-white dark:text-neutral-900"
                      : item.highlight
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-neutral-400 dark:text-neutral-500"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {typeof item.badge === "number" && item.badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono tabular-nums ${
                    isActive
                      ? "bg-white/20 text-white dark:bg-black/20 dark:text-neutral-900"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Workspace Footer Card */}
      <div className="p-3 border-t border-neutral-100 dark:border-neutral-800">
        <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 text-xs">
          <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-medium mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Community Verified</span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal">
            100% of deliveries tracked transparently with digital beneficiary
            receipts.
          </p>
        </div>
      </div>
    </aside>
  );
};
