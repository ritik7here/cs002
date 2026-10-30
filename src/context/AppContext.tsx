import React, { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  UserRole,
  NGO,
  Donation,
  Requirement,
  AppNotification,
  DistributionRecord,
  DonationStatus,
} from "../types";
import {
  INITIAL_USERS,
  INITIAL_NGOS,
  INITIAL_DONATIONS,
  INITIAL_REQUIREMENTS,
  INITIAL_DISTRIBUTIONS,
} from "../data/mockData";
import { ngosApi } from "../api/ngos";
import { donationsApi } from "../api/donations";
import { donationRequestsApi } from "../api/donationRequests";
import { requirementsApi } from "../api/requirements";
import { authApi } from "../api/auth";
import { notificationsApi } from "../api/notifications";
import { supabase } from "../lib/supabase";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { setAuthToken } from "../api/client";

interface Toast {
  id: string;
  message: string;
  type: "success" | "info" | "error";
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  ngos: NGO[];
  donations: Donation[];
  donationsLoadStatus: "loading" | "loaded" | "error";
  requirements: Requirement[];
  requirementsLoadStatus: "loading" | "loaded" | "error";
  distributions: DistributionRecord[];
  notifications: AppNotification[];
  theme: "light" | "dark";
  toggleTheme: () => void;
  currentView: string;
  setCurrentView: (view: string) => void;
  selectedDonationId: string | null;
  setSelectedDonationId: (id: string | null) => void;
  selectedNgoId: string | null;
  setSelectedNgoId: (id: string | null) => void;
  selectedRequirementId: string | null;
  setSelectedRequirementId: (id: string | null) => void;
  toasts: Toast[];
  showToast: (message: string, type?: "success" | "info" | "error") => void;
  removeToast: (id: string) => void;

  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  switchRole: (role: UserRole) => void;
  logout: () => Promise<void>;
  registerNGOOrganization: (
    payload: import("../api/ngos").NGOCreatePayload,
  ) => Promise<void>;
  updateNGOProfile: (
    ngoId: string,
    payload: import("../api/ngos").NGOProfileUpdatePayload,
  ) => Promise<void>;
  register: (formData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
    location: string;
    orgName?: string;
  }) => Promise<void>;

  // Donation actions
  addDonation: (donationData: Partial<Donation>) => Promise<Donation>;
  claimDonation: (
    donationId: string,
    ngoId: string,
    proposedDate: string,
    notes: string,
  ) => Promise<void>;
  updateDonationStatus: (
    donationId: string,
    status: DonationStatus,
    note?: string,
    actor?: string,
  ) => void;
  logDistribution: (record: Omit<DistributionRecord, "id">) => void;

  // Requirement actions
  addRequirement: (
    req: Omit<Requirement, "id" | "createdAt" | "fulfilledQuantity" | "status">,
  ) => Promise<Requirement>;
  fulfillRequirement: (requirementId: string, amount: number) => Promise<void>;

  // Admin actions
  updateNgoVerification: (
    ngoId: string,
    status: "verified" | "rejected" | "pending" | "under_review",
    reason?: string,
  ) => Promise<void>;
  toggleUserStatus: (userId: string) => void;

  // Notification actions
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // Reset
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("kb_theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("kb_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // State with LocalStorage fallbacks
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem("kb_users");
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // NGOs and donations are loaded from the live backend below. Start empty so
  // stale localStorage/mock records are never mistaken for database records.
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [donationsLoadStatus, setDonationsLoadStatus] = useState<
    "loading" | "loaded" | "error"
  >("loading");

  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [requirementsLoadStatus, setRequirementsLoadStatus] = useState<
    "loading" | "loaded" | "error"
  >("loading");

  const [distributions, setDistributions] = useState<DistributionRecord[]>(
    () => {
      const saved = localStorage.getItem("kb_distributions");
      return saved ? JSON.parse(saved) : INITIAL_DISTRIBUTIONS;
    },
  );

  // Notifications are account-specific and are loaded from the authenticated API.
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [currentView, setCurrentView] = useState<string>("public-landing");
  const [selectedDonationId, setSelectedDonationId] = useState<string | null>(
    null,
  );
  const [selectedNgoId, setSelectedNgoId] = useState<string | null>(null);
  const [selectedRequirementId, setSelectedRequirementId] = useState<
    string | null
  >("req-1");

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (
    message: string,
    type: "success" | "info" | "error" = "success",
  ) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load live NGO and donation data from FastAPI. Each list is handled
  // independently so one endpoint failure does not hide the other's data.
  useEffect(() => {
    let cancelled = false;

    const loadLiveData = async () => {
      const [ngoResult, requirementResult] = await Promise.allSettled([
        ngosApi.list(),
        requirementsApi.list(),
      ]);

      if (cancelled) return;

      if (ngoResult.status === "fulfilled") {
        setNgos(ngoResult.value);
        setSelectedNgoId((current) =>
          current && ngoResult.value.some((ngo) => ngo.id === current)
            ? current
            : (ngoResult.value[0]?.id ?? null),
        );
      } else {
        console.error(
          "Failed to load NGOs from the backend:",
          ngoResult.reason,
        );
        showToast(
          "Could not load NGOs from the server. Please check the backend and try again.",
          "error",
        );
      }

      if (requirementResult.status === "fulfilled") {
        setRequirements(requirementResult.value);
        setRequirementsLoadStatus("loaded");
      } else {
        setRequirementsLoadStatus("error");
        console.error(
          "Failed to load requirements from the backend:",
          requirementResult.reason,
        );
        showToast(
          "Could not load community requirements from the server.",
          "error",
        );
      }
    };

    void loadLiveData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the correct donation view for the active role. Donors must use the
  // private /donations/my endpoint because public summaries intentionally omit donor_id.
  useEffect(() => {
    let cancelled = false;

    const loadDonationsForRole = async () => {
      setDonationsLoadStatus("loading");
      try {
        const linkedNgo = currentUser?.organizationId
          ? ngos.find((ngo) => ngo.id === currentUser.organizationId)
          : undefined;
        const items =
          currentUser?.role === "donor"
            ? await donationsApi.listMy()
            : currentUser?.role === "ngo" && linkedNgo?.verified
              ? await donationsApi.listForNGO()
              : await donationsApi.list();
        if (cancelled) return;
        setDonations(items);
        setDonationsLoadStatus("loaded");
        setSelectedDonationId((current) =>
          current && items.some((donation) => donation.id === current)
            ? current
            : (items[0]?.id ?? null),
        );
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load donations for the active role:", error);
        setDonationsLoadStatus("error");
        showToast(
          "Could not load donations from the server. Please check the backend and try again.",
          "error",
        );
      }
    };

    void loadDonationsForRole();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.role, currentUser?.organizationId, ngos]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("kb_users", JSON.stringify(users));
  }, [users]);

  // Authentication is restored only from a real Supabase session; localStorage user objects are not trusted.
  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error || !data.session) {
        setAuthToken(null);
        setCurrentUser(null);
        return;
      }
      setAuthToken(data.session.access_token);
      try {
        const profile = await authApi.getMe();
        if (active) {
          setCurrentUser(profile);
          routeForUser(profile);
        }
      } catch (err) {
        console.error("Could not restore the authenticated profile:", err);
        await supabase.auth.signOut();
        setAuthToken(null);
        if (active) setCurrentUser(null);
      }
    };
    void restoreSession();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setAuthToken(session?.access_token ?? null);
        if (!session) {
          setCurrentUser(null);
          return;
        }
        // Defer network calls outside Supabase's auth-state callback.
        window.setTimeout(() => {
          void authApi
            .getMe()
            .then((profile) => {
              if (active) {
                setCurrentUser(profile);
                routeForUser(profile);
              }
            })
            .catch((error) =>
              console.error("Failed to refresh authenticated profile:", error),
            );
        }, 0);
      },
    );
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("kb_ngos", JSON.stringify(ngos));
  }, [ngos]);

  useEffect(() => {
    localStorage.setItem("kb_donations", JSON.stringify(donations));
  }, [donations]);

  useEffect(() => {
    localStorage.setItem("kb_requirements", JSON.stringify(requirements));
  }, [requirements]);

  useEffect(() => {
    localStorage.setItem("kb_distributions", JSON.stringify(distributions));
  }, [distributions]);

  useEffect(() => {
    let cancelled = false;
    if (!currentUser) {
      setNotifications([]);
      return () => {
        cancelled = true;
      };
    }
    notificationsApi
      .listMine()
      .then((items) => {
        if (!cancelled) setNotifications(items);
      })
      .catch((error) => {
        if (!cancelled) {
          setNotifications([]);
          console.error("Failed to load account notifications:", error);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  // Live authentication operations. Roles are loaded from the server profile, never selected by the client.
  const routeForUser = (user: User) => {
    if (user.role === "donor") setCurrentView("donor-dashboard");
    else if (user.role === "ngo")
      setCurrentView(user.organizationId ? "ngo-dashboard" : "ngo-onboarding");
    else if (user.role === "admin") setCurrentView("admin-dashboard");
    else setCurrentView("public-landing");
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error || !data.session) {
      setAuthToken(null);
      showToast(
        error?.message || "Sign-in did not return an active session.",
        "error",
      );
      return;
    }

    setAuthToken(data.session.access_token);
    try {
      const user = await authApi.getMe();
      setCurrentUser(user);
      routeForUser(user);
      showToast(`Welcome back, ${user.name}.`, "success");
    } catch (error) {
      await supabase.auth.signOut();
      setAuthToken(null);
      setCurrentUser(null);
      const message =
        error instanceof Error
          ? error.message
          : "Your account profile could not be loaded.";
      showToast(
        `Signed in, but profile validation failed: ${message}`,
        "error",
      );
    }
  };

  const switchRole = (_role: UserRole) => {
    showToast(
      "Role switching is disabled for live accounts. Sign in with the account for the required role.",
      "info",
    );
    setCurrentView("auth-login");
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    setAuthToken(null);
    setCurrentUser(null);
    setCurrentView("public-landing");
    if (error)
      showToast(
        `Signed out locally; Supabase reported: ${error.message}`,
        "error",
      );
    else showToast("You have been safely signed out.", "info");
  };

  const registerNGOOrganization = async (
    payload: import("../api/ngos").NGOCreatePayload,
  ) => {
    if (!currentUser || currentUser.role !== "ngo") {
      showToast(
        "Sign in with an NGO representative account to register an organization.",
        "error",
      );
      return;
    }
    if (currentUser.organizationId) {
      showToast(
        "This account is already linked to an NGO organization.",
        "error",
      );
      routeForUser(currentUser);
      return;
    }
    try {
      const created = await ngosApi.register(payload);
      // Refresh the server-owned profile so the new organization_id is authoritative.
      const refreshedUser = await authApi.getMe();
      setCurrentUser(refreshedUser);
      const latestNgos = await ngosApi.list();
      setNgos(latestNgos);
      setSelectedNgoId(created.id);
      routeForUser(refreshedUser);
      showToast(
        "Organization registered successfully. Verification is pending.",
        "success",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not register the NGO organization.";
      showToast(message, "error");
      throw error;
    }
  };

  const updateNGOProfile = async (
    ngoId: string,
    payload: import("../api/ngos").NGOProfileUpdatePayload,
  ) => {
    if (
      !currentUser ||
      currentUser.role !== "ngo" ||
      currentUser.organizationId !== ngoId
    ) {
      throw new Error(
        "You can only update the organization linked to your NGO account.",
      );
    }
    const updated = await ngosApi.updateProfile(ngoId, payload);
    setNgos((previous) =>
      previous.map((ngo) => (ngo.id === ngoId ? updated : ngo)),
    );
    setSelectedNgoId(ngoId);
    showToast("NGO organization profile saved to the database.", "success");
  };

  const register = async (formData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
    location: string;
    orgName?: string;
  }) => {
    if (formData.role === "admin" || formData.role === "guest") {
      showToast(
        "Public registration is available for donors and NGO representatives only.",
        "error",
      );
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: formData.email.trim(),
      password: formData.password,
      options: {
        data: {
          full_name: formData.name.trim(),
          role: formData.role,
          phone: formData.phone || "",
          location: formData.location.trim(),
          organization_name:
            formData.role === "ngo" ? formData.orgName || "" : "",
        },
      },
    });

    if (error) {
      showToast(error.message, "error");
      return;
    }

    if (!data.session) {
      showToast(
        "Account created. Check your email to confirm the address, then sign in.",
        "info",
      );
      setCurrentView("auth-login");
      return;
    }

    setAuthToken(data.session.access_token);
    try {
      const user = await authApi.getMe();
      setCurrentUser(user);
      routeForUser(user);
      showToast(`Welcome to KindredBridge, ${user.name}.`, "success");
    } catch (error) {
      await supabase.auth.signOut();
      setAuthToken(null);
      setCurrentUser(null);
      const message =
        error instanceof Error
          ? error.message
          : "Profile setup is not complete.";
      showToast(
        `Account created, but profile setup failed: ${message}`,
        "error",
      );
    }
  };

  // Add Donation (S4: cut over to API)
  const addDonation = async (
    donationData: Partial<Donation>,
  ): Promise<Donation> => {
    let createdDonation: Donation;

    try {
      createdDonation = await donationsApi.create({
        title: donationData.title || "Donation Item",
        category: donationData.category || "Food & Groceries",
        description: donationData.description || "",
        quantity: Number(donationData.quantity) || 1,
        unit: donationData.unit || "Units",
        estimated_value: donationData.estimatedValue
          ? Number(donationData.estimatedValue)
          : undefined,
        condition: donationData.condition || "Brand New",
        pickup_address: donationData.pickupAddress || "Provided upon pickup",
        city: donationData.city || "Mumbai",
        state: donationData.state || "Maharashtra",
        pincode: donationData.pincode || "400001",
        urgency: donationData.urgency || "Medium",
      });
      if (donationData.matchedNgoId) {
        createdDonation.matchedNgoId = donationData.matchedNgoId;
        createdDonation.matchedNgoName = donationData.matchedNgoName;
      }
      if (donationData.targetRequirementId) {
        createdDonation.targetRequirementId = donationData.targetRequirementId;
      }
    } catch (error) {
      console.error("Failed to create donation through the backend:", error);
      showToast(
        error instanceof Error
          ? `Donation was not saved: ${error.message}`
          : "Donation was not saved. Please try again.",
        "error",
      );
      throw error;
    }

    setDonations((prev) => [createdDonation, ...prev]);

    showToast("Donation successfully created!", "success");
    return createdDonation;
  };

  // Create a persisted donation request. Acceptance is a separate donor decision.
  const claimDonation = async (
    donationId: string,
    ngoId: string,
    proposedDate: string,
    notes: string,
  ): Promise<void> => {
    const ngo = ngos.find((n) => n.id === ngoId);
    if (!ngo) {
      showToast("Your NGO organization could not be found.", "error");
      throw new Error("NGO organization not found");
    }
    try {
      await donationRequestsApi.create({
        donation_id: donationId,
        proposed_pickup_date: proposedDate || undefined,
        notes,
      });
      showToast(
        "Donation request submitted. The donor must accept it before allocation.",
        "success",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not submit donation request.";
      showToast(message, "error");
      throw error;
    }
  };

  // Update Donation Status
  const updateDonationStatus = (
    donationId: string,
    status: DonationStatus,
    note?: string,
    actor?: string,
  ) => {
    setDonations((prev) =>
      prev.map((d) => {
        if (d.id !== donationId) return d;

        const currentStepName = status;
        const nowFormatted = new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const updatedTimeline = d.trackingTimeline.map((step) => {
          if (step.step === currentStepName) {
            return {
              ...step,
              completed: true,
              timestamp: nowFormatted,
              description: note || step.description,
              actor: actor || currentUser?.name || "Administrator",
            };
          }
          return step;
        });

        return {
          ...d,
          status,
          updatedAt: new Date().toISOString(),
          trackingTimeline: updatedTimeline,
        };
      }),
    );

    showToast(`Donation status updated to "${status}"`, "info");
  };

  // Log Distribution
  const logDistribution = (record: Omit<DistributionRecord, "id">) => {
    const newRecord: DistributionRecord = {
      ...record,
      id: `dist-${Date.now()}`,
    };

    setDistributions((prev) => [newRecord, ...prev]);

    // Update the donation status to Distributed
    setDonations((prev) =>
      prev.map((d) => {
        if (d.id !== record.donationId) return d;

        const nowFormatted = new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const updatedTimeline = d.trackingTimeline.map((step) => {
          if (step.step === "Distributed") {
            return {
              ...step,
              completed: true,
              timestamp: nowFormatted,
              title: `Distributed to ${record.beneficiariesReached} Beneficiaries`,
              description: record.impactReport,
              actor: record.ngoName,
              location: record.location,
            };
          }
          return step;
        });

        return {
          ...d,
          status: "Distributed" as DonationStatus,
          proofPhotos: record.proofImageUrl
            ? [record.proofImageUrl]
            : d.proofPhotos,
          beneficiaryNotes: record.impactReport,
          distributionDate: record.distributionDate,
          beneficiariesCount: record.beneficiariesReached,
          updatedAt: new Date().toISOString(),
          trackingTimeline: updatedTimeline,
        };
      }),
    );

    showToast("Distribution logged and impact report generated!", "success");
  };

  // Requirements are persisted by FastAPI; local state mirrors successful server responses.
  const addRequirement = async (
    reqData: Omit<
      Requirement,
      "id" | "createdAt" | "fulfilledQuantity" | "status"
    >,
  ): Promise<Requirement> => {
    if (
      !currentUser ||
      currentUser.role !== "ngo" ||
      !currentUser.organizationId
    ) {
      throw new Error(
        "Sign in with an NGO representative account linked to an organization.",
      );
    }
    const created = await requirementsApi.create({
      title: reqData.title,
      category: reqData.category,
      cause: reqData.cause,
      target_quantity: reqData.targetQuantity,
      unit: reqData.unit,
      urgency: reqData.urgency,
      description: reqData.description,
      beneficiary_group: reqData.beneficiaryGroup,
      needed_by_date: reqData.neededByDate || null,
    });
    setRequirements((prev) => [
      created,
      ...prev.filter((item) => item.id !== created.id),
    ]);
    showToast("Community requirement published and saved.", "success");
    return created;
  };

  const fulfillRequirement = async (
    requirementId: string,
    amount: number,
  ): Promise<void> => {
    const updated = await requirementsApi.recordFulfillment(
      requirementId,
      amount,
    );
    setRequirements((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
    showToast("Requirement fulfillment saved.", "success");
  };

  // Verification decisions are only reflected in the UI after the backend confirms persistence.
  const updateNgoVerification = async (
    ngoId: string,
    status: "verified" | "rejected" | "pending" | "under_review",
    reason?: string,
  ): Promise<void> => {
    const updated = await ngosApi.updateVerification(ngoId, {
      verification_status: status,
      reason: reason?.trim() || undefined,
    });
    setNgos((prev) => prev.map((ngo) => (ngo.id === ngoId ? updated : ngo)));
    showToast(
      `NGO verification status saved as ${status.replace("_", " ")}.`,
      status === "verified" ? "success" : "info",
    );
  };

  // Toggle user active / suspended
  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const newStatus = u.status === "active" ? "suspended" : "active";
        return { ...u, status: newStatus };
      }),
    );
    showToast("User account status updated", "info");
  };

  // Notification state changes are persisted by the authenticated backend.
  const markNotificationRead = async (id: string) => {
    try {
      const updated = await notificationsApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      showToast("Could not update notification. Please try again.", "error");
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showToast("All notifications marked as read", "info");
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      showToast("Could not update notifications. Please try again.", "error");
    }
  };

  // Reset Demo Data
  const resetDemoData = () => {
    localStorage.removeItem("kb_users");
    localStorage.removeItem("kb_current_user");
    localStorage.removeItem("kb_ngos");
    localStorage.removeItem("kb_donations");
    localStorage.removeItem("kb_requirements");
    localStorage.removeItem("kb_distributions");

    setUsers(INITIAL_USERS);
    void supabase.auth.signOut();
    setAuthToken(null);
    setCurrentUser(null);
    setNgos(INITIAL_NGOS);
    setDonations(INITIAL_DONATIONS);
    setRequirements(INITIAL_REQUIREMENTS);
    setDistributions(INITIAL_DISTRIBUTIONS);
    setNotifications([]);
    setCurrentView("public-landing");
    setSelectedDonationId("don-101");
    setSelectedNgoId("ngo-1");
    setSelectedRequirementId("req-1");

    showToast("Demo data reset to default seed state", "info");
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        ngos,
        donations,
        donationsLoadStatus,
        requirements,
        requirementsLoadStatus,
        distributions,
        notifications,
        theme,
        toggleTheme,
        currentView,
        setCurrentView,
        selectedDonationId,
        setSelectedDonationId,
        selectedNgoId,
        setSelectedNgoId,
        selectedRequirementId,
        setSelectedRequirementId,
        toasts,
        showToast,
        removeToast,
        login,
        switchRole,
        logout,
        register,
        registerNGOOrganization,
        updateNGOProfile,
        addDonation,
        claimDonation,
        updateDonationStatus,
        logDistribution,
        addRequirement,
        fulfillRequirement,
        updateNgoVerification,
        toggleUserStatus,
        markNotificationRead,
        markAllNotificationsRead,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};
