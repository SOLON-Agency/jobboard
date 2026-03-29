import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SOURCES = [
  {
    name: "Baroul Bucuresti",
    url: "https://www.baroul-bucuresti.ro/anunturi",
    parser: parseBaroulBucuresti,
  },
  {
    name: "Cariere Juridice",
    url: "https://cariere.juridice.ro",
    parser: parseCarierJuridice,
  },
  {
    name: "Wolf Theiss",
    url: "https://www.wolftheiss.com/your-career/job-openings/",
    parser: parseWolfTheiss,
  },
];

interface ScrapedJob {
  title: string;
  description: string;
  location: string;
  source_url: string;
  company_name: string;
}

async function hashString(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function fetchPage(url: string): Promise<string> {
  const resp = await fetch(url, {
    headers: { "User-Agent": "LegalJobs-Scraper/1.0" },
  });
  return resp.text();
}

function extractText(html: string, startTag: string, endTag: string): string[] {
  const results: string[] = [];
  let pos = 0;
  while (true) {
    const start = html.indexOf(startTag, pos);
    if (start === -1) break;
    const contentStart = start + startTag.length;
    const end = html.indexOf(endTag, contentStart);
    if (end === -1) break;
    results.push(html.slice(contentStart, end).replace(/<[^>]*>/g, "").trim());
    pos = end + endTag.length;
  }
  return results;
}

async function parseBaroulBucuresti(): Promise<ScrapedJob[]> {
  try {
    const html = await fetchPage("https://www.baroul-bucuresti.ro/anunturi");
    const titles = extractText(html, '<h3 class="entry-title">', "</h3>");
    return titles.slice(0, 10).map((title) => ({
      title,
      description: `Listing from Baroul Bucuresti: ${title}`,
      location: "Bucharest, Romania",
      source_url: "https://www.baroul-bucuresti.ro/anunturi",
      company_name: "Baroul Bucuresti",
    }));
  } catch {
    return [];
  }
}

async function parseCarierJuridice(): Promise<ScrapedJob[]> {
  try {
    const html = await fetchPage("https://cariere.juridice.ro");
    const titles = extractText(html, '<h2 class="entry-title">', "</h2>");
    return titles.slice(0, 10).map((title) => ({
      title,
      description: `Legal position: ${title}`,
      location: "Romania",
      source_url: "https://cariere.juridice.ro",
      company_name: "Cariere Juridice",
    }));
  } catch {
    return [];
  }
}

async function parseWolfTheiss(): Promise<ScrapedJob[]> {
  try {
    const html = await fetchPage(
      "https://www.wolftheiss.com/your-career/job-openings/"
    );
    const titles = extractText(html, '<h3 class="title">', "</h3>");
    return titles.slice(0, 10).map((title) => ({
      title,
      description: `Position at Wolf Theiss: ${title}`,
      location: "Multiple locations",
      source_url: "https://www.wolftheiss.com/your-career/job-openings/",
      company_name: "Wolf Theiss",
    }));
  } catch {
    return [];
  }
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let totalInserted = 0;

  for (const source of SOURCES) {
    try {
      const jobs = await source.parser();

      for (const job of jobs) {
        const sourceHash = await hashString(`${job.source_url}|${job.title}`);

        const { data: existing } = await supabase
          .from("job_listings")
          .select("id")
          .eq("source_hash", sourceHash)
          .single();

        if (existing) continue;

        let companyId: string;
        const { data: existingCompany } = await supabase
          .from("companies")
          .select("id")
          .eq("name", job.company_name)
          .single();

        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          const { data: newCompany } = await supabase
            .from("companies")
            .insert({
              name: job.company_name,
              slug: slugify(job.company_name),
              location: job.location,
            })
            .select("id")
            .single();
          companyId = newCompany!.id;
        }

        const slug = `${slugify(job.title)}-${Date.now().toString(36)}`;
        await supabase.from("job_listings").insert({
          company_id: companyId,
          title: job.title,
          slug,
          description: job.description,
          location: job.location,
          status: "published",
          is_external: true,
          source_url: job.source_url,
          source_hash: sourceHash,
          published_at: new Date().toISOString(),
        });

        totalInserted++;
      }
    } catch (err) {
      console.error(`Error scraping ${source.name}:`, err);
    }
  }

  return new Response(
    JSON.stringify({ success: true, inserted: totalInserted }),
    { headers: { "Content-Type": "application/json" } }
  );
});
