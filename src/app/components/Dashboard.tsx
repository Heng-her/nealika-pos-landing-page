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
  clearStoredAuthToken,
  getCurrentSubscription,
  getErrorMessage,
  getPackages,
  getProfile,
  isUnauthorizedError,
  logout,
  mapPackageToDisplayPackage,
  normalizeProfileAvatarUrl,
  uploadProfileAvatar,
  updateProfile,
  type CurrentSubscription,
  type DisplayPackage,
  type UserProfile,
} from "../services/posApi";

interface DashboardProps {
  onLogout: (options?: { redirectToLogin?: boolean }) => void;
}

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

  const subscribedPackageId = currentSubscription?.package_id || null;

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
    let isMounted = true;

    const loadDashboardData = async () => {
      setIsLoadingPackages(true);
      setIsLoadingSubscription(true);
      setIsLoadingProfile(true);
      setPackagesError("");
      setSubscriptionError("");
      setProfileError("");

      const [packagesResult, profileResult, subscriptionResult] =
        await Promise.allSettled([
          getPackages(),
          getProfile(),
          getCurrentSubscription(),
        ]);

      if (!isMounted) {
        return;
      }

      const unauthorizedResult = [profileResult, subscriptionResult].find(
        (result) =>
          result.status === "rejected" && isUnauthorizedError(result.reason),
      );

      if (unauthorizedResult) {
        onLogout({ redirectToLogin: true });
        return;
      }

      if (packagesResult.status === "fulfilled") {
        setServices(packagesResult.value.map(mapPackageToDisplayPackage));
      } else {
        const message = getErrorMessage(packagesResult.reason);
        setPackagesError(message);
      }

      if (profileResult.status === "fulfilled") {
        syncProfileState(profileResult.value);
      } else {
        const message = getErrorMessage(profileResult.reason);
        setProfileError(message);
      }

      if (subscriptionResult.status === "fulfilled") {
        setCurrentSubscription(subscriptionResult.value);
      } else {
        const message = getErrorMessage(subscriptionResult.reason);
        setSubscriptionError(message);
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

  const handleUnsubscribe = () => {
    alert(
      "Subscription cancellation is not connected in the current backend yet.",
    );
  };

  const handleUpgrade = (newPackageId: number) => {
    const selectedPackage = services.find(
      (service) => service.id === newPackageId,
    );
    if (selectedPackage) {
      setCheckoutPackage(selectedPackage);
    }
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
    } catch (error) {
      if (isUnauthorizedError(error)) {
        onLogout({ redirectToLogin: true });
        return;
      }

      const message = getErrorMessage(error);
      setPackagesError(message);
      setSubscriptionError(message);
      setProfileError(message);
    }
  };

  const handleCheckoutComplete = async () => {
    setCheckoutPackage(null);
    setSelectedServiceDetail(null);
    setActiveTab("services");
    setPaymentsRefreshKey((currentValue) => currentValue + 1);
    await refreshDashboardData();
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
          onLogout({ redirectToLogin: true });
          return;
        }

        setProfileError(getErrorMessage(refreshError));
      }
      toast.success("Profile updated successfully.");
      setIsEditingProfile(false);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        onLogout({ redirectToLogin: true });
        return;
      }

      setProfileError(getErrorMessage(error));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDashboardLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (!confirmLogout) {
      return;
    }

    try {
      await logout();
    } catch (error) {
      console.error("Logout request failed:", error);
      clearStoredAuthToken();
    }
    onLogout();
  };

  if (checkoutPackage) {
    return (
      <CheckoutPage
        packages={services}
        defaultPackageId={checkoutPackage.id}
        currentPackageId={subscribedPackageId}
        onBack={() => setCheckoutPackage(null)}
        onComplete={handleCheckoutComplete}
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
              onClick={handleDashboardLogout}
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
                profileError={profileError}
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

    </div>
  );
}
