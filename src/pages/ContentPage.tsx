import { SiteNav } from "@/components/plotra/site-nav";
import { SiteFooter } from "@/components/plotra/site-footer";
import { PageSeo } from "@/components/Seo";
import { CtaBox, FaqList, LastUpdated, PageHeader, RichText, type Rich } from "@/components/plotra/content-blocks";
import { CONTENT_PAGES } from "@/content/pages.js";
import { faqItems } from "@/content/faq.js";
import { getPrerenderData } from "@/lib/prerender-data";

type Section = {
  h2?: string;
  p?: Rich[];
  ul?: Rich[];
  ol?: Rich[];
  table?: { head: string[]; rows: string[][] };
  map?: string;
};

type ContentPageDef = {
  eyebrow?: string;
  h1: string;
  intro: string;
  sections: Section[];
  faqIds: string[];
  cta: { title: string; text: string };
};

/** Feature, city and comparison pages — content lives in src/content/pages.js. */
export default function ContentPage({ path }: { path: string }) {
  const page = (CONTENT_PAGES as Record<string, ContentPageDef>)[path];
  if (!page) return null;
  const faqs = faqItems(getPrerenderData().plans).filter((it) => page.faqIds.includes(it.id));

  return (
    <main className="overflow-x-clip">
      <PageSeo path={path} />
      <SiteNav />
      <PageHeader eyebrow={page.eyebrow} h1={page.h1} intro={page.intro} />

      <section className="bg-background px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl space-y-12">
          {page.sections.map((s, i) => (
            <div key={s.h2 ?? i}>
              {s.h2 ? <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">{s.h2}</h2> : null}
              {s.p?.map((para, j) => (
                <p key={j} className="mt-4 text-base leading-relaxed text-foreground/80">
                  <RichText value={para} />
                </p>
              ))}
              {s.ul ? (
                <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-relaxed text-foreground/80">
                  {s.ul.map((li, j) => (
                    <li key={j}>
                      <RichText value={li} />
                    </li>
                  ))}
                </ul>
              ) : null}
              {s.ol ? (
                <ol className="mt-4 list-decimal space-y-2 pl-6 text-base leading-relaxed text-foreground/80">
                  {s.ol.map((li, j) => (
                    <li key={j}>
                      <RichText value={li} />
                    </li>
                  ))}
                </ol>
              ) : null}
              {s.table ? (
                <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
                  <table className="w-full min-w-[32rem] text-left text-sm">
                    <thead className="bg-lavender text-ink">
                      <tr>
                        {s.table.head.map((h, j) => (
                          <th key={j} scope="col" className="px-4 py-3 font-semibold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {s.table.rows.map((row, r) => (
                        <tr key={r}>
                          {row.map((cell, c) =>
                            c === 0 && s.table!.head[0] === "" ? (
                              <th key={c} scope="row" className="px-4 py-3 font-semibold text-ink">
                                {cell}
                              </th>
                            ) : (
                              <td key={c} className="px-4 py-3 text-foreground/80">
                                {cell}
                              </td>
                            ),
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              {s.map ? (
                <iframe
                  title={`Map: ${s.map}`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(s.map)}&output=embed`}
                  loading="lazy"
                  className="mt-5 h-72 w-full rounded-2xl border border-border"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : null}
            </div>
          ))}

          {faqs.length ? (
            <div>
              <h2 className="mb-5 font-display text-2xl font-bold text-ink sm:text-3xl">Common questions</h2>
              <FaqList items={faqs} />
            </div>
          ) : null}

          <CtaBox title={page.cta.title} text={page.cta.text} />
          <LastUpdated />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
