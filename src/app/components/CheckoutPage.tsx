import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Loader2, Lock, Send, X } from "lucide-react";
import abaLogo from "@/imports/ABA_BANK__1_.png";
import cardsIcon from "@/imports/cards_icons.png";
import jcbIcon from "@/imports/JCB.png";
import mastercardIcon from "@/imports/Master__1_.png";
import logo from "@/imports/logo-nealika.png";
import unionpayIcon from "@/imports/UnionPay__1_.png";
import visaIcon from "@/imports/Visa_Icn.png";
import SocialAuthButtons from "./SocialAuthButtons";
import {
  ApiError,
  createPaywayPayment,
  getCheckoutQuote,
  getErrorMessage,
  getPaymentStatus,
  getStoredAuthToken,
  getSubscriptionDurations,
  normalizePaymentStatus,
  normalizePhoneNumber,
  sendOtp,
  submitPaywayForm,
  verifyOtp,
  type ApiSubscriptionDuration,
  type CheckoutQuote,
  type DisplayPackage,
} from "../services/posApi";

interface CheckoutPageProps {
  packages: DisplayPackage[];
  defaultPackageId: number;
  currentPackageId: number | null;
  onBack: () => void;
  onComplete: () => void;
}

type PaymentMethod = "khqr" | "card";
type PaymentTerminalStatus =
  | "idle"
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "expired";

interface PaymentSession {
  checkoutUrl: string;
  formFields: Record<string, string | number | null | undefined>;
  iframeName: string;
  transactionId: string;
}

function toDiscountNumber(value: string) {
  return Number(value || 0);
}

function getPaymentFailureMessage(status: PaymentTerminalStatus) {
  if (status === "expired") {
    return "Payment expired. Please retry.";
  }

  if (status === "cancelled") {
    return "Payment was cancelled. Please retry.";
  }

  if (status === "failed") {
    return "Payment failed. Please retry.";
  }

  return "Unable to process payment. Please retry.";
}

export default function CheckoutPage({
  packages,
  defaultPackageId,
  currentPackageId,
  onBack,
  onComplete,
}: CheckoutPageProps) {
  const [selectedPackageId, setSelectedPackageId] = useState(defaultPackageId);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("khqr");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDurationId, setSelectedDurationId] = useState<number | null>(
    null,
  );
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(getStoredAuthToken()),
  );
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [durationOptions, setDurationOptions] = useState<
    ApiSubscriptionDuration[]
  >([]);
  const [isLoadingDurations, setIsLoadingDurations] = useState(true);
  const [durationError, setDurationError] = useState("");
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paymentStatusMessage, setPaymentStatusMessage] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isLoginProcessing, setIsLoginProcessing] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [socialError, setSocialError] = useState("");

  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(
    null,
  );
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaywayLoading, setIsPaywayLoading] = useState(false);
  const [hasSubmittedPaymentForm, setHasSubmittedPaymentForm] = useState(false);
  const [hasIframeLoaded, setHasIframeLoaded] = useState(false);
  const [paymentModalError, setPaymentModalError] = useState("");
  const [paymentResultStatus, setPaymentResultStatus] =
    useState<PaymentTerminalStatus>("idle");
  const [showSelfRedirectFallback, setShowSelfRedirectFallback] =
    useState(false);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);

  const selectedPackage =
    packages.find((pkg) => pkg.id === selectedPackageId) || packages[0];

  const selectedDuration = useMemo(() => {
    return (
      durationOptions.find((option) => option.id === selectedDurationId) || null
    );
  }, [durationOptions, selectedDurationId]);

  const packageFeatures = selectedPackage?.features || [];
  const packagePrice = selectedPackage?.price || 0;
  const packageName = selectedPackage?.name || "Package";

  const hasCurrentPackage = currentPackageId !== null;
  const isUpgrade =
    hasCurrentPackage && selectedPackageId > (currentPackageId || 0);
  const isDowngrade =
    hasCurrentPackage && selectedPackageId < (currentPackageId || 0);
  const actionType = isUpgrade
    ? "Upgrade"
    : isDowngrade
      ? "Downgrade"
      : "Subscribe";
  const canRetryPayment =
    paymentResultStatus === "failed" ||
    paymentResultStatus === "cancelled" ||
    paymentResultStatus === "expired";

  useEffect(() => {
    if (!packages.length) {
      return;
    }

    const stillExists = packages.some((pkg) => pkg.id === selectedPackageId);
    if (!stillExists) {
      setSelectedPackageId(defaultPackageId || packages[0].id);
    }
  }, [defaultPackageId, packages, selectedPackageId]);

  useEffect(() => {
    let isMounted = true;

    const loadDurations = async () => {
      setIsLoadingDurations(true);
      setDurationError("");

      try {
        const durations = await getSubscriptionDurations();
        if (!isMounted) {
          return;
        }

        setDurationOptions(durations);
        if (durations.length > 0) {
          setSelectedDurationId((currentValue) => currentValue || durations[0].id);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setDurationError(getErrorMessage(error));
      } finally {
        if (isMounted) {
          setIsLoadingDurations(false);
        }
      }
    };

    loadDurations();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadQuote = async (
    packageId: number,
    durationId: number,
    coupon: string,
  ) => {
    setIsLoadingQuote(true);
    setQuoteError("");

    try {
      const latestQuote = await getCheckoutQuote({
        package_id: packageId,
        duration_id: durationId,
        coupon_code: coupon,
      });

      setQuote(latestQuote);
      return latestQuote;
    } catch (error) {
      const message = getErrorMessage(error);
      setQuoteError(message);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  useEffect(() => {
    if (!selectedPackage || !selectedDurationId) {
      return;
    }

    let cancelled = false;

    const refreshQuote = async () => {
      try {
        const latestQuote = await getCheckoutQuote({
          package_id: selectedPackage.id,
          duration_id: selectedDurationId,
          coupon_code: appliedCouponCode,
        });

        if (!cancelled) {
          setQuote(latestQuote);
          setQuoteError("");
        }
      } catch (error) {
        if (!cancelled) {
          setQuoteError(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingQuote(false);
        }
      }
    };

    setIsLoadingQuote(true);
    void refreshQuote();

    return () => {
      cancelled = true;
    };
  }, [appliedCouponCode, selectedDurationId, selectedPackage]);

  useEffect(() => {
    if (
      !paymentSession ||
      !isPaymentModalOpen ||
      hasSubmittedPaymentForm ||
      paymentResultStatus !== "pending"
    ) {
      return;
    }

    try {
      submitPaywayForm(
        paymentSession.checkoutUrl,
        paymentSession.formFields,
        paymentSession.iframeName,
      );
      setHasSubmittedPaymentForm(true);
      setPaymentStatusMessage("Waiting for payment...");
    } catch {
      setIsPaywayLoading(false);
      setShowSelfRedirectFallback(true);
      setPaymentModalError("Unable to process payment. Please retry.");
      setPaymentError("Unable to process payment. Please retry.");
    }
  }, [
    hasSubmittedPaymentForm,
    isPaymentModalOpen,
    paymentResultStatus,
    paymentSession,
  ]);

  useEffect(() => {
    if (
      !paymentSession ||
      !isPaymentModalOpen ||
      !isPaywayLoading ||
      hasIframeLoaded ||
      paymentResultStatus !== "pending"
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsPaywayLoading(false);
      setShowSelfRedirectFallback(true);
      setPaymentModalError("Unable to process payment. Please retry.");
      setPaymentError("Unable to process payment. Please retry.");
    }, 10000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    hasIframeLoaded,
    isPaywayLoading,
    isPaymentModalOpen,
    paymentResultStatus,
    paymentSession,
  ]);

  useEffect(() => {
    if (!transactionId || paymentResultStatus !== "pending") {
      return;
    }

    let isMounted = true;

    const pollPaymentStatus = async () => {
      try {
        const response = await getPaymentStatus(transactionId);
        if (!isMounted) {
          return;
        }

        const normalizedStatus = normalizePaymentStatus(
          response.status,
        ) as PaymentTerminalStatus;

        if (normalizedStatus === "pending") {
          setPaymentStatusMessage("Waiting for payment...");
          return;
        }

        setIsProcessing(false);
        setIsPaywayLoading(false);
        setPaymentResultStatus(normalizedStatus);

        if (normalizedStatus === "paid") {
          setPaymentError("");
          setPaymentModalError("");
          setIsPaymentModalOpen(false);
          setShowPaymentSuccessModal(true);
          setPaymentStatusMessage("Payment successful.");
          return;
        }

        const failureMessage = getPaymentFailureMessage(normalizedStatus);
        setPaymentModalError(failureMessage);
        setPaymentError(failureMessage);
        setPaymentStatusMessage("");
        setIsPaymentModalOpen(true);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setPaymentError(getErrorMessage(error));
      }
    };

    void pollPaymentStatus();
    const intervalId = window.setInterval(() => {
      void pollPaymentStatus();
    }, 3000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [paymentResultStatus, transactionId]);

  const handleApplyCoupon = async () => {
    if (!selectedPackage || !selectedDurationId) {
      return;
    }

    const nextCouponCode = couponCode.trim().toUpperCase();
    if (!nextCouponCode) {
      return;
    }

    setCouponError("");
    setIsApplyingCoupon(true);

    try {
      await loadQuote(selectedPackage.id, selectedDurationId, nextCouponCode);
      setAppliedCouponCode(nextCouponCode);
    } catch (error) {
      setCouponError(getErrorMessage(error));
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    if (!selectedPackage || !selectedDurationId) {
      return;
    }

    setAppliedCouponCode("");
    setCouponCode("");
    setCouponError("");

    try {
      await loadQuote(selectedPackage.id, selectedDurationId, "");
    } catch {
      // Quote error is already surfaced in state.
    }
  };

  const processPayment = async () => {
    if (!selectedPackage || !selectedDurationId) {
      setPaymentError("Please select a package and duration first.");
      return;
    }

    setIsProcessing(true);
    setPaymentError("");
    setPaymentModalError("");
    setPaymentStatusMessage("");

    try {
      const response = await createPaywayPayment({
        package_id: selectedPackage.id,
        duration_id: selectedDurationId,
        coupon_code: appliedCouponCode,
        payment_method: paymentMethod,
      });

      if (
        !response.checkout_url ||
        !response.form_fields ||
        !response.transaction_id
      ) {
        throw new Error("Payment redirect data is incomplete.");
      }

      setTransactionId(response.transaction_id);
      setPaymentResultStatus("pending");
      setPaymentStatusMessage("Waiting for payment...");
      setShowPaymentSuccessModal(false);
      setShowSelfRedirectFallback(false);
      setHasSubmittedPaymentForm(false);
      setHasIframeLoaded(false);
      setIsPaywayLoading(true);
      setPaymentSession({
        checkoutUrl: response.checkout_url,
        formFields: response.form_fields,
        iframeName: `payway_frame_${response.transaction_id}`,
        transactionId: response.transaction_id,
      });
      setIsPaymentModalOpen(true);
    } catch (error) {
      if (error instanceof ApiError && error.code === 401) {
        setIsAuthenticated(false);
        setShowLoginDialog(true);
        setLoginError("Please login first.");
      } else {
        setPaymentError(getErrorMessage(error));
      }
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated && !getStoredAuthToken()) {
      setShowLoginDialog(true);
      return;
    }

    await processPayment();
  };

  const handleRetryPayment = async () => {
    setPaymentModalError("");
    setPaymentError("");
    setPaymentStatusMessage("");
    setPaymentResultStatus("idle");
    setShowSelfRedirectFallback(false);
    setHasSubmittedPaymentForm(false);
    setHasIframeLoaded(false);
    setIsPaymentModalOpen(false);
    await processPayment();
  };

  const handleSendOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError("");
    setSocialError("");
    setIsLoginProcessing(true);

    try {
      await sendOtp(normalizePhoneNumber(phoneNumber));
      setShowOtpInput(true);
    } catch (error) {
      setLoginError(getErrorMessage(error));
    } finally {
      setIsLoginProcessing(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError("");
    setSocialError("");
    setIsLoginProcessing(true);

    try {
      await verifyOtp(normalizePhoneNumber(phoneNumber), otp);
      setIsAuthenticated(true);
      setShowLoginDialog(false);
      await processPayment();
    } catch (error) {
      setLoginError(getErrorMessage(error));
    } finally {
      setIsLoginProcessing(false);
    }
  };

  const handleSocialAuthStart = () => {
    setSocialError("");
    setLoginError("");
  };

  const handleSocialAuthError = (message: string) => {
    setSocialError(message);
    setLoginError("");
  };

  const handleSocialAuthSuccess = async () => {
    setSocialError("");
    setLoginError("");
    setIsAuthenticated(true);
    setShowLoginDialog(false);
    await processPayment();
  };

  const handlePaymentFrameLoad = () => {
    setHasIframeLoaded(true);
    setIsPaywayLoading(false);
    setShowSelfRedirectFallback(false);

    if (paymentResultStatus === "pending") {
      setPaymentModalError("");
      setPaymentStatusMessage("Waiting for payment...");
    }
  };

  const handlePaymentFrameError = () => {
    setIsPaywayLoading(false);
    setShowSelfRedirectFallback(true);
    setPaymentModalError("Unable to process payment. Please retry.");
    setPaymentError("Unable to process payment. Please retry.");
  };

  const handleFallbackRedirect = () => {
    if (!paymentSession) {
      return;
    }

    try {
      submitPaywayForm(
        paymentSession.checkoutUrl,
        paymentSession.formFields,
        "_self",
      );
    } catch {
      setPaymentModalError("Unable to process payment. Please retry.");
      setPaymentError("Unable to process payment. Please retry.");
    }
  };

  const handlePaymentSuccessContinue = () => {
    setShowPaymentSuccessModal(false);
    void onComplete();
  };

  if (!selectedPackage) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-slate-600">
              Packages are still loading. Please go back and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div className="flex items-center gap-2">
              <img src={logo} alt="Nealika" className="h-8" />
              <span className="text-slate-400">|</span>
              <span className="text-xl font-semibold text-slate-900">
                Checkout
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Select Package
              </h2>
              <p className="text-sm text-slate-600 mb-6">
                Choose the package that best fits your business needs
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`relative border-2 rounded-xl p-4 transition-all text-left ${
                      selectedPackageId === pkg.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {pkg.highlighted ? (
                      <span className="absolute -top-2 -right-2 px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                        Popular
                      </span>
                    ) : null}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 mb-1">
                          {pkg.name}
                        </h3>
                        <p className="text-2xl font-bold text-blue-600">
                          ${pkg.price}
                          <span className="text-sm text-slate-500">/mo</span>
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedPackageId === pkg.id
                            ? "border-blue-600 bg-blue-600"
                            : "border-slate-300"
                        }`}
                      >
                        {selectedPackageId === pkg.id ? (
                          <Check className="w-3 h-3 text-white" />
                        ) : null}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mb-3">
                      {pkg.description}
                    </p>
                    <div className="space-y-1">
                      {pkg.features.slice(0, 3).map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-1 text-xs text-slate-600"
                        >
                          <Check className="w-3 h-3 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      {pkg.features.length > 3 ? (
                        <p className="text-xs text-slate-500 italic mt-1">
                          +{pkg.features.length - 3} more
                        </p>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Select Subscription Duration
              </h2>
              <p className="text-sm text-slate-600 mb-6">
                Choose how long you want to subscribe. Longer durations offer
                better savings!
              </p>

              {durationError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                  {durationError}
                </div>
              ) : isLoadingDurations ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-28 rounded-xl bg-slate-100 animate-pulse"
                    ></div>
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {durationOptions.map((option) => {
                    const discount = toDiscountNumber(option.discount_percent);
                    const durationPrice =
                      packagePrice * option.months * (1 - discount / 100);
                    const baseDurationPrice = packagePrice * option.months;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedDurationId(option.id)}
                        className={`relative border-2 rounded-xl p-4 transition-all ${
                          selectedDurationId === option.id
                            ? "border-blue-600 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {discount > 0 ? (
                          <span className="absolute -top-2 -right-2 px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                            Save {discount}%
                          </span>
                        ) : null}
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-900">
                            {option.name}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedDurationId === option.id
                                ? "border-blue-600 bg-blue-600"
                                : "border-slate-300"
                            }`}
                          >
                            {selectedDurationId === option.id ? (
                              <Check className="w-3 h-3 text-white" />
                            ) : null}
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-2xl font-bold text-slate-900">
                            ${durationPrice.toFixed(2)}
                          </p>
                          {discount > 0 ? (
                            <p className="text-sm text-slate-500 line-through">
                              ${baseDurationPrice.toFixed(2)}
                            </p>
                          ) : null}
                          <p className="text-sm text-slate-600 mt-1">
                            ${packagePrice}/month x {option.months} month
                            {option.months > 1 ? "s" : ""}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Payment Method
              </h2>

              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("khqr")}
                  className={`w-full p-4 border-2 rounded-xl transition-all flex items-center justify-between ${
                    paymentMethod === "khqr"
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={abaLogo}
                      alt="ABA KHQR"
                      className="w-16 h-16 rounded-xl"
                    />
                    <div className="text-left">
                      <p className="font-semibold text-slate-900 text-lg">
                        ABA KHQR
                      </p>
                      <p className="text-sm text-slate-600">
                        Scan to pay with any banking app
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-6 h-6 transition-colors ${
                      paymentMethod === "khqr"
                        ? "text-blue-600"
                        : "text-slate-400"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`w-full p-4 border-2 rounded-xl transition-all flex items-center justify-between ${
                    paymentMethod === "card"
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={cardsIcon}
                      alt="Credit/Debit Card"
                      className="w-16 h-16 rounded-xl"
                    />
                    <div className="text-left">
                      <p className="font-semibold text-slate-900 text-lg">
                        Credit/Debit Card
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <img src={visaIcon} alt="Visa" className="h-5" />
                        <img
                          src={mastercardIcon}
                          alt="Mastercard"
                          className="h-5"
                        />
                        <img src={unionpayIcon} alt="UnionPay" className="h-5" />
                        <img src={jcbIcon} alt="JCB" className="h-5" />
                      </div>
                    </div>
                  </div>
                  <svg
                    className={`w-6 h-6 transition-colors ${
                      paymentMethod === "card"
                        ? "text-blue-600"
                        : "text-slate-400"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={
                isProcessing || isLoadingDurations || isLoadingQuote || !quote
              }
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>Processing...</>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Complete {actionType}
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Lock className="w-4 h-4" />
              Secure payment powered by Nealika Co.,LTD.
            </div>

            {paymentStatusMessage ? (
              <p className="text-sm text-blue-700 text-center">
                {paymentStatusMessage}
              </p>
            ) : null}

            {paymentResultStatus === "pending" &&
            paymentSession &&
            !isPaymentModalOpen ? (
              <div className="text-center">
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  Reopen Payment
                </button>
              </div>
            ) : null}

            {paymentError ? (
              <p className="text-sm text-red-600 text-center">{paymentError}</p>
            ) : null}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Order Summary
              </h2>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600">Package</span>
                  <span className="font-semibold text-slate-900">
                    {packageName}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600">Duration</span>
                  <span className="font-medium text-slate-900">
                    {selectedDuration?.name || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600">Action</span>
                  <span
                    className={`font-medium ${
                      isUpgrade
                        ? "text-blue-600"
                        : isDowngrade
                          ? "text-orange-600"
                          : "text-green-600"
                    }`}
                  >
                    {actionType}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 mb-6">
                <h3 className="font-semibold text-slate-900 mb-3">
                  Have a Coupon?
                </h3>
                {!appliedCouponCode ? (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(event) =>
                          setCouponCode(event.target.value.toUpperCase())
                        }
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={!couponCode.trim() || isApplyingCoupon}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                      >
                        {isApplyingCoupon ? "Applying..." : "Apply"}
                      </button>
                    </div>
                    {couponError ? (
                      <p className="text-xs text-red-600 mt-2">{couponError}</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        {appliedCouponCode} applied
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-4 mb-6">
                <h3 className="font-semibold text-slate-900 mb-3">
                  Included Features:
                </h3>
                <div className="space-y-2">
                  {packageFeatures.slice(0, 5).map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  {packageFeatures.length > 5 ? (
                    <p className="text-sm text-slate-500 italic">
                      +{packageFeatures.length - 5} more features
                    </p>
                  ) : null}
                </div>
              </div>

              {quoteError ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {quoteError}
                </div>
              ) : null}

              <div className="border-t border-slate-200 pt-4 mb-6">
                <div className="flex items-center justify-between mb-2 text-slate-600">
                  <span>Base Price</span>
                  <span>
                    {isLoadingQuote || !quote
                      ? "Loading..."
                      : `$${quote.base_price.toFixed(2)}`}
                  </span>
                </div>
                {quote && quote.duration_discount > 0 ? (
                  <div className="flex items-center justify-between mb-2 text-green-600">
                    <span>
                      Duration Discount (
                      {selectedDuration
                        ? toDiscountNumber(selectedDuration.discount_percent)
                        : 0}
                      %)
                    </span>
                    <span>-${quote.duration_discount.toFixed(2)}</span>
                  </div>
                ) : null}
                {quote && quote.coupon_discount > 0 ? (
                  <div className="flex items-center justify-between mb-2 text-green-600">
                    <span>Coupon ({appliedCouponCode})</span>
                    <span>-${quote.coupon_discount.toFixed(2)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between mb-2 text-slate-600">
                  <span>Subtotal</span>
                  <span>
                    {isLoadingQuote || !quote
                      ? "Loading..."
                      : `$${quote.subtotal.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2 text-slate-600">
                  <span>Tax ({quote ? quote.tax_percent : 10}%)</span>
                  <span>
                    {isLoadingQuote || !quote
                      ? "Loading..."
                      : `$${quote.tax_amount.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div className="border-t-2 border-slate-300 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-slate-900">Total</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {isLoadingQuote || !quote
                      ? "Loading..."
                      : `$${quote.total.toFixed(2)}`}
                  </span>
                </div>
                {quote && quote.discount > 0 ? (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-500">You save</span>
                    <span className="text-sm font-semibold text-green-600">
                      $
                      {(quote.duration_discount + quote.coupon_discount).toFixed(2)}
                    </span>
                  </div>
                ) : null}
                <p className="text-xs text-slate-500 mt-2">
                  One-time payment for{" "}
                  {(selectedDuration?.name || "selected duration").toLowerCase()}
                </p>
              </div>

              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600">
                  By completing this purchase, you agree to our Terms of Service
                  and Privacy Policy. You can cancel your subscription at any
                  time.
                </p>
              </div>
            </div>
          </div>
        </div>

        {showLoginDialog ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">
                    Authentication Required
                  </h3>
                  <p className="text-sm text-slate-600">
                    Please login to complete your purchase
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowLoginDialog(false);
                    setLoginError("");
                    setSocialError("");
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">
                  Login with Phone Number
                </h4>
                {!showOtpInput ? (
                  <form onSubmit={handleSendOtp}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Phone Number
                      </label>
                      <div className="flex gap-2">
                        <div className="flex items-center px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg">
                          <span className="text-slate-700 font-medium">
                            +855
                          </span>
                        </div>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(event) =>
                            setPhoneNumber(event.target.value.replace(/\D/g, ""))
                          }
                          placeholder="12 345 678"
                          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          maxLength={9}
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={phoneNumber.length < 8 || isLoginProcessing}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoginProcessing ? (
                        "Sending..."
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send OTP
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Enter OTP Code
                      </label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(event) =>
                          setOtp(event.target.value.replace(/\D/g, ""))
                        }
                        placeholder="123456"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
                        maxLength={6}
                        required
                      />
                      <p className="text-sm text-slate-500 mt-2">
                        Code sent to +855 {phoneNumber}
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={otp.length < 6 || isLoginProcessing}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed mb-2"
                    >
                      {isLoginProcessing ? "Verifying..." : "Verify & Continue"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOtpInput(false);
                        setOtp("");
                        setLoginError("");
                      }}
                      className="w-full px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Change Phone Number
                    </button>
                  </form>
                )}

                {loginError ? (
                  <p className="text-sm text-red-600 mt-3">{loginError}</p>
                ) : null}
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <SocialAuthButtons
                disabled={isLoginProcessing}
                onAuthSuccess={handleSocialAuthSuccess}
                onError={handleSocialAuthError}
                onStart={handleSocialAuthStart}
              />

              {socialError ? (
                <p className="text-sm text-amber-700 mt-4">{socialError}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {isPaymentModalOpen && paymentSession ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    ABA KHQR
                  </h3>
                  <p className="text-sm text-slate-600">
                    {paymentResultStatus === "pending"
                      ? "Waiting for payment..."
                      : paymentResultStatus === "expired"
                        ? "Payment expired"
                        : paymentResultStatus === "failed"
                          ? "Payment failed"
                          : paymentResultStatus === "cancelled"
                            ? "Payment cancelled"
                            : "Payment"}
                  </p>
                </div>
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4 flex items-center gap-3 text-sm text-slate-600">
                  {isPaywayLoading && paymentResultStatus === "pending" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  ) : null}
                  <span>
                    {paymentResultStatus === "paid"
                      ? "Payment successful."
                      : paymentModalError || "Waiting for payment..."}
                  </span>
                </div>

                {!paymentModalError &&
                paymentResultStatus === "pending" ? (
                  <div className="relative h-[540px] rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                    <iframe
                      key={paymentSession.iframeName}
                      name={paymentSession.iframeName}
                      title="ABA KHQR"
                      className="w-full h-full bg-white"
                      onLoad={handlePaymentFrameLoad}
                      onError={handlePaymentFrameError}
                    />

                    {isPaywayLoading ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/90">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <p className="text-sm text-slate-600">
                          Loading ABA PayWay...
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                    <p className="text-red-700 font-medium">
                      {paymentModalError || "Unable to process payment. Please retry."}
                    </p>
                    <p className="text-sm text-red-600 mt-2">
                      Transaction ID: {transactionId || paymentSession.transactionId}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {canRetryPayment && (
                    <button
                      onClick={() => void handleRetryPayment()}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Retry Payment
                    </button>
                  )}

                  {showSelfRedirectFallback &&
                  paymentResultStatus === "pending" ? (
                    <button
                      onClick={handleFallbackRedirect}
                      className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                    >
                      Continue In This Page
                    </button>
                  ) : null}

                  <button
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>

                <p className="mt-4 text-xs text-slate-500">
                  Debug reference: {transactionId || paymentSession.transactionId}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {showPaymentSuccessModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Payment Successful
              </h3>
              <p className="text-slate-600 mb-6">
                Your subscription has been updated successfully.
              </p>
              <button
                onClick={handlePaymentSuccessContinue}
                className="w-full px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
