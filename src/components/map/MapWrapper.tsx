"use client";

import dynamic from "next/dynamic";

const LoadingMap = () => (
  <div className="w-full h-screen bg-[#0a0a0a] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-4 border-zinc-700 border-t-white rounded-full animate-spin" />
      <p className="text-zinc-400 text-sm">Chargement de la carte...</p>
    </div>
  </div>
);

const AtlasMap = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <LoadingMap />,
});

export default function MapWrapper() {
  return <AtlasMap />;
}
