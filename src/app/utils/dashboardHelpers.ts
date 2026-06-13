import { type ProfileFormState } from "../components/ProfilePage";
import {
  normalizeProfileAvatarUrl,
  type UserProfile,
  type CurrentSubscription,
  type SubscriptionReminderStatus,
} from "../services/posApi";

// if not response from backend, show reminder for 7 days by default
export const SUBSCRIPTION_EXPIRY_REMINDER_DAYS = 7;
// key prefix for storing user's subscription expiry reminder preference in localStorage
export const SUBSCRIPTION_REMINDER_PREFERENCE_KEY =
  "subscription_expiry_alert_preference";

export function toProfileForm(profile?: UserProfile | null): ProfileFormState {
  const avatarUrl = normalizeProfileAvatarUrl(profile?.avatar);

  return {
    username: profile?.username || profile?.name || "",
    nickname: profile?.nickname || "",
    email: profile?.email || "",
    mobile: profile?.mobile || profile?.phone || "",
    bio: profile?.bio || "",
    businessName: profile?.business_name || "",
    address: profile?.address || "",
    avatarUrl,
    avatarPreviewUrl: avatarUrl,
    pendingAvatarFile: null,
    hasPendingAvatarChange: false,
  };
}

export function formatDateValue(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDurationLabel(months?: number) {
  if (!months) {
    return "-";
  }

  if (months === 1) {
    return "1 month";
  }

  return `${months} months`;
}

export function isAutoRenewEnabled(value?: boolean | number | null) {
  return value === true || Number(value || 0) === 1;
}

export function getDaysUntilDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const targetDate = new Date(value);
  if (Number.isNaN(targetDate.getTime())) {
    return null;
  }

  return Math.ceil(
    (targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

export function getReminderChannelLabels(status?: SubscriptionReminderStatus | null) {
  if (!status?.channels) {
    return [];
  }

  const labels: string[] = [];

  if (status.channels.sms) {
    labels.push("mobile");
  }

  if (status.channels.email) {
    labels.push("email");
  }

  if (status.channels.telegram) {
    labels.push("Telegram");
  }

  return labels;
}

export function getReminderPreferenceStorageKey(
  subscription?: CurrentSubscription | null,
) {
  if (!subscription) {
    return "";
  }

  const userId = subscription.user_id ?? "current";
  const subscriptionId =
    subscription.id ?? subscription.package_id ?? "active-subscription";

  return `${SUBSCRIPTION_REMINDER_PREFERENCE_KEY}:${String(userId)}:${String(
    subscriptionId,
  )}`;
}

export function readStoredReminderPreference(
  subscription?: CurrentSubscription | null,
) {
  if (typeof window === "undefined" || !subscription) {
    return null;
  }

  const storageKey = getReminderPreferenceStorageKey(subscription);
  if (!storageKey) {
    return null;
  }

  const storedValue = window.localStorage.getItem(storageKey);
  if (storedValue === "1") {
    return true;
  }

  if (storedValue === "0") {
    return false;
  }

  return null;
}

export function writeStoredReminderPreference(
  subscription: CurrentSubscription | null,
  enabled: boolean,
) {
  if (typeof window === "undefined" || !subscription) {
    return;
  }

  const storageKey = getReminderPreferenceStorageKey(subscription);
  if (!storageKey) {
    return;
  }

  window.localStorage.setItem(storageKey, enabled ? "1" : "0");
}
