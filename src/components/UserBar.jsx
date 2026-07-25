export default function UserBar({ show, label, onLogout }) {
  return (
    <div
      className={
        "fixed left-0 top-0 z-[9999] h-[52px] w-full items-center justify-between border-b border-white/8 bg-[rgba(18,18,22,.6)] px-[18px] backdrop-blur-[10px] " +
        (show ? "flex" : "hidden")
      }
    >
      <span className="text-[13px] font-semibold text-white opacity-[.85]">{label}</span>
      <button
        type="button"
        onClick={onLogout}
        className="rounded-xl border-none bg-[rgba(255,120,182,.25)] px-3 py-1.5 font-semibold text-white transition-colors hover:bg-[rgba(255,120,182,.4)]"
      >
        sair
      </button>
    </div>
  );
}
