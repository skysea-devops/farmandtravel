import type { ReactNode } from "react";

// Hafif, bağımlılıksız markdown render — blog gövdesi için. Güvenli (dangerouslySetInnerHTML
// yok): metin React elemanlarına çevrilir. Desteklenen: # ## ### başlık, **kalın**, *italik*,
// `kod`, [link](url), ![alt](url) görsel, - / 1. listeler, > alıntı, --- ayraç, paragraf.

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  // Sıra önemli: görsel/link, sonra kalın, italik, kod.
  const re = /(!?\[[^\]]*\]\([^)]+\))|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(`[^`]+`)/g;
  let last = 0; let m: RegExpExecArray | null; let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${keyBase}-${i++}`;
    if (tok.startsWith("![")) {
      const mm = /!\[([^\]]*)\]\(([^)]+)\)/.exec(tok)!;
      out.push(<img key={k} src={mm[2]} alt={mm[1]} className="my-4 w-full rounded-[var(--radius-lg)]" />);
    } else if (tok.startsWith("[")) {
      const mm = /\[([^\]]*)\]\(([^)]+)\)/.exec(tok)!;
      out.push(<a key={k} href={mm[2]} target="_blank" rel="noreferrer" className="text-forest-600 underline">{mm[1]}</a>);
    } else if (tok.startsWith("**")) {
      out.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("*")) {
      out.push(<em key={k}>{tok.slice(1, -1)}</em>);
    } else if (tok.startsWith("`")) {
      out.push(<code key={k} className="rounded bg-sand-100 px-1 py-0.5 text-[0.9em]">{tok.slice(1, -1)}</code>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text }: { text: string }) {
  const lines = (text ?? "").replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0; let key = 0;
  const cls = "text-[16px] leading-relaxed text-ink-700";
  while (i < lines.length) {
    let line = lines[i];
    if (!line.trim()) { i++; continue; }
    // Görsel (tek başına)
    const img = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/.exec(line);
    if (img) { blocks.push(<img key={key++} src={img[2]} alt={img[1]} className="my-6 w-full rounded-[var(--radius-lg)]" />); i++; continue; }
    // Ayraç
    if (/^---+\s*$/.test(line)) { blocks.push(<hr key={key++} className="my-8 border-border" />); i++; continue; }
    // Başlıklar
    if (line.startsWith("### ")) { blocks.push(<h3 key={key++} className="font-display mt-6 mb-2 text-xl font-semibold text-ink-900">{inline(line.slice(4), `h${key}`)}</h3>); i++; continue; }
    if (line.startsWith("## ")) { blocks.push(<h2 key={key++} className="font-display mt-8 mb-3 text-2xl font-semibold text-ink-900">{inline(line.slice(3), `h${key}`)}</h2>); i++; continue; }
    if (line.startsWith("# ")) { blocks.push(<h2 key={key++} className="font-display mt-8 mb-3 text-3xl font-semibold text-ink-900">{inline(line.slice(2), `h${key}`)}</h2>); i++; continue; }
    // Alıntı
    if (line.startsWith("> ")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) { buf.push(lines[i].slice(2)); i++; }
      blocks.push(<blockquote key={key++} className="my-4 border-l-4 border-forest-500 bg-offer-bg px-4 py-2 italic text-ink-700">{inline(buf.join(" "), `q${key}`)}</blockquote>);
      continue;
    }
    // Sırasız liste
    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) { items.push(lines[i].replace(/^[-*] /, "")); i++; }
      blocks.push(<ul key={key++} className="my-3 ml-5 list-disc space-y-1.5">{items.map((it, j) => <li key={j} className={cls}>{inline(it, `ul${key}-${j}`)}</li>)}</ul>);
      continue;
    }
    // Sıralı liste
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(lines[i].replace(/^\d+\. /, "")); i++; }
      blocks.push(<ol key={key++} className="my-3 ml-5 list-decimal space-y-1.5">{items.map((it, j) => <li key={j} className={cls}>{inline(it, `ol${key}-${j}`)}</li>)}</ol>);
      continue;
    }
    // Paragraf (ardışık metin satırlarını birleştir)
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3} |> |[-*] |\d+\. |---+\s*$|!\[)/.test(lines[i])) { buf.push(lines[i]); i++; }
    blocks.push(<p key={key++} className={`my-3 ${cls}`}>{inline(buf.join(" "), `p${key}`)}</p>);
    line = ""; // tüketildi
  }
  return <div>{blocks}</div>;
}
