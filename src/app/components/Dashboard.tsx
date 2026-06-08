import { useEffect, useMemo, useState } from "react";
import { Key, LogOut, Settings, User, Wallet } from "lucide-react";
import { toast } from "sonner";
import logo from "@/imports/logo-nealika.png";
import CheckoutPage from "./CheckoutPage";
import PaymentPage from "./PaymentPage";
import ProfilePage, { type ProfileFormState } from "./ProfilePage";
import AccessInfoPage from "./AccessInfoPage";
import PackagesPage from "./PackagesPage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  clearStoredAuthToken,
  getCurrentSubscription,
  getErrorMessage,
  getPackages,
  getProfile,
  getSubscriptionReminderStatus,
  isUnauthorizedError,
  logout,
  mapPackageToDisplayPackage,
  normalizeProfileAvatarUrl,
  unsubscribeCurrentSubscription,
  type SubscriptionReminderStatus,
  uploadProfileAvatar,
  updateProfile,
  type CurrentSubscription,
  type DisplayPackage,
  type UserProfile,
} from "../services/posApi";

interface DashboardProps {
  onLogout: (options?: { redirectToLogin?: boolean }) => void;
}

const SUBSCRIPTION_EXPIRY_REMINDER_DAYS = 7;

function toProfileForm(profile?: UserProfile | null): ProfileFormState {
  const avatarUrl = normalizeProfileAvatarUrl(profile?.avatar);

  return {
    username: profile?.username || profile?.name || "",
    nickname: profile?.nickname || "",
    email: profile?.email || "",
    mobile: profile?.mobile || profile?.phone || "",
    bio: profile?.bio || "",
    businessName: profile?.business_name || "",
    address: profile?.address || "",
    avatarUrl,
    avatarPreviewUrl: avatarUrl,
    pendingAvatarFile: null,
    hasPendingAvatarChange: false,
  };
}

function formatDateValue(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDurationLabel(months?: number) {
  if (!months) {
    return "-";
  }

  if (months === 1) {
    return "1 month";
  }

  return `${months} months`;
}

function isAutoRenewEnabled(value?: boolean | number | null) {
  return value === true || Number(value || 0) === 1;
}

function getDaysUntilDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const targetDate = new Date(value);
  if (Number.isNaN(targetDate.getTime())) {
    return null;
  }

  return Math.ceil(
    (targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

function getReminderChannelLabels(status?: SubscriptionReminderStatus | null) {
  if (!status?.channels) {
    return [];
  }

  const labels: string[] = [];

  if (status.channels.sms) {
    labels.push("mobile");
  }

  if (status.channels.email) {
    labels.push("email");
  }

  if (status.channels.telegram) {
    labels.push("Telegram");
  }

  return labels;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "profile" | "services" | "payments" | "access"
  >("profile");
  const [checkoutPackage, setCheckoutPackage] = useState<DisplayPackage | null>(
    null,
  );
  const [services, setServices] = useState<DisplayPackage[]>([]);
  const [selectedServiceDetail, setSelectedServiceDetail] =
    useState<DisplayPackage | null>(null);
  const [currentSubscription, setCurrentSubscription] =
    useState<CurrentSubscription | null>(null);
  const [profile, setProfile] = useState<ProfileFormState>(toProfileForm(null));
  const [savedProfile, setSavedProfile] = useState<ProfileFormState>(
    toProfileForm(null),
  );
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [packagesError, setPackagesError] = useState("");
  const [subscriptionError, setSubscriptionError] = useState("");
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [paymentsRefreshKey, setPaymentsRefreshKey] = useState(0);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUnsubscribeDialogOpen, setIsUnsubscribeDialogOpen] = useState(false);
  const [isUpdatingSubscription, setIsUpdatingSubscription] = useState(false);
  const [isExpiryReminderDialogOpen, setIsExpiryReminderDialogOpen] =
    useState(false);
  const [hasEvaluatedExpiryReminder, setHasEvaluatedExpiryReminder] =
    useState(false);
  const [reminderStatus, setReminderStatus] =
    useState<SubscriptionReminderStatus | null>(null);

  const subscribedPackageId = currentSubscription?.package_id || null;
  const currentSubscriptionPackage = useMemo(() => {
    return (
      services.find((service) => service.id === subscribedPackageId) || null
    );
  }, [services, subscribedPackageId]);
  const fallbackExpiryReminder = useMemo(() => {
    if (!currentSubscription || isAutoRenewEnabled(currentSubscription.auto_renew)) {
      return null;
    }

    const daysRemaining = getDaysUntilDate(currentSubscription.expire_date);
    if (
      daysRemaining === null ||
      daysRemaining < 0 ||
      daysRemaining > SUBSCRIPTION_EXPIRY_REMINDER_DAYS
    ) {
      return null;
    }

    return {
      daysRemaining,
      packageName:
        currentSubscription.package_name ||
        currentSubscriptionPackage?.name ||
        "your current plan",
      expiryDateLabel: formatDateValue(currentSubscription.expire_date),
      channels: [] as string[],
    };
  }, [currentSubscription, currentSubscriptionPackage]);
  const expiryReminder = useMemo(() => {
    if (reminderStatus?.should_remind) {
      return {
        daysRemaining:
          typeof reminderStatus.days_left === "number"
            ? reminderStatus.days_left
            : getDaysUntilDate(currentSubscription?.expire_date) || 0,
        packageName:
          currentSubscription?.package_name ||
          currentSubscriptionPackage?.name ||
          "your current plan",
        expiryDateLabel: formatDateValue(currentSubscription?.expire_date),
        channels: getReminderChannelLabels(reminderStatus),
      };
    }

    if (reminderStatus && reminderStatus.should_remind === false) {
      return null;
    }

    return fallbackExpiryReminder;
  }, [currentSubscription, currentSubscriptionPackage, fallbackExpiryReminder, reminderStatus]);

  const accessInfo = useMemo(() => {
    return {
      posUrl: currentSubscription
        ? "Provisioned after POS access API is connected"
        : "No active subscription",
      username: currentSubscription ? "Provisioning" : "Not available",
      password: "********",
      email: profile.email || "Not available",
    };
  }, [currentSubscription, profile.email]);

  const syncProfileState = (latestProfile?: UserProfile | null) => {
    const nextProfile = toProfileForm(latestProfile);
    setProfile(nextProfile);
    setSavedProfile(nextProfile);
  };

  useEffect(() => {
    if (
      isLoadingSubscription ||
      isLoadingPackages ||
      hasEvaluatedExpiryReminder
    ) {
      return;
    }

    setHasEvaluatedExpiryReminder(true);

    if (expiryReminder) {
      setIsExpiryReminderDialogOpen(true);
    }
  }, [
    expiryReminder,
    hasEvaluatedExpiryReminder,
    isLoadingPackages,
    isLoadingSubscription,
  ]);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      setIsLoadingPackages(true);
      setIsLoadingSubscription(true);
      setIsLoadingProfile(true);
      setPackagesError("");
      setSubscriptionError("");
      setProfileError("");

      const [packagesResult, profileResult, subscriptionResult, reminderStatusResult] =
        await Promise.allSettled([
          getPackages(),
          getProfile(),
          getCurrentSubscription(),
          getSubscriptionReminderStatus(),
        ]);

      if (!isMounted) {
        return;
      }

      const unauthorizedResult = [profileResult, subscriptionResult, reminderStatusResult].find(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected" && isUnauthorizedError(result.reason),
      );

      if (unauthorizedResult) {
        toast.error(getErrorMessage(unauthorizedResult.reason));
        onLogout({ redirectToLogin: true });
        return;
      }

      if (packagesResult.status === "fulfilled") {
        setServices(packagesResult.value.map(mapPackageToDisplayPackage));
      } else {
        const message = getErrorMessage(packagesResult.reason);
        setPackagesError(message);
        toast.error(message);
      }

      if (profileResult.status === "fulfilled") {
        syncProfileState(profileResult.value);
      } else {
        const message = getErrorMessage(profileResult.reason);
        setProfileError(message);
        toast.error(message);
      }

      if (subscriptionResult.status === "fulfilled") {
        setCurrentSubscription(subscriptionResult.value);
      } else {
        const message = getErrorMessage(subscriptionResult.reason);
        setSubscriptionError(message);
        toast.error(message);
      }

      if (reminderStatusResult.status === "fulfilled") {
        setReminderStatus(reminderStatusResult.value);
      } else {
        setReminderStatus(null);
      }

      setIsLoadingPackages(false);
      setIsLoadingSubscription(false);
      setIsLoadingProfile(false);
    };

    void loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [onLogout]);

  const handleSubscribe = (packageId: number) => {
    const selectedPackage = services.find(
      (service) => service.id === packageId,
    );
    if (selectedPackage) {
      setCheckoutPackage(selectedPackage);
    }
  };

  const handleUpgrade = (newPackageId: number) => {
    const selectedPackage = services.find(
      (service) => service.id === newPackageId,
    );
    if (selectedPackage) {
      setCheckoutPackage(selectedPackage);
    }
  };

  const handleUnsubscribe = () => {
    setIsUnsubscribeDialogOpen(true);
  };

  const refreshDashboardData = async () => {
    setPackagesError("");
    setSubscriptionError("");
    setProfileError("");

    try {
      const [packages, latestProfile, subscription] = await Promise.all([
        getPackages(),
        getProfile(),
        getCurrentSubscription(),
      ]);

      setServices(packages.map(mapPackageToDisplayPackage));
      syncProfileState(latestProfile);
      setCurrentSubscription(subscription);

      try {
        const latestReminderStatus = await getSubscriptionReminderStatus();
        setReminderStatus(latestReminderStatus);
      } catch (reminderError) {
        if (isUnauthorizedError(reminderError)) {
          toast.error(getErrorMessage(reminderError));
          onLogout({ redirectToLogin: true });
          return;
        }

        setReminderStatus(null);
      }
    } catch (error) {
      if (isUnauthorizedError(error)) {
        toast.error(getErrorMessage(error));
        onLogout({ redirectToLogin: true });
        return;
      }

      const message = getErrorMessage(error);
      setPackagesError(message);
      setSubscriptionError(message);
      setProfileError(message);
      toast.error(message);
    }
  };

  const handleCheckoutComplete = async () => {
    setCheckoutPackage(null);
    setSelectedServiceDetail(null);
    setActiveTab("services");
    setPaymentsRefreshKey((currentValue) => currentValue + 1);
    await refreshDashboardData();
  };

  const handleConfirmUnsubscribe = async () => {
    if (!currentSubscription) {
      setIsUnsubscribeDialogOpen(false);
      return;
    }

    setIsUpdatingSubscription(true);
    setSubscriptionError("");

    try {
      await unsubscribeCurrentSubscription(currentSubscription.id);
      setCurrentSubscription((currentValue) =>
        currentValue
          ? {
              ...currentValue,
              auto_renew: false,
            }
          : currentValue,
      );
      setIsUnsubscribeDialogOpen(false);
      toast.success("Auto-renew has been turned off.");
      await refreshDashboardData();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        toast.error(getErrorMessage(error));
        onLogout({ redirectToLogin: true });
        return;
      }

      const message = getErrorMessage(error);
      setSubscriptionError(message);
      toast.error(message);
    } finally {
      setIsUpdatingSubscription(false);
    }
  };

  const handleContinuePlanFromReminder = () => {
    setIsExpiryReminderDialogOpen(false);

    if (currentSubscriptionPackage) {
      setCheckoutPackage(currentSubscriptionPackage);
      return;
    }

    setActiveTab("services");
  };

  const handleUpdateProfile = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setIsSavingProfile(true);
    setProfileError("");

    try {
      let avatarPath: string | undefined;

      if (profile.pendingAvatarFile) {
        avatarPath = await uploadProfileAvatar(profile.pendingAvatarFile);
      }

      const updatedProfile = await updateProfile({
        username: String(formData.get("username") || "").trim(),
        nickname: String(formData.get("nickname") || "").trim(),
        bio: String(formData.get("bio") || "").trim(),
        business_name: String(formData.get("business_name") || "").trim(),
        address: String(formData.get("address") || "").trim(),
        ...(avatarPath ? { avatar: avatarPath } : {}),
      });

      syncProfileState(updatedProfile);
      try {
        const confirmedProfile = await getProfile();
        syncProfileState(confirmedProfile);
      } catch (refreshError) {
        if (isUnauthorizedError(refreshError)) {
          toast.error(getErrorMessage(refreshError));
          onLogout({ redirectToLogin: true });
          return;
        }

        const message = getErrorMessage(refreshError);
        setProfileError(message);
        toast.error(message);
      }
      toast.success("Profile updated successfully.");
      setIsEditingProfile(false);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        toast.error(getErrorMessage(error));
        onLogout({ redirectToLogin: true });
        return;
      }

      const message = getErrorMessage(error);
      setProfileError(message);
      toast.error(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDashboardLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setIsLogoutDialogOpen(false);
      toast.success("Logged out successfully.");
    } catch (error) {
      console.error("Logout request failed:", error);
      toast.error(getErrorMessage(error));
      clearStoredAuthToken();
    } finally {
      setIsLoggingOut(false);
    }
    onLogout();
  };

  if (checkoutPackage) {
    return (
      <CheckoutPage
        packages={services}
        defaultPackageId={checkoutPackage.id}
        currentPackageId={subscribedPackageId}
        mode="standard"
        freeTrialCouponCode=""
        onBack={() => setCheckoutPackage(null)}
        onComplete={handleCheckoutComplete}
        onOpenTerms={() =>
          window.open("/terms-of-service", "_blank", "noopener,noreferrer")
        }
        onOpenPrivacy={() =>
          window.open("/privacy-policy", "_blank", "noopener,noreferrer")
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Nealika" className="h-10" />
            </div>
            <button
              onClick={() => setIsLogoutDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-24 w-full overflow-hidden lg:overflow-visible">
              <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 whitespace-nowrap lg:whitespace-normal scrollbar-none">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`flex items-center gap-2 lg:gap-3 px-3.5 py-2.5 lg:px-4 lg:py-3 rounded-lg transition-colors shrink-0 lg:w-full text-sm lg:text-base font-medium ${
                    activeTab === "profile"
                      ? "bg-blue-600 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <User className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab("access")}
                  className={`flex items-center gap-2 lg:gap-3 px-3.5 py-2.5 lg:px-4 lg:py-3 rounded-lg transition-colors shrink-0 lg:w-full text-sm lg:text-base font-medium ${
                    activeTab === "access"
                      ? "bg-blue-600 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Key className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
                  POS Access Info
                </button>
                <button
                  onClick={() => setActiveTab("services")}
                  className={`flex items-center gap-2 lg:gap-3 px-3.5 py-2.5 lg:px-4 lg:py-3 rounded-lg transition-colors shrink-0 lg:w-full text-sm lg:text-base font-medium ${
                    activeTab === "services"
                      ? "bg-blue-600 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Settings className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
                  Packages
                </button>
                <button
                  onClick={() => setActiveTab("payments")}
                  className={`flex items-center gap-2 lg:gap-3 px-3.5 py-2.5 lg:px-4 lg:py-3 rounded-lg transition-colors shrink-0 lg:w-full text-sm lg:text-base font-medium ${
                    activeTab === "payments"
                      ? "bg-blue-600 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Wallet className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
                  Payments
                </button>
              </nav>
            </div>
          </div>

          <div className="lg:col-span-3 min-w-0">
            {activeTab === "profile" && (
              <ProfilePage
                profile={profile}
                setProfile={setProfile}
                logo={logo}
                isEditingProfile={isEditingProfile}
                setIsEditingProfile={setIsEditingProfile}
                isLoadingProfile={isLoadingProfile}
                isSavingProfile={isSavingProfile}
                onCancelEdit={() => {
                  setProfile(savedProfile);
                  setIsEditingProfile(false);
                }}
                onUpdateProfile={handleUpdateProfile}
              />
            )}

            {activeTab === "access" && (
              <AccessInfoPage accessInfo={accessInfo} />
            )}

            {activeTab === "services" && (
              <PackagesPage
                services={services}
                subscribedPackageId={subscribedPackageId}
                currentSubscription={currentSubscription}
                selectedServiceDetail={selectedServiceDetail}
                setSelectedServiceDetail={setSelectedServiceDetail}
                isLoadingPackages={isLoadingPackages}
                isLoadingSubscription={isLoadingSubscription}
                isUpdatingSubscription={isUpdatingSubscription}
                packagesError={packagesError}
                subscriptionError={subscriptionError}
                onSubscribe={handleSubscribe}
                onUnsubscribe={handleUnsubscribe}
                onUpgrade={handleUpgrade}
              />
            )}

            {activeTab === "payments" && (
              <PaymentPage refreshKey={paymentsRefreshKey} />
            )}
          </div>
        </div>
      </div>

      <AlertDialog
        open={isExpiryReminderDialogOpen}
        onOpenChange={setIsExpiryReminderDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Subscription Expiring Soon</AlertDialogTitle>
            <AlertDialogDescription>
              {expiryReminder
                ? `Your ${expiryReminder.packageName} plan expires in ${expiryReminder.daysRemaining} day${expiryReminder.daysRemaining === 1 ? "" : "s"} on ${expiryReminder.expiryDateLabel}. Continue your plan now to avoid interruption.${expiryReminder.channels.length ? ` We will also remind you by ${expiryReminder.channels.join(", ")}.` : ""}`
                : "Your subscription expires soon. Continue your plan now to avoid interruption."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={handleContinuePlanFromReminder}>
              Continue Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isUnsubscribeDialogOpen}
        onOpenChange={(open) => {
          if (!isUpdatingSubscription) {
            setIsUnsubscribeDialogOpen(open);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsubscribe</AlertDialogTitle>
            <AlertDialogDescription>
              Turn off auto-renew for your current package? Your subscription
              will stay active until{" "}
              {formatDateValue(currentSubscription?.expire_date)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingSubscription}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmUnsubscribe}
              disabled={isUpdatingSubscription}
              className="bg-red-600 hover:bg-red-700"
            >
              {isUpdatingSubscription ? "Updating..." : "Yes, unsubscribe"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isLogoutDialogOpen}
        onOpenChange={(open) => {
          if (!isLoggingOut) {
            setIsLogoutDialogOpen(open);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDashboardLogout}
              disabled={isLoggingOut}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoggingOut ? "Logging out..." : "Yes, logout"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
