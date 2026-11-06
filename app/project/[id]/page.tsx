"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../supabase" // 🚨 Fixed path to go up 3 levels
import { Folder, Loader2 } from "lucide-react";

export default function SharedProjectView() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (data) {
        setProject(data);
      }
      setLoading(false);
    };
    fetchProject();
  }, [projectId]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  );

  if (!project) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      Project not found or is private.
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
            <Folder className="w-6 h-6 text-zinc-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-sm text-zinc-500">Shared Project</p>
          </div>
        </div>

        <div className="bg-[#14141c] border border-zinc-800 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Clone this project to chat</h2>
          <p className="text-zinc-400 mb-6 max-w-md mx-auto">
            This project was shared with you. You can view its details and instructions, but to start chatting, you need to clone it to your own account.
          </p>
          <button 
            onClick={() => {
              // Logic to clone the project to the current user
              alert("Clone functionality coming soon!");
            }}
            className="bg-white text-black px-6 py-2.5 rounded-full font-semibold hover:bg-zinc-200"
          >
            Clone Project
          </button>
        </div>

      </div>
    </main>
  );
}