/* @namami/tokens 1.2.0 — generated. Do not edit. */
export const BOOKING_STATUS = Object.freeze({
  "received": {
    "family": "upcoming",
    "icon": "inbox",
    "en": "Received",
    "hi": "नई"
  },
  "scheduled": {
    "family": "upcoming",
    "icon": "calendar",
    "en": "Scheduled",
    "hi": "तय"
  },
  "rescheduled": {
    "family": "upcoming",
    "icon": "refresh-ccw",
    "en": "Rescheduled",
    "hi": "नया समय"
  },
  "ongoing": {
    "family": "live",
    "icon": "circle-dot",
    "en": "Ongoing",
    "hi": "चालू"
  },
  "completed": {
    "family": "done",
    "icon": "check",
    "en": "Completed",
    "hi": "पूरी"
  },
  "cancelled": {
    "family": "stopped",
    "icon": "x",
    "en": "Cancelled",
    "hi": "रद्द"
  },
  "expired": {
    "family": "stopped",
    "icon": "clock",
    "en": "Expired",
    "hi": "ख़त्म"
  },
  "lapsed": {
    "family": "stopped",
    "icon": "clock",
    "en": "Lapsed",
    "hi": "छूट गई"
  }
});
export const STATUS_FAMILIES = Object.freeze(["upcoming", "live", "done", "stopped"]);
/** Tailwind classes for a status pill, by family. */
export const STATUS_FAMILY_CLASSES = Object.freeze({
  upcoming: "bg-status-upcoming-bg text-status-upcoming-ink border-status-upcoming-border",
  live: "bg-status-live-bg text-status-live-ink border-transparent",
  done: "bg-status-done-bg text-status-done-ink border-transparent",
  stopped: "bg-status-stopped-bg text-status-stopped-ink border-transparent",
});
export function bookingStatus(status) {
  return BOOKING_STATUS[status] ?? null;
}
