import { useEffect, useMemo, useRef, useState } from "react";
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
  createPosLoginTicket,
  getCurrentSubscription,
  getErrorMessage,
  getPackages,
  getPosAccessInfo,
  getProfile,
  revealPosAccessPassword,
  getSubscriptionReminderStatus,
  isUnauthorizedError,
  logout,
  mapPackageToDisplayPackage,
  normalizeProfileAvatarUrl,
  regeneratePosAccessPassword,
  unsubscribeCurrentSubscription,
  type SubscriptionReminderStatus,
  uploadProfileAvatar,
  updateProfile,
  type CurrentSubscription,
  type DisplayPackage,
  type PosAccessInfo,
  type UserProfile,
} from "../services/posApi";

interface DashboardProps {
  onLogout: (options?: { redirectToLogin?: boolean }) => void;
}

const SUBSCRIPTION_EXPIRY_REMINDER_DAYS = 7;
const SUBSCRIPTION_REMINDER_PREFERENCE_KEY =
  "subscription_expiry_alert_preference";

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

function getReminderPreferenceStorageKey(
  subscription?: CurrentSubscription | null,
) {
  if (!subscription) {
    return "";
  }

  const userId = subscription.user_id ?? "current";
  const subscriptionId =
    subscription.id ?? subscription.package_id ?? "active-subscription";

  return `${SUBSCRIPTION_REMINDER_PREFERENCE_KEY}:${String(userId)}:${String(
    subscriptionId,
  )}`;
}

function readStoredReminderPreference(
  subscription?: CurrentSubscription | null,
) {
  if (typeof window === "undefined" || !subscription) {
    return null;
  }

  const storageKey = getReminderPreferenceStorageKey(subscription);
  if (!storageKey) {
    return null;
  }

  const storedValue = window.localStorage.getItem(storageKey);
  if (storedValue === "1") {
    return true;
  }

  if (storedValue === "0") {
    return false;
  }

  return null;
}

function writeStoredReminderPreference(
  subscription: CurrentSubscription | null,
  enabled: boolean,
) {
  if (typeof window === "undefined" || !subscription) {
    return;
  }

  const storageKey = getReminderPreferenceStorageKey(subscription);
  if (!storageKey) {
    return;
  }

  window.localStorage.setItem(storageKey, enabled ? "1" : "0");
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
  const [accessError, setAccessError] = useState("");
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [isLoadingAccessInfo, setIsLoadingAccessInfo] = useState(true);
  const [paymentsRefreshKey, setPaymentsRefreshKey] = useState(0);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUnsubscribeDialogOpen, setIsUnsubscribeDialogOpen] = useState(false);
  const [isUpdatingSubscription, setIsUpdatingSubscription] = useState(false);
  const [isOpeningPos, setIsOpeningPos] = useState(false);
  const [isRegeneratingPosPassword, setIsRegeneratingPosPassword] =
    useState(false);
  const [isRevealingPosPassword, setIsRevealingPosPassword] = useState(false);
  const [isExpiryReminderDialogOpen, setIsExpiryReminderDialogOpen] =
    useState(false);
  const [hasEvaluatedExpiryReminder, setHasEvaluatedExpiryReminder] =
    useState(false);
  const [isReminderAlertEnabled, setIsReminderAlertEnabled] = useState<
    boolean | null
  >(null);
  const [reminderStatus, setReminderStatus] =
    useState<SubscriptionReminderStatus | null>(null);
  const [accessInfo, setAccessInfo] = useState<PosAccessInfo | null>(null);
  const previousAutoRenewStateRef = useRef<boolean | null>(null);

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
    if (isReminderAlertEnabled !== true) {
      return null;
    }

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
  }, [
    currentSubscription,
    currentSubscriptionPackage,
    fallbackExpiryReminder,
    isReminderAlertEnabled,
    reminderStatus,
  ]);
  const showReminderAlertSection = useMemo(() => {
    if (
      !currentSubscription ||
      !isAutoRenewEnabled(currentSubscription.auto_renew)
    ) {
      return false;
    }

    if (reminderStatus) {
      if (
        reminderStatus.should_remind === true ||
        reminderStatus.reason === "within_reminder_window"
      ) {
        return true;
      }

      if (
        typeof reminderStatus.days_left === "number" &&
        typeof reminderStatus.reminder_days === "number"
      ) {
        return (
          reminderStatus.days_left >= 0 &&
          reminderStatus.days_left <= reminderStatus.reminder_days
        );
      }

      return false;
    }

    const daysRemaining = getDaysUntilDate(currentSubscription.expire_date);
    return (
      daysRemaining !== null &&
      daysRemaining >= 0 &&
      daysRemaining <= SUBSCRIPTION_EXPIRY_REMINDER_DAYS
    );
  }, [currentSubscription, reminderStatus]);

  useEffect(() => {
    if (!currentSubscription) {
      setIsReminderAlertEnabled(null);
      previousAutoRenewStateRef.current = null;
      return;
    }

    const storedPreference = readStoredReminderPreference(currentSubscription);
    setIsReminderAlertEnabled(storedPreference ?? true);
  }, [
    currentSubscription?.id,
    currentSubscription?.package_id,
    currentSubscription?.user_id,
  ]);

  useEffect(() => {
    if (!currentSubscription) {
      return;
    }

    const isCurrentAutoRenewEnabled = isAutoRenewEnabled(
      currentSubscription.auto_renew,
    );

    if (
      previousAutoRenewStateRef.current === false &&
      isCurrentAutoRenewEnabled
    ) {
      setIsReminderAlertEnabled(true);
      writeStoredReminderPreference(currentSubscription, true);
    }

    previousAutoRenewStateRef.current = isCurrentAutoRenewEnabled;
  }, [
    currentSubscription?.auto_renew,
    currentSubscription?.id,
    currentSubscription?.package_id,
    currentSubscription?.user_id,
  ]);

  useEffect(() => {
    if (!isReminderAlertEnabled) {
      setIsExpiryReminderDialogOpen(false);
    }
  }, [isReminderAlertEnabled]);

  const syncProfileState = (latestProfile?: UserProfile | null) => {
    const nextProfile = toProfileForm(latestProfile);
    setProfile(nextProfile);
    setSavedProfile(nextProfile);
  };

  useEffect(() => {
    if (
      isLoadingSubscription ||
      isLoadingPackages ||
      isReminderAlertEnabled === null ||
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
    isReminderAlertEnabled,
    isLoadingPackages,
    isLoadingSubscription,
  ]);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      setIsLoadingPackages(true);
      setIsLoadingSubscription(true);
      setIsLoadingAccessInfo(true);
      setIsLoadingProfile(true);
      setPackagesError("");
      setSubscriptionError("");
      setProfileError("");
      setAccessError("");

      const [
        packagesResult,
        profileResult,
        subscriptionResult,
        reminderStatusResult,
        accessInfoResult,
      ] =
        await Promise.allSettled([
          getPackages(),
          getProfile(),
          getCurrentSubscription(),
          getSubscriptionReminderStatus(),
          getPosAccessInfo(),
        ]);

      if (!isMounted) {
        return;
      }

      const unauthorizedResult = [
        profileResult,
        subscriptionResult,
        reminderStatusResult,
        accessInfoResult,
      ].find(
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

      if (accessInfoResult.status === "fulfilled") {
        setAccessInfo(accessInfoResult.value);
      } else {
        const message = getErrorMessage(accessInfoResult.reason);
        setAccessInfo(null);
        setAccessError(message);
        toast.error(message);
      }

      if (reminderStatusResult.status === "fulfilled") {
        setReminderStatus(reminderStatusResult.value);
      } else {
        setReminderStatus(null);
      }

      setIsLoadingPackages(false);
      setIsLoadingSubscription(false);
      setIsLoadingAccessInfo(false);
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

  const handleToggleReminderAlert = (enabled: boolean) => {
    setIsReminderAlertEnabled(enabled);

    if (currentSubscription) {
      writeStoredReminderPreference(currentSubscription, enabled);
    }

    if (!enabled) {
      setIsExpiryReminderDialogOpen(false);
      toast.success("Expiry reminder alerts turned off.");
      return;
    }

    toast.success("Expiry reminder alerts turned on.");

    if (reminderStatus?.should_remind || fallbackExpiryReminder) {
      setHasEvaluatedExpiryReminder(true);
      setIsExpiryReminderDialogOpen(true);
    }
  };

  const refreshAccessInfoState = async () => {
    try {
      const latestAccessInfo = await getPosAccessInfo();
      setAccessInfo(latestAccessInfo);
      return latestAccessInfo;
    } catch (error) {
      if (isUnauthorizedError(error)) {
        toast.error(getErrorMessage(error));
        onLogout({ redirectToLogin: true });
        return null;
      }

      const message = getErrorMessage(error);
      setAccessInfo(null);
      setAccessError(message);
      return null;
    }
  };

  const handleOpenPos = async () => {
    if (!accessInfo || accessInfo.locked) {
      toast.error(
        accessInfo?.message ||
          "Please subscribe to a package to unlock POS access.",
      );
      return;
    }

    setIsOpeningPos(true);
    setAccessError("");

    const pendingWindow = window.open("", "_blank");

    try {
      const loginTicketUrl = await createPosLoginTicket();

      if (pendingWindow) {
        pendingWindow.location.href = loginTicketUrl;
      } else {
        window.open(loginTicketUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      if (pendingWindow && !pendingWindow.closed) {
        pendingWindow.close();
      }

      if (isUnauthorizedError(error)) {
        toast.error(getErrorMessage(error));
        onLogout({ redirectToLogin: true });
        return;
      }

      const message = getErrorMessage(error);
      await refreshAccessInfoState();
      setAccessError(message);
      toast.error(message);
    } finally {
      setIsOpeningPos(false);
    }
  };

  const handleRegeneratePassword = async () => {
    if (!accessInfo || accessInfo.locked) {
      toast.error("POS access is locked until you subscribe.");
      return;
    }

    setIsRegeneratingPosPassword(true);
    setAccessError("");

    try {
      await regeneratePosAccessPassword();
      await refreshAccessInfoState();
      toast.success("POS password regenerated successfully.");
    } catch (error) {
      if (isUnauthorizedError(error)) {
        toast.error(getErrorMessage(error));
        onLogout({ redirectToLogin: true });
        return;
      }

      const message = getErrorMessage(error);
      await refreshAccessInfoState();
      setAccessError(message);
      toast.error(message);
    } finally {
      setIsRegeneratingPosPassword(false);
    }
  };

  const handleRevealPassword = async () => {
    if (!accessInfo || accessInfo.locked || !accessInfo.access) {
      return false;
    }

    setIsRevealingPosPassword(true);
    setAccessError("");

    try {
      const revealedPassword = await revealPosAccessPassword();
      setAccessInfo((currentValue) =>
        currentValue?.access
          ? {
              ...currentValue,
              access: {
                ...currentValue.access,
                password: revealedPassword,
              },
            }
          : currentValue,
      );
      return Boolean(revealedPassword);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        toast.error(getErrorMessage(error));
        onLogout({ redirectToLogin: true });
        return false;
      }

      const message = getErrorMessage(error);
      await refreshAccessInfoState();
      setAccessError(message);
      toast.error(message);
      return false;
    } finally {
      setIsRevealingPosPassword(false);
    }
  };

  const refreshSubscriptionViews = async () => {
    setSubscriptionError("");
    setAccessError("");
    setIsLoadingSubscription(true);
    setIsLoadingAccessInfo(true);

    const [subscriptionResult, latestAccessInfoResult, latestReminderStatusResult] =
      await Promise.allSettled([
        getCurrentSubscription(),
        getPosAccessInfo(),
        getSubscriptionReminderStatus(),
      ]);

    const unauthorizedResult = [
      subscriptionResult,
      latestAccessInfoResult,
      latestReminderStatusResult,
    ].find(
      (result): result is PromiseRejectedResult =>
        result.status === "rejected" && isUnauthorizedError(result.reason),
    );

    if (unauthorizedResult) {
      toast.error(getErrorMessage(unauthorizedResult.reason));
      onLogout({ redirectToLogin: true });
      return;
    }

    if (subscriptionResult.status === "fulfilled") {
      setCurrentSubscription(subscriptionResult.value);
    } else {
      const message = getErrorMessage(subscriptionResult.reason);
      setSubscriptionError(message);
      toast.error(message);
    }

    if (latestAccessInfoResult.status === "fulfilled") {
      setAccessInfo(latestAccessInfoResult.value);
    } else {
      const message = getErrorMessage(latestAccessInfoResult.reason);
      setAccessInfo(null);
      setAccessError(message);
      toast.error(message);
    }

    if (latestReminderStatusResult.status === "fulfilled") {
      setReminderStatus(latestReminderStatusResult.value);
    } else {
      setReminderStatus(null);
    }

    setIsLoadingSubscription(false);
    setIsLoadingAccessInfo(false);
  };

  const refreshDashboardData = async () => {
    setPackagesError("");
    setSubscriptionError("");
    setProfileError("");
    setAccessError("");
    setIsLoadingAccessInfo(true);

    const [
      packagesResult,
      latestProfileResult,
      subscriptionResult,
      latestAccessInfoResult,
      latestReminderStatusResult,
    ] = await Promise.allSettled([
        getPackages(),
        getProfile(),
        getCurrentSubscription(),
        getPosAccessInfo(),
      getSubscriptionReminderStatus(),
    ]);

    const unauthorizedResult = [
      latestProfileResult,
      subscriptionResult,
      latestAccessInfoResult,
      latestReminderStatusResult,
    ].find(
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

    if (latestProfileResult.status === "fulfilled") {
      syncProfileState(latestProfileResult.value);
    } else {
      const message = getErrorMessage(latestProfileResult.reason);
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

    if (latestAccessInfoResult.status === "fulfilled") {
      setAccessInfo(latestAccessInfoResult.value);
    } else {
      const message = getErrorMessage(latestAccessInfoResult.reason);
      setAccessInfo(null);
      setAccessError(message);
      toast.error(message);
    }

    if (latestReminderStatusResult.status === "fulfilled") {
      setReminderStatus(latestReminderStatusResult.value);
    } else {
      setReminderStatus(null);
    }

    setIsLoadingAccessInfo(false);
  };

  useEffect(() => {
    if (activeTab !== "services" && activeTab !== "access") {
      return;
    }

    void refreshSubscriptionViews();
  }, [activeTab]);

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
      setIsReminderAlertEnabled(false);
      writeStoredReminderPreference(currentSubscription, false);
      setIsExpiryReminderDialogOpen(false);
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
              <AccessInfoPage
                accessInfo={accessInfo}
                error={accessError}
                isLoading={isLoadingAccessInfo}
                isOpeningPos={isOpeningPos}
                isRegeneratingPassword={isRegeneratingPosPassword}
                isRevealingPassword={isRevealingPosPassword}
                onOpenPos={handleOpenPos}
                onRegeneratePassword={handleRegeneratePassword}
                onRevealPassword={handleRevealPassword}
                onViewPackages={() => setActiveTab("services")}
              />
            )}

            {activeTab === "services" && (
              <PackagesPage
                services={services}
                subscribedPackageId={subscribedPackageId}
                currentSubscription={currentSubscription}
                isReminderAlertEnabled={Boolean(isReminderAlertEnabled)}
                showReminderAlertSection={showReminderAlertSection}
                selectedServiceDetail={selectedServiceDetail}
                setSelectedServiceDetail={setSelectedServiceDetail}
                isLoadingPackages={isLoadingPackages}
                isLoadingSubscription={isLoadingSubscription}
                isUpdatingSubscription={isUpdatingSubscription}
                packagesError={packagesError}
                subscriptionError={subscriptionError}
                onSubscribe={handleSubscribe}
                onToggleReminderAlert={handleToggleReminderAlert}
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
              {expiryReminder ? (
                <>
                  Your {expiryReminder.packageName} plan expires in <strong>{expiryReminder.daysRemaining}</strong> day{expiryReminder.daysRemaining === 1 ? "" : "s"} on <strong>{expiryReminder.expiryDateLabel}</strong>. Continue your plan now to avoid interruption.
                  {expiryReminder.channels.length ? (
                    <> We will also remind you by {expiryReminder.channels.join(", ")}.</>
                  ) : null}
                </>
              ) : (
                "Your subscription expires soon. Continue your plan now to avoid interruption."
              )}
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