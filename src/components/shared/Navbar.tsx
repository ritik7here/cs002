import React, { useState, useRef, useEffect } from "react";
import {
  Sun,
  Moon,
  Bell,
  Heart,
  Shield,
  Building2,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { UserRole } from "../../types";

export const Navbar: React.FC = () => {
  const {
    currentUser,
    logout,
    theme,
    toggleTheme,
    currentView,
    setCurrentView,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setSelectedDonationId,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigateTo = (view: string) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "donor":
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <Heart className="w-3.5 h-3.5 text-emerald-600" /> Donor
          </span>
        );
      case "ngo":
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-300">
            <Building2 className="w-3.5 h-3.5 text-blue-600" /> NGO Partner
          </span>
        );
      case "admin":
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300">
            <Shield className="w-3.5 h-3.5 text-amber-600" /> Platform Admin
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo("public-landing")}
              className="flex items-center gap-2.5 text-left group focus-visible:outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm transition-transform group-hover:scale-105">
                K
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white leading-none block">
                  KindredBridge
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-normal">
                  NGO Community Hub
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600 dark:text-neutral-300">
            <button
              onClick={() => navigateTo("public-landing")}
              className={`hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer ${
                currentView === "public-landing"
                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                  : ""
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => navigateTo("public-about")}
              className={`hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer ${
                currentView === "public-about"
                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                  : ""
              }`}
            >
              How It Works
            </button>
            <button
              onClick={() => navigateTo("public-directory")}
              className={`hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer ${
                currentView === "public-directory"
                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                  : ""
              }`}
            >
              Verified NGOs
            </button>
            {currentUser && (
              <button
                onClick={() => {
                  if (currentUser.role === "donor")
                    navigateTo("donor-dashboard");
                  else if (currentUser.role === "ngo")
                    navigateTo("ngo-dashboard");
                  else navigateTo("admin-dashboard");
                }}
                className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-semibold transition-colors cursor-pointer"
              >
                Portal Workspace
              </button>
            )}
          </nav>

          {/* Zone 3: Actions & Controls */}
          <div className="flex items-center gap-2.5">
            {/* Live account role badge; roles cannot be switched from the client. */}
            {currentUser && (
              <div className="hidden sm:block px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80">
                {getRoleBadge(currentUser.role)}
              </div>
            )}

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                    <div className="font-semibold text-sm text-neutral-900 dark:text-white">
                      Notifications
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-neutral-500">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationRead(n.id);
                            if (n.actionView) setCurrentView(n.actionView);
                            if (n.actionId) setSelectedDonationId(n.actionId);
                            setNotifDropdownOpen(false);
                          }}
                          className={`p-3 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors ${
                            !n.read
                              ? "bg-emerald-50/40 dark:bg-emerald-950/20"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between font-medium text-neutral-900 dark:text-white mb-0.5">
                            <span>{n.title}</span>
                            <span className="text-[10px] text-neutral-400 font-normal">
                              {n.timestamp}
                            </span>
                          </div>
                          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-[11px]">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Toggle color theme"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5 text-amber-400" />
              )}
            </button>

            {/* User Profile or Login CTA */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-1">
                <button
                  onClick={() => {
                    if (currentUser.role === "donor")
                      navigateTo("donor-dashboard");
                    else if (currentUser.role === "ngo")
                      navigateTo("ngo-profile");
                    else navigateTo("admin-dashboard");
                  }}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title="View Profile"
                >
                  <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                    {currentUser.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <span className="hidden xl:inline text-xs font-medium text-neutral-800 dark:text-neutral-200 max-w-[100px] truncate">
                    {currentUser.name.split(" ")[0]}
                  </span>
                </button>
                <button
                  onClick={logout}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateTo("auth-login")}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigateTo("auth-register")}
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Join Us
                </button>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 pt-3 pb-6 space-y-3">
          <div className="space-y-1">
            <button
              onClick={() => navigateTo("public-landing")}
              className="w-full text-left px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
            >
              Overview
            </button>
            <button
              onClick={() => navigateTo("public-about")}
              className="w-full text-left px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
            >
              How It Works
            </button>
            <button
              onClick={() => navigateTo("public-directory")}
              className="w-full text-left px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
            >
              Verified NGO Directory
            </button>
          </div>

          {currentUser && (
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 px-3 text-xs">
              Signed in as <strong>{currentUser.name}</strong> (
              {currentUser.role}). Role permissions are assigned by the server.
            </div>
          )}
        </div>
      )}
    </header>
  );
};
