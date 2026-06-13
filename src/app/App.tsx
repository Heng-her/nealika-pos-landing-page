import { useCallback, useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router";
import CheckoutPage from "./components/CheckoutPage";
import Dashboard from "./pages/Dashboard";
import LegalPage, { type LegalPageType } from "./components/LegalPage";
import LoginPage from "./components/LoginPage";
import Home from "./pages/Home";
import logo from "@/imports/logo-nealika.png";
import { Toaster } from "sonner";
import {
  clearStoredAuthToken,
  getErrorMessage,
  getMe,
  getPackages,
  getPublicSiteSettings,
  getStoredAuthToken,
  isUnauthorizedError,
  mapPackageToDisplayPackage,
  type DisplayPackage,
  type PublicSiteSettings,
} from "./services/posApi";

const DEFAULT_BROWSER_TITLE = "POS | Nealika Co.,LTD.";

type CheckoutMode = "standard" | "free_trial";

interface CheckoutRouteWrapperProps {
  pricingPlans: DisplayPackage[];
  defaultId: number;
  publicSettings: PublicSiteSettings | null;
  handleCheckoutBack: () => void;
  handleCheckoutComplete: () => void;
  handleOpenLegalPage: (type: LegalPageType) => void;
}

function CheckoutRouteWrapper({
  pricingPlans,
  defaultId,
  publicSettings,
  handleCheckoutBack,
  handleCheckoutComplete,
  handleOpenLegalPage,
}: CheckoutRouteWrapperProps) {
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get("mode") as CheckoutMode) || "standard";
  const packageIdStr = searchParams.get("packageId");
  const packageId = packageIdStr ? parseInt(packageIdStr, 10) : defaultId;

  return (
    <CheckoutPage
      packages={pricingPlans}
      defaultPackageId={packageId}
      currentPackageId={null}
      mode={mode}
      freeTrialCouponCode={publicSettings?.free_trial_coupon_code || ""}
      onBack={handleCheckoutBack}
      onComplete={handleCheckoutComplete}
      onOpenTerms={() => handleOpenLegalPage("terms")}
      onOpenPrivacy={() => handleOpenLegalPage("privacy")}
    />
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(getStoredAuthToken()),
  );
  const [pricingPlans, setPricingPlans] = useState<DisplayPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [packagesError, setPackagesError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(
    Boolean(getStoredAuthToken()),
  );
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [publicSettings, setPublicSettings] =
    useState<PublicSiteSettings | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadInitialState = async () => {
      setIsLoadingPackages(true);
      setPackagesError("");
      setIsLoadingPublicSettings(true);

      const [packagesResult, meResult, publicSettingsResult] =
        await Promise.allSettled([
          getPackages(),
          getStoredAuthToken() ? getMe() : Promise.resolve(null),
          getPublicSiteSettings(),
        ]);

      if (!isMounted) {
        return;
      }

      if (packagesResult.status === "fulfilled") {
        const mappedPackages = packagesResult.value.map(
          mapPackageToDisplayPackage,
        );
        setPricingPlans(mappedPackages);
      } else {
        setPackagesError(getErrorMessage(packagesResult.reason));
      }

      if (meResult.status === "fulfilled") {
        setIsAuthenticated(Boolean(meResult.value));
      } else {
        if (isUnauthorizedError(meResult.reason)) {
          clearStoredAuthToken();
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(Boolean(getStoredAuthToken()));
        }
      }

      if (publicSettingsResult.status === "fulfilled") {
        const settings = publicSettingsResult.value;
        setPublicSettings(settings);
      } else {
        setPublicSettings(null);
      }

      setIsLoadingPackages(false);
      setIsCheckingAuth(false);
      setIsLoadingPublicSettings(false);
    };

    void loadInitialState();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    if (location.pathname === "/terms-of-service") {
      document.title = "Terms of Service";
      return;
    }

    if (location.pathname === "/privacy-policy") {
      document.title = "Privacy Policy";
      return;
    }

    document.title = DEFAULT_BROWSER_TITLE;
  }, [location.pathname]);

  const handleLogout = useCallback((options?: { redirectToLogin?: boolean }) => {
    clearStoredAuthToken();
    setIsAuthenticated(false);
    if (options?.redirectToLogin) {
      navigate("/login", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    navigate("/dashboard", { replace: true });
  };

  const handleCheckoutComplete = () => {
    setIsAuthenticated(true);
    navigate("/dashboard?pos-access", { replace: true });
  };

  const handleCheckoutBack = () => {
    if (getStoredAuthToken()) {
      setIsAuthenticated(true);
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/");
    }
  };

  const handleOpenLegalPage = (type: LegalPageType) => {
    navigate(type === "terms" ? "/terms-of-service" : "/privacy-policy");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCloseLegalPage = () => {
    if (getStoredAuthToken()) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const checkoutDefaultPackageId =
    pricingPlans.find((item) => item.highlighted)?.id ||
    pricingPlans[0]?.id ||
    0;

  const toastUi = (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        className: "shadow-lg",
      }}
    />
  );

  if (isCheckingAuth) {
    return (
      <>
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
          <div className="relative flex items-center justify-center w-24 h-24">
            <img src={logo} alt="Nealika" className="h-12 animate-pulse z-10" />
            <div className="absolute inset-0 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-500 font-medium text-sm animate-pulse">
            Initializing your secure workspace...
          </p>
        </div>
        {toastUi}
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <Home
              pricingPlans={pricingPlans}
              isLoadingPackages={isLoadingPackages}
              packagesError={packagesError}
              publicSettings={publicSettings}
              isLoadingPublicSettings={isLoadingPublicSettings}
              isAuthenticated={isAuthenticated}
            />
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage
                onBack={() => navigate("/")}
                onLoginSuccess={handleLoginSuccess}
                onOpenTerms={() => handleOpenLegalPage("terms")}
                onOpenPrivacy={() => handleOpenLegalPage("privacy")}
              />
            )
          }
        />
        <Route
          path="/checkout"
          element={
            <CheckoutRouteWrapper
              pricingPlans={pricingPlans}
              defaultId={checkoutDefaultPackageId}
              publicSettings={publicSettings}
              handleCheckoutBack={handleCheckoutBack}
              handleCheckoutComplete={handleCheckoutComplete}
              handleOpenLegalPage={handleOpenLegalPage}
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/terms-of-service"
          element={
            <LegalPage
              type="terms"
              settings={publicSettings}
              isLoadingContent={isLoadingPublicSettings}
              onBack={handleCloseLegalPage}
              onOpenLogin={() => {
                if (!isAuthenticated) {
                  navigate("/login");
                } else {
                  navigate("/dashboard");
                }
              }}
              onOpenTerms={() => handleOpenLegalPage("terms")}
              onOpenPrivacy={() => handleOpenLegalPage("privacy")}
            />
          }
        />
        <Route
          path="/privacy-policy"
          element={
            <LegalPage
              type="privacy"
              settings={publicSettings}
              isLoadingContent={isLoadingPublicSettings}
              onBack={handleCloseLegalPage}
              onOpenLogin={() => {
                if (!isAuthenticated) {
                  navigate("/login");
                } else {
                  navigate("/dashboard");
                }
              }}
              onOpenTerms={() => handleOpenLegalPage("terms")}
              onOpenPrivacy={() => handleOpenLegalPage("privacy")}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {toastUi}
    </>
  );
}
