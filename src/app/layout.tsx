import type { Metadata } from "next";
import { pretendard, ySpotlight, yPairing } from "./fonts";
import { Providers } from "./providers";
import "./globals.css";

// 핵심 유입 = 인스타 스토리·카톡 공유 → 공유 카드(OG)가 곧 전환율 (domain.md §1).
// 결과 페이지(개인) 동적 OG는 추후 해당 page에서 generateMetadata로 별도 처리 (domain.md §3).
const SITE_URL = "https://looky.my";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "looky — 친구들이 본 나",
    template: "%s | looky",
  },
  description: "친구들의 설문으로 나를 찍은 인생네컷을 만들어요.",
  openGraph: {
    type: "website",
    siteName: "looky",
    title: "looky — 친구들이 본 나",
    description: "친구들의 설문으로 나를 찍은 인생네컷을 만들어요.",
    locale: "ko_KR",
    images: [
      {
        url: "/assets/og-image.png",
        width: 1200,
        height: 630,
        alt: "looky — 친구들이 본 나를 인생네컷으로",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "looky — 친구들이 본 나",
    description: "친구들의 설문으로 나를 찍은 인생네컷을 만들어요.",
    images: ["/assets/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} ${ySpotlight.variable} ${yPairing.variable} antialiased`}
    >
      {/* 모바일: 풀스크린 / 데스크탑(md:): 회색 배경 위 정중앙에 iPhone 12 Pro(390×844) 기기 프레임 */}
      <body className="bg-white text-gray-900 md:flex md:min-h-dvh md:items-center md:justify-center md:bg-gray-100">
        <div className="mx-auto h-dvh w-full overflow-y-auto bg-white md:h-[844px] md:w-[390px] md:rounded-[40px] md:shadow-2xl">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
