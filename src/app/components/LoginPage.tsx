import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import logo from "@/imports/logo-nealika.png";
import {
  getErrorMessage,
  normalizePhoneNumber,
  sendOtp,
  verifyOtp,
} from "../services/posApi";

interface LoginPageProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

export default function LoginPage({
  onBack,
  onLoginSuccess,
}: LoginPageProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [authError, setAuthError] = useState("");
  const [socialError, setSocialError] = useState("");

  const handleSendOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError("");
    setSocialError("");
    setIsSendingOtp(true);

    try {
      await sendOtp(normalizePhoneNumber(phoneNumber));
      setShowOtpInput(true);
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError("");
    setSocialError("");
    setIsVerifyingOtp(true);

    try {
      await verifyOtp(normalizePhoneNumber(phoneNumber), otp);
      onLoginSuccess();
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSocialLoginUnavailable = (provider: "Google" | "Telegram") => {
    setSocialError(
      `${provider} login is not connected in the current backend yet. Please use mobile OTP.`,
    );
    setAuthError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img src={logo} alt="Nealika" className="h-12" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-slate-600">Sign in to your account</p>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Login with Phone Number
            </h3>
            {!showOtpInput ? (
              <form onSubmit={handleSendOtp}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg">
                      <span className="text-slate-700 font-medium">+855</span>
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(event) =>
                        setPhoneNumber(event.target.value.replace(/\D/g, ""))
                      }
                      placeholder="12 345 678"
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={9}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={phoneNumber.length < 8 || isSendingOtp}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSendingOtp ? (
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                    maxLength={6}
                    required
                  />
                  <p className="text-sm text-slate-500 mt-2">
                    Code sent to +855 {phoneNumber}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={otp.length < 6 || isVerifyingOtp}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed mb-2"
                >
                  {isVerifyingOtp ? "Verifying..." : "Verify & Login"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpInput(false);
                    setOtp("");
                    setAuthError("");
                  }}
                  className="w-full px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Change Phone Number
                </button>
              </form>
            )}

            {authError ? (
              <p className="text-sm text-red-600 mt-3">{authError}</p>
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

          <div className="space-y-3">
            <button
              onClick={() => handleSocialLoginUnavailable("Google")}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-3"
              type="button"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => handleSocialLoginUnavailable("Telegram")}
              className="w-full px-4 py-3 bg-[#0088cc] text-white rounded-lg font-medium hover:bg-[#006ba3] transition-colors flex items-center justify-center gap-3"
              type="button"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
              Continue with Telegram
            </button>
          </div>

          {socialError ? (
            <p className="text-sm text-amber-700 mt-4">{socialError}</p>
          ) : null}

          <p className="text-xs text-slate-500 text-center mt-6">
            By continuing, you agree to our{" "}
            <a href="#" className="text-blue-600 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
