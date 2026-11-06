"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../supabase";
import { ArrowLeft, Folder, Plus, Trash, FileText, Download } from "lucide-react";

export default function ProjectFiles() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles();
  }, [projectId]);

  const fetchFiles = async () => {
    const { data } = await supabase.from("project_files").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
    if (data) setFiles(data);
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);

    // 1. Upload to Supabase Storage (You need a bucket named 'project-files')
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${projectId}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file);
    
    if (!uploadError) {
      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage.from('project-files').getPublicUrl(filePath);

      // 3. Save to Database
      const { data } = await supabase.from("project_files").insert([{
        project_id: projectId,
        name: file.name,
        url: publicUrl,
        type: file.type
      }]).select().single();

      if (data) setFiles([data, ...files]);
    } else {
      alert("Upload failed. Make sure you created a 'project-files' bucket in Supabase Storage.");
    }
    setIsUploading(false);
  };

  const deleteFile = async (id: string) => {
    await supabase.from("project_files").delete().eq("id", id);
    setFiles(files.filter(f => f.id !== id));
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Files</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-300">
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" />

        {loading ? (
          <div className="text-center py-20 text-zinc-500">Loading...</div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 bg-[#14141c] rounded-2xl flex items-center justify-center mb-6 border border-zinc-800">
              <Folder className="w-8 h-8 text-zinc-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Files created during this session will appear here</h2>
            <p className="text-zinc-500 text-sm mb-6">Upload documents, PDFs, or text files to ground the AI.</p>
            <button onClick={() => fileInputRef.current?.click()} className="bg-white text-black px-6 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:bg-zinc-200">
              {isUploading ? "Uploading..." : <><Plus className="w-4 h-4" /> Upload File</>}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map(file => (
              <div key={file.id} className="flex items-center justify-between p-4 bg-[#14141c] border border-zinc-800 rounded-xl hover:border-zinc-600 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium truncate max-w-[150px]">{file.name}</p>
                    <p className="text-xs text-zinc-500">{new Date(file.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={file.url} target="_blank" rel="noreferrer" className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"><Download className="w-4 h-4" /></a>
                  <button onClick={() => deleteFile(file.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-500"><Trash className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}