import { useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
} from "lucide-react";
import type { PosAccessInfo } from "../services/posApi";

interface AccessInfoPageProps {
  accessInfo: PosAccessInfo | null;
  error?: string;
  isLoading: boolean;
  isOpeningPos: boolean;
  isRegeneratingPassword: boolean;
  isRevealingPassword: boolean;
  onOpenPos: () => void;
  onRegeneratePassword: () => void;
  onRevealPassword: () => Promise<boolean>;
  onViewPackages: () => void;
}

const LOCKED_ACCESS_MESSAGE =
  "Please subscribe to Starter, Professional, or Enterprise to unlock your POS system.";
const EXPIRED_ACCESS_MESSAGE =
  "Your subscription has expired. Please renew your package to continue using POS.";

export default function AccessInfoPage({
  accessInfo,
  error = "",
  isLoading,
  isOpeningPos,
  isRegeneratingPassword,
  isRevealingPassword,
  onOpenPos,
  onRegeneratePassword,
  onRevealPassword,
  onViewPackages,
}: AccessInfoPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isLocked =
    accessInfo?.locked !== false || !accessInfo?.has_subscription;
  const access = accessInfo?.access;
  const hasPassword = Boolean(access?.password);
  const hasEmail = Boolean(access?.email);
  const isExpired = accessInfo?.reason === "expired";
  const lockTitle = isExpired
    ? "POS Access is disabled"
    : "POS Access is locked";
  const lockMessage = isExpired
    ? EXPIRED_ACCESS_MESSAGE
    : accessInfo?.message?.trim() || LOCKED_ACCESS_MESSAGE;
  const lockDetailMessage =
    accessInfo?.message?.trim() &&
    accessInfo.message.trim() !== lockMessage &&
    accessInfo.message.trim() !== LOCKED_ACCESS_MESSAGE
      ? accessInfo.message.trim()
      : "";
  const isMaskedPassword = /^[*•●xX]+$/.test((access?.password || "").trim());

  const handleCopyToClipboard = (text: string, field: string) => {
    if (!text) {
      return;
    }

    void navigator.clipboard.writeText(text);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 2000);
  };

  const renderCopyButton = (text: string, field: string) => (
    <button
      onClick={() => handleCopyToClipboard(text, field)}
      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors"
      type="button"
    >
      {copiedField === field ? (
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
  );

  const handleTogglePasswordVisibility = async () => {
    if (showPassword) {
      setShowPassword(false);
      return;
    }

    if (isMaskedPassword) {
      const hasRevealedPassword = await onRevealPassword();
      if (!hasRevealedPassword) {
        return;
      }
    }

    setShowPassword(true);
  };

  const secondaryActionClassName =
    "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60";
  const primaryActionClassName =
    "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300";

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-56 rounded bg-slate-100" />
          <div className="h-5 w-72 rounded bg-slate-100" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Access Information
        </h2>
        <p className="text-slate-600">
          Manage your POS login details and open POS with a secure one-time
          login ticket.
        </p>
      </div>

      {error ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLocked ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-amber-100 p-3 text-amber-700">
              <Lock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-slate-900">
                {lockTitle}
              </h3>
              <p className="mt-2 text-slate-700">{lockMessage}</p>
              {lockDetailMessage ? (
                <p className="mt-3 text-sm text-amber-800">
                  {lockDetailMessage}
                </p>
              ) : null}
              <button
                onClick={onViewPackages}
                type="button"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                {isExpired ? "Renew Package" : "View Packages"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* <div className="mb-4 flex items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-sm font-medium text-green-700 w-fit border border-green-200">
            <Check className="w-4 h-4" />
            Your POS access is unlocked
          </div> */}

          <div className="space-y-4">
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex flex-col gap-3 mb-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="text-sm font-medium text-slate-500">
                  POS URL
                </label>
                {renderCopyButton(access?.pos_url || "", "url")}
              </div>
              <div className="flex flex-row gap-3">
                <input
                type="text"
                value={access?.pos_url || ""}
                readOnly
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-sm"
              />
              <button
                onClick={onOpenPos}
                type="button"
                disabled={isOpeningPos}
                className={primaryActionClassName}
              >
                <ExternalLink className="w-4 h-4" />
                {isOpeningPos ? "Opening POS..." : "Open"}
              </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2 gap-4">
                <label className="text-sm font-medium text-slate-500">
                  Username
                </label>
                {renderCopyButton(access?.username || "", "username")}
              </div>
              <input
                type="text"
                value={access?.username || ""}
                readOnly
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-sm"
              />
            </div>

            {hasPassword ? (
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex flex-col gap-3 mb-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-sm font-medium text-slate-500">
                    Password
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={onRegeneratePassword}
                      type="button"
                      disabled={isRegeneratingPassword}
                      className={secondaryActionClassName}
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${isRegeneratingPassword ? "animate-spin" : ""}`}
                      />
                      {isRegeneratingPassword
                        ? "Regenerating..."
                        : "Regenerate Password"}
                    </button>
                    {renderCopyButton(access?.password || "", "password")}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={access?.password || ""}
                    readOnly
                    className="w-full px-4 py-2 pr-12 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-sm"
                  />
                  <button
                    onClick={() => void handleTogglePasswordVisibility()}
                    type="button"
                    disabled={isRevealingPassword}
                    className="absolute inset-y-0 right-3 inline-flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors disabled:cursor-not-allowed disabled:text-slate-400"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {isRevealingPassword ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ) : null}

            {hasEmail ? (
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2 gap-4">
                  <label className="text-sm font-medium text-slate-500">
                    Email
                  </label>
                  {renderCopyButton(access?.email || "", "email")}
                </div>
                <input
                  type="text"
                  value={access?.email || ""}
                  readOnly
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-sm"
                />
              </div>
            ) : null}
          </div>
        </>
      )}

      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-3">
          <div className="mt-0.5 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-amber-900 mb-1">Security Notice</p>
            <p className="text-sm text-amber-700">
              Open POS from this page to create a fresh one-time login ticket.
              This is more secure than bookmarking an old direct login URL.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
