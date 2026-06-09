const DEFAULT_API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL).trim();
const PUBLIC_SETTINGS_PATH = String(
  import.meta.env.VITE_PUBLIC_SETTINGS_PATH || "/settings/public",
).trim();
const AUTH_TOKEN_KEY = "token";
const LEGACY_AUTH_TOKEN_KEY = "nealika_pos_token";
const USER_INFO_KEY = "userinfo";
const PROFILE_API_DEBUG_KEY = "profile_api_debug";

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
  id: number | string;
  type?: string | null;
  username?: string;
  nickname?: string;
  name?: string;
  email?: string | null;
  mobile?: string | null;
  phone?: string | null;
  bio?: string | null;
  avatar?: string | null;
  business_name?: string | null;
  address?: string | null;
  subscription_status?: string | null;
  current_package?: string | null;
  token?: string;
  [key: string]: unknown;
}

export interface VerifyOtpResponse {
  token?: string;
  vendor?: AuthUser | null;
  user?: AuthUser | null;
  userinfo?: AuthUser | null;
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
  username?: string;
  nickname?: string;
  name?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  bio?: string;
  business_name?: string;
  address?: string;
  avatar?: string | null;
  [key: string]: unknown;
}

export interface UpdateProfilePayload {
  username: string;
  nickname?: string;
  bio?: string;
  avatar?: string;
  business_name?: string;
  address?: string;
}

export interface PublicSiteSettings {
  pos_demo_video_url?: string;
  free_trial_coupon_code?: string;
  terms_of_service_content?: string;
  terms_of_service_updated_at?: string;
  privacy_policy_content?: string;
  privacy_policy_updated_at?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  contact?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    social_links?: {
      facebook?: string;
      instagram?: string;
      linkedin?: string;
      youtube?: string;
      telegram?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  social_links?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    telegram?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface CurrentSubscription {
  id?: number;
  user_id?: number | string;
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

export interface SubscriptionReminderStatus {
  should_remind?: boolean;
  days_left?: number | null;
  reminder_days?: number | null;
  reminders_enabled?: boolean;
  auto_renew?: boolean | number;
  subscription_id?: number | string | null;
  expire_date?: string | null;
  channels?: {
    email?: boolean;
    sms?: boolean;
    telegram?: boolean;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

export interface PosAccessCredentials {
  pos_url: string;
  username: string;
  password: string;
  email: string;
  [key: string]: unknown;
}

export interface PosAccessInfo {
  has_subscription: boolean;
  locked: boolean;
  reason?: string | null;
  message: string;
  access: PosAccessCredentials | null;
  subscription: CurrentSubscription | null;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

const REGISTER_LIMITS: Record<string, string> = {
  starter: "Up to 1 register",
  professional: "Up to 5 registers",
  enterprise: "Unlimited registers",
};

function getApiBaseUrl() {
  return DEFAULT_API_BASE_URL.replace(/\/+$/, "");
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

const VITE_API_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");

// Commented out as react-i18next is not installed in package.json to prevent build errors
// import { useTranslation } from "react-i18next";

export default async function post({
    endpoint,
    data,
    params,
    method = "POST",
}: {
    endpoint: string;
    data?: any | null;
    params?: Record<string, any>;
    method?: string;
}) {
    // Check if the URL is valid
    if (!endpoint || typeof endpoint !== "string") {
        throw new Error("Invalid URL");
    }

    const lang = localStorage.getItem("lang") || "en";
    params = {
        ...params,
        "lang": lang,
    }

    if (!data && !params) {
        return get({endpoint, method});
    }

    if (!data && params) {
        return get({endpoint, params, method});
    }

    // Check if the data is valid
    if (data !== null && typeof data !== "object") {
        throw new Error("Invalid data");
    }

    if (params && typeof params !== "object") {
        throw new Error("Invalid params");
    }
    const urlParams = new URLSearchParams(params).toString();
    endpoint = urlParams ? `${endpoint}?${urlParams}` : endpoint;

    const token = getStoredAuthToken();
    const headers: Record<string, string> = {
        "Content-Type": "application/x-www-form-urlencoded",
    };
    if (token) {
        headers["token"] = token;
    }

    try {
        const bodyContent = data instanceof FormData 
            ? data 
            : new URLSearchParams(data as Record<string, string>).toString();

        const fetchHeaders = data instanceof FormData 
            ? { ...headers } 
            : headers;
            
        if (data instanceof FormData) {
            delete (fetchHeaders as any)["Content-Type"];
        }

        return fetch(`${VITE_API_URL}${endpoint}`, {
            method,
            headers: fetchHeaders,
            body: bodyContent,
        }).then((res) => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        });
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        return error;
    }
}

export async function get({
    endpoint,
    params,
    method = "POST",
}: {
    endpoint: string;
    params?: Record<string, any>;
    method?: string;
}) {
    if (!endpoint || typeof endpoint !== "string") {
        throw new Error("Invalid URL");
    }
    if (params && typeof params !== "object") {
        throw new Error("Invalid params");
    }
    const urlParams = new URLSearchParams(params).toString();
    endpoint = urlParams ? `${endpoint}?${urlParams}` : endpoint;

    const token = getStoredAuthToken();
    const headers: Record<string, string> = {
        "Content-Type": "application/x-www-form-urlencoded",
    };
    if (token) {
        headers["token"] = token;
    }

    try {
        return fetch(`${VITE_API_URL}${endpoint}`, {
            method,
            headers,
        }).then((res) => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        });
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        return error;
    }
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
): Promise<T> {
  const token = getStoredAuthToken();
  const requestHeaders = new Headers(headers);

  if (token && !requestHeaders.has("token")) {
    requestHeaders.set("token", token);
  }

  let requestBody: BodyInit | undefined;
  if (body !== undefined && method !== "GET") {
    if (body instanceof FormData) {
      requestBody = body;
    } else if (requestHeaders.get("Content-Type") === "application/json") {
      requestBody = JSON.stringify(body);
    } else {
      requestHeaders.set(
        "Content-Type",
        requestHeaders.get("Content-Type") ||
          "application/x-www-form-urlencoded",
      );

      const urlSearchParams = new URLSearchParams();
      if (isRecord(body)) {
        Object.entries(body).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            urlSearchParams.append(key, String(value));
          }
        });
      }
      requestBody = urlSearchParams.toString();
    }
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: requestHeaders,
    body: requestBody,
  });
  const payload = await readResponseBody(response);

  if (response.status === 401) {
    throw createUnauthorizedError(
      isRecord(payload) && typeof payload.msg === "string"
        ? payload.msg
        : "Unauthorized",
      payload,
    );
  }

  if (response.status === 204) {
    return null as T;
  }

  if (!response.ok) {
    throw createApiError("Request failed", response, payload);
  }

  if (isRecord(payload) && typeof payload.code === "number") {
    const apiPayload = payload as ApiEnvelope<T>;
    if (apiPayload.code === 1) {
      return apiPayload.data;
    }

    if (apiPayload.code === 401) {
      throw createUnauthorizedError(
        apiPayload.msg || "Unauthorized",
        apiPayload.data,
      );
    }

    throw new ApiError(
      apiPayload.msg || "Request failed",
      apiPayload.code,
      apiPayload.data,
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

async function readResponseBody(response: Response) {
  const rawText = await response.text();
  if (!rawText) {
    return null;
  }

  return tryParseJson(rawText);
}

function extractNestedUserinfo<T extends Record<string, unknown>>(
  value: unknown,
): T | null {
  if (!isRecord(value)) {
    return null;
  }

  if (isRecord(value.vendor)) {
    return value.vendor as T;
  }

  if (isRecord(value.userinfo)) {
    return value.userinfo as T;
  }

  if (isRecord(value.user)) {
    return value.user as T;
  }

  return value as T;
}

function isAuthUserLikeRecord(value: unknown): value is AuthUser {
  if (!isRecord(value)) {
    return false;
  }

  return [
    "id",
    "type",
    "username",
    "nickname",
    "name",
    "email",
    "mobile",
    "phone",
    "avatar",
    "subscription_status",
    "current_package",
  ].some((key) => key in value);
}

function extractTokenFromRecord(value: unknown) {
  if (!isRecord(value)) {
    return "";
  }

  const token = value.token;
  return typeof token === "string" && token.trim() !== "" ? token.trim() : "";
}

function extractAuthToken(payload: VerifyOtpResponse | null | undefined) {
  if (!payload) {
    return "";
  }

  if (typeof payload.token === "string" && payload.token.trim() !== "") {
    return payload.token.trim();
  }

  const nestedToken =
    extractTokenFromRecord(payload.vendor) ||
    extractTokenFromRecord(payload.userinfo) ||
    extractTokenFromRecord(payload.user) ||
    extractTokenFromRecord(payload);

  if (nestedToken) {
    return nestedToken;
  }

  return "";
}

function extractAuthUserinfo(payload: VerifyOtpResponse | null | undefined) {
  if (!payload) {
    return null;
  }

  if (payload.vendor && isRecord(payload.vendor)) {
    return payload.vendor as AuthUser;
  }

  if (payload.userinfo && isRecord(payload.userinfo)) {
    return payload.userinfo as AuthUser;
  }

  if (payload.user && isRecord(payload.user)) {
    return payload.user as AuthUser;
  }

  if (isAuthUserLikeRecord(payload)) {
    return payload as AuthUser;
  }

  return null;
}

function persistAuthSession(payload: VerifyOtpResponse | null | undefined) {
  const token = extractAuthToken(payload);
  const userinfo = extractAuthUserinfo(payload);

  if (token) {
    setStoredAuthToken(token);
  }

  if (userinfo) {
    setStoredUserinfo(userinfo);
  }
}

function setStoredUserinfo(userinfo: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  if (userinfo === null || userinfo === undefined) {
    window.localStorage.removeItem(USER_INFO_KEY);
    return;
  }

  window.localStorage.setItem(USER_INFO_KEY, JSON.stringify(userinfo));
}

function buildAuthenticatedHeaders(
  extraHeaders: Record<string, string> = {},
) {
  return {
    ...extraHeaders,
    token: getStoredAuthToken() || "",
  };
}

function isProfileApiDebugEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(PROFILE_API_DEBUG_KEY) === "1";
}

function logProfileApiDebug(label: string, value?: unknown) {
  if (!isProfileApiDebugEnabled()) {
    return;
  }

  if (value === undefined) {
    console.log(label);
    return;
  }

  console.log(label, value);
}

function createUnauthorizedError(message = "Unauthorized", data: unknown = null) {
  clearStoredAuthToken();
  return new ApiError(message, 401, data);
}

function createApiError(
  fallbackMessage: string,
  response: Response,
  payload: unknown,
) {
  if (isRecord(payload)) {
    const message =
      typeof payload.msg === "string" && payload.msg.trim() !== ""
        ? payload.msg
        : fallbackMessage;
    const code =
      typeof payload.code === "number" ? payload.code : response.status || 500;
    return new ApiError(message, code, "data" in payload ? payload.data : payload);
  }

  return new ApiError(
    fallbackMessage,
    response.status || 500,
    payload,
  );
}

function extractUploadPath(payload: unknown): string {
  if (typeof payload === "string" && payload.trim() !== "") {
    return payload.trim();
  }

  if (!isRecord(payload)) {
    return "";
  }

  const candidateKeys = [
    "url",
    "path",
    "avatar",
    "filepath",
    "file_path",
    "savepath",
    "src",
    "fullurl",
  ];

  for (const key of candidateKeys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }

  return "";
}

function getFirstStringValue(
  record: Record<string, unknown>,
  keys: string[],
) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }

  return "";
}

function extractPublicSiteSettings(data: unknown): PublicSiteSettings {
  if (!isRecord(data)) {
    return {};
  }

  const candidateRecords = [
    data,
    isRecord(data.settings) ? data.settings : null,
    isRecord(data.config) ? data.config : null,
  ].filter(Boolean) as Record<string, unknown>[];
  const mergedRecord = candidateRecords.reduce<Record<string, unknown>>(
    (accumulator, record) => ({
      ...accumulator,
      ...record,
    }),
    {},
  );

  return {
    ...mergedRecord,
    pos_demo_video_url: getFirstStringValue(mergedRecord, [
      "pos_demo_video_url",
      "demo_video_url",
      "watch_demo_url",
      "video_demo_url",
      "video_url",
    ]),
    free_trial_coupon_code: getFirstStringValue(mergedRecord, [
      "free_trial_coupon_code",
      "start_free_trial_coupon_code",
      "trial_coupon_code",
      "free_coupon_code",
    ]),
    terms_of_service_content: getFirstStringValue(mergedRecord, [
      "terms_of_service_content",
      "terms_content",
      "terms_conditions_content",
      "terms_and_conditions_content",
    ]),
    terms_of_service_updated_at: getFirstStringValue(mergedRecord, [
      "terms_of_service_updated_at",
      "terms_updated_at",
      "terms_last_updated",
      "terms_of_service_last_updated",
    ]),
    privacy_policy_content: getFirstStringValue(mergedRecord, [
      "privacy_policy_content",
      "privacy_content",
    ]),
    privacy_policy_updated_at: getFirstStringValue(mergedRecord, [
      "privacy_policy_updated_at",
      "privacy_updated_at",
      "privacy_last_updated",
      "privacy_policy_last_updated",
    ]),
  };
}

export function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    window.localStorage.getItem(AUTH_TOKEN_KEY) ||
    window.localStorage.getItem(LEGACY_AUTH_TOKEN_KEY) ||
    ""
  );
}

export function setStoredAuthToken(token: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    window.localStorage.setItem(LEGACY_AUTH_TOKEN_KEY, token);
  }
}

export function clearStoredAuthToken() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
    window.localStorage.removeItem(USER_INFO_KEY);
  }
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof ApiError && error.code === 401;
}

export function normalizeProfileAvatarUrl(value?: string | null) {
  const trimmedValue = (value || "").trim();

  if (!trimmedValue || trimmedValue === "null") {
    return "";
  }

  return trimmedValue;
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
  return apiRequest<ApiPackage[]>("/packages");
}

export async function getSubscriptionDurations() {
  return apiRequest<ApiSubscriptionDuration[]>("/subscription_durations");
}

export async function sendOtp(phone: string) {
  return apiRequest<unknown>("/auth/sendotp", {
    method: "POST",
    body: { phone },
  });
}

export async function verifyOtp(phone: string, otp: string) {
  const data = await apiRequest<VerifyOtpResponse>("/auth/verifyotp", {
    method: "POST",
    body: { phone, otp },
  });

  persistAuthSession(data);

  return data;
}

export async function loginWithGoogle(idToken: string) {
  const data = await apiRequest<VerifyOtpResponse>("/auth/google", {
    method: "POST",
    body: { id_token: idToken },
  });

  persistAuthSession(data);

  return data;
}

export async function loginWithTelegram(payload: TelegramAuthPayload) {
  const data = await apiRequest<VerifyOtpResponse>("/auth/telegram", {
    method: "POST",
    body: payload,
  });

  persistAuthSession(data);

  return data;
}

export async function loginWithEmail(payload: Record<string, unknown>) {
  const data = await apiRequest<VerifyOtpResponse>("/auth/email", {
    method: "POST",
    body: payload,
  });

  persistAuthSession(data);

  return data;
}

export async function logout() {
  try {
    const data = await apiRequest<unknown>("/auth/logout", {
      method: "POST",
      requiresAuth: true,
    });
    return data;
  } finally {
    clearStoredAuthToken();
  }
}

export async function getMe() {
  if (!getStoredAuthToken()) {
    return null;
  }

  try {
    const data = await apiRequest<unknown>("/auth/me", {
      requiresAuth: true,
    });
    const account = extractAuthUserinfo(
      isRecord(data) ? (data as VerifyOtpResponse) : undefined,
    );

    if (account) {
      setStoredUserinfo(account);
      return account;
    }

    if (isAuthUserLikeRecord(data)) {
      setStoredUserinfo(data);
      return data;
    }

    return null;
  } catch (error) {
    if (error instanceof ApiError && error.code === 401) {
      return null;
    }

    throw error;
  }
}

export async function getProfile() {
  const token = getStoredAuthToken();
  const requestUrl = buildUrl("/user/profile");

  logProfileApiDebug("[Profile GET] url:", requestUrl);
  logProfileApiDebug("[Profile GET] method:", "GET");
  logProfileApiDebug("[Profile GET] token exists:", Boolean(token));

  const response = await fetch(requestUrl, {
    method: "GET",
    headers: {
      token: token || "",
    },
  });
  const payload = await readResponseBody(response);

  logProfileApiDebug("[Profile GET] status:", response.status);
  logProfileApiDebug("[Profile GET] response:", payload);

  if (response.status === 401) {
    throw createUnauthorizedError(
      isRecord(payload) && typeof payload.msg === "string"
        ? payload.msg
        : "Unauthorized",
      payload,
    );
  }

  if (!response.ok) {
    throw createApiError("Failed to get profile", response, payload);
  }

  if (!isRecord(payload) || payload.code !== 1) {
    if (isRecord(payload) && payload.code === 401) {
      throw createUnauthorizedError(
        typeof payload.msg === "string" ? payload.msg : "Unauthorized",
        payload,
      );
    }

    throw new ApiError(
      isRecord(payload) && typeof payload.msg === "string"
        ? payload.msg
        : "Failed to get profile",
      isRecord(payload) && typeof payload.code === "number"
        ? payload.code
        : response.status || 500,
      isRecord(payload) && "data" in payload ? payload.data : payload,
    );
  }

  const userinfo = extractNestedUserinfo<UserProfile>(payload.data);
  if (!userinfo) {
    throw new ApiError("Profile data is missing", 500, payload.data);
  }

  setStoredUserinfo(userinfo);
  return userinfo;
}

export async function uploadProfileAvatar(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(buildUrl("/common/upload"), {
    method: "POST",
    headers: buildAuthenticatedHeaders(),
    body: formData,
  });
  const payload = await readResponseBody(response);

  if (response.status === 401) {
    throw createUnauthorizedError(
      isRecord(payload) && typeof payload.msg === "string"
        ? payload.msg
        : "Unauthorized",
      payload,
    );
  }

  if (!response.ok) {
    throw createApiError("Failed to upload avatar", response, payload);
  }

  if (!isRecord(payload) || payload.code !== 1) {
    if (isRecord(payload) && payload.code === 401) {
      throw createUnauthorizedError(
        typeof payload.msg === "string" ? payload.msg : "Unauthorized",
        payload,
      );
    }

    throw new ApiError(
      isRecord(payload) && typeof payload.msg === "string"
        ? payload.msg
        : "Failed to upload avatar",
      isRecord(payload) && typeof payload.code === "number"
        ? payload.code
        : response.status || 500,
      isRecord(payload) && "data" in payload ? payload.data : payload,
    );
  }

  const avatarPath = extractUploadPath(payload.data);
  if (!avatarPath) {
    throw new ApiError("Avatar upload did not return a file path", 500, payload.data);
  }

  return avatarPath;
}

export async function updateProfile(profile: UpdateProfilePayload) {
  const cleanPayload: UpdateProfilePayload = { ...profile };
  const token = getStoredAuthToken();

  if (!cleanPayload.avatar || cleanPayload.avatar.trim() === "") {
    delete cleanPayload.avatar;
  }

  const requestUrl = buildUrl("/user/profile");

  logProfileApiDebug("[Profile POST] url:", requestUrl);
  logProfileApiDebug("[Profile POST] method:", "POST");
  logProfileApiDebug("[Profile POST] token exists:", Boolean(token));
  logProfileApiDebug(
    "[Profile POST] avatar included:",
    Object.prototype.hasOwnProperty.call(cleanPayload, "avatar"),
  );
  logProfileApiDebug("[Profile POST] payload:", cleanPayload);

  const response = await fetch(requestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token: token || "",
    },
    body: JSON.stringify(cleanPayload),
  });
  const payload = await readResponseBody(response);

  logProfileApiDebug("[Profile POST] status:", response.status);
  logProfileApiDebug("[Profile POST] response:", payload);

  if (response.status === 401) {
    throw createUnauthorizedError(
      isRecord(payload) && typeof payload.msg === "string"
        ? payload.msg
        : "Unauthorized",
      payload,
    );
  }

  if (!response.ok) {
    throw createApiError("Failed to update profile", response, payload);
  }

  if (!isRecord(payload) || payload.code !== 1) {
    if (isRecord(payload) && payload.code === 401) {
      throw createUnauthorizedError(
        typeof payload.msg === "string" ? payload.msg : "Unauthorized",
        payload,
      );
    }

    throw new ApiError(
      isRecord(payload) && typeof payload.msg === "string"
        ? payload.msg
        : "Failed to update profile",
      isRecord(payload) && typeof payload.code === "number"
        ? payload.code
        : response.status || 500,
      isRecord(payload) && "data" in payload ? payload.data : payload,
    );
  }

  const userinfo = extractNestedUserinfo<UserProfile>(payload.data);
  if (!userinfo) {
    throw new ApiError("Profile update response is missing user data", 500, payload.data);
  }

  setStoredUserinfo(userinfo);
  return userinfo;
}

export async function getCurrentSubscription() {
  return apiRequest<CurrentSubscription | null>("/subscriptions/current", {
    requiresAuth: true,
  });
}

function getBooleanFlag(
  record: Record<string, unknown>,
  keys: string[],
  fallback = false,
) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value === 1;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["1", "true", "yes", "enabled"].includes(normalized)) {
        return true;
      }
      if (["0", "false", "no", "disabled"].includes(normalized)) {
        return false;
      }
    }
  }

  return fallback;
}

function normalizePosAccessInfo(data: unknown): PosAccessInfo {
  if (!isRecord(data)) {
    return {
      has_subscription: false,
      locked: true,
      reason: null,
      message: "Please subscribe to a package to unlock POS access",
      access: null,
      subscription: null,
    };
  }

  const accessRecord =
    (isRecord(data.access) ? data.access : null) ||
    (isRecord(data.pos_access) ? data.pos_access : null) ||
    (isRecord(data.credentials) ? data.credentials : null);
  const subscriptionRecord =
    (isRecord(data.subscription) ? data.subscription : null) ||
    (isRecord(data.current_subscription) ? data.current_subscription : null);
  const hasSubscription = getBooleanFlag(
    data,
    ["has_subscription", "hasSubscription"],
    Boolean(subscriptionRecord),
  );
  const locked = getBooleanFlag(
    data,
    ["locked", "is_locked"],
    !hasSubscription || !accessRecord,
  );
  const reason = getFirstStringValue(data, ["reason", "lock_reason"]) || null;
  const isDisabled = locked || !hasSubscription || reason === "expired";
  const normalizedAccess = accessRecord
    ? {
        ...accessRecord,
        pos_url: getFirstStringValue(accessRecord, [
          "pos_url",
          "url",
          "posUrl",
          "login_url",
        ]),
        username: getFirstStringValue(accessRecord, [
          "username",
          "login",
          "user_name",
        ]),
        password: getFirstStringValue(accessRecord, [
          "password",
          "plain_password",
          "pos_password",
        ]),
        email: getFirstStringValue(accessRecord, [
          "email",
          "login_email",
          "pos_email",
        ]),
      }
    : null;

  return {
    ...data,
    has_subscription: hasSubscription,
    locked: isDisabled,
    reason,
    message:
      getFirstStringValue(data, ["message", "notice", "error"]) ||
      "Please subscribe to a package to unlock POS access",
    access: isDisabled ? null : normalizedAccess,
    subscription: subscriptionRecord
      ? (subscriptionRecord as CurrentSubscription)
      : null,
  };
}

function extractPosAccessPassword(data: unknown) {
  if (!isRecord(data)) {
    return "";
  }

  if (isRecord(data.access)) {
    return getFirstStringValue(data.access, [
      "password",
      "plain_password",
      "pos_password",
    ]);
  }

  if (isRecord(data.credentials)) {
    return getFirstStringValue(data.credentials, [
      "password",
      "plain_password",
      "pos_password",
    ]);
  }

  return getFirstStringValue(data, [
    "password",
    "plain_password",
    "pos_password",
  ]);
}

export async function getPosAccessInfo() {
  const data = await apiRequest<unknown>("/pos_access_info", {
    requiresAuth: true,
  });

  return normalizePosAccessInfo(data);
}

export async function regeneratePosAccessPassword() {
  return apiRequest<unknown>("/posaccessinfo/regeneratepassword", {
    method: "POST",
    requiresAuth: true,
  });
}

export async function revealPosAccessPassword() {
  try {
    const data = await apiRequest<unknown>("/posaccessinfo/revealpassword", {
      method: "POST",
      requiresAuth: true,
    });
    const password = extractPosAccessPassword(data);
    if (password) {
      return password;
    }
  } catch (error) {
    if (!(error instanceof ApiError) || (error.code !== 404 && error.code !== 405)) {
      throw error;
    }
  }

  const fallbackData = await apiRequest<unknown>("/posaccessinfo/revealpassword", {
    method: "GET",
    requiresAuth: true,
  });
  const fallbackPassword = extractPosAccessPassword(fallbackData);

  if (!fallbackPassword) {
    throw new ApiError(
      "POS reveal password response is missing the password value.",
      500,
      fallbackData,
    );
  }

  return fallbackPassword;
}

export async function createPosLoginTicket() {
  const data = await apiRequest<unknown>("/vendor/posloginticket", {
    method: "POST",
    requiresAuth: true,
  });

  const url =
    (isRecord(data) && getFirstStringValue(data, ["url", "redirect_url"])) ||
    "";

  if (!url) {
    throw new ApiError(
      "POS login ticket response is missing the destination URL.",
      500,
      data,
    );
  }

  return url;
}

export async function unsubscribeCurrentSubscription(subscriptionId?: number) {
  const token = getStoredAuthToken();
  const requestBody: Record<string, number> = {
    auto_renew: 0,
  };

  if (subscriptionId) {
    requestBody.subscription_id = subscriptionId;
  }
  const response = await fetch(buildUrl("/subscriptions/unsubscribe"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token: token || "",
    },
    body: JSON.stringify(requestBody),
  });
  const payload = await readResponseBody(response);

  if (response.status === 401) {
    throw createUnauthorizedError(
      isRecord(payload) && typeof payload.msg === "string"
        ? payload.msg
        : "Unauthorized",
      payload,
    );
  }

  if (!response.ok) {
    throw createApiError("Failed to update subscription", response, payload);
  }

  if (!isRecord(payload) || payload.code !== 1) {
    if (isRecord(payload) && payload.code === 401) {
      throw createUnauthorizedError(
        typeof payload.msg === "string" ? payload.msg : "Unauthorized",
        payload,
      );
    }

    throw new ApiError(
      isRecord(payload) && typeof payload.msg === "string"
        ? payload.msg
        : "Failed to update subscription",
      isRecord(payload) && typeof payload.code === "number"
        ? payload.code
        : response.status || 500,
      isRecord(payload) && "data" in payload ? payload.data : payload,
    );
  }

  return payload.data;
}

export async function getSubscriptionReminderStatus() {
  return apiRequest<SubscriptionReminderStatus>("/subscriptions/reminder-status", {
    requiresAuth: true,
  });
}

export async function getCheckoutQuote(payload: {
  package_id: number;
  duration_id: number;
  coupon_code?: string;
}) {
  return apiRequest<CheckoutQuote>("/checkout/quote", {
    method: "POST",
    body: payload,
  });
}

export async function createPaywayPayment(payload: {
  package_id: number;
  duration_id: number;
  coupon_code?: string;
  payment_method?: "khqr" | "card";
}) {
  return apiRequest<PaywayCreateResponse>("/payments/paywaycreate", {
    method: "POST",
    requiresAuth: true,
    body: payload,
  });
}

export interface PaymentHistoryResponse {
  total: number;
  page: number;
  limit: number;
  rows: PaymentHistoryItem[];
}

export async function getPaymentHistory() {
  return apiRequest<PaymentHistoryResponse>("/payments/history", {
    requiresAuth: true,
  });
}

export async function getPaymentStatus(transactionId: string) {
  return apiRequest<PaymentStatusResponse>("/payments/statusby", {
    requiresAuth: true,
    query: { tid: transactionId },
  });
}

export async function getPublicSiteSettings() {
  const data = await apiRequest<unknown>(PUBLIC_SETTINGS_PATH || "/settings/public");
  return extractPublicSiteSettings(data);
}