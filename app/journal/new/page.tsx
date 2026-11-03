"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../supabase";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';

export default function NewJournalEntry() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // UI States
  const [showTextOptions, setShowTextOptions] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Location Search States
  const [isLocating, setIsLocating] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Tiptap Editor Setup
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none text-base text-zinc-300 placeholder:text-zinc-600 outline-none min-h-[300px]',
      },
    },
  });

  // Real Location Search (OpenStreetMap API)
  useEffect(() => {
    if (!locationQuery.trim() || locationQuery.length < 2) {
      setLocationResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)}&limit=6&addressdetails=1`
        );
        const data = await res.json();
        setLocationResults(data);
      } catch (error) {
        console.error("Location search failed", error);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [locationQuery]);

  // Helper to pick an icon based on the location type from the API
  const getLocationIcon = (type: string, category: string) => {
    if (type?.includes('aerodrome') || type?.includes('airport')) return '✈️';
    if (type?.includes('hotel') || type?.includes('motel')) return '🛏️';
    if (category?.includes('natural') || type?.includes('peak')) return '🏔️';
    if (category?.includes('place') || type?.includes('city') || type?.includes('state')) return '🏙️';
    return '📍'; // Default pin
  };

  // Helper to format the location title nicely
  const formatLocationName = (loc: any) => {
    const name = loc.name || loc.display_name.split(',')[0];
    const city = loc.address?.city || loc.address?.town || loc.address?.state || loc.address?.country;
    const country = loc.address?.country;

    if (city && country && name !== city) return `${name} · ${city}, ${country}`;
    if (city) return `${name} · ${city}`;
    return loc.display_name;
  };

  const handleLocationSelect = (loc: any) => {
    const shortName = loc.name || loc.display_name.split(',')[0];
    const city = loc.address?.city || loc.address?.state || loc.address?.country || "";
    
    // Format the tag at the top (e.g., "Lagos · Lagos")
    setLocation(city ? `${shortName} · ${city}` : shortName);
    
    setIsLocating(false);
    setLocationQuery("");
    setLocationResults([]);
  };

  const handleSave = async () => {
    const contentHTML = editor?.getHTML() || "";
    if (!title.trim() && !contentHTML && images.length === 0) return;
    setIsSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("journal_entries").insert([{
      user_id: user.id,
      title,
      content: contentHTML,
      images,
      audio_url: audioUrl,
      location_name: location,
    }]);

    router.push("/journal");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages = Array.from(files).map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setAudioUrl("simulated-audio-blob");
    } else {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => setIsRecording(true))
        .catch(() => alert("Microphone access denied."));
    }
  };

  return (
    <main className="h-screen bg-black text-white flex flex-col overflow-hidden relative">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-black/90 backdrop-blur-md border-b border-zinc-800/50 z-10">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        
        <div className="flex items-center gap-2 bg-zinc-900 rounded-full px-2 py-1 border border-zinc-800">
          <button onClick={() => setShowTextOptions(true)} className="px-3 py-1 font-semibold text-sm text-zinc-300 hover:text-white">Aa</button>
          <div className="w-px h-4 bg-zinc-700"></div>
          <button className="px-3 py-1 font-semibold text-sm text-zinc-300 hover:text-white">⊙</button>
          <div className="w-px h-4 bg-zinc-700"></div>
          <button onClick={() => setShowMoreOptions(true)} className="px-3 py-1 text-zinc-300 hover:text-white">•••</button>
        </div>

        <button onClick={handleSave} disabled={isSaving} className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center hover:bg-indigo-400 disabled:opacity-50">
          {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <p className="text-center text-xs text-zinc-500 font-medium mb-4">Tue, 3 Nov</p>

        {/* Attachments Row (Location, Audio, Images) */}
        <div className="flex flex-wrap gap-2 mb-6">
          {/* Location Tag */}
          {location && (
            <div className="flex items-center gap-2 bg-[#1c1c1e] rounded-lg px-3 py-1.5 text-sm border border-zinc-800">
              <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px]">📍</div>
              <span className="text-zinc-300">{location}</span>
              <button onClick={() => setLocation(null)} className="ml-1 text-zinc-500 hover:text-white">✕</button>
            </div>
          )}

          {/* Audio Tag */}
          {audioUrl && (
            <div className="w-full bg-[#1e1b4b] border border-indigo-900/50 rounded-xl p-3 flex items-center gap-3">
              <button className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </button>
              <div className="flex-1 h-8 bg-indigo-500/20 rounded-full flex items-center px-2">
                 <div className="flex items-center gap-0.5 h-full w-full opacity-60">
                    {[...Array(20)].map((_, i) => <div key={i} className="w-1 bg-indigo-400 rounded-full" style={{height: `${Math.random() * 100}%`}} />)}
                 </div>
              </div>
              <span className="text-xs text-indigo-300 font-mono">0:08</span>
              <button onClick={() => setAudioUrl(null)} className="text-indigo-400 hover:text-white">✕</button>
            </div>
          )}

          {/* Images */}
          {images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto w-full pb-2">
              {images.map((img, i) => (
                <div key={i} className="relative w-24 h-24 shrink-0">
                  <img src={img} className="w-full h-full object-cover rounded-xl" />
                  <button onClick={() => removeImage(i)} className="absolute -top-2 -right-2 w-6 h-6 bg-zinc-800 border border-zinc-600 rounded-full flex items-center justify-center text-xs hover:bg-red-500 hover:border-red-500">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Text Inputs */}
        <input 
          type="text" 
          placeholder="Title" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent text-2xl font-bold text-white placeholder:text-zinc-600 outline-none mb-4"
        />
        
        {/* Tiptap Rich Text Editor */}
        <EditorContent editor={editor} />
      </div>

      {/* Bottom Toolbar */}
      <div className="p-4 bg-black border-t border-zinc-800/50 pb-safe z-10">
        <div className="flex items-center justify-between bg-[#1c1c1e] rounded-full p-2 px-4 shadow-lg">
          <button onClick={() => setShowTextOptions(true)} className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:bg-zinc-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
          
          <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:bg-zinc-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </button>
          
          <button onClick={() => cameraInputRef.current?.click()} className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:bg-zinc-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
          
          <button onClick={toggleRecording} className={`w-10 h-10 rounded-full flex items-center justify-center ${isRecording ? "bg-red-500 text-white animate-pulse" : "text-zinc-300 hover:bg-zinc-800"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </button>
          
          {/* LOCATION BUTTON */}
          <button onClick={() => setIsLocating(true)} className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:bg-zinc-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>

          <button onClick={() => setShowMoreOptions(true)} className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:bg-zinc-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
          </button>
        </div>
      </div>

      {/* Hidden Inputs for Media */}
      <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
      <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} className="hidden" onChange={handleImageUpload} />

      {/* --- MODALS --- */}

      {/* Text Options Modal */}
      {showTextOptions && editor && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowTextOptions(false)}>
          <div className="bg-[#1c1c1e] w-full max-w-sm rounded-3xl p-5 shadow-2xl animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-5">
                <h3 className="text-white font-semibold">Text options</h3>
                <button onClick={() => setShowTextOptions(false)} className="text-zinc-500 hover:text-white">✕</button>
             </div>
             
             <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                   <div className="flex bg-[#2c2c2e] rounded-xl overflow-hidden">
                     <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-3 ${editor.isActive('bulletList') ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
                     <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-3 ${editor.isActive('orderedList') ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
                   </div>
                   <div className="flex bg-[#2c2c2e] rounded-xl overflow-hidden flex-1 justify-between">
                     <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`p-3 flex-1 ${editor.isActive({ textAlign: 'left' }) ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}`}><svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10M4 18h16" /></svg></button>
                     <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`p-3 flex-1 ${editor.isActive({ textAlign: 'center' }) ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}`}><svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
                     <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`p-3 flex-1 ${editor.isActive({ textAlign: 'right' }) ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}`}><svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <div className="flex bg-[#2c2c2e] rounded-xl overflow-hidden flex-1 justify-between">
                     <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-3 flex-1 font-bold text-lg ${editor.isActive('bold') ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}`}>B</button>
                     <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-3 flex-1 italic text-lg ${editor.isActive('italic') ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}`}>I</button>
                     <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-3 flex-1 underline text-lg ${editor.isActive('underline') ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}`}>U</button>
                     <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-3 flex-1 line-through text-lg ${editor.isActive('strike') ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}`}>S</button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* PREMIUM LOCATION SEARCH BOTTOM SHEET */}
      {isLocating && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={() => setIsLocating(false)}>
          <div 
            className="bg-[#1c1c1e] w-full max-w-md rounded-t-3xl flex flex-col h-[85vh] animate-in slide-in-from-bottom-full duration-300 ease-out" 
            onClick={e => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-zinc-700 rounded-full"></div>
            </div>

            {/* Search Input */}
            <div className="px-4 pb-4 flex items-center gap-2">
              <div className="flex-1 bg-[#2c2c2e] rounded-xl flex items-center px-3 py-2.5 border border-zinc-800 focus-within:border-zinc-600 transition-colors">
                <svg className="w-5 h-5 text-zinc-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search locations..." 
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  className="bg-transparent w-full text-white outline-none placeholder:text-zinc-500"
                />
                {locationQuery && (
                  <button onClick={() => setLocationQuery("")} className="w-5 h-5 bg-zinc-600 rounded-full flex items-center justify-center text-xs text-black">✕</button>
                )}
              </div>
              <button onClick={() => setIsLocating(false)} className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-300 hover:bg-zinc-700">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {/* Results List */}
            <div className="flex-1 overflow-y-auto px-2 pb-10">
              {isSearchingLocation ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : locationResults.length > 0 ? (
                locationResults.map((loc: any) => (
                  <button 
                    key={loc.place_id} 
                    onClick={() => handleLocationSelect(loc)} 
                    className="w-full flex items-center gap-3 p-3 hover:bg-[#2c2c2e] rounded-xl text-left transition-colors"
                  >
                     <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-lg shadow-sm">
                       {getLocationIcon(loc.type, loc.class)}
                     </div>
                     
                     <div className="flex-1 min-w-0">
                       <p className="text-white text-[15px] truncate">{formatLocationName(loc)}</p>
                       {loc.address?.suburb && (
                         <p className="text-zinc-500 text-xs truncate">{loc.address.suburb}</p>
                       )}
                     </div>
                  </button>
                ))
              ) : locationQuery.length >= 2 && !isSearchingLocation ? (
                <p className="text-center text-zinc-500 text-sm py-6">No locations found.</p>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                   <svg className="w-10 h-10 text-zinc-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                   <p className="text-zinc-500 text-sm">Type a city, country or landmark</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* More Options Modal */}
      {showMoreOptions && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onClick={() => setShowMoreOptions(false)}>
           <div className="bg-[#1c1c1e] w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              {["Entry Date", "Choose Journals", "Add Bookmark", "Remove Title", "Find in Entry"].map(opt => (
                <button key={opt} className="w-full text-left px-5 py-4 text-white hover:bg-zinc-800 border-b border-zinc-800/50">{opt}</button>
              ))}
              <button className="w-full text-left px-5 py-4 text-red-500 hover:bg-zinc-800 font-medium">Delete</button>
              <button onClick={() => setShowMoreOptions(false)} className="w-full text-center px-5 py-4 text-zinc-400 hover:bg-zinc-800 bg-zinc-900">Cancel</button>
           </div>
        </div>
      )}
    </main>
  );
}