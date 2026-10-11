import type { ReactNode } from "react";

// Hukuki sayfalar (Kullanım Koşulları, Gizlilik) için ortak sunum bileşenleri.
// KurallarPage ile aynı görsel dili paylaşır.

export function LegalPage({ title, intro, updated, children }: {
  title: string; intro: string; updated: string; children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
      <header className="mb-10">
        <h1 className="font-display mb-3 text-4xl font-semibold">{title}</h1>
        <p className="text-[16px] text-ink-700">{intro}</p>
        <p className="mt-3 text-[13px] text-ink-500">{updated}</p>
      </header>
      {children}
    </div>
  );
}

export function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="mb-9">
      <h2 className="font-display mb-3 flex items-baseline gap-2.5 text-2xl font-semibold">
        <span className="text-[15px] font-semibold text-clay-600">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Para({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-[15px] leading-relaxed text-ink-700">{children}</p>;
}

export function Bullets({ items }: { items: ([string, string] | string)[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((it, i) => {
        const [head, body] = Array.isArray(it) ? it : ["", it];
        return (
          <li key={i} className="flex gap-2.5 text-[15px] text-ink-700">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-moss-500" />
            <span>{head && <b className="font-semibold text-ink-900">{head} </b>}{body}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border-l-4 border-clay-500 bg-sand-100 px-4 py-3 text-[14px] text-ink-700">
      {children}
    </div>
  );
}
