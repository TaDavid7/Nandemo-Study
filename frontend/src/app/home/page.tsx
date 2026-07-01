"use client";
import React, { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Flashcard from "@/components/Flashcard";
import { authfetch } from "@/lib/authfetch";

type Card = {
  _id: string;
  question: string;
  answer: string;
  folder: string;
};

type Folder = {
  _id: string;
  name: string;
};

const inputClass = `p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100
  placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition`;

export default function Home() {
  const [flashcards, setFlashcards] = useState<Card[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");

  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [newFolder, setNewFolder] = useState("");

  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderDropdownOpen, setFolderDropdownOpen] = useState<string | null>(null);

  const [cardindex, setCardIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [importMessage, setImportMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    authfetch(`/api/folders`)
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setFolders(data); });
  }, []);

  useEffect(() => {
    if (!selectedFolder) { setFlashcards([]); return; }
    setCardIndex(0);
    authfetch(`/api/flashcards?folderId=${selectedFolder}`)
      .then((res) => res.json())
      .then((cards: Card[]) => setFlashcards(cards));
  }, [selectedFolder]);

  const handleAddFolder = (e: FormEvent) => {
    e.preventDefault();
    authfetch(`/api/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolder }),
    }).then(async (res) => {
      if (!res.ok) { const data = await res.json(); setNewFolder(data.error || "Could not add folder"); return; }
      const folder: Folder = await res.json();
      setFolders(Array.isArray(folders) ? [...folders, folder] : [folder]);
      setNewFolder("");
    });
  };

  const handleAdd = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFolder) return;
    authfetch(`/api/flashcards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer, folder: selectedFolder }),
    })
      .then((res) => res.json())
      .then((newCard: Card) => setFlashcards([...flashcards, newCard]));
    setQuestion("");
    setAnswer("");
  };

  const handleImportPdf = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFolder || !pdfFile) return;
    setImportStatus("loading");
    setImportMessage(null);
    const formData = new FormData();
    formData.append("file", pdfFile);
    formData.append("folderId", selectedFolder);
    authfetch(`/api/flashcards/import/pdf`, { method: "POST", body: formData })
      .then(async (res) => {
        if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "Failed to import PDF"); }
        return res.json();
      })
      .then(async (data) => {
        const createdCount = data.createdCount ?? (Array.isArray(data.cards) ? data.cards.length : null);
        return authfetch(`/api/flashcards?folderId=${selectedFolder}`)
          .then((res) => res.json())
          .then((cards: Card[]) => {
            setFlashcards(cards);
            setImportStatus("done");
            setImportMessage(createdCount != null ? `Imported ${createdCount} flashcard${createdCount === 1 ? "" : "s"} from PDF.` : "Imported flashcards from PDF.");
            setPdfFile(null);
          });
      })
      .catch((err: any) => { setImportStatus("error"); setImportMessage(err.message || "Something went wrong while importing."); });
  };

  const handleEditStart = (id: string, question: string, answer: string) => {
    setEditingId(id); setEditQuestion(question); setEditAnswer(answer);
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingId) return;
    authfetch(`/api/flashcards/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: editQuestion, answer: editAnswer }),
    })
      .then((res) => res.json())
      .then((updatedCard: Card) => {
        setFlashcards(flashcards.map((card) => (card._id === editingId ? updatedCard : card)));
        setEditingId(null); setEditQuestion(""); setEditAnswer("");
      });
  };

  const handleEditCancel = () => { setEditingId(null); setEditQuestion(""); setEditAnswer(""); };

  const handleRenameFolder = (e: FormEvent) => {
    e.preventDefault();
    if (!renamingFolderId) return;
    authfetch(`/api/folders/${renamingFolderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolderName }),
    })
      .then((res) => res.json())
      .then((updatedFolder: Folder) => {
        setFolders(folders.map((f) => (f._id === renamingFolderId ? updatedFolder : f)));
        setRenamingFolderId(null); setNewFolderName("");
      });
  };

  const handleDelete = (id: string) => {
    authfetch(`/api/flashcards/${id}`, { method: "DELETE" }).then(() => {
      const newCards = flashcards.filter((card) => card._id !== id);
      if (cardindex >= newCards.length) setCardIndex(Math.max(0, newCards.length - 1));
      setFlashcards(newCards);
    });
  };

  const handleDeleteFolder = (id: string) => {
    if (!window.confirm("Are you sure? This will delete the folder and all its flashcards.")) return;
    authfetch(`/api/folders/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(() => {
        setFolders(folders.filter((f) => f._id !== id));
        if (selectedFolder === id) { setSelectedFolder(""); setFlashcards([]); }
      });
  };

  const decreaseIndex = (length: number) => {
    setSlideDirection(-1);
    setCardIndex(cardindex <= 0 ? length - 1 : (l) => l - 1);
  };

  const increaseIndex = (length: number) => {
    setSlideDirection(1);
    setCardIndex(cardindex >= length - 1 ? 0 : (l) => l + 1);
  };

  const slideVariants = {
    initial: (d: number) => ({ x: d * 220, opacity: 0 }),
    animate: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d * -220, opacity: 0 }),
  };

  const selectedFolderName = folders.find(f => f._id === selectedFolder)?.name;

  return (
    <div>
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Home</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Manage folders and study your flashcards in one place.</p>
      </div>

      {/* Controls Panel */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 ring-1 ring-black/5 dark:ring-white/10 shadow-sm overflow-hidden">

        {/* ── Section: Folders ── */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wide">Folders</span>
          </div>
          {selectedFolderName && (
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-full px-2.5 py-0.5">
              {selectedFolderName}
            </span>
          )}
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Folder select row */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="flex-1 min-w-[160px] sm:max-w-xs rounded-xl border border-slate-300 dark:border-slate-600
                         bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200
                         px-3 py-2.5 text-sm focus:border-indigo-500 dark:focus:border-indigo-400
                         focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none transition"
            >
              <option value="">Select a folder…</option>
              {Array.isArray(folders) && folders.map((folder) => (
                <option key={folder._id} value={folder._id}>{folder.name}</option>
              ))}
            </select>

            {selectedFolder && (
              <div className="relative">
                <button
                  aria-label="Folder actions"
                  className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-lg leading-none transition"
                  onClick={() => setFolderDropdownOpen(folderDropdownOpen === selectedFolder ? null : selectedFolder)}
                >
                  ⋮
                </button>
                {folderDropdownOpen === selectedFolder && (
                  <div className="absolute left-0 mt-2 z-20 min-w-[140px] rounded-xl bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black/5 dark:ring-white/10 p-1">
                    <button
                      className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                      onClick={() => { setRenamingFolderId(selectedFolder); setNewFolderName(folders.find(f => f._id === selectedFolder)?.name || ""); setFolderDropdownOpen(null); }}
                    >Rename</button>
                    <button
                      className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-400"
                      onClick={() => { setFolderDropdownOpen(null); handleDeleteFolder(selectedFolder); }}
                    >Delete</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rename form */}
          {renamingFolderId && (
            <form onSubmit={handleRenameFolder} className="flex items-center gap-2">
              <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} required autoFocus className={`${inputClass} focus:ring-2 focus:ring-amber-500 flex-1 text-sm`} />
              <button type="submit" className="px-3 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition">Save</button>
              <button type="button" onClick={() => setRenamingFolderId(null)} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition">Cancel</button>
            </form>
          )}

          {/* New folder form */}
          <form onSubmit={handleAddFolder} className="flex gap-2">
            <input value={newFolder} onChange={e => setNewFolder(e.target.value)} placeholder="New folder name…" required className={`${inputClass} focus:ring-2 focus:ring-indigo-500 flex-1 text-sm`} />
            <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition shrink-0">
              Add Folder
            </button>
          </form>
        </div>

        {/* ── Section: Cards ── */}
        <div className="px-6 py-4 border-t border-b border-slate-100 dark:border-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path strokeLinecap="round" d="M2 10h20" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wide">
            {editingId ? "Edit Card" : "Add a Card"}
          </span>
          {flashcards.length > 0 && !editingId && (
            <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{flashcards.length} card{flashcards.length === 1 ? "" : "s"}</span>
          )}
        </div>

        <div className="px-6 py-5">
          {!selectedFolder && !editingId ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">Select a folder above to add cards.</p>
          ) : editingId ? (
            <form onSubmit={handleEditSubmit} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
              <input value={editQuestion} onChange={e => setEditQuestion(e.target.value)} placeholder="Question" required className={`${inputClass} focus:ring-2 focus:ring-amber-500 text-sm`} />
              <input value={editAnswer} onChange={e => setEditAnswer(e.target.value)} placeholder="Answer" required className={`${inputClass} focus:ring-2 focus:ring-amber-500 text-sm`} />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition">Save</button>
                <button type="button" onClick={handleEditCancel} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition">Cancel</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
              <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Question" required className={`${inputClass} focus:ring-2 focus:ring-emerald-500 text-sm`} />
              <input value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Answer" required className={`${inputClass} focus:ring-2 focus:ring-emerald-500 text-sm`} />
              <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition">Add Card</button>
            </form>
          )}
        </div>

        {/* ── Section: Import PDF ── */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wide">Import from PDF</span>
          <span className="ml-1 text-xs font-medium text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded px-1.5 py-0.5">AI</span>
        </div>

        <div className="px-6 py-5 space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload a PDF and AI will generate flashcards automatically into the selected folder.
          </p>
          {!selectedFolder && (
            <p className="text-xs text-rose-500 dark:text-rose-400">Select a folder first.</p>
          )}
          <form onSubmit={handleImportPdf} className="space-y-3">
            <input
              type="file" name="file" accept="application/pdf"
              onChange={e => { const f = e.target.files?.[0] || null; setPdfFile(f); setImportStatus("idle"); setImportMessage(null); }}
              className="block w-full text-sm text-slate-700 dark:text-slate-300
                         file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-1.5
                         file:bg-indigo-50 dark:file:bg-indigo-900/40
                         file:text-sm file:font-medium file:text-indigo-700 dark:file:text-indigo-400
                         hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/60 file:transition"
            />
            {pdfFile && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Selected: {pdfFile.name}</p>}
            <button
              type="submit"
              disabled={!selectedFolder || !pdfFile || importStatus === "loading"}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {importStatus === "loading" ? "Importing…" : "Import PDF"}
            </button>
            {importMessage && (
              <p className={`text-sm ${importStatus === "error" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {importMessage}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Card Viewer */}
      <div className="mt-10">
        {flashcards.length > 0 ? (
          <div className="relative w-full max-w-3xl mx-auto px-8">
            <div className="overflow-hidden">
              <AnimatePresence mode="wait" custom={slideDirection}>
                <motion.div
                  key={flashcards[cardindex]?._id}
                  custom={slideDirection}
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                >
                  <Flashcard card={flashcards[cardindex]} onDelete={handleDelete} onEdit={handleEditStart} />
                </motion.div>
              </AnimatePresence>
            </div>

            <button
              type="button"
              aria-label="Previous"
              onClick={() => decreaseIndex(flashcards.length)}
              className="absolute left-0 top-[180px] -translate-y-1/2 w-11 h-11 rounded-full
                         bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200
                         shadow-lg ring-1 ring-black/5 dark:ring-white/10 hover:shadow-xl transition z-10"
            >
              ‹
            </button>

            <button
              type="button"
              aria-label="Next"
              onClick={() => increaseIndex(flashcards.length)}
              className="absolute right-0 top-[180px] -translate-y-1/2 w-11 h-11 rounded-full
                         bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200
                         shadow-lg ring-1 ring-black/5 dark:ring-white/10 hover:shadow-xl transition z-10"
            >
              ›
            </button>

            <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
              {cardindex + 1} / {flashcards.length}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl mt-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-10 text-center">
            <div className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-1">No cards yet</div>
            <p className="text-slate-600 dark:text-slate-400">Select or create a folder to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
