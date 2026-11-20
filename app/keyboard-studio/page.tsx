import type { Metadata } from "next";
import { KeyboardSamplesClient } from "../components/keyboard-studio/KeyboardSamplesClient";

export const metadata: Metadata = {
  title: "Gyra 3D Keyboard & Gen UI Live Show Samples",
  description:
    "Interactive compact samples pairing a rotatable 3D mechanical keyboard with Gyra's zero-lag Gen UI, 2700K Relight, 720p Video, and Async Fleet snapshot stage.",
};

export default function KeyboardStudioPage() {
  return <KeyboardSamplesClient />;
}
