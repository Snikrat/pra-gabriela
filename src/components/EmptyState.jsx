export default function EmptyState({ onWrite }) {
  return (
    <div className="flex min-h-[46vh] items-center justify-center max-[520px]:min-h-[44vh]">
      <div className="relative w-full overflow-hidden rounded-[22px] border border-white/55 bg-white/58 p-[18px_16px] shadow-[0_24px_70px_rgba(0,0,0,.10),0_0_0_1px_rgba(255,120,182,.10)_inset] backdrop-blur-[18px] max-[520px]:rounded-[20px] max-[520px]:p-[16px_14px]">
        <div className="pointer-events-none absolute -inset-0.5 opacity-90 [background:radial-gradient(600px_220px_at_18%_10%,rgba(255,120,182,.22),transparent_60%),radial-gradient(520px_240px_at_85%_15%,rgba(184,92,255,.14),transparent_60%),radial-gradient(520px_260px_at_40%_120%,rgba(255,200,225,.16),transparent_65%)]" />

        <div className="relative z-[1] mb-1.5 mt-2 text-[16px] font-extrabold text-[rgba(25,25,34,.92)] max-[520px]:text-[15px]">
          ainda não tem post-its hoje
        </div>
        <p className="relative z-[1] m-0 whitespace-pre-line text-[13px] leading-[1.55] text-[rgba(60,60,80,.78)]">
          mas talvez seja um bom dia{"\n"}pra deixar algo aqui…
        </p>

        <div className="relative z-[1] mt-3.5 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onWrite}
            className="rounded-full border-none px-[18px] py-3 text-[13px] font-extrabold text-[#5a3a4a] shadow-[0_14px_34px_rgba(255,120,182,.32),0_0_0_1px_rgba(255,255,255,.50)_inset] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(255,120,182,.40),0_0_0_1px_rgba(255,255,255,.55)_inset] active:translate-y-0 active:scale-[.99] [background:linear-gradient(135deg,#ffb7dd,#ff8fc6)]"
          >
            ➕ escrever
          </button>
          <div className="text-xs text-[rgba(60,60,80,.62)]">fica guardado no potinho 🫙</div>
        </div>
      </div>
    </div>
  );
}
