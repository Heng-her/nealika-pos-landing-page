import { useState } from "react";
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
import PaymentPage from "./PaymentPage";
import CheckoutPage from "./CheckoutPage";
import logo from "@/imports/logo-nealika.png";

interface DashboardProps {
  onLogout: () => void;
}

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  period: string;
  features: string[];
  maxRegisters: string;
  category: string;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "profile" | "services" | "payments" | "access"
  >("profile");
  const [checkoutPackage, setCheckoutPackage] = useState<Service | null>(null);
  const [services] = useState<Service[]>([
    {
      id: 1,
      name: "Starter Package",
      description: "Perfect for small businesses just getting started",
      price: 29,
      period: "/month",
      maxRegisters: "Up to 1 register",
      category: "POS Service",
      features: [
        "Basic inventory management",
        "Sales reporting",
        "Email support",
        "Mobile app access",
        "Payment processing",
      ],
    },
    {
      id: 2,
      name: "Professional Package",
      description: "Ideal for growing businesses with multiple locations",
      price: 79,
      period: "/month",
      maxRegisters: "Up to 5 registers",
      category: "POS Service",
      features: [
        "Advanced inventory management",
        "Advanced analytics & reports",
        "Priority support 24/7",
        "Employee management",
        "Customer loyalty program",
        "Multi-location support",
        "API access",
      ],
    },
    {
      id: 3,
      name: "Enterprise Package",
      description: "Complete solution for large-scale operations",
      price: 199,
      period: "/month",
      maxRegisters: "Unlimited registers",
      category: "POS Service",
      features: [
        "Enterprise inventory system",
        "Custom reports & dashboards",
        "Dedicated account manager",
        "Advanced security features",
        "Custom integrations",
        "White-label options",
        "Advanced fraud protection",
        "On-premise deployment option",
      ],
    },
  ]);

  const [subscribedPackageId, setSubscribedPackageId] = useState<number | null>(
    1,
  ); // User is subscribed to Starter by default
  const [selectedServiceDetail, setSelectedServiceDetail] =
    useState<Service | null>(null);

  // Subscription details
  const [subscriptionDetails] = useState({
    subscribedDate: "2026-04-07",
    duration: "1 month",
    expiryDate: "2026-05-07",
    autoRenew: true,
  });

  // Access Info State
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [accessInfo] = useState({
    posUrl: "https://username.nealika.io/nealika.php",
    username: "nealika",
    password: "SecurePass123!@#",
    email: "info@nealika.com",
  });

  // Profile data
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+855 12 345 678",
    business: "Swift Salon",
    address: "Phnom Penh, Cambodia",
    avatar: "", // empty by default, so it falls back to the company logo
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const handleSubscribe = (packageId: number) => {
    const selectedPackage = services.find((s) => s.id === packageId);
    if (selectedPackage) {
      setCheckoutPackage(selectedPackage);
    }
  };

  const handleUnsubscribe = () => {
    const packageName = services.find(
      (s) => s.id === subscribedPackageId,
    )?.name;
    if (confirm(`Are you sure you want to unsubscribe from ${packageName}?`)) {
      setSubscribedPackageId(null);
      alert("Successfully unsubscribed!");
    }
  };

  const handleUpgrade = (newPackageId: number) => {
    const selectedPackage = services.find((s) => s.id === newPackageId);
    if (selectedPackage) {
      setCheckoutPackage(selectedPackage);
    }
  };

  const handleCheckoutComplete = () => {
    if (checkoutPackage) {
      const isUpgrade =
        subscribedPackageId && checkoutPackage.id > subscribedPackageId;
      const isDowngrade =
        subscribedPackageId && checkoutPackage.id < subscribedPackageId;
      const actionText = isUpgrade
        ? "upgraded"
        : isDowngrade
          ? "downgraded"
          : "subscribed";

      setSubscribedPackageId(checkoutPackage.id);
      setCheckoutPackage(null);
      setActiveTab("services");
      alert(
        `Payment successful! You have ${actionText} to ${checkoutPackage.name}.`,
      );
    }
  };

  const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setProfile({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      business: formData.get("business") as string,
      address: formData.get("address") as string,
      avatar: profile.avatar,
    });
    setIsEditingProfile(false);
  };

  const handleCopyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Show checkout page if a package is selected for checkout
  if (checkoutPackage) {
    const packagesForCheckout = services.map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price,
      period: s.period,
      description: s.description,
      features: s.features,
      highlighted: s.id === 2,
    }));

    return (
      <CheckoutPage
        packages={packagesForCheckout}
        defaultPackageId={checkoutPackage.id}
        currentPackageId={subscribedPackageId}
        onBack={() => setCheckoutPackage(null)}
        onComplete={handleCheckoutComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Nealika" className="h-10" />
            </div>
            <button
              onClick={onLogout}
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
          {/* Sidebar */}
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

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
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

                {!isEditingProfile ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center overflow-hidden p-1 shadow-inner">
                        {profile.avatar ? (
                          <img
                            src={profile.avatar}
                            alt="Profile"
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <img
                            src={logo}
                            alt="Company Logo"
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">
                          {profile.name}
                        </h3>
                        <p className="text-slate-600">{profile.business}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-slate-500">
                          Email
                        </label>
                        <p className="text-slate-900 mt-1">{profile.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-500">
                          Phone
                        </label>
                        <p className="text-slate-900 mt-1">{profile.phone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-500">
                          Business Name
                        </label>
                        <p className="text-slate-900 mt-1">
                          {profile.business}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-500">
                          Address
                        </label>
                        <p className="text-slate-900 mt-1">{profile.address}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    {/* Avatar Upload */}
                    <div className="border-b border-slate-100 pb-4 mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Profile Picture
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center overflow-hidden p-1 shadow-inner">
                          {profile.avatar ? (
                            <img
                              src={profile.avatar}
                              alt="Profile Preview"
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <img
                              src={logo}
                              alt="Company Logo"
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <input
                            type="file"
                            accept="image/*"
                            id="avatar-upload"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setProfile((prev) => ({
                                    ...prev,
                                    avatar: reader.result as string,
                                  }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label
                            htmlFor="avatar-upload"
                            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer text-center transition-colors"
                          >
                            Upload Photo
                          </label>
                          {profile.avatar && (
                            <button
                              type="button"
                              onClick={() =>
                                setProfile((prev) => ({
                                  ...prev,
                                  avatar: "",
                                }))
                              }
                              className="text-xs text-red-600 hover:text-red-800 text-left font-medium"
                            >
                              Remove (Restore Company Logo)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

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
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Services Tab */}
            {activeTab === "services" && (
              <div className="space-y-6">
                {!selectedServiceDetail ? (
                  <div className="space-y-6">
                    {/* Subscription Details Card */}
                    {subscribedPackageId && (
                      <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-slate-900">
                            Current Subscription
                          </h3>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                            Active
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-slate-500 mb-1">
                              Package
                            </p>
                            <p className="text-lg font-semibold text-slate-900">
                              {
                                services.find(
                                  (s) => s.id === subscribedPackageId,
                                )?.name
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500 mb-1">
                              Subscribe Date
                            </p>
                            <p className="text-lg font-semibold text-slate-900">
                              {new Date(
                                subscriptionDetails.subscribedDate,
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500 mb-1">
                              Duration
                            </p>
                            <p className="text-lg font-semibold text-slate-900">
                              {subscriptionDetails.duration}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500 mb-1">
                              Expiry Date
                            </p>
                            <p className="text-lg font-semibold text-slate-900">
                              {new Date(
                                subscriptionDetails.expiryDate,
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        {/* <div className="mt-6 pt-6 border-t border-slate-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                Auto-Renew
                              </p>
                              <p className="text-sm text-slate-600">
                                {subscriptionDetails.autoRenew
                                  ? "Your subscription will automatically renew on expiry date"
                                  : "Auto-renewal is disabled"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-medium ${subscriptionDetails.autoRenew ? "text-green-600" : "text-slate-600"}`}
                              >
                                {subscriptionDetails.autoRenew ? "ON" : "OFF"}
                              </span>
                              <button
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  subscriptionDetails.autoRenew
                                    ? "bg-green-600"
                                    : "bg-slate-300"
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    subscriptionDetails.autoRenew
                                      ? "translate-x-6"
                                      : "translate-x-1"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        </div> */}

                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-900">
                            <strong>Next billing date:</strong>{" "}
                            {new Date(
                              subscriptionDetails.expiryDate,
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
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

                      {/* Services List */}
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {services.map((service) => {
                          const isSubscribed =
                            service.id === subscribedPackageId;
                          const canUpgrade =
                            subscribedPackageId &&
                            service.id > subscribedPackageId;
                          const canDowngrade =
                            subscribedPackageId &&
                            service.id < subscribedPackageId;

                          return (
                            <div
                              key={service.id}
                              onClick={() => setSelectedServiceDetail(service)}
                              className={`border-2 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer relative ${
                                isSubscribed
                                  ? "border-green-600 bg-green-50"
                                  : service.name === "Professional Package"
                                    ? "border-blue-600 bg-blue-50"
                                    : "border-slate-200 bg-white"
                              }`}
                            >
                              <div className="flex gap-2 mb-3">
                                {service.name === "Professional Package" &&
                                  !isSubscribed && (
                                    <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                                      Most Popular
                                    </span>
                                  )}
                                {isSubscribed && (
                                  <span className="inline-block px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                                    Active
                                  </span>
                                )}
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUnsubscribe();
                                    }}
                                    className="w-full px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium"
                                  >
                                    Unsubscribe
                                  </button>
                                ) : subscribedPackageId ? (
                                  canUpgrade ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpgrade(service.id);
                                      }}
                                      className="w-full px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
                                    >
                                      Upgrade
                                    </button>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpgrade(service.id);
                                      }}
                                      className="w-full px-3 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
                                    >
                                      Downgrade
                                    </button>
                                  )
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
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
                    </div>
                  </div>
                ) : (
                  /* Package Detail View */
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <button
                      onClick={() => setSelectedServiceDetail(null)}
                      className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
                    >
                      ← Back to Packages
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
                        {selectedServiceDetail.id === subscribedPackageId && (
                          <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            Active Subscription
                          </span>
                        )}
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
                        {selectedServiceDetail.features.map(
                          (feature, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <span className="text-slate-700">{feature}</span>
                            </div>
                          ),
                        )}
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
                            Active
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Subscription Details if this is the current package */}
                    {selectedServiceDetail.id === subscribedPackageId && (
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
                              {new Date(
                                subscriptionDetails.subscribedDate,
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-500">
                              Duration
                            </p>
                            <p className="text-slate-900 mt-1">
                              {subscriptionDetails.duration}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-500">
                              Expiry Date
                            </p>
                            <p className="text-slate-900 mt-1">
                              {new Date(
                                subscriptionDetails.expiryDate,
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-500">
                              Auto-Renew
                            </p>
                            <p className="text-slate-900 mt-1">
                              {subscriptionDetails.autoRenew
                                ? "Enabled"
                                : "Disabled"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

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

            {/* Access Info Tab */}
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
                  {/* POS URL */}
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
                      <a
                        href={accessInfo.posUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Open
                      </a>
                    </div>
                  </div>

                  {/* Username */}
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

                  {/* Password */}
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
                            handleCopyToClipboard(
                              accessInfo.password,
                              "password",
                            )
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

                  {/* Email */}
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
                    <div className="text-amber-600 mt-0.5">⚠️</div>
                    <div>
                      <p className="font-medium text-amber-900 mb-1">
                        Security Notice
                      </p>
                      <p className="text-sm text-amber-800">
                        Keep your credentials secure and do not share them with
                        unauthorized users. Change your password regularly for
                        enhanced security.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === "payments" && <PaymentPage />}
          </div>
        </div>
      </div>
    </div>
  );
}
