const GOOGLE_IDENTITY_SCRIPT_ID = "google-identity-services";
const TELEGRAM_WEBAPP_SCRIPT_ID = "telegram-webapp-sdk";
const TELEGRAM_AUTH_CALLBACK_FLAG = "telegramAuthCallback";
const TELEGRAM_AUTH_MESSAGE_TYPE = "nealika:telegram-auth";

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

type TelegramAuthCallback = (user: TelegramWidgetAuthData) => void;

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
    __telegramMessageBridgeReady?: boolean;
    onTelegramAuth?: TelegramAuthCallback;
    google?: {
      accounts: GoogleIdentityAccounts;
    };
  }
}

const scriptPromises = new Map<string, Promise<void>>();
let telegramAuthHandler: TelegramAuthCallback | null = null;

function logDev(message: string, data?: unknown) {
  if (!import.meta.env.DEV) {
    return;
  }

  if (data === undefined) {
    console.log(message);
    return;
  }

  console.log(message, data);
}

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

function mapTelegramAuthParams(
  searchParams: URLSearchParams,
): TelegramWidgetAuthData | null {
  const id = searchParams.get("id");
  const authDate = searchParams.get("auth_date");
  const hash = searchParams.get("hash");

  if (!id || !authDate || !hash) {
    return null;
  }

  return {
    auth_date: authDate,
    first_name: searchParams.get("first_name") || undefined,
    hash,
    id,
    last_name: searchParams.get("last_name") || undefined,
    photo_url: searchParams.get("photo_url") || undefined,
    username: searchParams.get("username") || undefined,
  };
}

function emitTelegramAuth(user: TelegramWidgetAuthData) {
  logDev("Telegram auth payload received", user);
  telegramAuthHandler?.(user);
}

function ensureTelegramMessageBridge() {
  if (typeof window === "undefined") {
    return;
  }

  if (window.__telegramMessageBridgeReady) {
    return;
  }

  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) {
      return;
    }

    const message = event.data;
    if (
      !message ||
      typeof message !== "object" ||
      (message as { type?: string }).type !== TELEGRAM_AUTH_MESSAGE_TYPE
    ) {
      return;
    }

    const payload = (message as { payload?: TelegramWidgetAuthData }).payload;
    if (!payload) {
      return;
    }

    emitTelegramAuth(payload);
  });

  window.__telegramMessageBridgeReady = true;
}

export function getTelegramAuthRedirectUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  const url = new URL(window.location.href);
  url.searchParams.set(TELEGRAM_AUTH_CALLBACK_FLAG, "1");
  return url.toString();
}

export function getTelegramAuthResultFromUrl() {
  if (typeof window === "undefined") {
    return null;
  }

  const url = new URL(window.location.href);
  return mapTelegramAuthParams(url.searchParams);
}

export function isTelegramAuthCallbackWindow() {
  if (typeof window === "undefined") {
    return false;
  }

  const url = new URL(window.location.href);
  return (
    url.searchParams.get(TELEGRAM_AUTH_CALLBACK_FLAG) === "1" &&
    Boolean(mapTelegramAuthParams(url.searchParams))
  );
}

export function forwardTelegramAuthResultToOpener() {
  if (typeof window === "undefined" || !window.opener || window.opener === window) {
    return false;
  }

  const payload = getTelegramAuthResultFromUrl();
  if (!payload) {
    return false;
  }

  logDev("Forwarding Telegram auth payload to opener", payload);
  window.opener.postMessage(
    {
      type: TELEGRAM_AUTH_MESSAGE_TYPE,
      payload,
    },
    window.location.origin,
  );

  window.setTimeout(() => {
    window.close();
  }, 150);

  return true;
}

export function setTelegramAuthHandler(handler: TelegramAuthCallback | null) {
  telegramAuthHandler = handler;

  if (typeof window === "undefined") {
    return;
  }

  ensureTelegramMessageBridge();
  window.onTelegramAuth = (user: TelegramWidgetAuthData) => {
    emitTelegramAuth(user);
  };
}
