import { useEffect } from "react";

export default function ConfirmModal({ state, onCancel, onOk }) {
  useEffect(() => {
    if (!state.open) return;
    function onKeyDown(e) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [state.open, onCancel]);

  if (!state.open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-pinkSoft p-[18px] animate-fadeIn">
      <div
        className={
          "w-[min(420px,96vw)] overflow-hidden rounded-[22px] border border-pink/25 bg-white shadow-[0_25px_70px_rgba(0,0,0,.3)] " +
          (state.anim === "shake" ? "animate-shake" : "animate-bounce2")
        }
      >
        <div className="flex items-center justify-between gap-3 border-b border-black/6 p-[14px_16px]">
          <div className="font-black tracking-[.2px]">amassar post-it?</div>
          <button
            type="button"
            onClick={() => onCancel()}
            className="rounded-full border-none bg-pink/15 px-3 py-2"
          >
            fechar
          </button>
        </div>

        <div className="p-[14px_16px_16px]">
          <p className="m-0 leading-[1.35] text-black/75">{state.message}</p>

          <div className="mt-3.5 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => onCancel()}
              className="rounded-full border border-black/12 bg-white/70 px-3.5 py-2.5"
            >
              cancelar
            </button>
            <button
              type="button"
              onClick={() => onOk()}
              className="rounded-full border-none bg-[linear-gradient(135deg,rgba(255,120,182,.95),rgba(255,150,210,.95))] px-3.5 py-2.5 font-extrabold text-white"
            >
              amassar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
