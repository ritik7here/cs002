import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Navbar } from "./components/shared/Navbar";
import { Sidebar } from "./components/shared/Sidebar";
import { ToastContainer } from "./components/shared/Notifications";

// Public views
import { LandingPage } from "./components/public/LandingPage";
import { AboutHowItWorks } from "./components/public/AboutHowItWorks";
import { NGODirectory } from "./components/public/NGODirectory";

// Auth views
import { Login } from "./components/auth/Login";
import { Register } from "./components/auth/Register";

// Donor views
import { DonorDashboard } from "./components/donor/DonorDashboard";
import { CreateDonation } from "./components/donor/CreateDonation";
import { MyDonations } from "./components/donor/MyDonations";
import { DonationDetails } from "./components/donor/DonationDetails";
import { MatchedNGOs } from "./components/donor/MatchedNGOs";
import { DonationTracking } from "./components/donor/DonationTracking";

// NGO views
import { NGODashboard } from "./components/ngo/NGODashboard";
import { NGOProfile } from "./components/ngo/NGOProfile";
import { NGOOnboarding } from "./components/ngo/NGOOnboarding";
import { CreateRequirement } from "./components/ngo/CreateRequirement";
import { ActiveRequirements } from "./components/ngo/ActiveRequirements";
import { AvailableDonations } from "./components/ngo/AvailableDonations";
import { DonationRequests } from "./components/ngo/DonationRequests";
import { DistributionTracking } from "./components/ngo/DistributionTracking";
import { PickupCoordination } from "./components/shared/PickupCoordination";

// Admin views
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { NGOVerification } from "./components/admin/NGOVerification";
import { UserManagement } from "./components/admin/UserManagement";
import { DonationManagement } from "./components/admin/DonationManagement";
import { RequirementManagement } from "./components/admin/RequirementManagement";
import { SystemAnalytics } from "./components/admin/SystemAnalytics";

const AppContent: React.FC = () => {
  const { currentView, currentUser, setCurrentView } = useApp();

  const isPublicView =
    currentView === "public-landing" ||
    currentView === "public-about" ||
    currentView === "public-directory" ||
    currentView === "auth-login" ||
    currentView === "auth-register";

  const renderCurrentView = () => {
    switch (currentView) {
      // Public
      case "public-landing":
        return <LandingPage />;
      case "public-about":
        return <AboutHowItWorks />;
      case "public-directory":
        return <NGODirectory />;

      // Auth
      case "auth-login":
        return <Login />;
      case "auth-register":
        return <Register />;

      // Donor
      case "donor-dashboard":
        return <DonorDashboard />;
      case "donor-create-donation":
        return <CreateDonation />;
      case "donor-my-donations":
        return <MyDonations />;
      case "donor-donation-details":
        return <DonationDetails />;
      case "donor-matched-ngos":
        return <MatchedNGOs />;
      case "donor-tracking":
        return <DonationTracking />;
      case "pickup-coordination":
        return <PickupCoordination />;

      // NGO
      case "ngo-onboarding":
        return <NGOOnboarding />;
      case "ngo-dashboard":
        return <NGODashboard />;
      case "ngo-profile":
        return <NGOProfile />;
      case "ngo-create-requirement":
        return <CreateRequirement />;
      case "ngo-active-requirements":
        return <ActiveRequirements />;
      case "ngo-available-donations":
        return <AvailableDonations />;
      case "ngo-donation-requests":
        return <DonationRequests />;
      case "ngo-distribution-tracking":
      case "donor-distribution-tracking":
      case "admin-distribution-tracking":
        return <DistributionTracking />;

      // Admin
      case "admin-dashboard":
        return <AdminDashboard />;
      case "admin-ngo-verification":
        return <NGOVerification />;
      case "admin-user-management":
        return <UserManagement />;
      case "admin-donation-management":
        return <DonationManagement />;
      case "admin-requirement-management":
        return <RequirementManagement />;
      case "admin-analytics":
        return <SystemAnalytics />;

      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      <Navbar />

      <div className="flex-1 flex w-full">
        {/* Sidebar rendered for logged in portal screens */}
        {!isPublicView && currentUser && <Sidebar />}

        {/* Main Content Area */}
        <main
          className={`flex-1 ${!isPublicView ? "p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full" : ""}`}
        >
          {renderCurrentView()}
        </main>
      </div>

      {/* Public Footer */}
      {isPublicView && (
        <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-10 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-900 dark:text-white">
                KindredBridge
              </span>
              <span aria-hidden="true">·</span>
              <span>Auditable NGO Community Management System</span>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setCurrentView("public-about")}
                className="hover:text-neutral-900 dark:hover:text-white"
              >
                Verification Standards
              </button>
              <button
                onClick={() => setCurrentView("public-directory")}
                className="hover:text-neutral-900 dark:hover:text-white"
              >
                NGO Directory
              </button>
              <button
                onClick={() => setCurrentView("auth-login")}
                className="hover:text-neutral-900 dark:hover:text-white"
              >
                Portal Sign-in
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Floating Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
