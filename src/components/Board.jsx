import { useMemo, useRef } from "react";
import NoteCard from "./NoteCard.jsx";
import EmptyState from "./EmptyState.jsx";
import { getRevealedSetForUser } from "../lib/firestoreApi.js";
import { canDeleteNote, canEditNote, NOTE_COLORS } from "../lib/rules.js";

export default function Board({
  notes,
  notesByDay,
  user,
  onReveal,
  onOpenFocus,
  onDelete,
  onEdit,
  onWrite,
  archiveMode = false,
}) {
  const rotCache = useRef(new Map());

  const sorted = useMemo(
    () => notes.slice().sort((a, b) => Number(b?.createdAtMs || 0) - Number(a?.createdAtMs || 0)),
    [notes]
  );

  if (!sorted.length) {
    return <EmptyState onWrite={onWrite} />;
  }

  return (
    <main className="mt-8 grid grid-cols-1 gap-3.5 min-[520px]:grid-cols-2 max-[768px]:flex max-[768px]:flex-col max-[768px]:items-center max-[768px]:gap-5">
      {sorted.map((n, i) => {
        const nid = String(n?.id || "");
        if (!rotCache.current.has(nid || i)) {
          rotCache.current.set(nid || i, (Math.random() * 4 - 2).toFixed(2) + "deg");
        }
        const rot = rotCache.current.get(nid || i);

        const dayData = notesByDay[n?._dayKey];
        const revealedSet = getRevealedSetForUser(dayData, user);
        const isRevealed = archiveMode || (!!nid && revealedSet.has(nid));
        const bg = n?.color || NOTE_COLORS[i % NOTE_COLORS.length];

        return (
          <div key={nid || i} className="max-[768px]:w-full max-[768px]:max-w-[420px]">
            <NoteCard
              note={{ ...n, _rot: rot }}
              isRevealed={isRevealed}
              canDelete={!archiveMode && canDeleteNote(n, user)}
              canEdit={!archiveMode && canEditNote(n, user)}
              bg={bg}
              onReveal={(el) => onReveal(n, el)}
              onOpenFocus={(el) => onOpenFocus(n, bg, el)}
              onDelete={() => onDelete(n)}
              onEdit={() => onEdit(n)}
            />
          </div>
        );
      })}
    </main>
  );
}
