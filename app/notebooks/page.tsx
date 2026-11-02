"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../supabase";

export default function NotebookLibrary() {
  const [notebooks, setNotebooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Create Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const fetchNotebooks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notebooks")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (data) setNotebooks(data);
    setLoading(false);
  };

  const createNotebook = async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("notebooks")
      .insert([
        { user_id: user.id, title: newTitle, description: newDesc }
      ])
      .select()
      .single();

    if (data) {
      // Navigate immediately to the new notebook
      window.location.href = `/notebooks/${data.id}`;
    }
    setIsCreating(false);
  };

  const filteredNotebooks = notebooks.filter(nb => 
    nb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (nb.description && nb.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-[#f1f5f9] p-6 md:p-12">
      {/* Top Bar */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notebooks</h1>
          <p className="text-[#94a3b8] mt-1 text-sm">Your AI-powered research library.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search notebooks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#14141c] border border-[#1e293b] rounded-full py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#3b82f6] transition-colors"
            />
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#3b82f6] hover:bg-blue-500 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Create Notebook
          </button>
        </div>
      </div>

      {/* Notebook Grid */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-48 bg-[#14141c] rounded-2xl border border-[#1e293b] animate-pulse" />
            ))}
          </div>
        ) : filteredNotebooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-[#14141c] border border-[#1e293b] rounded-3xl flex items-center justify-center mb-6">
              <span className="text-4xl">📓</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">No notebooks yet</h2>
            <p className="text-[#94a3b8] max-w-sm mb-6">Create your first notebook to start uploading sources and chatting with your data.</p>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#3b82f6] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-blue-500 transition-colors"
            >
              Create Notebook
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredNotebooks.map((nb) => (
              <Link 
                key={nb.id} 
                href={`/notebooks/${nb.id}`}
                className="group block bg-[#14141c] border border-[#1e293b] rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#3b82f6]/50 hover:shadow-[0_10px_30px_rgba(59,130,246,0.15)] relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#1e293b] flex items-center justify-center text-xl">
                    📓
                  </div>
                  <div className="w-2 h-2 rounded-full bg-[#14b8a6] shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1 truncate">{nb.title}</h3>
                <p className="text-sm text-[#94a3b8] line-clamp-2 h-10 mb-4">{nb.description || "No description provided."}</p>
                <div className="flex items-center justify-between text-xs text-[#64748b]">
                  <span>Updated {new Date(nb.updated_at).toLocaleDateString()}</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#3b82f6]">Open →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#14141c] border border-[#1e293b] rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-6">Create Notebook</h2>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">Title</label>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="e.g., Q3 Financial Analysis" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-[#1e293b] rounded-xl px-4 py-3 text-white outline-none focus:border-[#3b82f6] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">Description (Optional)</label>
                <textarea 
                  placeholder="What is this notebook for?" 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0a0a0f] border border-[#1e293b] rounded-xl px-4 py-3 text-white outline-none focus:border-[#3b82f6] transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="px-5 py-2.5 rounded-full text-sm font-medium text-[#94a3b8] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={createNotebook}
                disabled={!newTitle.trim() || isCreating}
                className="bg-[#3b82f6] hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : "Create Notebook"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}