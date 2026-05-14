import { describe, it, expect } from "vitest";
import {
  notificationPreferencesSchema,
  buildDefaultValues,
} from "@/components/forms/validations/notification-preferences.schema";
import { NOTIFICATION_TYPES, NOTIFICATION_DEFAULTS } from "@/lib/notifications/types";

const ALL_TYPE_KEYS = Object.values(NOTIFICATION_TYPES);

describe("notificationPreferencesSchema", () => {
  it("accepts a valid full payload", () => {
    const prefsRow = Object.fromEntries(
      ALL_TYPE_KEYS.map((k) => [k, { email: true, browser: false, sms: false }])
    ) as Record<string, { email: boolean; browser: boolean; sms: boolean }>;

    const result = notificationPreferencesSchema.safeParse({
      notifications_email: true,
      notifications_browser: false,
      notifications_sms: false,
      preferences: prefsRow,
    });

    expect(result.success).toBe(true);
  });

  it("rejects if notifications_email is missing", () => {
    const prefsRow = Object.fromEntries(
      ALL_TYPE_KEYS.map((k) => [k, { email: true, browser: false, sms: false }])
    );

    const result = notificationPreferencesSchema.safeParse({
      notifications_browser: false,
      notifications_sms: false,
      preferences: prefsRow,
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-boolean channel values", () => {
    const prefsRow = Object.fromEntries(
      ALL_TYPE_KEYS.map((k) => [k, { email: "yes", browser: false, sms: false }])
    );

    const result = notificationPreferencesSchema.safeParse({
      notifications_email: true,
      notifications_browser: false,
      notifications_sms: false,
      preferences: prefsRow,
    });

    expect(result.success).toBe(false);
  });
});

describe("matchmaking type in schema", () => {
  it("accepts a payload that includes preferences.matchmaking", () => {
    const prefsRow = Object.fromEntries(
      ALL_TYPE_KEYS.map((k) => [k, { email: true, browser: false, sms: false }])
    ) as Record<string, { email: boolean; browser: boolean; sms: boolean }>;

    const result = notificationPreferencesSchema.safeParse({
      notifications_email: true,
      notifications_browser: false,
      notifications_sms: false,
      preferences: prefsRow,
    });

    expect(result.success).toBe(true);
    expect(result.data?.preferences.matchmaking).toEqual({
      email: true,
      browser: false,
      sms: false,
    });
  });

  it("buildDefaultValues fills matchmaking from NOTIFICATION_DEFAULTS", () => {
    const values = buildDefaultValues(
      { email: true, browser: true, sms: false },
      null
    );
    expect(values.preferences.matchmaking).toEqual(
      NOTIFICATION_DEFAULTS.matchmaking
    );
  });
});

describe("buildDefaultValues", () => {
  it("sets channel on/off from provided channel state", () => {
    const values = buildDefaultValues(
      { email: true, browser: true, sms: false },
      null
    );
    expect(values.notifications_email).toBe(true);
    expect(values.notifications_browser).toBe(true);
    expect(values.notifications_sms).toBe(false);
  });

  it("applies NOTIFICATION_DEFAULTS when no stored preferences", () => {
    const values = buildDefaultValues(
      { email: true, browser: false, sms: false },
      null
    );
    for (const key of ALL_TYPE_KEYS) {
      expect(values.preferences[key as keyof typeof values.preferences].email).toBe(
        NOTIFICATION_DEFAULTS[key as keyof typeof NOTIFICATION_DEFAULTS].email
      );
    }
  });

  it("uses stored override when present", () => {
    const stored = {
      account_created: { email: false, browser: true, sms: false },
    } as Record<string, Record<"email" | "browser" | "sms", boolean>>;

    const values = buildDefaultValues(
      { email: true, browser: true, sms: false },
      stored
    );

    expect(values.preferences.account_created.email).toBe(false);
    expect(values.preferences.account_created.browser).toBe(true);
  });

  it("produces a valid schema-parseable object", () => {
    const values = buildDefaultValues(
      { email: true, browser: false, sms: false },
      null
    );
    const result = notificationPreferencesSchema.safeParse(values);
    expect(result.success).toBe(true);
  });
});
