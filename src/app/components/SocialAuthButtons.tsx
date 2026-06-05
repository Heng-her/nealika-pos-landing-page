import { useEffect, useRef, useState } from "react";
import {
  getErrorMessage,
  loginWithGoogle,
  loginWithTelegram,
} from "../services/posApi";
import {
  ensureGoogleIdentityScript,
  ensureTelegramWebAppScript,
  getGoogleClientId,
  getTelegramBotUsername,
  getTelegramWebAppInitData,
  type GoogleCredentialResponse,
  type TelegramWidgetAuthData,
} from "../services/socialAuth";

interface SocialAuthButtonsProps {
  disabled?: boolean;
  onAuthSuccess: () => void | Promise<void>;
  onError: (message: string) => void;
  onStart?: () => void;
}

export default function SocialAuthButtons({
  disabled = false,
  onAuthSuccess,
  onError,
  onStart,
}: SocialAuthButtonsProps) {
  const googleButtonShellRef = useRef<HTMLDivElement | null>(null);
  const googleButtonMountRef = useRef<HTMLDivElement | null>(null);
  const telegramButtonShellRef = useRef<HTMLDivElement | null>(null);
  const telegramButtonMountRef = useRef<HTMLDivElement | null>(null);
  const telegramCallbackNameRef = useRef(
    `__nealikaTelegramAuth_${Math.random().toString(36).slice(2)}`,
  );

  const [googleButtonWidth, setGoogleButtonWidth] = useState(0);
  const [googleReady, setGoogleReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);
  const [telegramReady, setTelegramReady] = useState(false);
  const [telegramScale, setTelegramScale] = useState(1);

  const googleClientId = getGoogleClientId();
  const telegramBotUsername = getTelegramBotUsername();
  const isDisabled = disabled || isSubmitting;

  const startAuth = () => {
    onStart?.();
  };

  const runSuccessfulAuth = async (authAction: () => Promise<unknown>) => {
    startAuth();
    setIsSubmitting(true);

    try {
      await authAction();
      await onAuthSuccess();
    } catch (error) {
      onError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateTelegramScale = () => {
    const shellWidth = telegramButtonShellRef.current?.offsetWidth || 0;
    const iframeWidth =
      telegramButtonMountRef.current?.querySelector("iframe")?.clientWidth || 0;

    if (!shellWidth || !iframeWidth) {
      setTelegramScale(1);
      return;
    }

    setTelegramScale(shellWidth / iframeWidth);
  };

  useEffect(() => {
    const updateWidths = () => {
      setGoogleButtonWidth(googleButtonShellRef.current?.offsetWidth || 0);
      updateTelegramScale();
    };

    updateWidths();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidths);
      return () => {
        window.removeEventListener("resize", updateWidths);
      };
    }

    const observer = new ResizeObserver(updateWidths);

    if (googleButtonShellRef.current) {
      observer.observe(googleButtonShellRef.current);
    }

    if (telegramButtonShellRef.current) {
      observer.observe(telegramButtonShellRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const detectTelegramWebApp = async () => {
      const initData = getTelegramWebAppInitData();
      if (initData) {
        if (isMounted) {
          setIsTelegramWebApp(true);
        }
        return;
      }

      try {
        await ensureTelegramWebAppScript();
      } catch {
        if (isMounted) {
          setIsTelegramWebApp(false);
        }
        return;
      }

      if (isMounted) {
        setIsTelegramWebApp(Boolean(getTelegramWebAppInitData()));
      }
    };

    void detectTelegramWebApp();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!googleClientId || !googleButtonMountRef.current || !googleButtonWidth) {
      setGoogleReady(false);
      return;
    }

    let isMounted = true;

    const initializeGoogle = async () => {
      try {
        await ensureGoogleIdentityScript();

        if (!isMounted || !googleButtonMountRef.current || !window.google?.accounts?.id) {
          return;
        }

        googleButtonMountRef.current.innerHTML = "";

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: GoogleCredentialResponse) => {
            const credential = response.credential;

            if (!credential) {
              onError("Google login failed. Please try again.");
              return;
            }

            void runSuccessfulAuth(() => loginWithGoogle(credential));
          },
          context: "signin",
          ux_mode: "popup",
        });

        window.google.accounts.id.renderButton(googleButtonMountRef.current, {
          shape: "rectangular",
          size: "large",
          text: "continue_with",
          theme: "outline",
          type: "standard",
          width: Math.max(googleButtonWidth, 240),
        });

        setGoogleReady(true);
      } catch {
        if (isMounted) {
          setGoogleReady(false);
        }
      }
    };

    void initializeGoogle();

    return () => {
      isMounted = false;
    };
  }, [googleButtonWidth, googleClientId, onError]);

  useEffect(() => {
    if (
      isTelegramWebApp ||
      !telegramBotUsername ||
      !telegramButtonMountRef.current
    ) {
      setTelegramReady(false);
      return;
    }

    const callbackName = telegramCallbackNameRef.current;
    window[callbackName] = (user: TelegramWidgetAuthData) => {
      void runSuccessfulAuth(() =>
        loginWithTelegram({
          auth_date: user.auth_date,
          first_name: user.first_name,
          hash: user.hash,
          id: user.id,
          last_name: user.last_name,
          photo_url: user.photo_url,
          username: user.username,
        }),
      );
    };

    const mountNode = telegramButtonMountRef.current;
    mountNode.innerHTML = "";
    setTelegramReady(false);

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-lang", "en");
    script.setAttribute("data-onauth", `${callbackName}(user)`);
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-size", "large");
    script.setAttribute("data-telegram-login", telegramBotUsername);
    script.setAttribute("data-userpic", "false");
    script.onload = () => {
      setTelegramReady(true);
      window.setTimeout(updateTelegramScale, 150);
    };
    script.onerror = () => {
      setTelegramReady(false);
    };
    mountNode.appendChild(script);

    return () => {
      delete (window as any)[callbackName];
      mountNode.innerHTML = "";
    };
  }, [isTelegramWebApp, telegramBotUsername]);

  const handleGoogleButtonClick = () => {
    if (isDisabled) {
      return;
    }

    startAuth();

    if (!googleClientId) {
      onError("Google login is not configured.");
      return;
    }

    if (!googleReady) {
      onError("Google login is loading. Please try again.");
    }
  };

  const handleTelegramButtonClick = () => {
    if (isDisabled) {
      return;
    }

    startAuth();

    const initData = getTelegramWebAppInitData();
    if (initData) {
      void runSuccessfulAuth(() => loginWithTelegram({ init_data: initData }));
      return;
    }

    if (!telegramBotUsername) {
      onError("Telegram login is not configured.");
      return;
    }

    if (!telegramReady) {
      onError("Telegram login is loading. Please try again.");
    }
  };

  return (
    <div className="space-y-3">
      <div ref={googleButtonShellRef} className="relative">
        <button
          onClick={handleGoogleButtonClick}
          className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-3 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200"
          disabled={isDisabled}
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

        {googleClientId ? (
          <div
            className={`absolute inset-0 z-10 overflow-hidden opacity-0 ${
              googleReady && !isDisabled
                ? "pointer-events-auto"
                : "pointer-events-none"
            }`}
          >
            <div
              ref={googleButtonMountRef}
              className="flex h-full w-full items-center justify-center"
            />
          </div>
        ) : null}
      </div>

      <div ref={telegramButtonShellRef} className="relative">
        <button
          onClick={handleTelegramButtonClick}
          className="w-full px-4 py-3 bg-[#0088cc] text-white rounded-lg font-medium hover:bg-[#006ba3] transition-colors flex items-center justify-center gap-3 disabled:bg-[#80bddf] disabled:text-white/80"
          disabled={isDisabled}
          type="button"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
          </svg>
          Continue with Telegram
        </button>

        {!isTelegramWebApp && telegramBotUsername ? (
          <div
            className={`absolute inset-0 z-10 overflow-hidden opacity-0 ${
              telegramReady && !isDisabled
                ? "pointer-events-auto"
                : "pointer-events-none"
            }`}
          >
            <div className="flex h-full w-full items-center justify-center overflow-hidden">
              <div
                style={{
                  transform: `scale(${telegramScale})`,
                  transformOrigin: "center center",
                }}
              >
                <div ref={telegramButtonMountRef} />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
