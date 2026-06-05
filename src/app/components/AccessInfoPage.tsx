import { useState } from "react";
import { Check, Copy, Eye, EyeOff } from "lucide-react";

interface AccessInfoPageProps {
  accessInfo: {
    posUrl: string;
    username: string;
    password: string;
    email: string;
  };
}

export default function AccessInfoPage({ accessInfo }: AccessInfoPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
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
              onClick={() => handleCopyToClipboard(accessInfo.posUrl, "url")}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors"
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
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors"
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
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
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
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors"
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
              onClick={() => handleCopyToClipboard(accessInfo.email, "email")}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors"
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
              POS access info is still waiting for its backend endpoint.
              The layout is ready, but the real credentials API has not
              been provided yet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
