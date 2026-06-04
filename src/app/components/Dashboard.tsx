import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Edit2,
  Eye,
  EyeOff,
  Key,
  LogOut,
  Settings,
  User,
  Wallet,
} from "lucide-react";
import logo from "@/imports/logo-nealika.png";
import CheckoutPage from "./CheckoutPage";
import PaymentPage from "./PaymentPage";
import {
  clearStoredAuthToken,
  getCurrentSubscription,
  getErrorMessage,
  getPackages,
  getProfile,
  mapPackageToDisplayPackage,
  updateProfile,
  type CurrentSubscription,
  type DisplayPackage,
  type UserProfile,
} from "../services/posApi";

interface DashboardProps {
  onLogout: () => void;
}

interface ProfileFormState {
  name: string;
  email: string;
  phone: string;
  business: string;
  address: string;
}

function toProfileForm(profile?: UserProfile | null): ProfileFormState {
  return {
    name: profile?.name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    business: profile?.business_name || "",
    address: profile?.address || "",
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
  const [profile, setProfile] = useState<ProfileFormState>(
    toProfileForm(null),
  );
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccessMessage, setProfileSuccessMessage] = useState("");
  const [packagesError, setPackagesError] = useState("");
  const [subscriptionError, setSubscriptionError] = useState("");
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
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

      if (packagesResult.status === "fulfilled") {
        setServices(packagesResult.value.map(mapPackageToDisplayPackage));
      } else {
        const message = getErrorMessage(packagesResult.reason);
        setPackagesError(message);
      }

      if (profileResult.status === "fulfilled") {
        setProfile(toProfileForm(profileResult.value));
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

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubscribe = (packageId: number) => {
    const selectedPackage = services.find((service) => service.id === packageId);
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
    const selectedPackage = services.find((service) => service.id === newPackageId);
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
      setProfile(toProfileForm(latestProfile));
      setCurrentSubscription(subscription);
    } catch (error) {
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
    setProfileSuccessMessage("");

    try {
      const updatedProfile = await updateProfile({
        name: String(formData.get("name") || ""),
        email: String(formData.get("email") || ""),
        phone: String(formData.get("phone") || ""),
        business_name: String(formData.get("business") || ""),
        address: String(formData.get("address") || ""),
      });

      setProfile(toProfileForm(updatedProfile));
      setProfileSuccessMessage("Profile updated successfully.");
      setIsEditingProfile(false);
    } catch (error) {
      setProfileError(getErrorMessage(error));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCopyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDashboardLogout = () => {
    clearStoredAuthToken();
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-24">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === "profile"
                      ? "bg-blue-600 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <User className="w-5 h-5" />
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab("access")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === "access"
                      ? "bg-blue-600 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Key className="w-5 h-5" />
                  POS Access Info
                </button>
                <button
                  onClick={() => setActiveTab("services")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === "services"
                      ? "bg-blue-600 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  Packages
                </button>
                <button
                  onClick={() => setActiveTab("payments")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === "payments"
                      ? "bg-blue-600 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Wallet className="w-5 h-5" />
                  Payments
                </button>
              </nav>
            </div>
          </div>

          <div className="lg:col-span-3">
            {activeTab === "profile" && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Profile Information
                  </h2>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                </div>

                {profileError ? (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                    {profileError}
                  </div>
                ) : null}

                {profileSuccessMessage ? (
                  <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
                    {profileSuccessMessage}
                  </div>
                ) : null}

                {isLoadingProfile ? (
                  <div className="space-y-4">
                    <div className="h-20 w-20 rounded-full bg-slate-200 animate-pulse"></div>
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-5 rounded bg-slate-200 animate-pulse"
                      ></div>
                    ))}
                  </div>
                ) : !isEditingProfile ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                        {(profile.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">
                          {profile.name || "No name"}
                        </h3>
                        <p className="text-slate-600">
                          {profile.business || "No business name"}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-slate-500">
                          Email
                        </label>
                        <p className="text-slate-900 mt-1">
                          {profile.email || "-"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-500">
                          Phone
                        </label>
                        <p className="text-slate-900 mt-1">
                          {profile.phone || "-"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-500">
                          Business Name
                        </label>
                        <p className="text-slate-900 mt-1">
                          {profile.business || "-"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-500">
                          Address
                        </label>
                        <p className="text-slate-900 mt-1">
                          {profile.address || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          defaultValue={profile.name}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          defaultValue={profile.email}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          defaultValue={profile.phone}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Business Name
                        </label>
                        <input
                          type="text"
                          name="business"
                          defaultValue={profile.business}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Address
                        </label>
                        <input
                          type="text"
                          name="address"
                          defaultValue={profile.address}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300"
                      >
                        {isSavingProfile ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingProfile(false);
                          setProfileSuccessMessage("");
                        }}
                        className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeTab === "services" && (
              <div className="space-y-6">
                {!selectedServiceDetail ? (
                  <div className="space-y-6">
                    {subscriptionError ? (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                        {subscriptionError}
                      </div>
                    ) : null}

                    {isLoadingSubscription ? (
                      <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="space-y-4">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <div
                              key={index}
                              className="h-5 rounded bg-slate-200 animate-pulse"
                            ></div>
                          ))}
                        </div>
                      </div>
                    ) : currentSubscription ? (
                      <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-slate-900">
                            Current Subscription
                          </h3>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                            {currentSubscription.status || "Active"}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-slate-500 mb-1">
                              Package
                            </p>
                            <p className="text-lg font-semibold text-slate-900">
                              {currentSubscription.package_name || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500 mb-1">
                              Subscribe Date
                            </p>
                            <p className="text-lg font-semibold text-slate-900">
                              {formatDateValue(currentSubscription.start_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500 mb-1">
                              Duration
                            </p>
                            <p className="text-lg font-semibold text-slate-900">
                              {formatDurationLabel(
                                currentSubscription.duration_months,
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500 mb-1">
                              Expiry Date
                            </p>
                            <p className="text-lg font-semibold text-slate-900">
                              {formatDateValue(currentSubscription.expire_date)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-900">
                            <strong>Next billing date:</strong>{" "}
                            {formatDateValue(
                              currentSubscription.next_billing_date ||
                                currentSubscription.expire_date,
                            )}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                          Current Subscription
                        </h3>
                        <p className="text-slate-600">
                          No active subscription found.
                        </p>
                      </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                          POS Packages
                        </h2>
                        <p className="text-slate-600">
                          Choose the perfect package for your business needs
                        </p>
                      </div>

                      {packagesError ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                          {packagesError}
                        </div>
                      ) : isLoadingPackages ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Array.from({ length: 3 }).map((_, index) => (
                            <div
                              key={index}
                              className="h-72 rounded-xl bg-slate-100 animate-pulse"
                            ></div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {services.map((service) => {
                            const isSubscribed = service.id === subscribedPackageId;
                            const canUpgrade =
                              Boolean(subscribedPackageId) &&
                              service.id > (subscribedPackageId || 0);

                            return (
                              <div
                                key={service.id}
                                onClick={() => setSelectedServiceDetail(service)}
                                className={`border-2 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer relative ${
                                  isSubscribed
                                    ? "border-green-600 bg-green-50"
                                    : service.highlighted
                                      ? "border-blue-600 bg-blue-50"
                                      : "border-slate-200 bg-white"
                                }`}
                              >
                                <div className="flex gap-2 mb-3">
                                  {service.highlighted && !isSubscribed ? (
                                    <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                                      Most Popular
                                    </span>
                                  ) : null}
                                  {isSubscribed ? (
                                    <span className="inline-block px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                                      Active
                                    </span>
                                  ) : null}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">
                                  {service.name}
                                </h3>
                                <div className="mb-3">
                                  <span className="text-3xl font-bold text-slate-900">
                                    ${service.price}
                                  </span>
                                  <span className="text-slate-600">
                                    {service.period}
                                  </span>
                                </div>
                                <p className="text-slate-600 text-sm mb-4">
                                  {service.description}
                                </p>
                                <div className="mb-4">
                                  <p className="text-sm font-medium text-slate-700">
                                    {service.maxRegisters}
                                  </p>
                                </div>
                                <div className="pt-3 border-t border-slate-200">
                                  {isSubscribed ? (
                                    <button
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleUnsubscribe();
                                      }}
                                      className="w-full px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium"
                                    >
                                      Unsubscribe
                                    </button>
                                  ) : subscribedPackageId ? (
                                    <button
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleUpgrade(service.id);
                                      }}
                                      className={`w-full px-3 py-2 text-sm rounded-lg transition-colors font-medium ${
                                        canUpgrade
                                          ? "text-white bg-blue-600 hover:bg-blue-700"
                                          : "text-slate-600 bg-slate-100 hover:bg-slate-200"
                                      }`}
                                    >
                                      {canUpgrade ? "Upgrade" : "Downgrade"}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleSubscribe(service.id);
                                      }}
                                      className="w-full px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
                                    >
                                      Subscribe
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <button
                      onClick={() => setSelectedServiceDetail(null)}
                      className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
                    >
                      Back to Packages
                    </button>

                    <div className="mb-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="text-3xl font-bold text-slate-900 mb-2">
                            {selectedServiceDetail.name}
                          </h2>
                          <p className="text-lg text-slate-600">
                            {selectedServiceDetail.description}
                          </p>
                        </div>
                        {selectedServiceDetail.id === subscribedPackageId ? (
                          <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            Active Subscription
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-blue-50 rounded-lg p-6">
                        <p className="text-sm text-slate-600 mb-2">Price</p>
                        <div className="flex items-baseline gap-1">
                          <p className="text-4xl font-bold text-blue-600">
                            ${selectedServiceDetail.price}
                          </p>
                          <p className="text-lg text-slate-600">
                            {selectedServiceDetail.period}
                          </p>
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-6">
                        <p className="text-sm text-slate-600 mb-2">Registers</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {selectedServiceDetail.maxRegisters}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-6">
                        <p className="text-sm text-slate-600 mb-2">Features</p>
                        <p className="text-4xl font-bold text-green-600">
                          {selectedServiceDetail.features.length}
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-6 mb-8">
                      <h3 className="text-xl font-bold text-slate-900 mb-4">
                        Package Features
                      </h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {selectedServiceDetail.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <span className="text-slate-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-xl font-bold text-slate-900 mb-4">
                        Package Details
                      </h3>
                      <div className="grid md:grid-cols-3 gap-6">
                        <div>
                          <p className="text-sm font-medium text-slate-500">
                            Package ID
                          </p>
                          <p className="text-slate-900 mt-1">
                            #{selectedServiceDetail.id}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500">
                            Category
                          </p>
                          <p className="text-slate-900 mt-1">
                            {selectedServiceDetail.category}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500">
                            Status
                          </p>
                          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mt-1">
                            {selectedServiceDetail.id === subscribedPackageId
                              ? currentSubscription?.status || "Active"
                              : "Available"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedServiceDetail.id === subscribedPackageId ? (
                      <div className="border-t pt-6 mt-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">
                          Subscription Details
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm font-medium text-slate-500">
                              Subscribe Date
                            </p>
                            <p className="text-slate-900 mt-1">
                              {formatDateValue(currentSubscription?.start_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-500">
                              Duration
                            </p>
                            <p className="text-slate-900 mt-1">
                              {formatDurationLabel(
                                currentSubscription?.duration_months,
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-500">
                              Expiry Date
                            </p>
                            <p className="text-slate-900 mt-1">
                              {formatDateValue(currentSubscription?.expire_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-500">
                              Auto-Renew
                            </p>
                            <p className="text-slate-900 mt-1">
                              {currentSubscription?.auto_renew ? "Enabled" : "Disabled"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-8">
                      {selectedServiceDetail.id === subscribedPackageId ? (
                        <button
                          onClick={() => {
                            handleUnsubscribe();
                            setSelectedServiceDetail(null);
                          }}
                          className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                        >
                          Unsubscribe from this Package
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            handleSubscribe(selectedServiceDetail.id);
                            setSelectedServiceDetail(null);
                          }}
                          className={`w-full px-6 py-3 text-white rounded-lg transition-colors font-semibold ${
                            subscribedPackageId &&
                            selectedServiceDetail.id > subscribedPackageId
                              ? "bg-blue-600 hover:bg-blue-700"
                              : subscribedPackageId &&
                                  selectedServiceDetail.id < subscribedPackageId
                                ? "bg-slate-600 hover:bg-slate-700"
                                : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          {subscribedPackageId &&
                          selectedServiceDetail.id > subscribedPackageId
                            ? "Upgrade to this Package"
                            : subscribedPackageId &&
                                selectedServiceDetail.id < subscribedPackageId
                              ? "Downgrade to this Package"
                              : "Subscribe to this Package"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "access" && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Access Information
                  </h2>
                  <p className="text-slate-600">
                    Your POS system credentials and access details
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-500">
                        POS URL
                      </label>
                      <button
                        onClick={() =>
                          handleCopyToClipboard(accessInfo.posUrl, "url")
                        }
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        {copiedField === "url" ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={accessInfo.posUrl}
                        readOnly
                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-500">
                        Username
                      </label>
                      <button
                        onClick={() =>
                          handleCopyToClipboard(accessInfo.username, "username")
                        }
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        {copiedField === "username" ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={accessInfo.username}
                      readOnly
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-sm"
                    />
                  </div>

                  <div className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-500">
                        Password
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-sm"
                        >
                          {showPassword ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              Show
                            </>
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleCopyToClipboard(accessInfo.password, "password")
                          }
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          {copiedField === "password" ? (
                            <>
                              <Check className="w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={accessInfo.password}
                      readOnly
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-sm"
                    />
                  </div>

                  <div className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-500">
                        Email
                      </label>
                      <button
                        onClick={() =>
                          handleCopyToClipboard(accessInfo.email, "email")
                        }
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        {copiedField === "email" ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={accessInfo.email}
                      readOnly
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex gap-3">
                    <div className="text-amber-600 mt-0.5">!</div>
                    <div>
                      <p className="font-medium text-amber-900 mb-1">
                        Security Notice
                      </p>
                      <p className="text-sm text-amber-800">
                        POS access info is still waiting for its backend endpoint.
                        The layout is ready, but the real credentials API has not
                        been provided yet.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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
