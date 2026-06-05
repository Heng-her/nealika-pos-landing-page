const DEFAULT_API_BASE_URL = "https://mgr-pos.kemleap.site";
const AUTH_TOKEN_KEY = "nealika_pos_token";

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

interface ApiEnvelope<T> {
  code: number;
  msg: string;
  time?: string;
  data: T;
}

export interface ApiPackageFeature {
  id: number;
  package_id: number;
  feature: string;
  status: number;
  sort_order: number;
  createtime?: number;
  updatetime?: number;
}

export interface ApiPackage {
  id: number;
  name: string;
  slug: string;
  description: string;
  monthly_price: string;
  currency: string;
  is_popular: number | boolean;
  status: number;
  sort_order: number;
  createtime?: number;
  updatetime?: number;
  features?: ApiPackageFeature[];
}

export interface ApiSubscriptionDuration {
  id: number;
  name: string;
  months: number;
  discount_percent: string;
  status: number;
  sort_order: number;
  createtime?: number;
  updatetime?: number;
}

export interface AuthUser {
  id: number;
  name?: string;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  business_name?: string | null;
  address?: string | null;
  [key: string]: unknown;
}

export interface VerifyOtpResponse {
  token?: string;
  user?: AuthUser | null;
  [key: string]: unknown;
}

export interface TelegramAuthPayload {
  auth_date?: number | string;
  first_name?: string;
  hash?: string;
  id?: number | string;
  init_data?: string;
  last_name?: string;
  photo_url?: string;
  username?: string;
}

export interface UserProfile {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
  business_name?: string;
  address?: string;
  avatar?: string | null;
  [key: string]: unknown;
}

export interface CurrentSubscription {
  id?: number;
  user_id?: number;
  package_id?: number;
  package_name?: string;
  duration_months?: number;
  start_date?: string | null;
  expire_date?: string | null;
  status?: string;
  auto_renew?: boolean | number;
  next_billing_date?: string | null;
  [key: string]: unknown;
}

export interface CheckoutQuote {
  package: ApiPackage;
  duration: ApiSubscriptionDuration;
  coupon?: {
    code?: string;
    [key: string]: unknown;
  } | null;
  base_price: number;
  duration_discount: number;
  coupon_discount: number;
  subtotal: number;
  discount: number;
  tax_percent: number;
  tax_amount: number;
  total: number;
  currency: string;
}

export interface PaywayCreateResponse {
  payment_id?: number;
  order_id?: number;
  transaction_id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  checkout_url?: string;
  form_fields?: Record<string, string | number | null | undefined>;
  expires_at?: string | null;
  [key: string]: unknown;
}

export interface PaymentHistoryItem {
  id?: number;
  transaction_id?: string;
  package_name?: string;
  type?: string;
  amount?: number | string;
  currency?: string;
  method?: string;
  status?: string;
  paid_at?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface PaymentStatusResponse {
  transaction_id?: string;
  payment_id?: number;
  order_id?: number;
  status?: string;
  amount?: number | string;
  currency?: string;
  paid_at?: string | null;
  expire_at?: string | null;
  subscription_status?: string | null;
  [key: string]: unknown;
}

export interface DisplayPackage {
  id: number;
  name: string;
  slug: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  maxRegisters: string;
  category: string;
}

interface RequestOptions {
  method?: RequestMethod;
  body?: unknown;
  requiresAuth?: boolean;
  headers?: Record<string, string>;
  query?: Record<string, string | number | undefined | null>;
}

export class ApiError extends Error {
  code: number;
  data: unknown;

  constructor(message: string, code = 500, data: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.data = data;
  }
}

const REGISTER_LIMITS: Record<string, string> = {
  starter: "Up to 1 register",
  professional: "Up to 5 registers",
  enterprise: "Unlimited registers",
};

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

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(
    /\/+$/,
    "",
  );
}

function buildUrl(
  path: string,
  query?: Record<string, string | number | undefined | null>,
) {
  const url = new URL(`${getApiBaseUrl()}${path}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

async function apiRequest<T>(
  path: string,
  {
    method = "GET",
    body,
    requiresAuth = false,
    headers = {},
    query,
  }: RequestOptions = {},
) {
  const requestHeaders = new Headers(headers);
  const token = getStoredAuthToken();

  if (requiresAuth) {
    if (!token) {
      throw new ApiError("Please login first", 401);
    }
    requestHeaders.set("token", token);
  }

  let requestBody: BodyInit | undefined;
  if (body instanceof FormData) {
    requestBody = body;
  } else if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: requestHeaders,
    body: requestBody,
  });

  const rawText = await response.text();
  const payload = rawText ? tryParseJson(rawText) : null;

  if (payload && typeof payload === "object" && "code" in payload) {
    const apiPayload = payload as ApiEnvelope<T>;
    if (apiPayload.code === 1) {
      return apiPayload.data;
    }

    if (apiPayload.code === 401) {
      clearStoredAuthToken();
    }

    throw new ApiError(
      apiPayload.msg || "Request failed",
      apiPayload.code,
      apiPayload.data,
    );
  }

  if (!response.ok) {
    throw new ApiError(
      response.statusText || "Request failed",
      response.status,
      payload,
    );
  }

  return payload as T;
}

function tryParseJson(rawText: string) {
  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
}

export function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY) || "";
}

export function setStoredAuthToken(token: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

export function clearStoredAuthToken() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export function normalizePhoneNumber(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("0")) {
    return digits;
  }

  if (digits.startsWith("855")) {
    return `0${digits.slice(3)}`;
  }

  return `0${digits}`;
}

export function getPackageFeatureTexts(
  packageData?: Pick<ApiPackage, "features"> | null,
) {
  if (!packageData?.features?.length) {
    return [];
  }

  return packageData.features.map((feature) => feature.feature);
}

export function mapPackageToDisplayPackage(
  packageData: ApiPackage,
): DisplayPackage {
  const featureTexts = getPackageFeatureTexts(packageData);

  return {
    id: packageData.id,
    name: packageData.name,
    slug: packageData.slug,
    price: Number(packageData.monthly_price || 0),
    currency: packageData.currency || "USD",
    period: "/month",
    description: packageData.description,
    features: featureTexts,
    highlighted: Boolean(Number(packageData.is_popular)),
    maxRegisters:
      REGISTER_LIMITS[packageData.slug] ||
      featureTexts[0] ||
      "Included in package",
    category: "POS Service",
  };
}

export function normalizePaymentStatus(status?: string | null) {
  const normalized = (status || "").toLowerCase();

  if (normalized === "completed" || normalized === "paid") {
    return "paid";
  }

  if (normalized === "cancelled") {
    return "cancelled";
  }

  if (normalized === "expired") {
    return "expired";
  }

  if (normalized === "failed") {
    return "failed";
  }

  return "pending";
}

export function submitPaywayForm(
  checkoutUrl: string,
  formFields: Record<string, string | number | null | undefined>,
  target = "_self",
) {
  const form = document.createElement("form");

  form.method = "POST";
  form.action = checkoutUrl;
  form.target = target;
  form.style.display = "none";

  Object.entries(formFields).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value ?? "");
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

export async function getPackages() {
  return apiRequest<ApiPackage[]>("/api/packages");
}

export async function getSubscriptionDurations() {
  return apiRequest<ApiSubscriptionDuration[]>("/api/subscription_durations");
}

export async function sendOtp(phone: string) {
  return apiRequest<unknown>("/api/auth/sendotp", {
    method: "POST",
    body: { phone },
  });
}

export async function verifyOtp(phone: string, otp: string) {
  const data = await apiRequest<VerifyOtpResponse>("/api/auth/verifyotp", {
    method: "POST",
    body: { phone, otp },
  });

  if (data?.token) {
    setStoredAuthToken(data.token);
  }

  return data;
}

export async function loginWithGoogle(idToken: string) {
  const data = await apiRequest<VerifyOtpResponse>("/api/auth/google", {
    method: "POST",
    body: { id_token: idToken },
  });

  if (data?.token) {
    setStoredAuthToken(data.token);
  }

  return data;
}

export async function loginWithTelegram(payload: TelegramAuthPayload) {
  logDev("Calling backend /api/auth/telegram", payload);
  const data = await apiRequest<VerifyOtpResponse>("/api/auth/telegram", {
    method: "POST",
    body: payload,
  });
  logDev("Telegram backend response", data);

  if (data?.token) {
    setStoredAuthToken(data.token);
  }

  return data;
}

export async function getMe() {
  if (!getStoredAuthToken()) {
    return null;
  }

  try {
    return await apiRequest<AuthUser>("/api/auth/me", {
      requiresAuth: true,
    });
  } catch (error) {
    if (error instanceof ApiError && error.code === 401) {
      return null;
    }

    throw error;
  }
}

export async function getProfile() {
  return apiRequest<UserProfile>("/api/profile", {
    requiresAuth: true,
  });
}

export async function updateProfile(profile: UserProfile) {
  return apiRequest<UserProfile>("/api/profile", {
    method: "PUT",
    requiresAuth: true,
    body: profile,
  });
}

export async function getCurrentSubscription() {
  return apiRequest<CurrentSubscription | null>("/api/subscriptions/current", {
    requiresAuth: true,
  });
}

export async function getCheckoutQuote(payload: {
  package_id: number;
  duration_id: number;
  coupon_code?: string;
}) {
  return apiRequest<CheckoutQuote>("/api/checkout/quote", {
    method: "POST",
    body: payload,
  });
}

export async function createPaywayPayment(payload: {
  package_id: number;
  duration_id: number;
  coupon_code?: string;
  payment_method: "khqr" | "card";
}) {
  return apiRequest<PaywayCreateResponse>("/api/payments/paywaycreate", {
    method: "POST",
    requiresAuth: true,
    body: payload,
  });
}

export async function getPaymentHistory() {
  return apiRequest<PaymentHistoryItem[]>("/api/payments/history", {
    requiresAuth: true,
  });
}

export async function getPaymentStatus(transactionId: string) {
  return apiRequest<PaymentStatusResponse>("/api/payments/statusby", {
    requiresAuth: true,
    query: { tid: transactionId },
  });
}
