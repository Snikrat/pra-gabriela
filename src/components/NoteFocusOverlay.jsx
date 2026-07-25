import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { creatorLabel } from "../lib/rules.js";
import { TZ } from "../lib/time.js";

export default function NoteFocusOverlay({ data, canDelete, canEdit, onClose, onDelete, onEdit, onReply }) {
  const [closing, setClosing] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const cardRef = useRef(null);
  const closeTimerRef = useRef(null);

  const note = data?.note || null;
  const fromRect = data?.fromRect || null;
  const noteId = note?.id || null;

  // só reseta o rascunho da resposta quando troca de post-it (ou fecha/abre),
  // não a cada atualização em tempo real de um post-it não relacionado
  useEffect(() => {
    setReplyText("");
    setClosing(false);
  }, [noteId]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    function onKeyDown(e) {
      if (e.key === "Escape") requestClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // FLIP: anima a entrada a partir do post-it original clicado
  useLayoutEffect(() => {
    if (!data || !cardRef.current || !fromRect) return;
    const card = cardRef.current;

    const toRect = card.getBoundingClientRect();
    const dx = fromRect.left - toRect.left;
    const dy = fromRect.top - toRect.top;
    const sx = fromRect.width / Math.max(1, toRect.width);
    const sy = fromRect.height / Math.max(1, toRect.height);

    card.style.transition = "none";
    card.style.transformOrigin = "top left";
    card.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    card.style.opacity = "0.6";

    requestAnimationFrame(() => {
      card.style.transition = "transform 420ms cubic-bezier(.2,.9,.2,1), opacity 220ms ease";
      card.style.transform = "translate(0px, 0px) scale(1, 1)";
      card.style.opacity = "1";
    });
  }, [data, fromRect]);

  const sortedReplies = useMemo(() => {
    const list = Array.isArray(note?.replies) ? note.replies : [];
    return list.slice().sort((a, b) => Number(a?.createdAtMs || 0) - Number(b?.createdAtMs || 0));
  }, [note?.replies]);

  if (!data || !note) return null;

  function requestClose() {
    const card = cardRef.current;
    if (card && fromRect && !closing) {
      setClosing(true);

      const to = card.getBoundingClientRect();
      const dx = fromRect.left - to.left;
      const dy = fromRect.top - to.top;
      const sx = fromRect.width / Math.max(1, to.width);
      const sy = fromRect.height / Math.max(1, to.height);

      card.style.transformOrigin = "top left";
      card.style.transition = "transform 320ms cubic-bezier(.2,.9,.2,1), opacity 200ms ease";
      card.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      card.style.opacity = "0.2";

      closeTimerRef.current = setTimeout(() => onClose(), 340);
      return;
    }
    onClose();
  }

  async function handleSendReply() {
    const txt = replyText.trim();
    if (!txt) return;

    if (!note.id) {
      alert("esse post-it é antigo e não tem id pra responder 🤍");
      return;
    }

    setSending(true);
    try {
      await onReply(note, txt);
      setReplyText("");
    } catch (e) {
      console.error(e);
      alert("deu ruim ao responder. tenta de novo.");
    } finally {
      setSending(false);
    }
  }

  const by = creatorLabel(note);
  const ms = Number(note?.createdAtMs || 0);
  const whenText = ms
    ? new Date(ms).toLocaleString("pt-BR", { timeZone: TZ, dateStyle: "short", timeStyle: "short" })
    : "";

  return (
    <div
      className="fixed inset-0 z-[260] grid place-items-center bg-pinkSoft p-[18px]"
      onClick={(e) => e.target === e.currentTarget && requestClose()}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label="post-it"
        style={{ background: data.bg || undefined }}
        className="max-h-[78vh] w-[min(560px,92vw)] overflow-auto rounded-[22px] border border-pink/25 p-[16px_16px_18px] shadow-[0_30px_90px_rgba(0,0,0,.45)]"
      >
        <button
          type="button"
          onClick={requestClose}
          className="sticky top-0 ml-auto block rounded-full border border-pink/22 bg-white/65 px-3.5 py-2 text-xs"
        >
          fechar
        </button>

        <div className="mt-2.5 flex items-center gap-2.5">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl border border-black/6 bg-white/35">
            📌
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-xs font-extrabold lowercase text-[rgba(40,40,55,.75)]">{by}</div>
            <div className="text-[11px] text-[rgba(40,40,55,.55)]">{whenText}</div>
          </div>
        </div>

        <h2 className="m-0 mb-2 mt-3 text-lg">{note.title || ""}</h2>
        <div className="text-[15px] leading-[1.55]" dangerouslySetInnerHTML={{ __html: note.text || "" }} />

        <div className="mt-3.5 border-t border-black/8 pt-3">
          <div className="mb-2.5 text-[13px] font-extrabold opacity-[.75]">respostas</div>

          <div className="flex max-h-[220px] flex-col gap-2.5 overflow-auto pr-1">
            {!sortedReplies.length && (
              <div className="text-xs opacity-[.72]">ainda sem respostas 🤍</div>
            )}

            {sortedReplies.map((r, i) => {
              const rWhen = Number(r?.createdAtMs || 0);
              const rWhenText = rWhen
                ? new Date(rWhen).toLocaleString("pt-BR", { timeZone: TZ, dateStyle: "short", timeStyle: "short" })
                : "";
              return (
                <div key={r.id || i} className="rounded-[14px] border border-black/6 bg-white/55 p-[10px_12px]">
                  <div className="mb-1.5 flex flex-wrap gap-2 text-[11px] opacity-[.72]">
                    {r?.createdByName && <span>respondido por {r.createdByName}</span>}
                    {rWhenText && (
                      <>
                        <span>•</span>
                        <span>{rWhenText}</span>
                      </>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-[1.35]">{r?.text || ""}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-2.5 flex items-end gap-2.5">
            <textarea
              rows={2}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReply();
                }
              }}
              placeholder="responder..."
              className="flex-1 resize-none rounded-2xl border border-black/10 bg-white/70 px-3 py-2.5 outline-none"
            />
            <button
              type="button"
              disabled={sending}
              onClick={handleSendReply}
              className="rounded-2xl border-none bg-white/75 px-3.5 py-2.5 font-extrabold disabled:cursor-not-allowed disabled:opacity-55"
            >
              {sending ? "enviando..." : "enviar"}
            </button>
          </div>
        </div>

        {(canEdit || canDelete) && (
          <div className="mt-3.5 flex justify-end gap-2.5">
            {canEdit && (
              <button
                type="button"
                onClick={() => onEdit(note)}
                className="rounded-full border border-pink/25 bg-white/55 px-3.5 py-2 text-xs active:scale-[.99]"
              >
                editar
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={async () => {
                  await onDelete(note);
                  requestClose();
                }}
                className="rounded-full border border-pink/25 bg-white/55 px-3.5 py-2 text-xs active:scale-[.99]"
              >
                amassar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
