import type { MetadataRoute } from "next";

// App Router 네이티브 매니페스트 (/manifest.webmanifest 로 서빙)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "looky — 친구들이 본 나",
    short_name: "looky",
    description: "친구들의 설문으로 나를 찍은 인생네컷을 만들어요.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      // TODO(✍️): 192/512 PNG 아이콘(설치 프롬프트·maskable)으로 교체 — 디자인 에셋 확정 후
    ],
  };
}
