

import LatestArticles from "@/components/home/latest-articles";
import Stories from "@/components/home/stories";

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto w-full px-4 py-6 md:px-6 lg:px-8">
      <Stories />
      <LatestArticles />
    </main>
  );
}
