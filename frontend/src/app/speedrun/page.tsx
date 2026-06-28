"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Speedrun, {FlashcardType} from "@/components/speedrun"
import {authfetch} from "@/lib/authfetch";


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

export default function QuizPage() {
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState<string>("");
  const [gameReady, setGameReady] = useState<boolean>(false);


  useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("No token, redirecting...");
    router.push("/account");
    return;
  }

  authfetch("/api/folders")
    .then(async (res) => {
      const text = await res.text();
      console.log("🔍 Raw /api/folders response text:", text);

      try {
        const data = JSON.parse(text);
        if (!Array.isArray(data)) {
          console.error("Invalid folders response:", data);
          return;
        }
        setFolders(data);
      } catch (err) {
        console.error("Failed to parse folders response as JSON", err);
      }
    });
}, []);
  
  
  //check if there are folders
  useEffect(() => {
    if (!folders) {
      setFlashcards([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    authfetch(`/api/flashcards?folderId=${selectedFolder}`)
      .then(res => res.json())
      .then((cards: FlashcardType[]) => {
        setFlashcards(cards);
        setLoading(false);
      });
  }, [selectedFolder]);

  const exitingQuizGame = () => {
    setSelectedFolder("");
    router.push("/home");
  }

  const isDisabled = !selectedFolder || !time || selectedFolder.length<=5;

  if (loading) {
    return <div className="p-6">Loading quiz...</div>;
  }

  return (
    <div>
      {!gameReady ? (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
            
            {/* Hero */}
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Speedrun</h1>
              <p className="mt-2 text-slate-600">A fast-paced game where you try to answer as many questions as possible. 
                Each card presents a question, and you type in your answer before moving to the next one. 
                The deck randomizes and recycles.</p>
            </div>

            <div className="rounded-2xl shadow-md bg-white ring-1 ring-black/5 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Select Folder ({'>'} 4 cards) </label>
                    <>
                      <select
                        value={selectedFolder}
                        onChange={e => setSelectedFolder(e.target.value)}
                        className="w-full sm:w-64
                                    rounded-xl border border-gray-300
                                    bg-gray-50 text-gray-700
                                    px-3 py-2
                                    focus:border-blue-500 focus:ring-2 focus:ring-blue-500
                                    outline-none
                                    appearance-none"
                      >
                      <option value="">-- Select --</option>
                      {Array.isArray(folders) && folders.map(folder => (
                        <option key={folder._id} value={folder._id}>{folder.name}</option>
                      ))}
                      </select> 
                    </>
                  </div>
                  
                </div>
              </div>

              {/* Input time value */}
              <div>
                <input 
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  placeholder="Type time in seconds"
                  className="mt-6 flex flex-col sm:flex-row gap-2 w-50 px-3 py-1 border-2 border-gray-300 rounded-lg 
                    text-m bg-gray-50 outline-none transition duration-300
                    focus:border-blue-500 focus:shadow-md placeholder-gray-400 italic"
                    autoFocus
                /> 
              </div>
              
              {/* Buttons */}
              <div>
                <button
                  className = "bg-blue-400 rounded-2xl text-white px-4 py-2 rounded hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled = {isDisabled}
                  onClick={() => {setGameReady(true)}} style={{ marginTop: "1rem" }}> Start
                </button> &nbsp; &nbsp;

                <button
                  className = "bg-red-400 rounded-2xl text-white px-4 py-2 rounded hover:bg-red-600 transition" 
                  onClick={exitingQuizGame} style={{ marginTop: "1rem" }}> Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      ): 
        (<Speedrun
          flashcards={flashcards}
          time = {time}
          onQuit={exitingQuizGame}
        />)}
    </div>
  );
}
