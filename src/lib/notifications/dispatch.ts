/**
 * Client-side helper for dispatching typed notifications via the
 * `notifications` Supabase Edge Function.
 *
 * Usage (in a client component):
 *   import { dispatchNotification } from "@/lib/notifications/dispatch";
 *   void dispatchNotification(supabase, {
 *     type: NOTIFICATION_TYPES.PROFILE_UPDATED,
 *     recipients: [user.id],
 *     data: { site_url: process.env.NEXT_PUBLIC_SITE_URL },
 *   }).catch(console.warn);
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { NotificationChannel, NotificationTypeKey } from "./types";

export interface DispatchNotificationOptions {
  type: NotificationTypeKey;
  recipients: string[];
  data?: Record<string, unknown>;
  channels?: NotificationChannel[];
  idempotencyKey?: string;
}

/**
 * Dispatches a typed notification to one or more recipients.
 * Fire-and-forget safe — wrap the call in `void …catch(console.warn)`.
 */
export async function dispatchNotification(
  supabase: SupabaseClient<Database>,
  options: DispatchNotificationOptions
): Promise<void> {
  const { error } = await supabase.functions.invoke("notifications", {
    body: {
      type: options.type,
      recipients: options.recipients,
      data: {
        site_url: process.env.NEXT_PUBLIC_SITE_URL ?? "",
        ...options.data,
      },
      ...(options.channels ? { channels: options.channels } : {}),
      ...(options.idempotencyKey ? { idempotency_key: options.idempotencyKey } : {}),
    },
  });

  if (error) {
    throw error;
  }
}
