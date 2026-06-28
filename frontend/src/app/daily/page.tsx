"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {authfetch} from "@/lib/authfetch";
import DailyPractice from "@/components/DailyPractice";

type Folder = {
  _id: string;
  name: string;
  schedule: boolean;
};

export default function daily(){
    const [folders, setFolders] = useState<Folder[]>([]);
    const [folderView, setFolderView] = useState<boolean>(false);
    const [gameReady, setGameReady]= useState<boolean>(false);

    useEffect(() => {
        authfetch("/api/folders")
            .then(res => res.json())
            .then((data) => {
                if (!Array.isArray(data)) {
                    console.error("Invalid folders response:", data);
                    return;
                }
            setFolders(data);
            })
    }, []);

     const handleToggle = async (id: string, currentValue: boolean) => {
        setFolders((prev) => prev.map((f) => 
            (f._id === id ? { ...f, schedule: !currentValue } : f))
        )
        try {
            const res = await authfetch(`/api/folders/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ schedule: !currentValue }),
            });

            if (!res.ok) {
            const body = await res.text();
            console.error("PATCH /api/folders/:id failed", res.status, body);
            setFolders(prev =>
                prev.map(f => (f._id === id ? { ...f, schedule: currentValue } : f))
            );
            return;
            }

            const updated = await res.json();
            setFolders(prev => prev.map(f => (f._id === id ? updated : f)));
        } catch (e) {
            console.error("Network/other error:", e);
            setFolders(prev =>
            prev.map(f => (f._id === id ? { ...f, schedule: currentValue } : f))
            );
        }
    };

    return(
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {!gameReady ? (
            <div>
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
                {/* Hero */}
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Daily</h1>
                    <p className="mt-2 text-slate-600">Select folders you want daily practice in.</p>
                </div>
                <button
                    type="button"
                    onClick={() => setFolderView((v) => !v)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
                    >
                    Select Folders
                </button> &nbsp; &nbsp;
                <button
                    type="button"
                    onClick = {() => setGameReady(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700"
                >
                    Start
                </button>
                {Array.isArray(folders) &&
                folders
                    .slice() // avoid mutating original state
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((folder) => (
                    <div key={folder._id} className="flex items-center gap-3">
                        <span>{folder.name}</span>
                        <input
                        type="checkbox"
                        checked={!!folder.schedule}
                        onChange={() => handleToggle(folder._id, !!folder.schedule)}
                        className="w-4 h-4 accent-indigo-500"
                        />
                    </div>
                    ))}

                </div>

            </div>) 
            
            : (<div>
                <DailyPractice></DailyPractice>
            </div>)}
            
        </div>
    )
};