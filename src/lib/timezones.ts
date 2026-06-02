export const TIMEZONE_GROUPS: { region: string; zones: string[] }[] = [
  {
    region: "Americas",
    zones: [
      "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
      "America/Anchorage", "America/Phoenix", "America/Toronto", "America/Vancouver",
      "America/Mexico_City", "America/Bogota", "America/Sao_Paulo",
      "America/Argentina/Buenos_Aires", "America/Lima",
    ],
  },
  {
    region: "Europe",
    zones: [
      "Europe/London", "Europe/Dublin", "Europe/Paris", "Europe/Berlin",
      "Europe/Rome", "Europe/Madrid", "Europe/Amsterdam", "Europe/Zurich",
      "Europe/Stockholm", "Europe/Warsaw", "Europe/Moscow",
    ],
  },
  {
    region: "Asia/Pacific",
    zones: [
      "Asia/Dubai", "Asia/Kolkata", "Asia/Dhaka", "Asia/Bangkok",
      "Asia/Singapore", "Asia/Shanghai", "Asia/Tokyo", "Asia/Seoul",
      "Australia/Sydney", "Australia/Melbourne", "Pacific/Auckland", "Pacific/Honolulu",
    ],
  },
];

export const ALL_TIMEZONES = TIMEZONE_GROUPS.flatMap((g) => g.zones);

/** Get current UTC offset string for an IANA timezone, e.g. "UTC-7" or "UTC+5:30". */
export function getTimezoneOffset(tz: string, date = new Date()): string {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    });
    const part = dtf.formatToParts(date).find((p) => p.type === "timeZoneName");
    if (part?.value) {
      // e.g. "GMT-7" or "GMT+5:30" → "UTC-7"
      return part.value.replace(/^GMT/, "UTC").replace(/^UTC$/, "UTC+0");
    }
  } catch {
    // fall through
  }
  return "UTC";
}

/** "America/Los_Angeles" → "Los Angeles (UTC-7)" */
export function formatTimezoneLabel(tz: string, date = new Date()): string {
  const city = tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
  return `${city} (${getTimezoneOffset(tz, date)})`;
}
