import { useEffect, useMemo, useState } from "react";
import CustomSelect from "./CustomSelect.jsx";
import { listDaysFromDB, listQualifyingDaysPage, JAR_PAGE_SIZE } from "../lib/firestoreApi.js";
import { onlyExpiredNotes, normEmail, ALLOWED_EMAILS } from "../lib/rules.js";
import { formatDayPretty, zonedToUtcEpochSP, TZ } from "../lib/time.js";

export default function JarModal({ open, onClose, onOpenDay }) {
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [sort, setSort] = useState("desc");
  const [author, setAuthor] = useState("");

  const [monthOptions, setMonthOptions] = useState([{ label: "todos os meses", value: "" }]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [pagedItems, setPagedItems] = useState([]);
  const [cursorKey, setCursorKey] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const needsFullScan = !!search || !!month || !!author;

  useEffect(() => {
    if (!open) return;

    setSearch("");
    setMonth("");
    setSort("desc");
    setAuthor("");
    setPagedItems([]);
    setCursorKey(null);
    setHasMore(true);

    listDaysFromDB()
      .then((arc) => {
        const months = new Set();
        arc.forEach((it) => {
          if (!it?.key) return;
          const [y, m] = it.key.split("-");
          months.add(`${y}-${m}`);
        });

        const list = Array.from(months)
          .sort()
          .reverse()
          .map((val) => {
            const [y, m] = val.split("-");
            const epoch = zonedToUtcEpochSP({ year: Number(y), month: Number(m), day: 1, hour: 12, minute: 0, second: 0 });
            const label = new Date(epoch).toLocaleDateString("pt-BR", { timeZone: TZ, month: "long", year: "numeric" });
            return { label, value: val };
          });

        setMonthOptions([{ label: "todos os meses", value: "" }, ...list]);
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(false);
      try {
        if (needsFullScan) {
          let arc = await listDaysFromDB();
          arc = arc
            .map((it) => ({ ...it, notes: onlyExpiredNotes(it?.notes) }))
            .filter((it) => (it.notes || []).length);

          const term = search.toLowerCase();
          if (term) {
            arc = arc.filter((it) =>
              (it.notes || []).some(
                (n) => (n.title || "").toLowerCase().includes(term) || (n.text || "").toLowerCase().includes(term)
              )
            );
          }
          if (month) arc = arc.filter((it) => String(it.key || "").startsWith(month));
          if (author) {
            const target = normEmail(author);
            arc = arc.filter((it) => (it.notes || []).some((n) => normEmail(n?.createdByEmail) === target));
          }

          arc.sort((a, b) =>
            sort === "asc" ? String(a.key).localeCompare(String(b.key)) : String(b.key).localeCompare(String(a.key))
          );

          if (!cancelled) setItems(arc);
        } else {
          const first = await listQualifyingDaysPage({ pageSize: JAR_PAGE_SIZE, cursorKey: null, sortOrder: sort });
          if (cancelled) return;
          setPagedItems(first.items);
          setCursorKey(first.nextCursor);
          setHasMore(first.hasMore);
          setItems(first.items);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, search, month, sort, author]);

  async function loadMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const next = await listQualifyingDaysPage({ pageSize: JAR_PAGE_SIZE, cursorKey, sortOrder: sort });
      const merged = pagedItems.concat(next.items);
      setPagedItems(merged);
      setItems(merged);
      setCursorKey(next.nextCursor);
      setHasMore(next.hasMore);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }

  const authorOptions = useMemo(
    () => [
      { label: "todas as pessoas", value: "" },
      { label: "só felippe", value: ALLOWED_EMAILS[0] || "" },
      { label: "só gabriela", value: ALLOWED_EMAILS[1] || "" },
    ],
    []
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-pinkSoft p-[18px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Potinho de memórias"
        className="flex max-h-[75vh] w-[min(560px,92vw)] flex-col overflow-hidden rounded-[20px] border border-pink/25 bg-white shadow-[0_30px_80px_rgba(0,0,0,.35)] max-[520px]:w-[calc(100vw-24px)] max-[520px]:rounded-[18px]"
      >
        <div className="flex justify-end p-[12px_16px_0]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border-none bg-pink/15 px-3.5 py-2 text-xs"
          >
            fechar
          </button>
        </div>

        <div className="flex items-center gap-2.5 p-[10px_16px_14px]">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl border border-pink/18 bg-pink/12">
            🫙
          </div>
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-[#5a3a4a]">potinho de memórias</div>
            <div className="mt-0.5 text-xs opacity-[.7]">seus post-its guardados por dia 🤍</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 border-b border-pink/12 p-[0_16px_14px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="buscar por palavra..."
            className="w-full rounded-full border border-pink/25 bg-white px-3 py-2 text-xs outline-none focus:border-pink/50 focus:shadow-[0_0_0_3px_rgba(255,120,182,.15)]"
          />

          <div className="grid grid-cols-1 gap-2.5 min-[560px]:grid-cols-3">
            <CustomSelect value={month} placeholder="todos os meses" options={monthOptions} onChange={setMonth} />
            <CustomSelect
              value={sort}
              placeholder="mais recente"
              options={[
                { label: "mais recente", value: "desc" },
                { label: "mais antigo", value: "asc" },
              ]}
              onChange={setSort}
            />
            <CustomSelect value={author} placeholder="todas as pessoas" options={authorOptions} onChange={setAuthor} />
          </div>
        </div>

        <div className="grid gap-2.5 overflow-y-auto p-4">
          {loading && <div className="p-[10px_2px] text-[13px] text-[rgba(80,60,70,.7)]">carregando memórias…</div>}

          {!loading && error && (
            <div className="p-[10px_2px] text-[13px] text-[rgba(80,60,70,.7)]">deu ruim ao carregar 🤍</div>
          )}

          {!loading && !error && !items.length && (
            <div className="p-[10px_2px] text-[13px] text-[rgba(80,60,70,.7)]">nenhum post-it encontrado 🤍</div>
          )}

          {!loading &&
            !error &&
            items.map((item) => (
              <button
                key={item._id || item.key}
                type="button"
                onClick={() => onOpenDay(item)}
                className="w-full rounded-2xl border border-pink/20 bg-pink/8 p-3 text-left text-[13px] transition-colors hover:bg-pink/15"
              >
                <div className="flex w-full items-center justify-between gap-2.5">
                  <div>
                    <div className="font-extrabold">{formatDayPretty(item.key)}</div>
                    <div className="mt-0.5 text-xs opacity-[.7]">{(item.notes || []).length} memórias</div>
                  </div>
                  <div className="self-center opacity-[.65]">abrir</div>
                </div>
              </button>
            ))}

          {!loading && !error && !needsFullScan && hasMore && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                disabled={loadingMore}
                onClick={loadMore}
                className="rounded-full border-none bg-[linear-gradient(135deg,#ffb7dd,#ff8fc6)] px-3.5 py-2 text-xs disabled:opacity-70"
              >
                {loadingMore ? "carregando…" : "carregar mais"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
