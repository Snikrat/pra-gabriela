import { creatorLabel } from "../lib/rules.js";
import { formatDayPretty } from "../lib/time.js";

export default function DayModal({
  open,
  item,
  onClose,
  onBackToJar,
  onViewAsPostIt,
}) {
  if (!open || !item) return null;

  return (
    <div
      className="fixed inset-0 z-[220] grid place-items-center bg-pinkSoft p-[18px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Post-its do dia"
        className="flex max-h-[75vh] w-[min(560px,92vw)] flex-col overflow-hidden rounded-[20px] border border-pink/25 bg-white shadow-[0_30px_80px_rgba(0,0,0,.35)]"
      >
        <div className="flex items-center justify-between border-b border-pink/12 p-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToJar}
              className="rounded-full border-none bg-pink/15 px-2.5 py-1.5 text-xs transition-colors hover:bg-pink/25"
            >
              voltar
            </button>
            <div>
              <div className="text-sm font-extrabold text-[#5a3a4a]">
                post-its do dia
              </div>
              <div className="mt-0.5 text-xs opacity-[.7]">
                {formatDayPretty(item.key)}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border-none bg-pink/15 px-3.5 py-2 text-xs"
          >
            fechar
          </button>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto p-4">
          {(item.notes || []).map((n, i) => {
            const by = creatorLabel(n);
            const repliesCount = Array.isArray(n?.replies)
              ? n.replies.length
              : 0;

            return (
              <div
                key={n.id || i}
                className="rounded-xl border border-pink/18 bg-pink/8 p-2.5 text-xs"
              >
                <h4 className="m-0 mb-1 text-[13px]">{n.title || ""}</h4>
                <div dangerouslySetInnerHTML={{ __html: n.text || "" }} />
                {repliesCount > 0 && (
                  <div className="mt-1.5 text-[11px] opacity-[.75]">
                    💬 {repliesCount} resposta{repliesCount === 1 ? "" : "s"}
                  </div>
                )}
                {by && (
                  <div className="mt-1.5 text-[11px] opacity-[.7]">{by}</div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => onViewAsPostIt(item)}
            className="mt-1.5 self-start rounded-full border-none bg-[linear-gradient(135deg,#ffb7dd,#ff8fc6)] px-3 py-2 text-xs"
          >
            ver como post-it 🤍
          </button>
        </div>
      </div>
    </div>
  );
}
