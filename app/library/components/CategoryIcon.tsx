"use client";

import {
  BriefcaseBusiness,
  Code2,
  GraduationCap,
  LayoutGrid,
  Microscope,
  Palette,
  PenLine,
} from "lucide-react";

type CategoryIconProps = {
  categoryId: string | null;
  className?: string;
};

export default function CategoryIcon({
  categoryId,
  className = "h-4 w-4",
}: CategoryIconProps) {
  switch (categoryId) {
    case "writing":
      return <PenLine className={className} strokeWidth={1.75} />;
    case "coding":
      return <Code2 className={className} strokeWidth={1.75} />;
    case "business":
      return <BriefcaseBusiness className={className} strokeWidth={1.75} />;
    case "learning":
      return <GraduationCap className={className} strokeWidth={1.75} />;
    case "creative":
      return <Palette className={className} strokeWidth={1.75} />;
    case "research":
      return <Microscope className={className} strokeWidth={1.75} />;
    default:
      return <LayoutGrid className={className} strokeWidth={1.75} />;
  }
}
