import {
  Check,
  CreditCard,
  BarChart3,
  Users,
  Zap,
  Shield,
  X,
  User,
  Menu,
} from "lucide-react";
import { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import CheckoutPage from "./components/CheckoutPage";
import Footer from "./components/Footer";
import logo from "@/imports/logo-nealika.png";
import { cn } from "./components/ui/utils";

export default function App() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [showLoginPage, setShowLoginPage] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const difference = currentScrollY - lastScrollY;

      // Ignore scrolls less than 5px
      if (Math.abs(difference) < 5) return;

      if (currentScrollY > lastScrollY && currentScrollY > 10) {
        setIsTopBarVisible(false);
      } else {
        setIsTopBarVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
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

  const pricingPlans = [
    {
      id: 1,
      name: "Starter",
      price: 29,
      period: "/month",
      description: "Perfect for small businesses just getting started",
      features: [
        "Up to 1 register",
        "Basic inventory management",
        "Sales reporting",
        "Email support",
        "Mobile app access",
        "Payment processing",
      ],
      highlighted: false,
    },
    {
      id: 2,
      name: "Professional",
      price: 79,
      period: "/month",
      description: "Ideal for growing businesses with multiple locations",
      features: [
        "Up to 5 registers",
        "Advanced inventory management",
        "Advanced analytics & reports",
        "Priority support 24/7",
        "Employee management",
        "Customer loyalty program",
        "Multi-location support",
        "API access",
      ],
      highlighted: true,
    },
    {
      id: 3,
      name: "Enterprise",
      price: 199,
      period: "/month",
      description: "Complete solution for large-scale operations",
      features: [
        "Unlimited registers",
        "Enterprise inventory system",
        "Custom reports & dashboards",
        "Dedicated account manager",
        "Advanced security features",
        "Custom integrations",
        "White-label options",
        "Advanced fraud protection",
        "On-premise deployment option",
      ],
      highlighted: false,
    },
  ];

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

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowLoginPage(false);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowLoginPage(false);
  };

  const handleGetStarted = () => {
    setShowCheckout(true);
  };

  const handleCheckoutComplete = () => {
    setIsAuthenticated(true);
    setShowCheckout(false);
  };

  if (isAuthenticated) {
    return <Dashboard onLogout={handleLogout} />;
  }

  if (showCheckout) {
    return (
      <CheckoutPage
        packages={pricingPlans}
        defaultPackageId={2}
        currentPackageId={null}
        onBack={() => setShowCheckout(false)}
        onComplete={handleCheckoutComplete}
      />
    );
  }

  if (showLoginPage) {
    return (
      <LoginPage
        onBack={() => setShowLoginPage(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header
        className={cn(
          "bg-white sticky top-0 z-50 shadow-sm transition-transform duration-300 ease-in-out",
          isTopBarVisible ? "translate-y-0" : "-translate-y-[37px]",
        )}
      >
        {/* Top Bar */}
        <div className="border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-end gap-6 text-sm">
              <button
                onClick={() => setShowLoginPage(true)}
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

        {/* Main Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Nealika" className="h-[55px]" />
            </div>

            {/* Desktop Navigation */}
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

            {/* Mobile Menu Trigger & Get Start CTA */}
            <div className="flex items-center gap-3 lg:hidden">
              {/* <button
                onClick={handleGetStarted}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Get Start
              </button> */}
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

        {/* Mobile Drawer (Glassmorphic Slide-out Menu) */}
        <div
          className={cn(
            "fixed inset-0 z-50 lg:hidden transition-all duration-300 ease-in-out",
            isMobileMenuOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none",
          )}
        >
          {/* Backdrop Blur Overlay */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div
            className={cn(
              "absolute top-0 right-0 w-80 h-full bg-white shadow-2xl flex flex-col p-6 transition-transform duration-300 ease-in-out transform",
              isMobileMenuOpen ? "translate-x-0" : "translate-x-full",
            )}
          >
            {/* Header of Drawer */}
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

            {/* Scrollable Navigation Links */}
            <nav className="flex flex-col gap-2 py-6 overflow-y-auto flex-1">
              <a
                href="#"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-all font-medium"
              >
                <span>🏠</span>
                Home
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

            {/* Top Bar Actions & CTA in Mobile Menu */}
            <div className="border-t border-slate-100 pt-6 flex flex-col gap-4">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setShowLoginPage(true);
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
                  handleGetStarted();
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold text-center shadow-md hover:shadow-lg"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-48 md:py-64 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1746723386880-ca68b5f4b22d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
            alt="Modern retail store"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-blue-900/80"></div>
        </div>

        {/* Content */}
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
              onClick={handleGetStarted}
              className="px-8 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="px-8 py-3 text-lg font-medium text-white bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-lg hover:bg-white/20 transition-colors"
            >
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
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

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-slate-600">
              Choose the perfect plan for your business size
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
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
                  className={`text-2xl font-bold mb-2 ${plan.highlighted ? "text-white" : "text-slate-900"}`}
                >
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold">${plan.price}</span>
                  <span
                    className={`text-lg ${plan.highlighted ? "text-white/80" : "text-slate-600"}`}
                  >
                    {plan.period}
                  </span>
                </div>
                <p
                  className={`mb-6 ${plan.highlighted ? "text-white/90" : "text-slate-600"}`}
                >
                  {plan.description}
                </p>
                <button
                  onClick={handleGetStarted}
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
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.highlighted ? "text-white" : "text-blue-600"}`}
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
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of businesses already using Nealika POS
          </p>
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-lg hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl"
          >
            Start Your Free 14-Day Trial
          </button>
          <p className="text-blue-100 mt-4">
            No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <div className="relative aspect-video">
              {/* https://www.youtube.com/watch?v=vIl15M3Dkjk&feature=youtu.be */}
              <iframe
                src="https://www.youtube.com/embed/vIl15M3Dkjk?autoplay=1"
                title="Nealika POS Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
