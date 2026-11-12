// PDF-Befund im Browser in Bilder und Text umwandeln, damit Claude ihn lesen kann.
// Die Datei verlässt dabei das Gerät nicht; erst die Seitenbilder gehen mit Einwilligung an Claude.
// pdf.js wird erst geladen, wenn wirklich ein PDF gewählt wird.

export interface PdfPages {
  images: Blob[];
  /** Text aus dem PDF, falls vorhanden (gescannte PDFs haben keinen) */
  text: string;
  /** Seiten im PDF */
  pageCount: number;
  /** davon gelesen */
  pagesRead: number;
}

const MAX_SIDE = 2400;
let workerUrl: string | null = null;

/** Wie viele Seiten gelesen werden und ob jede Seite in zwei Hälften geht (kleine Schrift bleibt so lesbar). */
export function pagePlan(pageCount: number, maxImages: number): { pages: number; split: boolean } {
  const pages = Math.max(1, Math.min(pageCount, maxImages));
  return { pages, split: pages * 2 <= maxImages };
}

const toBlob = (c: HTMLCanvasElement) => new Promise<Blob | null>((res) => c.toBlob(res, 'image/jpeg', 0.9));

export async function pdfToImages(file: Blob, maxImages: number): Promise<PdfPages> {
  const pdfjs = await import('pdfjs-dist');
  if (!workerUrl) {
    const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?raw')).default;
    workerUrl = URL.createObjectURL(new Blob([worker], { type: 'text/javascript' }));
  }
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await task.promise;
  const pageCount = doc.numPages;
  const { pages, split } = pagePlan(pageCount, maxImages);
  const images: Blob[] = [];
  const texts: string[] = [];
  try {
    for (let i = 1; i <= pages; i++) {
      const page = await doc.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min(3, MAX_SIDE / Math.max(base.width, base.height)) });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      if (split) {
        // obere und untere Hälfte, mit etwas Überlappung, damit keine Zeile zerschnitten verloren geht
        const h = Math.ceil(canvas.height * 0.54);
        for (const y of [0, canvas.height - h]) {
          const part = document.createElement('canvas');
          part.width = canvas.width;
          part.height = h;
          part.getContext('2d')!.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
          const b = await toBlob(part);
          if (b) images.push(b);
        }
      } else {
        const b = await toBlob(canvas);
        if (b) images.push(b);
      }
      const content = await page.getTextContent();
      texts.push(content.items.map((it) => ('str' in it ? it.str : '')).join(' ').replace(/\s+/g, ' ').trim());
    }
  } finally {
    await task.destroy();
  }
  return { images, text: texts.filter(Boolean).join('\n\n--- nächste Seite ---\n\n'), pageCount, pagesRead: pages };
}
