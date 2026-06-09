import { Check } from "lucide-react";
import {
  type DisplayPackage,
  type CurrentSubscription,
} from "../services/posApi";
import { Switch } from "./ui/switch";

interface PackagesPageProps {
  services: DisplayPackage[];
  subscribedPackageId: number | null;
  currentSubscription: CurrentSubscription | null;
  isReminderAlertEnabled: boolean;
  showReminderAlertSection: boolean;
  selectedServiceDetail: DisplayPackage | null;
  setSelectedServiceDetail: (val: DisplayPackage | null) => void;
  isLoadingPackages: boolean;
  isLoadingSubscription: boolean;
  isUpdatingSubscription: boolean;
  packagesError: string;
  subscriptionError: string;
  onSubscribe: (packageId: number) => void;
  onToggleReminderAlert: (enabled: boolean) => void;
  onUnsubscribe: () => void;
  onUpgrade: (newPackageId: number) => void;
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

export default function PackagesPage({
  services,
  subscribedPackageId,
  currentSubscription,
  isReminderAlertEnabled,
  showReminderAlertSection,
  selectedServiceDetail,
  setSelectedServiceDetail,
  isLoadingPackages,
  isLoadingSubscription,
  isUpdatingSubscription,
  packagesError,
  subscriptionError,
  onSubscribe,
  onToggleReminderAlert,
  onUnsubscribe,
  onUpgrade,
}: PackagesPageProps) {
  const hasSubscribedPackage = Boolean(subscribedPackageId);
  const isCurrentPackageAutoRenewEnabled = isAutoRenewEnabled(
    currentSubscription?.auto_renew,
  );

  const handlePackageAction = (packageId: number) => {
    if (packageId === subscribedPackageId) {
      if (isCurrentPackageAutoRenewEnabled) {
        onUnsubscribe();
      } else {
        onSubscribe(packageId);
      }
      return;
    }

    if (hasSubscribedPackage) {
      onUpgrade(packageId);
      return;
    }

    onSubscribe(packageId);
  };

  const getPackageActionLabel = (packageId: number) => {
    if (packageId === subscribedPackageId) {
      return isCurrentPackageAutoRenewEnabled ? "Unsubscribe" : "Subscribe";
    }

    if (!hasSubscribedPackage) {
      return "Subscribe";
    }

    return packageId > (subscribedPackageId || 0) ? "Upgrade" : "Downgrade";
  };

  const getPackageActionButtonClassName = (packageId: number) => {
    if (packageId === subscribedPackageId) {
      return isCurrentPackageAutoRenewEnabled
        ? "text-red-600 bg-red-50 hover:bg-red-100"
        : "text-white bg-blue-600 hover:bg-blue-700";
    }

    if (!hasSubscribedPackage || packageId > (subscribedPackageId || 0)) {
      return "text-white bg-blue-600 hover:bg-blue-700";
    }

    return "text-slate-600 bg-slate-100 hover:bg-slate-200";
  };

  const isUnsubscribeAction = (packageId: number) =>
    packageId === subscribedPackageId && isCurrentPackageAutoRenewEnabled;

  return (
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
                  <p className="text-sm text-slate-500 mb-1">Package</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {currentSubscription.package_name || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Subscribe Date</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {formatDateValue(currentSubscription.start_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Duration</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {formatDurationLabel(currentSubscription.duration_months)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Expiry Date</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {formatDateValue(currentSubscription.expire_date)}
                  </p>
                </div>
              </div>
              <div
                className={`${showReminderAlertSection ? "mt-4" : "mt-6"} p-3 bg-blue-50 border border-blue-200 rounded-lg`}
              >
                {isCurrentPackageAutoRenewEnabled ? (
                  <>
                    <p className="text-sm text-blue-900">
                      <strong>Next billing date:</strong>{" "}
                      {formatDateValue(
                        currentSubscription.next_billing_date ||
                          currentSubscription.expire_date,
                      )}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-blue-900">
                      <strong>Subscription ends on:</strong>{" "}
                      {formatDateValue(currentSubscription.expire_date)}
                    </p>
                    <p className="mt-2 text-sm text-blue-800">
                      Auto-renew is off. You can subscribe again anytime to
                      extend your expiry date.
                    </p>
                  </>
                )}
              </div>
              {showReminderAlertSection ? (
                <div className="flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    {/* <p className="text-base font-semibold text-slate-900">
                      Alert Reminder
                    </p> */}
                    <p className="mt-1 text-sm text-slate-600">
                      Your subscription will automatically renew on expiry date.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 self-start sm:self-center">
                    <span
                      className={`text-sm font-semibold ${
                        isReminderAlertEnabled
                          ? "text-green-600"
                          : "text-slate-500"
                      }`}
                    >
                      {isReminderAlertEnabled ? "ON" : "OFF"}
                    </span>
                    <Switch
                      checked={isReminderAlertEnabled}
                      onCheckedChange={onToggleReminderAlert}
                      disabled={isUpdatingSubscription}
                      className="data-[state=checked]:!bg-green-600 data-[state=unchecked]:bg-slate-300"
                      aria-label="Toggle expiry reminder alerts"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Current Subscription
              </h3>
              <p className="text-slate-600">No active subscription found.</p>
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
                        <span className="text-slate-600">{service.period}</span>
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
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handlePackageAction(service.id);
                          }}
                          disabled={isUpdatingSubscription}
                          className={`w-full px-3 py-2 text-sm rounded-lg transition-colors font-medium ${getPackageActionButtonClassName(
                            service.id,
                          )} disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          {getPackageActionLabel(service.id)}
                        </button>
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
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors font-medium"
          >
            {"<-"} Back to Packages
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

          <div className="border-t pt-6 mb-8 text-slate-800">
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

          <div className="border-t pt-6 text-slate-800">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Package Details
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-slate-500">Package ID</p>
                <p className="text-slate-900 mt-1">
                  #{selectedServiceDetail.id}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Category</p>
                <p className="text-slate-900 mt-1">
                  {selectedServiceDetail.category}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Status</p>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mt-1">
                  {selectedServiceDetail.id === subscribedPackageId
                    ? currentSubscription?.status || "Active"
                    : "Available"}
                </span>
              </div>
            </div>
          </div>

          {selectedServiceDetail.id === subscribedPackageId &&
          currentSubscription ? (
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
                    {formatDateValue(currentSubscription.start_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Duration</p>
                  <p className="text-slate-900 mt-1">
                    {formatDurationLabel(currentSubscription.duration_months)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Expiry Date
                  </p>
                  <p className="text-slate-900 mt-1">
                    {formatDateValue(currentSubscription.expire_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Auto-Renew
                  </p>
                  <p className="text-slate-900 mt-1">
                    {currentSubscription.auto_renew ? "Enabled" : "Disabled"}
                  </p>
                </div>
                {showReminderAlertSection ? (
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Alert Reminder
                    </p>
                    <p className="text-slate-900 mt-1">
                      {isReminderAlertEnabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-8">
            <button
              onClick={() => {
                handlePackageAction(selectedServiceDetail.id);
                if (!isUnsubscribeAction(selectedServiceDetail.id)) {
                  setSelectedServiceDetail(null);
                }
              }}
              disabled={isUpdatingSubscription}
              className={`w-full px-6 py-3 rounded-lg transition-colors font-semibold ${
                selectedServiceDetail.id === subscribedPackageId &&
                isCurrentPackageAutoRenewEnabled
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : selectedServiceDetail.id === subscribedPackageId
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : hasSubscribedPackage &&
                        selectedServiceDetail.id < (subscribedPackageId || 0)
                      ? "bg-slate-600 text-white hover:bg-slate-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {selectedServiceDetail.id === subscribedPackageId &&
              isCurrentPackageAutoRenewEnabled
                ? "Unsubscribe from this Package"
                : selectedServiceDetail.id === subscribedPackageId
                  ? "Subscribe to this Package"
                  : hasSubscribedPackage &&
                      selectedServiceDetail.id > (subscribedPackageId || 0)
                    ? "Upgrade to this Package"
                    : hasSubscribedPackage &&
                        selectedServiceDetail.id < (subscribedPackageId || 0)
                      ? "Downgrade to this Package"
                      : "Subscribe to this Package"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
