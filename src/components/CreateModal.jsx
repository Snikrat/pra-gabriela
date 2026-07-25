import { useEffect, useState } from "react";
import { NOTE_COLORS, splitSpotifyEmbed, buildTextWithSpotify } from "../lib/rules.js";

const DEFAULT_CUSTOM = "#ffd6ea";

export default function CreateModal({ open, editTarget, onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [musicOn, setMusicOn] = useState(false);
  const [musicUrl, setMusicUrl] = useState("");
  const [color, setColor] = useState(NOTE_COLORS[0]);
  const [customColor, setCustomColor] = useState(DEFAULT_CUSTOM);
  const [saving, setSaving] = useState(false);

  const isEditing = !!editTarget;

  useEffect(() => {
    if (!open) return;

    if (editTarget) {
      const { plainText, spotifyUrl } = splitSpotifyEmbed(editTarget.text);
      setTitle(editTarget.title || "");
      setText(plainText);
      setMusicOn(!!spotifyUrl);
      setMusicUrl(spotifyUrl);
      setColor(editTarget.color || NOTE_COLORS[0]);
      setCustomColor(editTarget.color && editTarget.color.startsWith("#") ? editTarget.color : DEFAULT_CUSTOM);
      return;
    }

    setTitle("");
    setText("");
    setMusicOn(false);
    setMusicUrl("");
    setColor(NOTE_COLORS[0]);
    setCustomColor(DEFAULT_CUSTOM);
  }, [open, editTarget]);

  if (!open) return null;

  async function handleSave() {
    const t = title.trim();
    const body = text.trim();

    if (!t || !body) {
      alert("preenche o título e a mensagem 🤍");
      return;
    }

    let spotifyUrl = "";
    if (musicOn && musicUrl.trim()) {
      const url = musicUrl.trim();
      if (!url.includes("open.spotify.com")) {
        alert("cola um link válido do spotify 🤍");
        return;
      }
      spotifyUrl = url;
    }

    const finalText = buildTextWithSpotify(body, spotifyUrl);

    setSaving(true);
    try {
      await onSave({ title: t, finalText, color });
      onClose();
    } catch (e) {
      console.error(e);
      alert(isEditing ? "deu ruim ao salvar a edição. tenta de novo." : "deu ruim ao salvar. tenta de novo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[230] grid place-items-center bg-pinkSoft p-[18px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? "editar post-it" : "criar post-it"}
        className="w-[min(560px,92vw)] overflow-hidden rounded-[20px] border border-pink/25 bg-white shadow-[0_30px_80px_rgba(0,0,0,.35)]"
      >
        <div className="flex items-center justify-between gap-2.5 border-b border-pink/14 p-[14px_16px]">
          <div className="text-sm font-black text-[#5a3a4a]">
            {isEditing ? "editar post-it ✏️" : "criar post-it 🤍"}
          </div>
          <button type="button" onClick={onClose} className="rounded-full border-none bg-pink/15 px-3.5 py-2 text-xs">
            fechar
          </button>
        </div>

        <div className="grid gap-2.5 p-[14px_16px_16px]">
          <div className="grid gap-1.5">
            <div className="text-xs font-bold text-[rgba(90,58,74,.75)]">título</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
              placeholder="ex: lembrete fofo..."
              className="w-full rounded-2xl border border-pink/25 bg-white px-3 py-2.5 text-[13px] outline-none focus:border-pink/55 focus:shadow-[0_0_0_3px_rgba(255,120,182,.15)]"
            />
          </div>

          <div className="grid gap-1.5">
            <div className="text-xs font-bold text-[rgba(90,58,74,.75)]">mensagem</div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={600}
              placeholder="escreve aqui..."
              className="min-h-[110px] w-full resize-none rounded-2xl border border-pink/25 bg-white px-3 py-2.5 text-[13px] leading-[1.45] outline-none focus:border-pink/55 focus:shadow-[0_0_0_3px_rgba(255,120,182,.15)]"
            />
          </div>

          <div className="mt-1.5 grid gap-1.5">
            <div className="text-xs font-bold text-[rgba(70,50,65,.75)]">cor do post-it</div>
            <div role="radiogroup" aria-label="Escolher cor do post-it" className="flex flex-wrap items-center gap-2.5">
              {NOTE_COLORS.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={color === c}
                  aria-label={`cor ${i + 1}`}
                  onClick={() => setColor(c)}
                  style={{ background: c }}
                  className={
                    "h-7 w-7 rounded-xl border-2 shadow-[0_10px_22px_rgba(0,0,0,.10)] transition-all hover:-translate-y-px active:scale-[.98] " +
                    (color === c
                      ? "border-pink/95 shadow-[0_0_0_4px_rgba(255,120,182,.18),0_12px_26px_rgba(0,0,0,.14)]"
                      : "border-pink/22 hover:border-pink/55")
                  }
                />
              ))}

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-pink/25 bg-white/65 px-2.5 py-1.5">
                <span className="text-sm opacity-85">🎨</span>
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    setColor(e.target.value);
                  }}
                  className="h-[22px] w-[34px] cursor-pointer border-none bg-transparent p-0"
                />
              </label>
            </div>
          </div>

          <div className="mt-1.5 grid gap-2.5">
            <label className="inline-flex items-center gap-2.5 text-[13px] font-semibold text-[rgba(80,60,70,.85)]">
              <input
                type="checkbox"
                checked={musicOn}
                onChange={(e) => {
                  setMusicOn(e.target.checked);
                  if (!e.target.checked) setMusicUrl("");
                }}
                className="h-4 w-4 accent-pink"
              />
              <span>adicionar música 🎵</span>
            </label>

            <input
              type="url"
              value={musicUrl}
              onChange={(e) => setMusicUrl(e.target.value)}
              disabled={!musicOn}
              placeholder="cole o link do spotify (track/album/playlist)…"
              inputMode="url"
              autoComplete="off"
              className="w-full rounded-2xl border border-pink/25 bg-white/75 px-3 py-2.5 text-[13px] outline-none focus:border-pink/55 focus:shadow-[0_0_0_3px_rgba(255,120,182,.15)] disabled:opacity-55"
            />
          </div>

          <div className="mt-1.5 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-pink/22 bg-white/75 px-3.5 py-2.5 text-[13px] font-bold text-[#5a3a4a]"
            >
              cancelar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="rounded-2xl border-none bg-[linear-gradient(135deg,#ff9fd2,#ff78b6)] px-3.5 py-2.5 text-[13px] font-extrabold text-white shadow-[0_10px_22px_rgba(255,120,182,.28)] disabled:opacity-70"
            >
              {saving ? "salvando..." : isEditing ? "salvar edição" : "salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
