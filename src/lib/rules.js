export const DELETE_WINDOW_MS = 60 * 60 * 1000; // 1 hora
export const NOTE_ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

export const ALLOWED_EMAILS = [
  "felippe.santosffx@gmail.com",
  "gabrielagoncalves133@gmail.com",
].map((e) => e.toLowerCase());

export function isAllowedEmail(email) {
  return ALLOWED_EMAILS.includes(String(email || "").toLowerCase());
}

export function normEmail(e) {
  return String(e || "").trim().toLowerCase();
}

export function makeId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return "id_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
}

// fallback pra notas antigas sem id
export function noteKeyForMatch(note) {
  const em = normEmail(note?.createdByEmail);
  const t = Number(note?.createdAtMs || 0);
  return em && t ? `${em}|${t}` : "";
}

export function canDeleteNote(note, user) {
  if (!user) return false;

  const uEmail = normEmail(user.email);
  const nEmail = normEmail(note?.createdByEmail);

  if (!uEmail || !nEmail) return false;
  if (uEmail !== nEmail) return false;

  const created = Number(note?.createdAtMs || 0);
  if (!created) return false;

  return Date.now() - created <= DELETE_WINDOW_MS;
}

// editar usa a mesma regra de apagar: só o autor, só na primeira hora
export const canEditNote = canDeleteNote;

const SPOTIFY_EMBED_RE =
  /\s*<br><br>\s*<a href="([^"]+)" target="_blank" rel="noopener" class="spotifyBtn">\s*🎵 ouvir no spotify\s*<\/a>\s*$/;

// separa o texto "puro" do link do spotify embutido, pra poder repopular o
// formulário de edição (o create guarda os dois juntos num HTML só)
export function splitSpotifyEmbed(text) {
  const str = String(text || "");
  const m = str.match(SPOTIFY_EMBED_RE);
  if (!m) return { plainText: str, spotifyUrl: "" };
  return { plainText: str.slice(0, m.index), spotifyUrl: m[1] };
}

export function buildTextWithSpotify(plainText, spotifyUrl) {
  const base = String(plainText || "").trim();
  if (!spotifyUrl) return base;
  return `${base}
      <br><br>
      <a href="${spotifyUrl}" target="_blank" rel="noopener" class="spotifyBtn">
        🎵 ouvir no spotify
      </a>
    `;
}

export function onlyExpiredNotes(notes) {
  const now = Date.now();
  const arr = Array.isArray(notes) ? notes : [];
  return arr.filter((n) => {
    const created = Number(n?.createdAtMs || 0);
    if (!created) return true; // antigos sem timestamp entram no potinho
    return now - created >= NOTE_ACTIVE_WINDOW_MS;
  });
}

export function firstNameFromUser(user) {
  if (!user) return "";

  if (user.displayName && user.displayName.trim().length > 0) {
    return user.displayName.trim().split(/\s+/)[0];
  }

  if (user.email) {
    const beforeAt = user.email.split("@")[0];
    const clean = beforeAt.split(".")[0];
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  return "";
}

export function creatorLabel(note) {
  const n = (note?.createdByName || "").trim();
  if (!n) return "";
  return `escrito por ${n}`.toLowerCase();
}

export function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export const NOTE_COLORS = ["var(--noteA)", "var(--noteB)", "var(--noteC)", "var(--noteD)"];
