import { ArrowLeft, Shield, User } from "lucide-react";
import logo from "@/imports/logo-nealika.png";
import Footer from "./Footer";
import type { PublicSiteSettings } from "../services/posApi";

export type LegalPageType = "terms" | "privacy";

interface LegalPageProps {
  type: LegalPageType;
  settings?: PublicSiteSettings | null;
  isLoadingContent?: boolean;
  onBack: () => void;
  onOpenLogin: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

function formatLegalDate(value?: string) {
  const trimmedValue = (value || "").trim();

  if (!trimmedValue) {
    return "";
  }

  const date = new Date(trimmedValue);
  if (Number.isNaN(date.getTime())) {
    return trimmedValue;
  }

  return date.toISOString().slice(0, 10);
}

function containsHtml(value?: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value || "");
}

function getLegalDocumentSettings(
  type: LegalPageType,
  settings?: PublicSiteSettings | null,
) {
  if (type === "terms") {
    return {
      title: "Terms and Conditions",
      content: settings?.terms_of_service_content || "",
      date: settings?.terms_of_service_updated_at || "",
      dateLabel: "Last updated",
    };
  }

  return {
    title: "Privacy Policy",
    content: settings?.privacy_policy_content || "",
    date: settings?.privacy_policy_updated_at || "",
    dateLabel: "Last updated",
  };
}

function renderPlainTextContent(value: string) {
  return value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => (
      <p key={`${block.slice(0, 24)}-${index}`} className="mb-6">
        {block}
      </p>
    ));
}

export default function LegalPage({
  type,
  settings,
  isLoadingContent = false,
  onBack,
  onOpenLogin,
  onOpenTerms,
  onOpenPrivacy,
}: LegalPageProps) {
  const documentSettings = getLegalDocumentSettings(type, settings);
  const formattedDate = formatLegalDate(documentSettings.date);
  const hasContent = documentSettings.content.trim() !== "";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b shadow-sm">
        <div className="border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-end gap-6 text-sm">
              <button
                onClick={onOpenLogin}
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-3 text-left"
            >
              <img src={logo} alt="Nealika" className="h-14 w-auto" />
            </button>

            <nav className="flex flex-wrap items-center gap-4 text-base text-slate-700">
              <button
                onClick={onBack}
                className="hover:text-blue-600 transition-colors"
              >
                Home
              </button>
              <button
                onClick={onOpenTerms}
                className={`transition-colors ${
                  type === "terms"
                    ? "text-blue-600 font-semibold"
                    : "hover:text-blue-600"
                }`}
              >
                Terms of Service
              </button>
              <button
                onClick={onOpenPrivacy}
                className={`transition-colors ${
                  type === "privacy"
                    ? "text-blue-600 font-semibold"
                    : "hover:text-blue-600"
                }`}
              >
                Privacy Policy
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto rounded-[2rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-16 lg:py-14">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>

            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tight text-slate-900">
                  {documentSettings.title}
                </h1>
              </div>

              {formattedDate ? (
                <p className="text-lg text-slate-700 mb-8">
                  {documentSettings.dateLabel}: {formattedDate}
                </p>
              ) : null}

              {isLoadingContent ? (
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-6 rounded bg-slate-200 animate-pulse"
                    ></div>
                  ))}
                </div>
              ) : hasContent ? (
                containsHtml(documentSettings.content) ? (
                  <div
                    className="max-w-none text-[18px] leading-8 text-slate-800 [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:uppercase [&_h1]:tracking-tight [&_h1]:text-slate-900 [&_h1]:mb-8 [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-10 [&_h2]:mb-5 [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h3]:mt-8 [&_h3]:mb-4 [&_p]:mb-6 [&_strong]:font-semibold [&_ul]:mb-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2"
                    dangerouslySetInnerHTML={{
                      __html: documentSettings.content,
                    }}
                  />
                ) : (
                  <div className="text-[18px] leading-8 text-slate-800">
                    {renderPlainTextContent(documentSettings.content)}
                  </div>
                )
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-8 text-slate-600">
                  {documentSettings.title} content will be available soon.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer
        settings={settings}
        onOpenTerms={onOpenTerms}
        onOpenPrivacy={onOpenPrivacy}
      />
    </div>
  );
}
