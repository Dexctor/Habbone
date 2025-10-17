from pathlib import Path
text = Path("src/app/news/[id]/page.tsx").read_text()
text = text.replace("mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-10", "mx-auto max-w-5xl space-y-10 px-6 py-12 sm:px-10 lg:px-16")
text = text.replace("rounded-2xl", "rounded-sm")
text = text.replace("rounded-xl", "rounded-sm")
text = text.replace("space-y-6 px-6 py-6 sm:px-8", "space-y-8 px-8 py-8 sm:px-12")
text = text.replace("px-6 py-5", "px-6 py-6")
Path("src/app/news/[id]/page.tsx").write_text(text)
