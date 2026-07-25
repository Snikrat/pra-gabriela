const pillBtn =
  "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold shadow-[0_4px_10px_rgba(0,0,0,.08)] transition-transform active:scale-[.97]";

export default function Header({
  headline,
  dateLabel,
  isArchive,
  onBack,
  onOpenJar,
  onOpenCreate,
  onBackToToday,
}) {
  return (
    <header className="relative mb-4 pr-0 sm:pr-[150px]">
      <h1
        id="headline"
        className="m-0 text-[22px] [text-shadow:0_6px_26px_rgba(255,120,182,.12)]"
      >
        {headline}
      </h1>

      <button
        type="button"
        onClick={onBack}
        aria-label="Voltar para o envelope"
        className={
          pillBtn +
          " absolute right-0 top-0 border-pink/28 bg-white/65 text-[#333]"
        }
      >
        <span className="h-2 w-2 rounded-full bg-pink/75 shadow-[0_0_12px_rgba(255,120,182,.35)]" />
        fechar envelope
      </button>

      <button
        type="button"
        onClick={onOpenJar}
        aria-label="Abrir potinho de post-its"
        className={
          pillBtn +
          " absolute right-0 top-[44px] border-pink/35 text-[#5a3a4a] shadow-[0_8px_20px_rgba(255,120,182,.25)] hover:-translate-y-0.5 [background:linear-gradient(135deg,#ffe4f3,#ffd1ea)]"
        }
      >
        🫙 potinho
      </button>

      <button
        type="button"
        onClick={onOpenCreate}
        aria-label="Criar um novo post-it"
        className={
          pillBtn +
          " absolute right-0 top-[88px] border-pink/35 text-[#5a3a4a] shadow-[0_8px_20px_rgba(255,120,182,.22)] hover:-translate-y-0.5 [background:linear-gradient(135deg,#fff6fb,#ffe1f2)]"
        }
      >
        ➕ escrever
      </button>

      <div className="mt-1.5 text-[13px] text-muted">post-its do dia</div>

      {isArchive ? (
        <button
          type="button"
          onClick={onBackToToday}
          className="mt-2 inline-block cursor-pointer rounded-full border border-pink/20 bg-pink/12 px-3 py-2 text-[13px] text-[#555]"
        >
          ↩ hoje
        </button>
      ) : (
        <div className="mt-2 inline-block rounded-full border border-pink/20 bg-pink/12 px-3 py-2 text-[13px] text-[#555]">
          {dateLabel}
        </div>
      )}
    </header>
  );
}
