"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../supabase";

export default function ViewJournalEntry() {
  const params = useParams();
  const router = useRouter();
  const entryId = params.id as string;

  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    const fetchEntry = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("id", entryId)
        .single();

      if (data) {
        setEntry(data);
        setTitle(data.title || "");
        setContent(data.content || "");
      } else {
        alert("Entry not found.");
        router.push("/journal");
      }
      setLoading(false);
    };
    fetchEntry();
  }, [entryId, router]);

  const handleUpdate = async () => {
    setIsSaving(true);
    await supabase
      .from("journal_entries")
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq("id", entryId);

    setEntry({ ...entry, title, content });
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    await supabase.from("journal_entries").delete().eq("id", entryId);
    router.push("/journal");
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <main className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-black/90 backdrop-blur-md border-b border-zinc-800/50">
        <button onClick={() => router.push("/journal")} className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        
        <div className="flex items-center gap-3">
          {isEditing ? (
            <button onClick={handleUpdate} disabled={isSaving} className="px-4 py-1.5 rounded-full bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-400">
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          ) : (
            <button onClick={() => setIsEditing(true)} className="px-4 py-1.5 rounded-full bg-zinc-800 text-white text-sm font-semibold hover:bg-zinc-700">
              Edit
            </button>
          )}
          <button onClick={handleDelete} className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-red-500 hover:bg-red-500/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <p className="text-center text-xs text-zinc-500 font-medium mb-6">
          {new Date(entry.created_at).toLocaleDateString("en-US", { weekday: 'short', day: 'numeric', month: 'short' })}
        </p>

        {/* Media Attachments */}
        {entry.images?.length > 0 && !isEditing && (
          <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
            {entry.images.map((img: string, i: number) => (
              <img key={i} src={img} className="w-32 h-32 rounded-xl object-cover border border-zinc-800" />
            ))}
          </div>
        )}

        {entry.location_name && !isEditing && (
           <div className="inline-flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-1.5 text-sm border border-zinc-700 mb-6">
             <span className="text-zinc-400">📍</span> {entry.location_name}
           </div>
        )}

        {/* Title & Content */}
        {isEditing ? (
          <>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full bg-transparent text-2xl font-bold text-white placeholder:text-zinc-600 outline-none mb-4"
            />
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing..."
              className="w-full bg-transparent text-base text-zinc-300 placeholder:text-zinc-600 outline-none resize-none min-h-[300px]"
            />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-4">{entry.title || "Untitled"}</h1>
            <div 
              className="prose prose-invert max-w-none text-base text-zinc-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: entry.content || "No content." }} 
            />
          </>
        )}
      </div>
    </main>
  );
}