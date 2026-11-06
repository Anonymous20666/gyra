"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../supabase";
import { 
  Folder, MoreHorizontal, ArrowLeft, Plus, 
  FolderOpen, Zap, Share2, Edit, Copy, Trash, X, Check, Loader2,
  ChevronDown 
} from "lucide-react";

export default function ProjectWorkspace() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showMenu, setShowMenu] = useState(false);
  const [activeModal, setActiveModal] = useState<"share" | "edit" | "delete" | null>(null);
  
  // Share Modal State
  const [isPublic, setIsPublic] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitedUsers, setInvitedUsers] = useState<any[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const [activeRoleMenu, setActiveRoleMenu] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/login");

    const { data: proj } = await supabase.from("projects").select("*").eq("id", projectId).single();
    if (!proj) return router.push("/projects");
    
    setProject(proj);
    setIsPublic(proj.is_public || false);

    const { data: chatData } = await supabase.from("chats").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
    if (chatData) setChats(chatData);

    const { data: accessData } = await supabase.from("project_access").select("*").eq("project_id", projectId);
    if (accessData) setInvitedUsers(accessData);

    setLoading(false);
  };

  const handleDeleteProject = async () => {
    await supabase.from("projects").delete().eq("id", projectId);
    router.push("/projects");
  };

  const handleCloneProject = async () => {
    alert("Clone project coming soon!");
  };

  const handleShareToggle = async () => {
    const newVal = !isPublic;
    setIsPublic(newVal);
    await supabase.from("projects").update({ is_public: newVal }).eq("id", projectId);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) return;
    setIsInviting(true);

    const { data } = await supabase.from("project_access").insert([{
      project_id: projectId,
      email: inviteEmail,
      role: "viewer"
    }]).select().single();

    if (data) {
      setInvitedUsers([...invitedUsers, data]);
      
      try {
        await fetch("/api/send-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email: inviteEmail, 
            projectName: project.name, 
            projectId: projectId 
          }),
        });
      } catch (err) {
        console.error("Failed to send email", err);
      }

      setInviteEmail("");
    }
    setIsInviting(false);
  };

  const updateUserRole = async (id: string, newRole: string) => {
    if (newRole === "remove") {
      await supabase.from("project_access").delete().eq("id", id);
      setInvitedUsers(invitedUsers.filter(u => u.id !== id));
    } else {
      await supabase.from("project_access").update({ role: newRole }).eq("id", id);
      setInvitedUsers(invitedUsers.map(u => u.id === id ? { ...u, role: newRole } : u));
    }
    setActiveRoleMenu(null);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/projects")} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                <Folder className="w-5 h-5 text-zinc-300" />
              </div>
              <h1 className="text-xl font-bold">{project.name}</h1>
            </div>
          </div>

          {/* 3-Dot Menu */}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
              <MoreHorizontal className="w-6 h-6 text-zinc-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-12 w-56 bg-[#1c1c1e] border border-zinc-800 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95">
                <button onClick={() => { router.push(`/projects/${projectId}/files`); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 text-sm text-zinc-300">
                  <FolderOpen className="w-4 h-4" /> Project Files
                </button>
                <button onClick={() => { router.push(`/projects/${projectId}/automations`); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 text-sm text-zinc-300">
                  <Zap className="w-4 h-4" /> Automations
                </button>
                <button onClick={() => { setActiveModal("share"); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 text-sm text-zinc-300">
                  <Share2 className="w-4 h-4" /> Share Project
                </button>
                <button onClick={() => { setActiveModal("edit"); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 text-sm text-zinc-300">
                  <Edit className="w-4 h-4" /> Edit Project
                </button>
                <button onClick={handleCloneProject} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 text-sm text-zinc-300">
                  <Copy className="w-4 h-4" /> Clone Project
                </button>
                <div className="h-px bg-zinc-800 my-1"></div>
                <button onClick={() => { setActiveModal("delete"); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 text-sm text-red-500">
                  <Trash className="w-4 h-4" /> Delete Project
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chat List */}
        <div className="space-y-2 mb-20">
          {chats.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              <p>No conversations yet in this project.</p>
            </div>
          ) : (
            chats.map((chat) => (
              <div key={chat.id} onClick={() => router.push(`/dashboard?projectId=${projectId}&chat=${chat.id}`)} className="flex items-center justify-between p-4 bg-[#14141c] border border-zinc-800 rounded-xl hover:border-zinc-600 cursor-pointer transition-colors group">
                <div>
                  <h3 className="text-white font-medium">{chat.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1">{new Date(chat.created_at).toLocaleString()}</p>
                </div>
                <MoreHorizontal className="w-5 h-5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))
          )}
        </div>

        {/* Floating New Chat Button */}
        <button onClick={() => router.push(`/dashboard?projectId=${projectId}`)} className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-lg transition-transform active:scale-95">
          <Plus className="w-5 h-5" /> New Chat
        </button>

      </div>

      {/* EDIT PROJECT MODAL */}
      {activeModal === "edit" && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 sm:p-6" onClick={() => setActiveModal(null)}>
          <div className="bg-[#1c1c1e] w-full max-w-lg rounded-3xl p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Edit Project</h2>
              <button onClick={() => setActiveModal(null)} className="text-zinc-500 hover:text-white"><X className="w-6 h-6" /></button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center text-zinc-300">
                  <Folder className="w-5 h-5" />
                </div>
                <input type="text" value={project.name} onChange={(e) => setProject({...project, name: e.target.value})} className="flex-1 bg-transparent border-2 border-zinc-700 focus:border-indigo-500 rounded-2xl px-4 py-3 text-lg outline-none text-white transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Project Instructions (Optional)</label>
                <textarea value={project.instructions || ""} onChange={(e) => setProject({...project, instructions: e.target.value})} rows={4} className="w-full bg-[#14141c] border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-indigo-500 resize-none text-white" />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Project Files</label>
                <div className="bg-[#14141c] border border-zinc-800 rounded-2xl overflow-hidden">
                  <button onClick={() => router.push(`/projects/${projectId}/files`)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800 border-b border-zinc-800 text-sm text-zinc-300">
                    <div className="flex items-center gap-3"><FolderOpen className="w-4 h-4" /> Manage Files</div>
                    <ChevronDown className="w-4 h-4 -rotate-90" />
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 border-b border-zinc-800 text-sm text-zinc-300">
                    <Plus className="w-4 h-4" /> Upload File
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setActiveModal(null)} className="px-5 py-2.5 rounded-full text-sm font-medium text-zinc-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={async () => {
                await supabase.from("projects").update({ name: project.name, instructions: project.instructions }).eq("id", projectId);
                setActiveModal(null);
              }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE PROJECT MODAL */}
      {activeModal === "share" && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center sm:items-center p-0 sm:p-6" onClick={() => setActiveModal(null)}>
          <div className="bg-[#1c1c1e] w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 animate-in slide-in-from-bottom-full sm:zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-4 sm:hidden"><div className="w-12 h-1.5 bg-zinc-700 rounded-full"></div></div>
            
            <h2 className="text-xl font-bold text-center mb-2">Share Project</h2>
            <p className="text-sm text-zinc-400 text-center mb-6">People with the link can view this project's conversations, instructions, and files, and can clone it.</p>
            
            <div className="flex items-center justify-between mb-6 bg-[#2c2c2e] p-3 rounded-xl border border-zinc-800">
              <span className="text-sm font-medium text-white">Anyone with the link can view</span>
              <button onClick={handleShareToggle} className={`w-12 h-6 rounded-full transition-colors relative ${isPublic ? 'bg-white' : 'bg-zinc-600'}`}>
                <div className={`w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {isPublic && (
              <div className="flex gap-4 mb-6">
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/project/${projectId}`); alert("Link Copied!"); }} className="flex-1 flex flex-col items-center gap-2 p-3 bg-[#2c2c2e] rounded-xl hover:bg-zinc-700 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center"><Copy className="w-5 h-5 text-zinc-300" /></div>
                  <span className="text-sm text-zinc-300">Copy Link</span>
                </button>
                <button onClick={() => navigator.share({ url: `${window.location.origin}/project/${projectId}` })} className="flex-1 flex flex-col items-center gap-2 p-3 bg-[#2c2c2e] rounded-xl hover:bg-zinc-700 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center"><Share2 className="w-5 h-5 text-zinc-300" /></div>
                  <span className="text-sm text-zinc-300">Send Link</span>
                </button>
              </div>
            )}

            <div className="flex gap-2 mb-6">
              <input type="email" placeholder="Invite by email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="flex-1 bg-[#2c2c2e] border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500" />
              <button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-3 rounded-xl text-sm font-medium disabled:opacity-50">
                {isInviting ? "Inviting..." : "Invite"}
              </button>
            </div>

            {invitedUsers.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">People with access</p>
                <div className="space-y-3">
                  {invitedUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">{user.email[0].toUpperCase()}</div>
                        <span className="text-sm text-white">{user.email}</span>
                      </div>
                      <div className="relative">
                        <button onClick={() => setActiveRoleMenu(activeRoleMenu === user.id ? null : user.id)} className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
                          {user.role === 'viewer' ? 'Viewer' : 'Editor'} <ChevronDown className="w-4 h-4" />
                        </button>
                        {activeRoleMenu === user.id && (
                          <div className="absolute right-0 top-8 w-40 bg-[#2c2c2e] border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
                            <button onClick={() => updateUserRole(user.id, "viewer")} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700">Viewer</button>
                            <button onClick={() => updateUserRole(user.id, "editor")} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700">Editor</button>
                            <button onClick={() => updateUserRole(user.id, "remove")} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-zinc-700">Remove access</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white sm:hidden"><X className="w-6 h-6" /></button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {activeModal === "delete" && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onClick={() => setActiveModal(null)}>
          <div className="bg-[#1c1c1e] w-full max-w-sm rounded-3xl p-6 text-center animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="w-12() h-12 rounded-full bg-red {
-500/10 flex items-center justify -center mx-auto mb-4 const"><Trash className="w params-6 h-6 text-red-500" /></div>
            <h2 className="text-xl font-bold mb-2">Delete Project?</h2>
            <p className="text-sm text-zinc-400 mb-6">This will permanently delete the project and all its conversations. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setActiveModal(null)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-medium">Cancel</button>
              <button onClick={handleDeleteProject} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}