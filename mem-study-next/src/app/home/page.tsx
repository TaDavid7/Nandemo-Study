"use client";
import React, { useState, useEffect, FormEvent } from "react";
import Flashcard from "@/components/Flashcard";
import {authfetch} from "@/lib/authfetch";

// Types
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

export default function Home() {
  // Flashcards
  const [flashcards, setFlashcards] = useState<Card[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  // Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");

  // Folders
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [newFolder, setNewFolder] = useState("");

  // Edit Folders
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderDropdownOpen, setFolderDropdownOpen] = useState<string | null>(null);

  // Index
  const [cardindex, setCardIndex] = useState(0);

  // pdf import
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Load folders
  useEffect(() => {
    authfetch(`/api/folders`)
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          console.error("Invalid folders response:", data);
          return;
        }
        setFolders(data);
    });
  }, []);

  // Load flashcards when folder changes
  useEffect(() => {
    if (!selectedFolder) {
      setFlashcards([]);
      return;
    }
    setCardIndex(0);
    authfetch(`/api/flashcards?folderId=${selectedFolder}`)
      .then((res) => res.json())
      .then((cards: Card[]) => setFlashcards(cards));
  }, [selectedFolder]);

  // Add a folder
  const handleAddFolder = (e: FormEvent) => {
    e.preventDefault();
    authfetch(`/api/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolder }),
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json();
        setNewFolder(data.error || "Could not add folder");
        return;
      }
      const folder: Folder = await res.json();
      if(!Array.isArray(folders)){
        setFolders([folder]);
      } else{
        setFolders([...folders, folder]);
      }
      setNewFolder("");
    });
  };

  // Add new flashcard
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

    authfetch(`/api/flashcards/import/pdf`, {
      method: "POST",
      body: formData, 
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to import PDF");
        }
        return res.json();
      })
      .then(async (data) => {
        const createdCount =
          data.createdCount ?? (Array.isArray(data.cards) ? data.cards.length : null);

        // Refresh flashcards from server so new cards show up
        return authfetch(`/api/flashcards?folderId=${selectedFolder}`)
          .then((res) => res.json())
          .then((cards: Card[]) => {
            setFlashcards(cards);
            setImportStatus("done");
            setImportMessage(
              createdCount != null
                ? `Imported ${createdCount} flashcard${createdCount === 1 ? "" : "s"} from PDF.`
                : "Imported flashcards from PDF."
            );
            setPdfFile(null);
          });
      })
      .catch((err: any) => {
        console.error("Import PDF error:", err);
        setImportStatus("error");
        setImportMessage(err.message || "Something went wrong while importing.");
      });
  };

  // Edit flashcard start
  const handleEditStart = (id: string, question: string, answer: string) => {
    setEditingId(id);
    setEditQuestion(question);
    setEditAnswer(answer);
  };

  // Edit submit
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
        setEditingId(null);
        setEditQuestion("");
        setEditAnswer("");
      });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditQuestion("");
    setEditAnswer("");
  };

  // Rename folder
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
        setRenamingFolderId(null);
        setNewFolderName("");
      });
  };

  // Delete a flashcard
  const handleDelete = (id: string) => {
    increaseIndex(cardindex);
    authfetch(`/api/flashcards/${id}`, { method: "DELETE" }).then(() =>
      setFlashcards(flashcards.filter((card) => card._id !== id))
    );
  };

  // Delete a folder
  const handleDeleteFolder = (id: string) => {
    if (!window.confirm("Are you sure? This will delete the folder and all its flashcards.")) return;
    authfetch(`/api/folders/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(() => {
        setFolders(folders.filter((f) => f._id !== id));
        if (selectedFolder === id) setSelectedFolder("");
        setFlashcards([]);
      });
  };

  const decreaseIndex = (length: number) => {
    if (cardindex <= 0) {
      setCardIndex(length - 1);
    } else {
      setCardIndex((l) => l - 1);
    }
  };

  const increaseIndex = (length: number) => {
    if (cardindex >= length - 1) {
      setCardIndex(0);
    } else {
      setCardIndex((l) => l + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Home</h1>
          <p className="mt-2 text-slate-600">Manage folders and study your flashcards in one place.</p>
        </div>

        {/* Controls Panel */}
        <div className="rounded-2xl shadow-md bg-white ring-1 ring-black/5 p-6 sm:p-8">
          {/* Folder select + actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700">Select folder </label>
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full sm:w-64
                                    rounded-xl border border-gray-300
                                    bg-gray-50 text-gray-700
                                    px-3 py-2
                                    focus:border-blue-500 focus:ring-2 focus:ring-blue-500
                                    outline-none
                                    appearance-none"
              >
                <option value="">-- Select --</option>
                {Array.isArray(folders) && folders.map((folder) => (
                  <option key={folder._id} value={folder._id}>
                    {folder.name}
                  </option>
                ))}
              </select>

              {/* Folder actions */}
              {selectedFolder && (
                <div className="relative">
                  <button
                    aria-label="Folder actions"
                    className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition"
                    onClick={() =>
                      setFolderDropdownOpen(folderDropdownOpen === selectedFolder ? null : selectedFolder)
                    }
                  >
                    ⋮
                  </button>
                  {folderDropdownOpen === selectedFolder && (
                    <div
                      className="absolute left-0 mt-2 z-20 min-w-[140px]
                                  rounded-xl bg-white shadow-lg ring-1 ring-black/5 p-1"
                    >
                      <button
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
                        onClick={() => {
                          setRenamingFolderId(selectedFolder);
                          setNewFolderName(folders.find((f) => f._id === selectedFolder)?.name || "");
                          setFolderDropdownOpen(null);
                        }}
                      >
                        Rename
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-rose-600"
                        onClick={() => {
                          setFolderDropdownOpen(null);
                          handleDeleteFolder(selectedFolder);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Rename Folder Form */}
          {renamingFolderId && (
            <form onSubmit={handleRenameFolder} className="mt-4 flex items-center gap-2">
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                required
                className="p-2.5 rounded-xl bg-slate-100 text-slate-800
                           focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setRenamingFolderId(null)}
                className="px-3 py-2 rounded-xl bg-slate-200 text-slate-700 font-medium hover:bg-slate-300"
              >
                Cancel
              </button>
            </form>
          )}

          {/* Add Folder */}
          <form onSubmit={handleAddFolder} className="mt-6 flex flex-col sm:flex-row gap-2">
            <input
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              placeholder="New folder name"
              required
              className="p-2.5 rounded-xl bg-slate-100 text-slate-800 placeholder-slate-400
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
            >
              Add Folder
            </button>
          </form>

          {/* Add or Edit Card */}
          {editingId ? (
            <form onSubmit={handleEditSubmit} className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
                placeholder="Edit Question"
                required
                className="p-2.5 rounded-xl bg-slate-100 text-slate-800 placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <input
                value={editAnswer}
                onChange={(e) => setEditAnswer(e.target.value)}
                placeholder="Edit Answer"
                required
                className="p-2.5 rounded-xl bg-slate-100 text-slate-800 placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleEditCancel}
                  className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-medium hover:bg-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdd} className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Question"
                required
                className="p-2.5 rounded-xl bg-slate-100 text-slate-800 placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Answer"
                required
                className="p-2.5 rounded-xl bg-slate-100 text-slate-800 placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700"
              >
                Add Card
              </button>
            </form>
          )}
          {/* Import PDF */}

          <section className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-1">
              Import notes from PDF (AI)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mb-3">
              Upload a PDF of your notes to automatically generate flashcards in the selected folder.
            </p>

            {!selectedFolder && (
              <p className="mb-3 text-xs text-rose-500">
                Select a folder above before importing a PDF.
              </p>
            )}

            <form onSubmit={handleImportPdf} className="space-y-3">
              <div>
                <input
                  type="file"
                  name="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setPdfFile(f);
                    setImportStatus("idle");
                    setImportMessage(null);
                  }}
                  className="block w-full text-xs sm:text-sm text-slate-700
                             file:mr-4 file:rounded-lg file:border-0
                             file:bg-indigo-50 file:px-3 file:py-2
                             file:text-xs sm:file:text-sm file:font-medium
                             file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {pdfFile && (
                  <p className="mt-1 text-xs text-slate-500 truncate">
                    Selected: {pdfFile.name}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!selectedFolder || !pdfFile || importStatus === "loading"}
                className="inline-flex items-center rounded-xl bg-indigo-600 px-3 sm:px-4 py-2
                           text-xs sm:text-sm font-medium text-white shadow
                           hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {importStatus === "loading" ? "Importing…" : "Import PDF to flashcards"}
              </button>

              {importMessage && (
                <p
                  className={`text-xs sm:text-sm mt-1 ${
                    importStatus === "error" ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  {importMessage}
                </p>
              )}
            </form>
          </section>
        </div>

        {/* Viewer */}
        <div className="mt-10">
          {flashcards.length > 0 ? (
            <div className="relative w-full max-w-3xl mx-auto">
              <div key={flashcards[cardindex]?._id}>
                <Flashcard
                  card={flashcards[cardindex]}
                  onDelete={handleDelete}
                  onEdit={handleEditStart}
                />
              </div>

              {/* Prev */}
              <button
                type="button"
                aria-label="Previous"
                onClick={() => decreaseIndex(flashcards.length)}
                className="absolute left-0 -translate-x-1/2 top-1/2 -translate-y-1/2
                           w-11 h-11 rounded-full bg-white shadow-lg ring-1 ring-black/5
                           hover:shadow-xl transition"
              >
                ‹
              </button>

              {/* Next */}
              <button
                type="button"
                aria-label="Next"
                onClick={() => increaseIndex(flashcards.length)}
                className="absolute right-0 translate-x-1/2 top-1/2 -translate-y-1/2
                           w-11 h-11 rounded-full bg-white shadow-lg ring-1 ring-black/5
                           hover:shadow-xl transition"
              >
                ›
              </button>

              {/* Index indicator */}
              <div className="mt-4 text-center text-sm text-slate-600">
                {cardindex + 1} / {flashcards.length}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-10 text-center">
              <div className="text-lg font-medium mb-1">No cards yet</div>
              <p className="text-slate-600">Select or Create a folder to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


