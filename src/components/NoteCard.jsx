import { creatorLabel } from "../lib/rules.js";

export default function NoteCard({ note, isRevealed, canDelete, canEdit, bg, onReveal, onOpenFocus, onDelete, onEdit }) {
  const by = creatorLabel(note);
  const repliesCount = Array.isArray(note?.replies) ? note.replies.length : 0;

  function activate(el) {
    if (isRevealed) {
      onOpenFocus(el);
      return;
    }
    if (!note?.id) return;
    onReveal(el);
  }

  function handleClick(e) {
    activate(e.currentTarget);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate(e.currentTarget);
    }
  }

  const label = isRevealed
    ? `abrir post-it: ${note.title || "sem título"}`
    : "toque pra revelar post-it";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{ "--rot": note._rot, background: bg }}
      className={
        "relative cursor-pointer rounded-2xl p-3.5 shadow-[0_14px_35px_rgba(0,0,0,.18)] [transform:rotate(var(--rot))] transition-[filter,transform] duration-[700ms] [transition-timing-function:cubic-bezier(.2,.9,.2,1)] active:[transform:rotate(var(--rot))_scale(.99)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2 " +
        (isRevealed
          ? "animate-revealPop"
          : "[transform:rotate(var(--rot))_scale(.985)] [filter:blur(14px)_saturate(.90)_brightness(1.02)] " +
            "after:pointer-events-none after:absolute after:inset-0 after:grid after:place-items-center after:text-sm after:text-[rgba(20,20,30,.52)] after:![filter:none] after:content-['toque_pra_revelar_🤍'] after:[text-shadow:0_1px_0_rgba(255,255,255,.75)]")
      }
    >
      <div className="mb-2 flex justify-end text-xs opacity-90">
        <span>{note.emo || "📌"}</span>
        {repliesCount > 0 && <span className="ml-auto text-xs opacity-[.75]">💬 {repliesCount}</span>}
      </div>

      <h2 className="m-0 mb-1.5 text-[15px]">{note.title || ""}</h2>
      <p className="m-0 text-sm leading-[1.5]" dangerouslySetInnerHTML={{ __html: note.text || "" }} />

      {(by || canDelete || canEdit) && (
        <div className="mt-2.5 flex items-center justify-between gap-2.5 opacity-[.92]">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[rgba(40,40,55,.65)]">
            {by && (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-pink/75 shadow-[0_0_10px_rgba(255,120,182,.25)]" />
                <span>{by}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {canEdit && (
              <button
                type="button"
                aria-label="editar post-it"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit();
                }}
                className="rounded-xl border border-black/8 bg-white/55 px-2.5 py-1.5 text-xs font-bold opacity-90 transition-all hover:bg-white/75 hover:opacity-100 hover:-translate-y-px active:translate-y-0"
              >
                editar
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                aria-label="apagar post-it"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete();
                }}
                className="rounded-xl border border-black/8 bg-white/55 px-2.5 py-1.5 text-xs font-bold opacity-90 transition-all hover:bg-white/75 hover:opacity-100 hover:-translate-y-px active:translate-y-0"
              >
                amassar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
