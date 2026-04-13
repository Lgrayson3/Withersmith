export type SupportedFileType = 'pdf' | 'docx' | 'txt';

export interface ParsedFile {
  text: string;
  title: string;
}

export function detectFileType(file: File): SupportedFileType | null {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'txt' || ext === 'md') return 'txt';
  return null;
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const type = detectFileType(file);
  if (!type) {
    throw new Error(`Unsupported file type: ${file.name}. Use .docx, .pdf, or .txt`);
  }

  const title = file.name.replace(/\.[^.]+$/, '');

  switch (type) {
    case 'docx':
      return { text: await parseDocx(file), title };
    case 'pdf':
      return { text: await parsePdf(file), title };
    case 'txt':
      return { text: await file.text(), title };
  }
}

async function parseDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

async function parsePdf(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');

  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .filter((item) => 'str' in item)
      .map((item) => (item as { str: string }).str)
      .join(' ');
    pages.push(text);
  }

  return pages.join('\n\n').trim();
}
