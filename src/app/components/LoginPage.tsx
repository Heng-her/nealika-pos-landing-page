import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import logo from "@/imports/logo-nealika.png";
import SocialAuthButtons from "./SocialAuthButtons";
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

  const handleSendOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSendingOtp(true);

    try {
      await sendOtp(normalizePhoneNumber(phoneNumber));
      setShowOtpInput(true);
      toast.success("OTP sent successfully.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsVerifyingOtp(true);

    try {
      await verifyOtp(normalizePhoneNumber(phoneNumber), otp);
      toast.success("Logged in successfully.");
      onLoginSuccess();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSocialAuthStart = () => {};

  const handleSocialAuthError = (message: string) => {
    toast.error(message);
  };

  const handleSocialAuthSuccess = async () => {
    toast.success("Logged in successfully.");
    onLoginSuccess();
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
                  }}
                  className="w-full px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Change Phone Number
                </button>
              </form>
            )}
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
            disabled={isSendingOtp || isVerifyingOtp}
            onAuthSuccess={handleSocialAuthSuccess}
            onError={handleSocialAuthError}
            onStart={handleSocialAuthStart}
          />

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
