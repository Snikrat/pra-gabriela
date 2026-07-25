export default function AuthGate({ show, loggingIn, onLogin }) {
  return (
    <div
      className={
        "fixed inset-0 z-[999] items-center justify-center p-[18px] backdrop-blur-[10px] " +
        "[background:radial-gradient(950px_520px_at_50%_14%,rgba(255,200,107,.20),transparent_62%),radial-gradient(820px_520px_at_20%_32%,rgba(255,120,182,.16),transparent_62%),radial-gradient(820px_520px_at_82%_42%,rgba(184,92,255,.10),transparent_64%),linear-gradient(180deg,#fff9f4,#fff1f7)] " +
        (show ? "flex" : "hidden")
      }
      aria-hidden={!show}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="login"
        className="relative w-[min(360px,92vw)] overflow-hidden rounded-[26px] border border-pink/18 p-[22px_20px_18px] text-ink shadow-[0_30px_90px_rgba(255,120,182,.18),0_0_0_1px_rgba(255,255,255,.6)_inset] [background:radial-gradient(700px_260px_at_30%_0%,rgba(255,200,107,.16),transparent_60%),linear-gradient(180deg,#ffffff,#fff6fb)]"
      >
        <div className="mb-3.5 flex items-start justify-between gap-3">
          <div>
            <h1 className="m-0 text-[26px] font-black tracking-[.2px] text-ink">entrar</h1>
            <p className="mt-1.5 mb-0 text-[13px] leading-[1.4] text-[rgba(60,60,80,.75)]">esse espacinho é só nosso</p>
          </div>
        </div>

        <button
          type="button"
          disabled={loggingIn}
          onClick={onLogin}
          className="mt-3.5 flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/40 px-4 py-[13px] font-extrabold tracking-[.2px] text-white shadow-[0_16px_40px_rgba(255,120,182,.28),0_0_18px_rgba(255,120,182,.18)] transition-all hover:-translate-y-px hover:brightness-[1.03] hover:shadow-[0_22px_54px_rgba(255,120,182,.34),0_0_22px_rgba(255,120,182,.22)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-[.65] disabled:grayscale-[.15] [background:linear-gradient(135deg,#ff9fd2,#ff78b6)]"
        >
          <span
            aria-hidden="true"
            className="grid h-[22px] w-[22px] place-items-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,.15)]"
          >
            <span className="h-[14px] w-[14px] rounded-full [background:conic-gradient(from_0deg,#4285F4_0_25%,#34A853_25%_50%,#FBBC05_50%_75%,#EA4335_75%_100%)]" />
          </span>
          <span>{loggingIn ? "entrando..." : "entrar com google"}</span>
        </button>

        <p className="mt-3.5 mb-0 text-center text-xs tracking-[.15px] text-[rgba(60,60,80,.55)]">i will follow you</p>
      </div>
    </div>
  );
}
