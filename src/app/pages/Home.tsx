import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  BarChart3,
  Check,
  CreditCard,
  Menu,
  Shield,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import Footer from "../components/Footer";
import { type LegalPageType } from "../components/LegalPage";
import { cn } from "../components/ui/utils";
import logo from "@/imports/logo-nealika.png";
import {
  type DisplayPackage,
  type PublicSiteSettings,
} from "../services/posApi";

const DEFAULT_POS_DEMO_VIDEO_URL = "https://youtu.be/0rKpjzk02ZY";

type DemoVideoSource =
  | {
      type: "iframe";
      src: string;
    }
  | {
      type: "html5";
      src: string;
    };

interface HomeProps {
  pricingPlans: DisplayPackage[];
  isLoadingPackages: boolean;
  packagesError: string;
  publicSettings: PublicSiteSettings | null;
  isLoadingPublicSettings: boolean;
  isAuthenticated: boolean;
}

function extractYouTubeVideoId(url: URL) {
  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] || "";
  }

  if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch") {
      return url.searchParams.get("v") || "";
    }

    if (url.pathname.startsWith("/embed/")) {
      return url.pathname.split("/embed/")[1]?.split("/")[0] || "";
    }

    if (url.pathname.startsWith("/shorts/")) {
      return url.pathname.split("/shorts/")[1]?.split("/")[0] || "";
    }
  }

  return "";
}

function extractVimeoVideoId(url: URL) {
  const host = url.hostname.replace(/^www\./, "");

  if (host !== "vimeo.com" && host !== "player.vimeo.com") {
    return "";
  }

  const segments = url.pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] || "";
}

function normalizeDemoVideoSource(value?: string | null): DemoVideoSource | null {
  const trimmedValue = (value || "").trim();

  if (!trimmedValue) {
    return null;
  }

  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trimmedValue)) {
    return {
      type: "html5",
      src: trimmedValue,
    };
  }

  try {
    const url = new URL(trimmedValue);
    const youTubeVideoId = extractYouTubeVideoId(url);

    if (youTubeVideoId) {
      return {
        type: "iframe",
        src: `https://www.youtube.com/embed/${youTubeVideoId}?autoplay=1&rel=0`,
      };
    }

    const vimeoVideoId = extractVimeoVideoId(url);

    if (vimeoVideoId) {
      return {
        type: "iframe",
        src: `https://player.vimeo.com/video/${vimeoVideoId}?autoplay=1`,
      };
    }
  } catch {
    return {
      type: "iframe",
      src: trimmedValue,
    };
  }

  return {
    type: "iframe",
    src: trimmedValue,
  };
}

export default function Home({
  pricingPlans,
  isLoadingPackages,
  packagesError,
  publicSettings,
  isLoadingPublicSettings,
  isAuthenticated,
}: HomeProps) {
  const navigate = useNavigate();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);
  const [demoVideoUrl, setDemoVideoUrl] = useState(DEFAULT_POS_DEMO_VIDEO_URL);
  const lastScrollYRef = useRef(0);

  const demoVideoSource = normalizeDemoVideoSource(demoVideoUrl);

  useEffect(() => {
    const nextDemoVideoUrl = publicSettings?.pos_demo_video_url?.trim() || "";
    if (nextDemoVideoUrl) {
      setDemoVideoUrl(nextDemoVideoUrl);
    }
  }, [publicSettings]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const difference = currentScrollY - lastScrollYRef.current;

      if (Math.abs(difference) < 5) {
        return;
      }

      if (currentScrollY > lastScrollYRef.current && currentScrollY > 10) {
        setIsTopBarVisible(false);
      } else {
        setIsTopBarVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsVideoModalOpen(false);
      }
    };

    if (isVideoModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isVideoModalOpen]);

  const handleOpenCheckout = (mode: "standard" | "free_trial", packageId?: number) => {
    let url = "/checkout";
    const params = new URLSearchParams();
    if (mode === "free_trial") {
      params.set("mode", "free_trial");
    }
    if (packageId) {
      params.set("packageId", packageId.toString());
    }
    const queryString = params.toString();
    if (queryString) {
      url += "?" + queryString;
    }
    navigate(url);
  };

  const handleGetStarted = (packageId?: number) => {
    handleOpenCheckout("standard", packageId);
  };

  const handleStartFreeTrial = (packageId?: number) => {
    if (isLoadingPublicSettings) {
      toast.error("Free trial is still loading. Please try again in a moment.");
      return;
    }

    if (!publicSettings?.free_trial_coupon_code?.trim()) {
      toast.error("Free trial is not configured right now.");
      return;
    }

    handleOpenCheckout("free_trial", packageId);
  };

  const handleOpenLegalPage = (type: LegalPageType) => {
    setIsVideoModalOpen(false);
    setIsMobileMenuOpen(false);
    navigate(type === "terms" ? "/terms-of-service" : "/privacy-policy");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenVideoModal = () => {
    if (!demoVideoSource) {
      toast.error("Demo video is not available right now.");
      return;
    }
    setIsVideoModalOpen(true);
  };

  const features = [
    {
      icon: CreditCard,
      title: "Fast Payments",
      description:
        "Accept all major payment methods with lightning-fast processing",
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Track sales, inventory, and performance in real-time",
    },
    {
      icon: Users,
      title: "Customer Management",
      description: "Build lasting relationships with integrated CRM tools",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Process transactions in seconds, even offline",
    },
    {
      icon: Shield,
      title: "Secure & Compliant",
      description: "Bank-level security with PCI DSS compliance",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header
        className={cn(
          "bg-white sticky top-0 z-50 shadow-sm transition-transform duration-300 ease-in-out",
          isTopBarVisible ? "translate-y-0" : "-translate-y-[37px]",
        )}
      >
        <div className="border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-end gap-6 text-sm">
              <button
                onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}
                className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
              >
                <User className="w-4 h-4" />
                Account
              </button>
              <a
                href="#"
                className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
              >
                <Shield className="w-4 h-4" />
                Support Desk
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 lg:py-0">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Nealika" className="h-[45px] lg:h-[55px]" />
            </div>

            <nav className="hidden lg:flex items-center gap-6 py-[20px]">
              <a
                href="#"
                className="text-slate-700 hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                Home
              </a>
              <a
                href="#features"
                className="text-slate-700 hover:text-blue-600 transition-colors"
              >
                About Us
              </a>
              <a href="#" className="text-blue-600 font-medium relative">
                POS
                <span className="absolute -top-3 -right-6 px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-semibold rounded">
                  NEW
                </span>
              </a>
              <a
                href="#pricing"
                className="text-slate-700 hover:text-blue-600 transition-colors"
              >
                Services
              </a>
              <a
                href="#"
                className="text-slate-700 hover:text-blue-600 transition-colors"
              >
                Technology
              </a>
              <a
                href="#"
                className="text-slate-700 hover:text-blue-600 transition-colors"
              >
                Digital Marketing
              </a>
              <a
                href="#"
                className="text-slate-700 hover:text-blue-600 transition-colors"
              >
                E-Commerce
              </a>
              <a
                href="#"
                className="text-slate-700 hover:text-blue-600 transition-colors"
              >
                Clients
              </a>
              <a
                href="#"
                className="text-slate-700 hover:text-blue-600 transition-colors"
              >
                News
              </a>
            </nav>

            <div className="flex items-center gap-3 lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Open Menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Glassmorphic Slide-out Menu) */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden transition-all duration-300 ease-in-out",
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
      >
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        <div
          className={cn(
            "absolute top-0 right-0 w-80 h-full bg-white shadow-2xl flex flex-col p-6 transition-transform duration-300 ease-in-out transform",
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <img src={logo} alt="Nealika" className="h-[45px]" />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close Menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex flex-col gap-2 py-6 overflow-y-auto flex-1">
            <a
              href="#"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-all font-medium"
            >
              <span>Home</span>
            </a>
            <a
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-all font-medium"
            >
              About Us
            </a>
            <a
              href="#"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-4 py-3 rounded-lg text-blue-600 hover:bg-blue-50/50 transition-all font-medium"
            >
              <span>POS</span>
              <span className="px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-semibold rounded">
                NEW
              </span>
            </a>
            <a
              href="#pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-all font-medium"
            >
              Services
            </a>
            <a
              href="#"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-all font-medium"
            >
              Technology
            </a>
            <a
              href="#"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-all font-medium"
            >
              Digital Marketing
            </a>
            <a
              href="#"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-all font-medium"
            >
              E-Commerce
            </a>
            <a
              href="#"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-all font-medium"
            >
              Clients
            </a>
            <a
              href="#"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-all font-medium"
            >
              News
            </a>
          </nav>

          <div className="border-t border-slate-100 pt-6 flex flex-col gap-4">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate(isAuthenticated ? "/dashboard" : "/login");
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-medium text-sm"
            >
              <User className="w-4 h-4" />
              Account
            </button>
            <a
              href="#"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-medium text-sm"
            >
              <Shield className="w-4 h-4" />
              Support Desk
            </a>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleStartFreeTrial();
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold text-center shadow-md hover:shadow-lg disabled:bg-slate-300"
              disabled={pricingPlans.length === 0}
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </div>

      <section className="relative py-48 md:py-64 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1746723386880-ca68b5f4b22d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
            alt="Modern retail store"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-blue-900/80"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Modern POS System for
            <span className="text-blue-400"> Modern Businesses</span>
          </h1>
          <p className="text-xl text-slate-200 mb-8 max-w-2xl mx-auto">
            Streamline your sales, manage inventory, and grow your business with
            our powerful point-of-sale solution
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleStartFreeTrial()}
              disabled={pricingPlans.length === 0}
              className="px-8 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:bg-slate-400"
            >
              Start Free Trial
            </button>
            <button
              onClick={handleOpenVideoModal}
              className="px-8 py-3 text-lg font-medium text-white bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-lg hover:bg-white/20 transition-colors"
            >
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-slate-600">
              Powerful features designed to help your business thrive
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all"
              >
                <feature.icon className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-slate-600">
              Choose the perfect plan for your business size
            </p>
          </div>

          {packagesError ? (
            <div className="max-w-2xl mx-auto rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-red-700 font-medium">{packagesError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : isLoadingPackages ? (
            <div className="grid md:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl p-8 bg-white border-2 border-slate-200 shadow-lg animate-pulse"
                >
                  <div className="h-6 w-32 bg-slate-200 rounded mb-6"></div>
                  <div className="h-12 w-28 bg-slate-200 rounded mb-4"></div>
                  <div className="h-4 w-full bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 w-4/5 bg-slate-200 rounded mb-8"></div>
                  <div className="h-12 w-full bg-slate-200 rounded mb-8"></div>
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((__, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="h-4 w-full bg-slate-200 rounded"
                      ></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-8 ${
                    plan.highlighted
                      ? "bg-blue-600 text-white shadow-2xl scale-105 border-4 border-blue-400"
                      : "bg-white border-2 border-slate-200 hover:border-blue-300 shadow-lg"
                  } transition-all`}
                >
                  {plan.highlighted && (
                    <div className="text-center mb-4">
                      <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <h3
                    className={`text-2xl font-bold mb-2 ${
                      plan.highlighted ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-5xl font-bold">${plan.price}</span>
                    <span
                      className={`text-lg ${
                        plan.highlighted ? "text-white/80" : "text-slate-600"
                      }`}
                    >
                      {plan.period}
                    </span>
                  </div>
                  <p
                    className={`mb-6 ${
                      plan.highlighted ? "text-white/90" : "text-slate-600"
                    }`}
                  >
                    {plan.description}
                  </p>
                  <button
                    onClick={() => handleGetStarted(plan.id)}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors mb-8 ${
                      plan.highlighted
                        ? "bg-white text-blue-600 hover:bg-blue-50"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    Get Started
                  </button>
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-3">
                        <Check
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            plan.highlighted ? "text-white" : "text-blue-600"
                          }`}
                        />
                        <span
                          className={
                            plan.highlighted ? "text-white/90" : "text-slate-600"
                          }
                        >
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of businesses already using Nealika POS
          </p>
          <button
            onClick={() => handleStartFreeTrial()}
            disabled={pricingPlans.length === 0}
            className="px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-lg hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl disabled:bg-slate-200"
          >
            Start Your Free 14-Day Trial
          </button>
          <p className="text-blue-100 mt-4">
            No credit card required | Cancel anytime
          </p>
        </div>
      </section>

      <Footer
        settings={publicSettings}
        onOpenTerms={() => handleOpenLegalPage("terms")}
        onOpenPrivacy={() => handleOpenLegalPage("privacy")}
      />

      {isVideoModalOpen && demoVideoSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <div className="relative aspect-video">
              {demoVideoSource.type === "html5" ? (
                <video
                  src={demoVideoSource.src}
                  controls
                  autoPlay
                  className="w-full h-full bg-black"
                />
              ) : (
                <iframe
                  src={demoVideoSource.src}
                  title="Nealika POS Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
