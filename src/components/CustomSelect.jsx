import { useEffect, useRef, useState } from "react";

export default function CustomSelect({ value, placeholder, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);

  const selected = options.find((o) => o.value === value);
  const label = selected?.label ?? placeholder;

  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function placePanel() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const panelMax = 240;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    setOpenUp(spaceBelow < panelMax && spaceAbove > spaceBelow);
  }

  function toggle(e) {
    e.preventDefault();
    if (!open) placePanel();
    setOpen((o) => !o);
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
        className="flex w-full items-center justify-between gap-2.5 rounded-full border-[1.5px] border-pink/35 bg-[#ffeaf5] px-3.5 py-2.5 text-[13px] text-[#5a3a4a] transition-all hover:border-pink/60 focus:outline-none focus:border-pink/80 focus:shadow-[0_0_0_3px_rgba(255,120,182,.15)]"
      >
        <span>{label}</span>
        <span
          className={
            "text-base leading-none text-pink/95 transition-transform " +
            (open ? "-translate-y-px rotate-180" : "-translate-y-px")
          }
        >
          ⌄
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          className={
            "absolute left-0 right-0 z-[9999] max-h-[220px] overflow-auto rounded-2xl border border-pink/22 bg-white p-1.5 shadow-[0_18px_40px_rgba(0,0,0,.18)] max-[520px]:max-h-[42vh] " +
            (openUp ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]")
          }
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={
                "w-full rounded-xl px-3 py-2.5 text-left text-[13px] text-[#5a3a4a] transition-colors hover:bg-pink/10 active:scale-[.99] " +
                (opt.value === value ? "bg-pink/16 font-bold" : "")
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
