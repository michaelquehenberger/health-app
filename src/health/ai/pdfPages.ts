// PDF-Befund im Browser in Bilder (eine Seite = ein Bild) und Text umwandeln, damit Claude ihn lesen kann.
// Die Datei verlässt dabei das Gerät nicht; erst die Seitenbilder gehen mit Einwilligung an Claude.
// pdf.js wird erst geladen, wenn wirklich ein PDF gewählt wird.

export interface PdfPages {
  images: Blob[];
  /** Text aus dem PDF, falls vorhanden (gescannte PDFs haben keinen) */
  text: string;
  pageCount: number;
}

const MAX_SIDE = 1800;

export async function pdfToImages(file: Blob, maxPages: number): Promise<PdfPages> {
  const pdfjs = await import('pdfjs-dist');
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?raw')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([worker], { type: 'text/javascript' }));

  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await task.promise;
  const images: Blob[] = [];
  const texts: string[] = [];
  const n = Math.min(doc.numPages, maxPages);
  for (let i = 1; i <= n; i++) {
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
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.9));
    if (blob) images.push(blob);
    const content = await page.getTextContent();
    texts.push(content.items.map((it) => ('str' in it ? it.str : '')).join(' ').replace(/\s+/g, ' ').trim());
  }
  await task.destroy();
  return { images, text: texts.filter(Boolean).join('\n\n--- nächste Seite ---\n\n'), pageCount: doc.numPages };
}
