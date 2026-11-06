"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../supabase";
import { ArrowLeft, Plus, Clock, X, Bell, Mail } from "lucide-react";

export default function ProjectAutomations() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState("");
  const [prompt, setPrompt] = useState("");
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAutomations();
  }, [projectId]);

  const fetchAutomations = async () => {
    const { data } = await supabase.from("project_automations").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
    if (data) setAutomations(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!name.trim() || !prompt.trim()) return;
    setIsSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from("project_automations").insert([{
      project_id: projectId,
      user_id: user.id,
      name,
      schedule,
      prompt,
      notify_push: notifyPush,
      notify_email: notifyEmail
    }]).select().single();

    if (data) {
      setAutomations([data, ...automations]);
      setShowCreate(false);
      setName(""); setSchedule(""); setPrompt(""); setNotifyPush(true); setNotifyEmail(false);
    }
    setIsSaving(false);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Automations</h1>
          </div>
          <button onClick={() => setShowCreate(true)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-300">
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {automations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 bg-[#14141c] rounded-full flex items-center justify-center mb-6 border border-zinc-800">
              <Clock className="w-8 h-8 text-zinc-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Automate this project</h2>
            <p className="text-zinc-500 text-sm mb-6">Schedule recurring tasks that run in this project</p>
            <button onClick={() => setShowCreate(true)} className="bg-white text-black px-6 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:bg-zinc-200">
              <Plus className="w-4 h-4" /> New Automation
            </button>
          </div>
        ) : (
          <div className="space-y-3">
             {automations.map(auto => (
               <div key={auto.id} className="p-4 bg-[#14141c] border border-zinc-800 rounded-xl">
                 <div className="flex items-center justify-between mb-2">
                   <h3 className="font-semibold text-white">{auto.name}</h3>
                   <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">{auto.schedule || "Manual Trigger"}</span>
                 </div>
                 <p className="text-sm text-zinc-400">{auto.prompt}</p>
               </div>
             ))}
          </div>
        )}

      </div>

      {/* 🚨 CREATE AUTOMATION MODAL 🚨 */}
      {showCreate && (
        <div className="fixed inset-0 bg-[#0a0a0f] z-50 flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-zinc-800 rounded-full"><X className="w-5 h-5" /></button>
              <h2 className="text-lg font-bold">New Automation</h2>
            </div>
            <button onClick={handleCreate} disabled={isSaving || !name.trim() || !prompt.trim()} className="bg-white text-black px-5 py-2 rounded-full text-sm font-semibold hover:bg-zinc-200 disabled:opacity-50">
              {isSaving ? "Creating..." : "Create"}
            </button>
          </div>

          <div className="max-w-2xl mx-auto w-full p-6 flex flex-col gap-6">
            
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#2c2c2e] rounded-2xl flex items-center justify-center">
                <Clock className="w-8 h-8 text-zinc-300" />
              </div>
            </div>

            <input type="text" placeholder="Automation Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#14141c] border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500" />
            
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Schedule</label>
              <button onClick={() => setSchedule("Daily at 9:00 AM")} className="w-full flex items-center gap-3 px-4 py-3 bg-[#14141c] border border-dashed border-zinc-700 rounded-xl hover:border-zinc-500 text-left">
                <Plus className="w-5 h-5 text-zinc-400" />
                <span className="text-zinc-300">{schedule || "Select Schedule or Trigger"}</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Project Instructions</label>
              <textarea placeholder="Tell the agent what it should do" value={prompt} onChange={e => setPrompt(e.target.value)} rows={5} className="w-full bg-[#14141c] border border-zinc-800 rounded-xl p-4 text-sm outline-none focus:border-indigo-500 resize-none text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Notifications</label>
              <div className="bg-[#14141c] border border-zinc-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                  <div className="flex items-center gap-3 text-white"><Bell className="w-5 h-5 text-zinc-400" /> Push</div>
                  <button onClick={() => setNotifyPush(!notifyPush)} className={`w-12 h-6 rounded-full transition-colors relative ${notifyPush ? 'bg-white' : 'bg-zinc-600'}`}>
                    <div className={`w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform ${notifyPush ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 text-white"><Mail className="w-5 h-5 text-zinc-400" /> Email</div>
                  <button onClick={() => setNotifyEmail(!notifyEmail)} className={`w-12 h-6 rounded-full transition-colors relative ${notifyEmail ? 'bg-white' : 'bg-zinc-600'}`}>
                    <div className={`w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform ${notifyEmail ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}