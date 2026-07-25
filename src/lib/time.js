export const TZ = "America/Sao_Paulo";

const _dtfPartsSP = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const _dtfOffsetSP = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  timeZoneName: "shortOffset",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function getZonedPartsSP(date = new Date()) {
  const parts = _dtfPartsSP.formatToParts(date);
  const out = {};
  for (const p of parts) {
    if (p.type !== "literal") out[p.type] = p.value;
  }
  return {
    year: Number(out.year),
    month: Number(out.month),
    day: Number(out.day),
    hour: Number(out.hour),
    minute: Number(out.minute),
    second: Number(out.second),
  };
}

export function getOffsetMsSP(date = new Date()) {
  const parts = _dtfOffsetSP.formatToParts(date);
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value || "GMT+00:00";

  const m = tzName.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
  if (!m) return 0;

  const sign = m[1] === "-" ? -1 : 1;
  const hh = Number(m[2] || 0);
  const mm = Number(m[3] || 0);

  return sign * (hh * 60 + mm) * 60 * 1000;
}

export function zonedToUtcEpochSP({ year, month, day, hour = 0, minute = 0, second = 0 }) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second, 0);
  const offset = getOffsetMsSP(new Date(utcGuess));
  return utcGuess - offset;
}

export function dayKeySP(date = new Date()) {
  const p = getZonedPartsSP(date);
  const y = p.year;
  const m = String(p.month).padStart(2, "0");
  const d = String(p.day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function msUntilNextMidnightSP() {
  const now = new Date();
  const p = getZonedPartsSP(now);

  const today00 = zonedToUtcEpochSP({
    year: p.year,
    month: p.month,
    day: p.day,
    hour: 0,
    minute: 0,
    second: 0,
  });

  const nextMidnightEpoch = today00 + 24 * 60 * 60 * 1000;
  return Math.max(250, nextMidnightEpoch - Date.now());
}

export function dayKeyAddDays(key, deltaDays) {
  const [y, m, d] = String(key || "").split("-").map(Number);
  if (!y || !m || !d) return dayKeySP();

  const noon = zonedToUtcEpochSP({ year: y, month: m, day: d, hour: 12, minute: 0, second: 0 });
  const dt = new Date(noon + deltaDays * 24 * 60 * 60 * 1000);
  return dayKeySP(dt);
}

export function formatDayPretty(key) {
  const [y, m, d] = String(key || "").split("-").map(Number);
  const epoch = zonedToUtcEpochSP({ year: y, month: m, day: d, hour: 12, minute: 0, second: 0 });
  const dt = new Date(epoch);

  return dt.toLocaleDateString("pt-BR", {
    timeZone: TZ,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
