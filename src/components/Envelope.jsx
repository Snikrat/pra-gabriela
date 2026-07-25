export default function Envelope({ open, hidden, onOpen, onKeyDown }) {
  return (
    <section
      className={
        "fixed inset-0 z-10 grid place-items-center overflow-hidden backdrop-blur-xl transition-[opacity,visibility] duration-[600ms] " +
        "[background:radial-gradient(950px_520px_at_50%_14%,rgba(255,200,107,.20),transparent_62%),radial-gradient(820px_520px_at_20%_32%,rgba(255,120,182,.14),transparent_62%),radial-gradient(820px_520px_at_82%_42%,rgba(184,92,255,.10),transparent_64%),linear-gradient(180deg,rgba(255,255,255,.68),rgba(255,255,255,.46))] " +
        (hidden ? "invisible opacity-0 pointer-events-none" : "opacity-100")
      }
    >
      <div
        role="button"
        tabIndex={0}
        aria-label="Abrir carta para Gabriela"
        onClick={onOpen}
        onKeyDown={onKeyDown}
        className="relative z-[1] w-[min(860px,94vw)] cursor-pointer select-none [-webkit-tap-highlight-color:transparent]"
      >
        {/* carta */}
        <div
          className={
            "absolute left-[18px] right-[18px] top-[18px] z-[6] h-[240px] overflow-hidden rounded-[18px] border border-pink/18 p-[18px_18px_18px_26px] text-[#1f1f2a] shadow-[0_22px_55px_rgba(0,0,0,.18)] transition-all duration-[850ms] [transition-timing-function:cubic-bezier(.2,.9,.2,1)] " +
            "[background:radial-gradient(700px_280px_at_50%_0%,rgba(255,120,182,.12),transparent_62%),repeating-linear-gradient(to_bottom,rgba(120,130,170,.10)_0px,rgba(120,130,170,.10)_1px,transparent_1px,transparent_22px),linear-gradient(180deg,#ffffff,#fff8fc)] " +
            "before:absolute before:left-[14px] before:top-[14px] before:bottom-[14px] before:w-[2px] before:rounded-full before:opacity-90 before:[background:linear-gradient(180deg,rgba(255,120,182,.55),rgba(255,120,182,.15))] before:content-[''] " +
            "after:absolute after:right-0 after:top-0 after:h-16 after:w-16 after:opacity-95 after:[clip-path:polygon(100%_0,0_0,100%_100%)] after:shadow-[-8px_10px_20px_rgba(0,0,0,.10)] after:[background:linear-gradient(135deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0)_49%,rgba(255,235,245,.95)_50%,rgba(255,255,255,.92)_100%)] after:content-[''] " +
            (open
              ? "translate-y-[-20px] opacity-100"
              : "translate-y-[150px] opacity-0")
          }
        >
          <h3 className="m-0 mb-2.5 text-base text-ink">pra você 🤍</h3>
          <p className="m-0 text-[13px] leading-[1.55] text-[#2f2f3b]">
            eu fiz isso aqui pra você abrir no celular e lembrar que tem alguém
            sempre do seu lado.
            <br />
            pega um post-it sempre que precisar.
            <br />
            <br />
            amo você mais que tudo.
          </p>
          <div className="mt-3 text-xs text-[rgba(60,60,80,.7)]">
            toque de novo pra ver os post-its ✨
          </div>
        </div>

        {/* envelope */}
        <div
          className={
            "relative h-[min(420px,54vw)] min-h-[270px] overflow-hidden rounded-[26px] border border-[rgba(255,190,95,.22)] shadow-[0_18px_55px_rgba(0,0,0,.16),0_0_0_1px_rgba(255,200,107,.06)_inset,0_0_0_10px_rgba(255,255,255,.35)_inset] " +
            "[background:radial-gradient(760px_340px_at_50%_0%,rgba(255,200,107,.16),transparent_65%),radial-gradient(640px_280px_at_78%_15%,rgba(255,120,182,.10),transparent_68%),linear-gradient(180deg,#fffaf6,#fff3f8)] " +
            "before:pointer-events-none before:absolute before:inset-0 before:content-[''] " +
            "before:[background:linear-gradient(135deg,transparent_49.55%,rgba(0,0,0,.07)_50%,transparent_50.45%),linear-gradient(225deg,transparent_49.55%,rgba(0,0,0,.07)_50%,transparent_50.45%),linear-gradient(135deg,transparent_49.85%,rgba(255,255,255,.55)_50%,transparent_50.15%),linear-gradient(225deg,transparent_49.85%,rgba(255,255,255,.55)_50%,transparent_50.15%),linear-gradient(135deg,transparent_49.95%,rgba(255,200,107,.20)_50%,transparent_50.05%),linear-gradient(225deg,transparent_49.95%,rgba(255,200,107,.20)_50%,transparent_50.05%)] " +
            "after:pointer-events-none after:absolute after:inset-0 after:opacity-[.65] after:content-[''] " +
            "after:[background:radial-gradient(2px_2px_at_14%_22%,rgba(255,255,255,.55),transparent_60%),radial-gradient(2px_2px_at_38%_12%,rgba(255,255,255,.45),transparent_60%),radial-gradient(1.6px_1.6px_at_62%_18%,rgba(255,255,255,.40),transparent_60%),radial-gradient(2px_2px_at_84%_28%,rgba(255,255,255,.45),transparent_60%),radial-gradient(1.6px_1.6px_at_72%_52%,rgba(255,255,255,.35),transparent_60%),repeating-linear-gradient(0deg,rgba(120,130,170,.05)_0px,rgba(120,130,170,.05)_1px,transparent_1px,transparent_18px),radial-gradient(900px_380px_at_50%_12%,rgba(255,200,107,.14),transparent_65%)] " +
            "max-[520px]:rounded-[22px]"
          }
        >
          {/* flap */}
          <div
            className={
              "absolute left-0 right-0 top-0 z-[3] h-[58%] rounded-tl-[26px] rounded-tr-[26px] border-b border-[rgba(255,200,107,.18)] transition-transform duration-[850ms] [transition-timing-function:cubic-bezier(.2,.9,.2,1)] [transform-origin:50%_0%] " +
              "[background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(255,255,255,.52)),radial-gradient(700px_260px_at_50%_0%,rgba(255,200,107,.18),transparent_70%)] " +
              "after:pointer-events-none after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[22px] after:opacity-[.22] after:content-[''] after:[background:linear-gradient(180deg,rgba(0,0,0,.10),transparent)] " +
              "max-[520px]:rounded-tl-[22px] max-[520px]:rounded-tr-[22px] " +
              (open ? "[transform:rotateX(170deg)]" : "")
            }
          />

          {/* selo (sol) */}
          <div
            className={
              "absolute left-1/2 top-[27%] z-[5] grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white/62 text-[0px] text-white/95 shadow-[0_16px_34px_rgba(255,200,107,.22),0_0_0_10px_rgba(255,200,107,.10)] transition-[.6s] " +
              "[background:radial-gradient(circle_at_30%_30%,rgba(255,255,255,.55),transparent_45%),radial-gradient(circle_at_70%_75%,rgba(0,0,0,.08),transparent_55%),linear-gradient(135deg,#ffd79a,#ffc86b)] " +
              "before:content-['☀'] before:text-[22px] before:leading-none before:[filter:drop-shadow(0_6px_10px_rgba(255,200,107,.25))] " +
              "max-[520px]:h-[72px] max-[520px]:w-[72px] " +
              (open ? "scale-[.92] opacity-20" : "")
            }
          />

          {/* meta (textos + carimbo decorativo) */}
          <div
            className={
              "absolute inset-0 z-[6] pointer-events-none transition-[opacity,filter] duration-[600ms] ease-in-out " +
              "before:pointer-events-none before:absolute before:right-[46px] before:bottom-[46px] before:h-[118px] before:w-[118px] before:rounded-full before:opacity-[.55] before:shadow-[0_10px_24px_rgba(0,0,0,.10)] before:content-[''] " +
              "before:[background:radial-gradient(circle_at_50%_50%,rgba(255,255,255,0)_52%,rgba(255,200,107,.22)_53%,rgba(255,200,107,.22)_55%,rgba(255,255,255,0)_56%),radial-gradient(circle_at_50%_50%,rgba(255,120,182,.12),rgba(255,120,182,0)_70%)] " +
              "after:pointer-events-none after:absolute after:right-[46px] after:bottom-[46px] after:h-[118px] after:w-[118px] after:rounded-full after:opacity-[.45] after:[filter:blur(.1px)] after:content-[''] " +
              "after:[background:radial-gradient(10px_10px_at_38%_50%,rgba(255,200,107,.55),transparent_65%),radial-gradient(18px_18px_at_38%_50%,rgba(255,200,107,.18),transparent_70%),radial-gradient(12px_12px_at_66%_50%,rgba(184,92,255,.30),transparent_65%),radial-gradient(12px_12px_at_69%_50%,rgba(255,255,255,.80),transparent_66%),conic-gradient(from_0deg_at_38%_50%,rgba(255,200,107,0)_0_12deg,rgba(255,200,107,.30)_12deg_14deg,rgba(255,200,107,0)_14deg_24deg,rgba(255,200,107,.22)_24deg_26deg,rgba(255,200,107,0)_26deg_360deg),radial-gradient(2px_2px_at_22%_30%,rgba(255,200,107,.45),transparent_60%),radial-gradient(2px_2px_at_76%_26%,rgba(184,92,255,.35),transparent_60%),radial-gradient(2px_2px_at_78%_74%,rgba(255,120,182,.32),transparent_60%),radial-gradient(2px_2px_at_30%_78%,rgba(255,200,107,.32),transparent_60%)] " +
              "max-[520px]:before:right-[18px] max-[520px]:before:bottom-[18px] max-[520px]:before:h-24 max-[520px]:before:w-24 " +
              "max-[520px]:after:right-[18px] max-[520px]:after:bottom-[18px] max-[520px]:after:h-24 max-[520px]:after:w-24 " +
              (open ? "opacity-10 blur-[6px]" : "opacity-100")
            }
          >
            <div className="absolute left-[88px] top-[62%] flex -translate-y-1/2 items-end gap-2.5 opacity-[.96] max-[520px]:left-6 max-[520px]:top-[46%] max-[520px]:gap-1.5">
              <div className="whitespace-nowrap text-base font-semibold text-[rgba(50,50,65,.55)] max-[520px]:text-xs">
                Para:
              </div>
              <div className="translate-y-0.5 whitespace-nowrap font-sig text-[28px] text-[rgba(255,146,196,.96)] max-[520px]:text-lg">
                quem escolheu ficar
              </div>
              <div className="ml-2 h-px w-[220px] rounded-full opacity-90 [background:linear-gradient(90deg,rgba(255,200,107,.30),rgba(255,200,107,0))] max-[520px]:hidden" />
            </div>

            <div className="absolute right-[88px] top-[79%] flex max-w-[min(320px,42vw)] -translate-y-1/2 items-end gap-2.5 opacity-[.86] max-[520px]:right-6 max-[520px]:top-[63%] max-[520px]:max-w-none max-[520px]:gap-1.5">
              <div className="whitespace-nowrap text-base font-semibold text-[rgba(50,50,65,.55)] max-[520px]:text-xs">
                De:
              </div>
              <div className="whitespace-nowrap text-[14px] font-sig leading-[1.15] text-[rgba(255,146,196,.96)] opacity-[.88] max-[520px]:text-sm">
                quem escolheu cuidar
              </div>
            </div>

            <div
              className={
                "absolute left-[88px] bottom-11 flex items-center gap-3 text-sm text-[rgba(30,30,45,.72)] max-[520px]:left-6 max-[520px]:bottom-4 max-[520px]:text-xs transition-opacity duration-300 " +
                (open ? "opacity-0" : "opacity-100")
              }
            >
              <div className="grid h-[22px] w-[22px] place-items-center rounded-full border border-[rgba(255,200,107,.22)] bg-[rgba(255,200,107,.10)]">
                ⌃
              </div>
              <div>toque para abrir{open ? " (toque de novo)" : ""}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
