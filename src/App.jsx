import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useAuth } from "./hooks/useAuth.js";
import { useTodayNotes } from "./hooks/useTodayNotes.js";
import { useConfirm } from "./hooks/useConfirm.js";
import {
  getZonedPartsSP,
  zonedToUtcEpochSP,
  formatDayPretty,
  TZ,
} from "./lib/time.js";
import { firstNameFromUser, canDeleteNote, canEditNote } from "./lib/rules.js";

import Envelope from "./components/Envelope.jsx";
import AuthGate from "./components/AuthGate.jsx";
import UserBar from "./components/UserBar.jsx";
import Header from "./components/Header.jsx";
import Board from "./components/Board.jsx";
import SparkleLayer from "./components/SparkleLayer.jsx";

// só baixados quando realmente abertos — tiram peso do carregamento inicial
const JarModal = lazy(() => import("./components/JarModal.jsx"));
const DayModal = lazy(() => import("./components/DayModal.jsx"));
const CreateModal = lazy(() => import("./components/CreateModal.jsx"));
const ConfirmModal = lazy(() => import("./components/ConfirmModal.jsx"));
const NoteFocusOverlay = lazy(() => import("./components/NoteFocusOverlay.jsx"));

function greeting(hour) {
  return hour < 12 ? "bom dia, " : hour < 18 ? "boa tarde, " : "boa noite, ";
}

export default function App() {
  const { user, ready, loggingIn, login, logout } = useAuth();
  const today = useTodayNotes(user);
  const confirm = useConfirm();

  const [view, setView] = useState("envelope"); // envelope | posts
  const [envelopeOpen, setEnvelopeOpen] = useState(false);

  const [jarOpen, setJarOpen] = useState(false);
  const [dayModalItem, setDayModalItem] = useState(null);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [createModalState, setCreateModalState] = useState(null); // null | { note?, dayKey? }
  const [noteFocus, setNoteFocus] = useState(null); // { noteId, fallbackNote, bg, fromRect }
  const [archiveItem, setArchiveItem] = useState(null); // dia visto "como post-it"

  const sparkleRef = useRef(null);

  const anyModalOpen =
    jarOpen || dayModalOpen || !!createModalState || confirm.state.open || !!noteFocus;
  useEffect(() => {
    document.body.classList.toggle("modalOpen", anyModalOpen);
  }, [anyModalOpen]);

  // reset de navegação ao deslogar
  useEffect(() => {
    if (ready && !user) {
      setView("envelope");
      setEnvelopeOpen(false);
      setJarOpen(false);
      setDayModalOpen(false);
      setDayModalItem(null);
      setCreateModalState(null);
      setNoteFocus(null);
      setArchiveItem(null);
    }
  }, [ready, user]);

  const now = new Date();
  const p = getZonedPartsSP(now);
  const dt = new Date(
    zonedToUtcEpochSP({ ...p, hour: 12, minute: 0, second: 0 }),
  );
  const dateLabel = dt.toLocaleDateString("pt-BR", {
    timeZone: TZ,
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  const headline = archiveItem
    ? formatDayPretty(archiveItem.key)
    : greeting(p.hour) + "🤍";

  function handleEnvelopeOpen() {
    if (!envelopeOpen) {
      setEnvelopeOpen(true);
      return;
    }
    setView("posts");
  }

  function handleEnvelopeKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleEnvelopeOpen();
    }
  }

  function goToEnvelope() {
    setJarOpen(false);
    setDayModalOpen(false);
    setDayModalItem(null);
    setCreateModalState(null);
    setNoteFocus(null);
    setArchiveItem(null);
    setEnvelopeOpen(false);
    setView("envelope");
    sparkleRef.current?.clear();
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  async function handleReveal(note, el) {
    const r = el.getBoundingClientRect();
    sparkleRef.current?.spawn(r.left + r.width / 2, r.top + r.height / 2);
    try {
      await today.reveal(note);
    } catch (e) {
      console.error(e);
    }
  }

  function handleOpenFocus(note, bg, el) {
    const fromRect = el?.getBoundingClientRect?.() || null;
    setNoteFocus({ noteId: note?.id || null, fallbackNote: note, bg, fromRect });
  }

  async function handleDeleteNote(note) {
    const ok = await confirm.ask("quer amassar esse post-it?");
    if (!ok) return;
    try {
      const target = archiveItem ? { ...note, _dayKey: archiveItem.key } : note;
      await today.remove(target);
      // no modo arquivo, o board mostra um snapshot local — atualiza pra não
      // sumir a nota só quando o usuário voltar pro potinho
      if (archiveItem) {
        setArchiveItem((cur) =>
          cur
            ? {
                ...cur,
                notes: (cur.notes || []).filter((n) => n.id !== note.id),
              }
            : cur,
        );
      }
    } catch (e) {
      console.error(e);
      alert("deu ruim ao amassar. tenta de novo.");
    }
  }

  async function handleReply(note, text) {
    const dayKey = archiveItem?.key || note?._dayKey || today.todayCache?.key;
    const reply = await today.reply(dayKey, note.id, text);
    // no modo arquivo o dia é um snapshot estático — não vem sozinho em tempo real
    if (archiveItem) {
      setArchiveItem((cur) =>
        cur
          ? {
              ...cur,
              notes: (cur.notes || []).map((n) =>
                n.id === note.id ? { ...n, replies: [...(n.replies || []), reply] } : n,
              ),
            }
          : cur,
      );
    }
    return reply;
  }

  function handleEditNote(note) {
    const dayKey = archiveItem?.key || note?._dayKey || today.todayCache?.key;
    setNoteFocus(null);
    setCreateModalState({ note, dayKey });
  }

  async function handleSaveCreateOrEdit({ title, finalText, color }) {
    const editing = createModalState?.note;
    if (editing) {
      const dayKey = createModalState.dayKey || archiveItem?.key || editing._dayKey || today.todayCache?.key;
      await today.edit(dayKey, editing.id, { title, finalText, color });
      if (archiveItem) {
        setArchiveItem((cur) =>
          cur
            ? {
                ...cur,
                notes: (cur.notes || []).map((n) =>
                  n.id === editing.id ? { ...n, title, text: finalText, color } : n,
                ),
              }
            : cur,
        );
      }
      return editing.id;
    }
    return today.create({ title, finalText, color });
  }

  function openJar() {
    setJarOpen(true);
  }

  function handleOpenDay(item) {
    setJarOpen(false);
    setDayModalItem(item);
    setDayModalOpen(true);
  }

  function handleBackToJar() {
    setDayModalOpen(false);
    setJarOpen(true);
  }

  function handleViewAsPostIt(item) {
    setDayModalOpen(false);
    setArchiveItem(item);
    setView("posts");
  }

  function handleBackToToday() {
    setArchiveItem(null);
  }

  const boardNotes = archiveItem ? archiveItem.notes || [] : today.activeNotes;
  const boardNotesByDay = archiveItem
    ? { [archiveItem.key]: archiveItem }
    : today.activeNotesByDay;

  // o overlay de destaque busca a versão viva da nota (reflete em tempo real
  // revelações/respostas de qualquer um dos dois), com a nota original como
  // fallback pra notas antigas sem id ou se ela já não estiver mais na lista
  const noteFocusLiveNote = noteFocus
    ? (noteFocus.noteId && boardNotes.find((n) => n.id === noteFocus.noteId)) || noteFocus.fallbackNote
    : null;
  const noteFocusData =
    noteFocus && noteFocusLiveNote
      ? { note: noteFocusLiveNote, bg: noteFocus.bg, fromRect: noteFocus.fromRect }
      : null;

  const showApp = ready && !!user;

  return (
    <>
      {ready && <AuthGate show={!user} loggingIn={loggingIn} onLogin={login} />}

      {showApp && (
        <UserBar
          show
          label={`oi, ${firstNameFromUser(user)} 🤍`.toLowerCase()}
          onLogout={logout}
        />
      )}

      {showApp && (
        <>
          <Envelope
            open={envelopeOpen}
            hidden={view !== "envelope"}
            onOpen={handleEnvelopeOpen}
            onKeyDown={handleEnvelopeKeyDown}
          />

          <div
            className={
              "mx-auto max-w-[520px] p-[20px_16px_30px] pt-[76px] " +
              (view === "posts" ? "block" : "hidden")
            }
          >
            <Header
              headline={headline}
              dateLabel={dateLabel}
              isArchive={!!archiveItem}
              onBack={goToEnvelope}
              onOpenJar={openJar}
              onOpenCreate={() => setCreateModalState({})}
              onBackToToday={handleBackToToday}
            />

            <Board
              notes={boardNotes}
              notesByDay={boardNotesByDay}
              user={user}
              archiveMode={!!archiveItem}
              onReveal={handleReveal}
              onOpenFocus={handleOpenFocus}
              onDelete={handleDeleteNote}
              onEdit={handleEditNote}
              onWrite={() => setCreateModalState({})}
            />

            <footer className="mt-[25px] text-center text-xs text-muted">
              feito com carinho
            </footer>
          </div>

          <SparkleLayer ref={sparkleRef} />

          <Suspense fallback={null}>
            {jarOpen && (
              <JarModal
                open={jarOpen}
                onClose={() => setJarOpen(false)}
                onOpenDay={handleOpenDay}
              />
            )}

            {dayModalOpen && (
              <DayModal
                open={dayModalOpen}
                item={dayModalItem}
                onClose={() => setDayModalOpen(false)}
                onBackToJar={handleBackToJar}
                onViewAsPostIt={handleViewAsPostIt}
              />
            )}

            {!!createModalState && (
              <CreateModal
                open={!!createModalState}
                editTarget={createModalState?.note || null}
                onClose={() => setCreateModalState(null)}
                onSave={handleSaveCreateOrEdit}
              />
            )}

            {noteFocusData && (
              <NoteFocusOverlay
                data={noteFocusData}
                canDelete={canDeleteNote(noteFocusData.note, user)}
                canEdit={canEditNote(noteFocusData.note, user)}
                onClose={() => setNoteFocus(null)}
                onDelete={handleDeleteNote}
                onEdit={handleEditNote}
                onReply={handleReply}
              />
            )}

            {confirm.state.open && (
              <ConfirmModal
                state={confirm.state}
                onCancel={() => confirm.resolve(false)}
                onOk={() => confirm.resolve(true)}
              />
            )}
          </Suspense>
        </>
      )}
    </>
  );
}
