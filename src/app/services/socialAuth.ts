const GOOGLE_IDENTITY_SCRIPT_ID = "google-identity-services";
const TELEGRAM_WEBAPP_SCRIPT_ID = "telegram-webapp-sdk";

const GOOGLE_IDENTITY_SCRIPT_URL = "https://accounts.google.com/gsi/client";
const TELEGRAM_WEBAPP_SCRIPT_URL = "https://telegram.org/js/telegram-web-app.js";

interface GoogleIdConfiguration {
  auto_select?: boolean;
  callback: (response: GoogleCredentialResponse) => void;
  client_id: string;
  context?: "signin" | "signup" | "use";
  ux_mode?: "popup" | "redirect";
}

interface GoogleButtonConfiguration {
  shape?: "circle" | "pill" | "rectangular" | "square";
  size?: "large" | "medium" | "small";
  text?: "continue_with" | "signin" | "signin_with" | "signup_with";
  theme?: "filled_black" | "filled_blue" | "outline";
  type?: "icon" | "standard";
  width?: number;
}

export interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
}

export interface TelegramWidgetAuthData {
  auth_date: string;
  first_name?: string;
  hash: string;
  id: number | string;
  last_name?: string;
  photo_url?: string;
  username?: string;
}

interface GoogleIdentityAccounts {
  id: {
    initialize: (configuration: GoogleIdConfiguration) => void;
    renderButton: (
      parent: HTMLElement,
      options: GoogleButtonConfiguration,
    ) => void;
  };
}

interface TelegramWebApp {
  initData?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
    google?: {
      accounts: GoogleIdentityAccounts;
    };
  }
}

const scriptPromises = new Map<string, Promise<void>>();

function loadScript(scriptId: string, src: string) {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("Browser environment is required."));
  }

  const existingPromise = scriptPromises.get(scriptId);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(
      scriptId,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        resolve();
        return;
      }

      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => {
          scriptPromises.delete(scriptId);
          reject(new Error(`Failed to load script: ${src}`));
        },
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => {
      scriptPromises.delete(scriptId);
      reject(new Error(`Failed to load script: ${src}`));
    };
    document.body.appendChild(script);
  });

  scriptPromises.set(scriptId, promise);
  return promise;
}

export function getGoogleClientId() {
  return String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
}

export function getTelegramBotUsername() {
  return String(import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "").trim();
}

export function ensureGoogleIdentityScript() {
  return loadScript(GOOGLE_IDENTITY_SCRIPT_ID, GOOGLE_IDENTITY_SCRIPT_URL);
}

export function ensureTelegramWebAppScript() {
  return loadScript(TELEGRAM_WEBAPP_SCRIPT_ID, TELEGRAM_WEBAPP_SCRIPT_URL);
}

export function getTelegramWebAppInitData() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.Telegram?.WebApp?.initData || "";
}
