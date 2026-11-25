"use client";

import { useEffect, useRef } from "react";
import { Camera, Clock, FileText, Image as ImageIcon } from "lucide-react";

type AttachmentMenuProps = {
  open: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectPhotos: () => void;
  onSelectFiles: () => void;
  onSelectRecent: () => void;
};

export default function AttachmentMenu({
  open,
  onClose,
  onSelectCamera,
  onSelectPhotos,
  onSelectFiles,
  onSelectRecent,
}: AttachmentMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const items = [
    {
      label: "Take photo",
      hint: "Camera capture",
      icon: Camera,
      action: onSelectCamera,
    },
    {
      label: "Upload image",
      hint: "PNG, JPG, WebP",
      icon: ImageIcon,
      action: onSelectPhotos,
    },
    {
      label: "Attach document",
      hint: "PDF, DOCX, TXT, code",
      icon: FileText,
      action: onSelectFiles,
    },
    {
      label: "Recent images",
      hint: "From your library",
      icon: Clock,
      action: onSelectRecent,
    },
  ];

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Attach media or files"
      className="absolute bottom-full left-0 mb-2 w-60 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-1.5 shadow-xl z-50"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            onClick={() => {
              item.action();
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 min-h-[44px] text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B9EC2]"
          >
            <Icon className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" strokeWidth={1.75} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-tight">
                {item.label}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">
                {item.hint}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
