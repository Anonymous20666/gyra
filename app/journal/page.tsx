"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";

export default function JournalList() {
  const router = useRouter();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/login");

    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setEntries(data);
    setLoading(false);
  };

  const filteredEntries = entries.filter(e => 
    (e.title && e.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
    (e.content && e.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard")} className="text-zinc-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-2xl font-bold">Journal</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-zinc-400 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
          <button className="text-zinc-400 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
        </div>
      </header>

      {/* Search Bar (Optional, trigger via icon later) */}
      <div className="px-4 pt-4">
        <input 
          type="text" 
          placeholder="Search entries..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#1c1c1e] text-white rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-zinc-600"
        />
      </div>

      {/* Entries List */}
      <div className="px-4 pt-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>
        ) : filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
             <div className="w-20 h-20 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4">
               <span className="text-3xl">📓</span>
             </div>
             <h2 className="text-xl font-semibold mb-2">No Entries</h2>
             <p className="text-zinc-500 text-sm">To add an entry, tap the Plus button.</p>
          </div>
        ) : (
          <>
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Today</h3>
            {filteredEntries.map((entry) => (
              <Link key={entry.id} href={`/journal/${entry.id}`} className="block bg-[#1c1c1e] rounded-2xl p-4 border border-zinc-800 hover:border-zinc-700 transition-colors">
                {/* Media Previews */}
                {entry.images?.length > 0 && (
                  <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
                    {entry.images.map((img: string, i: number) => (
                      <img key={i} src={img} className="w-16 h-16 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
                
                {entry.title && <h2 className="text-lg font-bold text-white mb-1">{entry.title}</h2>}
                {entry.content && <p className="text-zinc-400 text-sm line-clamp-2 mb-3">{entry.content}</p>}
                
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  {entry.location_name && <span className="flex items-center gap-1">📍 {entry.location_name}</span>}
                  <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => router.push("/journal/new")}
        className="fixed bottom-8 right-6 w-14 h-14 bg-[#4f46e5] hover:bg-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-transform active:scale-95"
      >
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
      </button>
    </main>
  );
}