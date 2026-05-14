import { describe, it, expect } from "vitest";
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_DEFAULTS,
  NOTIFICATION_GROUPS,
  NOTIFICATION_TYPE_LABELS,
  isChannelEnabled,
  type NotificationTypeKey,
  type NotificationChannel,
} from "@/lib/notifications/types";

const ALL_TYPE_KEYS = Object.values(NOTIFICATION_TYPES) as NotificationTypeKey[];
const ALL_CHANNELS: NotificationChannel[] = ["email", "browser", "sms"];

describe("NOTIFICATION_DEFAULTS", () => {
  it("has a default entry for every notification type key", () => {
    for (const key of ALL_TYPE_KEYS) {
      expect(NOTIFICATION_DEFAULTS).toHaveProperty(key);
    }
  });

  it("every default entry covers all three channels", () => {
    for (const key of ALL_TYPE_KEYS) {
      const defaults = NOTIFICATION_DEFAULTS[key];
      for (const channel of ALL_CHANNELS) {
        expect(typeof defaults[channel]).toBe("boolean");
      }
    }
  });

  it("email defaults to true for every type", () => {
    for (const key of ALL_TYPE_KEYS) {
      expect(NOTIFICATION_DEFAULTS[key].email).toBe(true);
    }
  });

  it("sms defaults to false for every type", () => {
    for (const key of ALL_TYPE_KEYS) {
      expect(NOTIFICATION_DEFAULTS[key].sms).toBe(false);
    }
  });
});

describe("NOTIFICATION_TYPE_LABELS", () => {
  it("has a label for every notification type key", () => {
    for (const key of ALL_TYPE_KEYS) {
      expect(NOTIFICATION_TYPE_LABELS).toHaveProperty(key);
      expect(typeof NOTIFICATION_TYPE_LABELS[key]).toBe("string");
      expect(NOTIFICATION_TYPE_LABELS[key].length).toBeGreaterThan(0);
    }
  });
});

describe("NOTIFICATION_GROUPS", () => {
  it("contains at least one group", () => {
    expect(NOTIFICATION_GROUPS.length).toBeGreaterThan(0);
  });

  it("every group has a label and types array", () => {
    for (const group of NOTIFICATION_GROUPS) {
      expect(typeof group.label).toBe("string");
      expect(Array.isArray(group.types)).toBe(true);
      expect(group.types.length).toBeGreaterThan(0);
    }
  });

  it("all grouped types are valid NOTIFICATION_TYPES values", () => {
    const validKeys = new Set(ALL_TYPE_KEYS);
    for (const group of NOTIFICATION_GROUPS) {
      for (const typeKey of group.types) {
        expect(validKeys.has(typeKey)).toBe(true);
      }
    }
  });

  it("every type appears in exactly one group", () => {
    const seen = new Map<NotificationTypeKey, number>();
    for (const group of NOTIFICATION_GROUPS) {
      for (const typeKey of group.types) {
        seen.set(typeKey, (seen.get(typeKey) ?? 0) + 1);
      }
    }
    for (const key of ALL_TYPE_KEYS) {
      expect(seen.get(key)).toBe(1);
    }
  });
});

describe("matchmaking notification type", () => {
  it("exists in NOTIFICATION_TYPES", () => {
    expect(NOTIFICATION_TYPES.MATCHMAKING).toBe("matchmaking");
  });

  it("has default email=true, browser=true, sms=false", () => {
    expect(NOTIFICATION_DEFAULTS.matchmaking).toEqual({
      email: true,
      browser: true,
      sms: false,
    });
  });

  it("has a non-empty label", () => {
    expect(NOTIFICATION_TYPE_LABELS.matchmaking).toBeTruthy();
  });

  it("belongs to exactly one group", () => {
    const groups = NOTIFICATION_GROUPS.filter((g) =>
      g.types.includes(NOTIFICATION_TYPES.MATCHMAKING)
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("Potriviri");
  });
});

describe("isChannelEnabled", () => {
  it("returns the default when no preferences are stored", () => {
    for (const key of ALL_TYPE_KEYS) {
      for (const channel of ALL_CHANNELS) {
        expect(isChannelEnabled(null, key, channel)).toBe(
          NOTIFICATION_DEFAULTS[key][channel]
        );
      }
    }
  });

  it("uses the stored override when present", () => {
    const prefs: Record<string, Record<NotificationChannel, boolean>> = {
      account_created: { email: false, browser: true, sms: true },
    };
    expect(isChannelEnabled(prefs, "account_created", "email")).toBe(false);
    expect(isChannelEnabled(prefs, "account_created", "browser")).toBe(true);
    expect(isChannelEnabled(prefs, "account_created", "sms")).toBe(true);
  });

  it("falls back to defaults for types not in stored preferences", () => {
    const prefs: Record<string, Record<NotificationChannel, boolean>> = {};
    expect(isChannelEnabled(prefs, "daily_digest", "email")).toBe(
      NOTIFICATION_DEFAULTS.daily_digest.email
    );
  });
});
