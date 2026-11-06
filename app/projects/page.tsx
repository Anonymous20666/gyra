"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase";
import { 
  Folder, X, Plus, Search, Anchor, Globe, Apple, Trash, Bell, 
  Box, Briefcase, Code, Coffee, Heart, Home, Zap, Sparkles, 
  Camera, Book, Check, ChevronDown, Filter, ArrowUpDown
} from "lucide-react";

// The list of icons available in the picker
const ICON_OPTIONS = [
  "Folder", "Briefcase", "Code", "Sparkles", "Zap", 
  "Book", "Heart", "Home", "Globe", "Camera"
];

const ICON_MAP: any = {
  Folder: <Folder className="w-5 h-5" />,
  Briefcase: <Briefcase className="w-5 h-5" />,
  Code: <Code className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  Zap: <Zap className="w-5 h-5" />,
  Book: <Book className="w-5 h-5" />,
  Heart: <Heart className="w-5 h-5" />,
  Home: <Home className="w-5 h-5" />,
  Globe: <Globe className="w-5 h-5" />,
  Camera: <Camera className="w-5 h-5" />,
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Folder");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/login");

    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (data) setProjects(data);
    setLoading(false);
  };

  const createProject = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from("projects").insert([{
      user_id: user.id,
      name,
      instructions,
      icon: selectedIcon
    }]).select().single();

    if (data) {
      // Navigate directly into the new project's workspace
      router.push(`/projects/${data.id}`);
    }
    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/dashboard")} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>

        {/* Filters (UI matching screenshot) */}
        {projects.length > 0 && (
          <div className="flex items-center gap-3 mb-6">
            <button className="flex items-center gap-2 bg-[#14141c] border border-zinc-800 rounded-full px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors">
              <Filter className="w-4 h-4" /> All <ChevronDown className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-2 bg-[#14141c] border border-zinc-800 rounded-full px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors">
              <ArrowUpDown className="w-4 h-4" /> Last Edited <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Empty State */}
        {projects.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-zinc-800">
              <Folder className="w-8 h-8 text-zinc-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Get started by creating a new project</h2>
            <p className="text-zinc-500 max-w-sm mb-6">Projects help you set common instructions and attach files for conversations.</p>
            <button onClick={() => setIsCreating(true)} className="bg-white text-black px-6 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:bg-zinc-200 transition-colors">
              <Plus className="w-4 h-4" /> New Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((proj) => (
              <div 
                key={proj.id} 
                onClick={() => router.push(`/projects/${proj.id}`)}
                className="bg-[#14141c] border border-zinc-800 rounded-2xl p-5 hover:border-zinc-600 transition-all cursor-pointer group hover:-translate-y-1"
              >
                <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center mb-4 text-zinc-400 group-hover:text-white transition-colors border border-zinc-800">
                  {ICON_MAP[proj.icon] || <Folder className="w-5 h-5" />}
                </div>
                <h3 className="font-semibold text-white mb-1 truncate">{proj.name}</h3>
                <p className="text-xs text-zinc-500">Modified: {new Date(proj.updated_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* CREATE PROJECT MODAL */}
      {isCreating && (
        <div className="fixed inset-0 bg-[#0a0a0f] z-50 flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 sticky top-0 bg-[#0a0a0f] z-10">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              <h2 className="text-lg font-bold">New Project</h2>
            </div>
            <button 
              onClick={createProject} 
              disabled={saving || !name.trim()}
              className="bg-white text-black px-5 py-2 rounded-full text-sm font-semibold hover:bg-zinc-200 disabled:opacity-50 transition-colors"
            >
              {saving ? "Creating..." : "Create"}
            </button>
          </div>

          <div className="max-w-2xl mx-auto w-full p-6 flex flex-col gap-6">
            
            {/* Name & Icon Input */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowIconPicker(true)}
                className="w-14 h-14 bg-zinc-900 border border-zinc-700 rounded-2xl flex items-center justify-center text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
              >
                {ICON_MAP[selectedIcon]}
              </button>
              <input 
                type="text" 
                placeholder="Project Name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-transparent border-2 border-zinc-700 focus:border-indigo-500 rounded-2xl px-4 py-3 text-lg outline-none text-white transition-colors"
              />
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Project Instructions (Optional)</label>
              <textarea 
                placeholder="Add instructions about the tone, style, and persona you want Gyra to adopt."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={5}
                className="w-full bg-[#14141c] border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-indigo-500 resize-none text-white transition-colors"
              />
            </div>

            {/* Files (UI only for now) */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Project Files</label>
              <div className="bg-[#14141c] border border-zinc-800 rounded-2xl overflow-hidden">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 border-b border-zinc-800 text-sm text-zinc-300 transition-colors">
                  <Plus className="w-4 h-4" /> Upload File
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 border-b border-zinc-800 text-sm text-zinc-300 transition-colors">
                  <div className="w-4 h-4 bg-green-500 rounded-sm" /> Add Google Drive
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 text-sm text-zinc-300 transition-colors">
                  <div className="w-4 h-4 bg-blue-500 rounded-sm" /> Add Box
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ICON PICKER MODAL */}
      {showIconPicker && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end justify-center pb-10 sm:items-center sm:pb-0">
          <div className="bg-[#1c1c1e] w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Folder className="w-5 h-5" /> Pick new icon</h3>
              <button onClick={() => setShowIconPicker(false)} className="text-zinc-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="grid grid-cols-5 gap-4">
              {ICON_OPTIONS.map((iconName) => (
                <button 
                  key={iconName}
                  onClick={() => { setSelectedIcon(iconName); setShowIconPicker(false); }}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${selectedIcon === iconName ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"}`}
                >
                  {ICON_MAP[iconName]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}