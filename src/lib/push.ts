import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";


const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported in this browser.");
  }
  return navigator.serviceWorker.register("/sw.js");
}

/**
 * Subscribe the current user to Web Push notifications.
 * Requests permission if needed, then upserts the subscription into `push_subscriptions`.
 * Returns true on success, false if the user denied permission.
 */
export async function subscribeUserToPush(
  supabase: SupabaseClient<Database>
): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY) {
    console.warn("subscribeUserToPush: NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set.");
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const registration = await getRegistration();
  await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const { endpoint, keys } = subscription.toJSON() as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  // push_subscriptions added by migration — not yet in generated types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("push_subscriptions")
    .upsert(
      { endpoint, p256dh: keys.p256dh, auth: keys.auth, user_agent: navigator.userAgent },
      { onConflict: "endpoint" }
    );

  if (error) {
    console.error("subscribeUserToPush: upsert failed:", error.message);
    return false;
  }

  return true;
}

/**
 * Unsubscribe the current user from Web Push notifications
 * and remove the stored subscription from `push_subscriptions`.
 */
export async function unsubscribeUserFromPush(
  supabase: SupabaseClient<Database>
): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  if (!registration) return;

  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const { endpoint } = subscription;
  await subscription.unsubscribe();

  // push_subscriptions added by migration — not yet in generated types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) {
    console.warn("unsubscribeUserFromPush: delete failed:", error.message);
  }
}

/**
 * Returns true if the user currently has an active push subscription.
 */
export async function isPushSubscribed(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  if (!registration) return false;
  const subscription = await registration.pushManager.getSubscription();
  return subscription !== null;
}

/**
 * Returns the current Notification permission state.
 */
export function getPushPermission(): NotificationPermission {
  if (!("Notification" in window)) return "denied";
  return Notification.permission;
}
