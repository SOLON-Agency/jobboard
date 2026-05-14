/**
 * Notification template registry.
 *
 * Each template exports:
 *   buildEmail(data)  → { subject: string, html: string }
 *   buildShort(data)  → string  (used for browser push body and SMS)
 *   buildInApp(data)  → { title: string, body: string | null, data: Record<string,unknown> }
 *
 * The `data` object is whatever the dispatcher caller passes in the `data` field.
 */

import {
  buildEmail as _buildEmail,
  detailRow,
  infoTable,
} from "../email-templates.ts";

type EmailResult = { subject: string; html: string };
type InAppResult = { title: string; body: string | null; data: Record<string, unknown> };

// deno-lint-ignore no-explicit-any
type D = Record<string, any>;

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const SITE_URL_FALLBACK = "https://legaljobs.ro";

// ─── account_created ─────────────────────────────────────────────────────────

export const account_created = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const name = esc(d.full_name ?? "");
    const subject = "Bun venit pe LegalJobs!";
    const html = _buildEmail({
      heading: "Bun venit pe LegalJobs!",
      preheader: "Contul tău a fost creat cu succes.",
      bodyHtml: `<p>Salut${name ? ` <strong>${name}</strong>` : ""},</p>
        <p>Contul tău a fost creat cu succes. Poți acum să îți completezi profilul și să aplici la anunțuri de muncă.</p>`,
      ctaUrl: `${siteUrl}/dashboard`,
      ctaLabel: "Accesează panoul de control",
      siteUrl,
    });
    return { subject, html };
  },
  buildShort(d: D): string {
    return `Bun venit${d.full_name ? `, ${d.full_name}` : ""}! Contul tău pe LegalJobs a fost creat.`;
  },
  buildInApp(d: D): InAppResult {
    return {
      title: "Bun venit pe LegalJobs!",
      body: "Contul tău a fost creat cu succes.",
      data: d,
    };
  },
};

// ─── account_deletion_scheduled ──────────────────────────────────────────────

export const account_deletion_scheduled = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const deletionDate = esc(d.deletion_date ?? "");
    const subject = "Contul tău este programat pentru ștergere";
    const html = _buildEmail({
      heading: "Contul tău este programat pentru ștergere",
      preheader: `Contul va fi șters la ${deletionDate}.`,
      bodyHtml: `<p>Salut,</p>
        <p>Am primit o cerere de ștergere a contului tău. Contul va fi șters definitiv la <strong>${deletionDate}</strong>.</p>
        <p>Dacă nu ai solicitat ștergerea contului, te rugăm să contactezi echipa de suport imediat.</p>`,
      ctaUrl: `${siteUrl}/dashboard/profile`,
      ctaLabel: "Accesează profilul",
      siteUrl,
    });
    return { subject, html };
  },
  buildShort(d: D): string {
    return `Contul tău va fi șters la ${d.deletion_date ?? "data programată"}.`;
  },
  buildInApp(d: D): InAppResult {
    return {
      title: "Cont programat pentru ștergere",
      body: `Contul va fi șters la ${d.deletion_date ?? "data programată"}.`,
      data: d,
    };
  },
};

// ─── password_reset_ok ────────────────────────────────────────────────────────

export const password_reset_ok = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const subject = "Parola ta a fost resetată cu succes";
    const html = _buildEmail({
      heading: "Parolă resetată cu succes",
      preheader: "Parola contului tău a fost modificată.",
      bodyHtml: `<p>Salut,</p>
        <p>Parola contului tău a fost resetată cu succes. Dacă nu ai efectuat această modificare, te rugăm să contactezi echipa de suport imediat.</p>`,
      ctaUrl: `${siteUrl}/dashboard`,
      ctaLabel: "Accesează contul",
      siteUrl,
    });
    return { subject, html };
  },
  buildShort(_d: D): string {
    return "Parola ta a fost resetată cu succes.";
  },
  buildInApp(d: D): InAppResult {
    return {
      title: "Parolă resetată cu succes",
      body: "Parola contului tău a fost modificată.",
      data: d,
    };
  },
};

// ─── profile_updated ─────────────────────────────────────────────────────────

export const profile_updated = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const subject = "Profilul tău a fost actualizat";
    const html = _buildEmail({
      heading: "Profil actualizat",
      preheader: "Modificările profilului tău au fost salvate.",
      bodyHtml: `<p>Salut,</p><p>Profilul tău pe LegalJobs a fost actualizat cu succes.</p>`,
      ctaUrl: `${siteUrl}/dashboard/profile`,
      ctaLabel: "Vezi profilul",
      siteUrl,
    });
    return { subject, html };
  },
  buildShort(_d: D): string {
    return "Profilul tău a fost actualizat cu succes.";
  },
  buildInApp(d: D): InAppResult {
    return { title: "Profil actualizat", body: "Modificările au fost salvate.", data: d };
  },
};

// ─── daily_digest ─────────────────────────────────────────────────────────────

export const daily_digest = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const subject = "Rezumatul tău zilnic — LegalJobs";
    const globalRows = [
      d.new_jobs != null ? detailRow("Anunțuri noi", String(d.new_jobs)) : "",
      d.new_companies != null ? detailRow("Companii noi", String(d.new_companies)) : "",
      d.new_candidates != null ? detailRow("Candidați noi", String(d.new_candidates)) : "",
    ].filter(Boolean).join("");

    const myRows = [
      d.my_jobs != null ? detailRow("Anunțurile mele", String(d.my_jobs)) : "",
      d.my_applications != null ? detailRow("Candidaturile mele", String(d.my_applications)) : "",
      d.my_new_candidates != null ? detailRow("Candidați noi la anunțurile mele", String(d.my_new_candidates)) : "",
    ].filter(Boolean).join("");

    const html = _buildEmail({
      heading: "Rezumat zilnic",
      preheader: "Activitatea de ieri pe LegalJobs.",
      bodyHtml: `
        <p>Salut,</p>
        <p>Iată un sumar al activității de ieri pe platformă:</p>
        ${globalRows ? `<h3 style="margin:16px 0 8px;font-size:15px;">Activitate globală</h3>${infoTable(globalRows)}` : ""}
        ${myRows ? `<h3 style="margin:16px 0 8px;font-size:15px;">Activitatea ta</h3>${infoTable(myRows)}` : ""}
      `,
      ctaUrl: `${siteUrl}/dashboard`,
      ctaLabel: "Accesează panoul de control",
      siteUrl,
    });
    return { subject, html };
  },
  buildShort(d: D): string {
    return `Rezumat zilnic: ${d.new_jobs ?? 0} anunțuri noi, ${d.new_companies ?? 0} companii noi.`;
  },
  buildInApp(d: D): InAppResult {
    return {
      title: "Rezumat zilnic",
      body: `${d.new_jobs ?? 0} anunțuri noi, ${d.new_companies ?? 0} companii noi ieri.`,
      data: d,
    };
  },
};

// ─── profile_nudge ────────────────────────────────────────────────────────────

export const profile_nudge = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const completeness = d.completeness ?? 0;
    const subject = `Profilul tău este completat ${completeness}% — hai să îl îmbunătățim!`;
    const html = _buildEmail({
      heading: "Completează-ți profilul",
      preheader: `Profilul tău este ${completeness}% completat.`,
      bodyHtml: `<p>Salut,</p>
        <p>Profilul tău este completat <strong>${completeness}%</strong>. Un profil complet îți crește șansele de a fi descoperit de angajatori cu <strong>3×</strong>.</p>
        <p>Adaugă CV-ul, experiența și competențele pentru a atinge 90%.</p>`,
      ctaUrl: `${siteUrl}/dashboard/profile`,
      ctaLabel: "Completează profilul",
      siteUrl,
    });
    return { subject, html };
  },
  buildShort(d: D): string {
    return `Profilul tău este ${d.completeness ?? 0}% completat. Completează-l acum!`;
  },
  buildInApp(d: D): InAppResult {
    return {
      title: "Completează-ți profilul",
      body: `Profilul tău este ${d.completeness ?? 0}% completat.`,
      data: d,
    };
  },
};

// ─── company_created ─────────────────────────────────────────────────────────

export const company_created = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const name = esc(d.company_name ?? "Compania");
    const subject = `Compania „${name}" a fost creată`;
    const html = _buildEmail({
      heading: `Compania „${name}" a fost creată`,
      preheader: `Profilul companiei ${name} este acum activ.`,
      bodyHtml: `<p>Salut,</p>
        <p>Compania <strong>${name}</strong> a fost creată cu succes pe LegalJobs. Poți acum să publici anunțuri de angajare.</p>`,
      ctaUrl: d.company_url ?? `${siteUrl}/dashboard`,
      ctaLabel: "Gestionează compania",
      siteUrl,
    });
    return { subject, html };
  },
  buildShort(d: D): string {
    return `Compania „${d.company_name ?? "compania ta"}" a fost creată cu succes.`;
  },
  buildInApp(d: D): InAppResult {
    return {
      title: "Companie creată",
      body: `Compania „${d.company_name ?? ""}" a fost creată.`,
      data: d,
    };
  },
};

// ─── company_updated ─────────────────────────────────────────────────────────

export const company_updated = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const name = esc(d.company_name ?? "Compania");
    const html = _buildEmail({
      heading: `${name} și-a actualizat profilul`,
      preheader: `${name} și-a actualizat informațiile de profil.`,
      bodyHtml: `<p>Salut,</p>
        <p>Compania <strong>${name}</strong>, pe care o urmărești, și-a actualizat recent profilul.</p>
        ${infoTable(detailRow("Companie", name))}`,
      ctaUrl: d.company_url ?? siteUrl,
      ctaLabel: "Vezi profilul companiei",
      siteUrl,
    });
    return { subject: `${name} și-a actualizat profilul`, html };
  },
  buildShort(d: D): string {
    return `${d.company_name ?? "Compania"} și-a actualizat profilul.`;
  },
  buildInApp(d: D): InAppResult {
    return {
      title: "Profil companie actualizat",
      body: `${d.company_name ?? "Compania"} și-a actualizat profilul.`,
      data: d,
    };
  },
};

// ─── company_archived ────────────────────────────────────────────────────────

export const company_archived = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const name = esc(d.company_name ?? "Compania");
    const html = _buildEmail({
      heading: `Compania „${name}" a fost arhivată`,
      preheader: `Profilul companiei ${name} a fost arhivat.`,
      bodyHtml: `<p>Salut,</p>
        <p>Compania <strong>${name}</strong> a fost arhivată și nu mai este vizibilă public. Poți să o dezarhivezi oricând din panoul de control.</p>`,
      ctaUrl: `${siteUrl}/dashboard`,
      ctaLabel: "Panoul de control",
      siteUrl,
    });
    return { subject: `Compania „${name}" a fost arhivată`, html };
  },
  buildShort(d: D): string {
    return `Compania „${d.company_name ?? ""}" a fost arhivată.`;
  },
  buildInApp(d: D): InAppResult {
    return { title: "Companie arhivată", body: `„${d.company_name ?? ""}" a fost arhivată.`, data: d };
  },
};

// ─── company_deleted ─────────────────────────────────────────────────────────

export const company_deleted = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const name = esc(d.company_name ?? "Compania");
    const html = _buildEmail({
      heading: `Compania „${name}" a fost ștearsă`,
      preheader: `Profilul companiei ${name} a fost șters definitiv.`,
      bodyHtml: `<p>Salut,</p>
        <p>Compania <strong>${name}</strong> și toate datele asociate au fost șterse definitiv.</p>`,
      ctaUrl: `${siteUrl}/dashboard`,
      ctaLabel: "Panoul de control",
      siteUrl,
    });
    return { subject: `Compania „${name}" a fost ștearsă`, html };
  },
  buildShort(d: D): string {
    return `Compania „${d.company_name ?? ""}" a fost ștearsă.`;
  },
  buildInApp(d: D): InAppResult {
    return { title: "Companie ștearsă", body: `„${d.company_name ?? ""}" a fost ștearsă.`, data: d };
  },
};

// ─── company_favorited ────────────────────────────────────────────────────────

export const company_favorited = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const name = esc(d.company_name ?? "Compania");
    const user = esc(d.user_name ?? "Un utilizator");
    const html = _buildEmail({
      heading: `${user} a adăugat „${name}" la favorite`,
      preheader: `Compania ta a primit un nou urmăritor.`,
      bodyHtml: `<p>Salut,</p>
        <p><strong>${user}</strong> a adăugat compania <strong>${name}</strong> la lista sa de favorite.</p>`,
      ctaUrl: d.company_url ?? `${siteUrl}/dashboard`,
      ctaLabel: "Vezi profilul companiei",
      siteUrl,
    });
    return { subject: `Compania ta „${name}" a primit un urmăritor nou`, html };
  },
  buildShort(d: D): string {
    return `${d.user_name ?? "Un utilizator"} urmărește acum compania „${d.company_name ?? ""}".`;
  },
  buildInApp(d: D): InAppResult {
    return {
      title: "Companie adăugată la favorite",
      body: `${d.user_name ?? "Un utilizator"} urmărește „${d.company_name ?? ""}".`,
      data: d,
    };
  },
};

// ─── company_engagement_up ────────────────────────────────────────────────────

export const company_engagement_up = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const name = esc(d.company_name ?? "Compania");
    const count = d.followers_count ?? 0;
    const html = _buildEmail({
      heading: `Compania „${name}" — interacțiuni în creștere!`,
      preheader: `Profilul tău are acum ${count} urmăritori.`,
      bodyHtml: `<p>Salut,</p>
        <p>Compania ta <strong>${name}</strong> a ajuns la <strong>${count} urmăritori</strong> — felicitări!</p>`,
      ctaUrl: d.company_url ?? `${siteUrl}/dashboard`,
      ctaLabel: "Vezi profilul companiei",
      siteUrl,
    });
    return { subject: `Compania ta „${name}" a atins ${count} urmăritori`, html };
  },
  buildShort(d: D): string {
    return `Compania „${d.company_name ?? ""}" a atins ${d.followers_count ?? 0} urmăritori!`;
  },
  buildInApp(d: D): InAppResult {
    return {
      title: "Interacțiuni companie în creștere",
      body: `„${d.company_name ?? ""}" a atins ${d.followers_count ?? 0} urmăritori.`,
      data: d,
    };
  },
};

// ─── job_created ─────────────────────────────────────────────────────────────

export const job_created = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const title = esc(d.job_title ?? "Anunț");
    const company = esc(d.company_name ?? "");
    const html = _buildEmail({
      heading: `Anunț nou de la ${company}`,
      preheader: `${company} a publicat: „${title}".`,
      bodyHtml: `<p>Salut,</p>
        <p>Compania <strong>${company}</strong>, pe care o urmărești, a publicat un nou anunț de angajare.</p>
        ${infoTable([detailRow("Companie", company), detailRow("Post", title)].join(""))}`,
      ctaUrl: d.job_url ?? siteUrl,
      ctaLabel: "Vezi anunțul",
      siteUrl,
    });
    return { subject: `Anunț nou de la ${company}: „${title}"`, html };
  },
  buildShort(d: D): string {
    return `${d.company_name ?? "Companie"} a publicat: „${d.job_title ?? "anunț nou"}".`;
  },
  buildInApp(d: D): InAppResult {
    return {
      title: "Anunț nou",
      body: `${d.company_name ?? ""}: „${d.job_title ?? ""}"`,
      data: d,
    };
  },
};

// ─── job_published ───────────────────────────────────────────────────────────

export const job_published = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const title = esc(d.job_title ?? "Anunțul tău");
    const posterName = esc(d.poster_name ?? "");
    const html = _buildEmail({
      heading: `Anunțul tău „${title}" a fost publicat`,
      preheader: `Anunțul ${title} este acum activ.`,
      bodyHtml: `<p>Salut${posterName ? ` <strong>${posterName}</strong>` : ""},</p>
        <p>Anunțul tău <strong>${title}</strong> a fost publicat cu succes pe LegalJobs.</p>`,
      ctaUrl: d.job_url ?? `${siteUrl}/dashboard/jobs`,
      ctaLabel: "Vizualizează anunțul",
      siteUrl,
    });
    return { subject: `Anunțul tău „${title}" a fost publicat`, html };
  },
  buildShort(d: D): string {
    return `Anunțul „${d.job_title ?? ""}" a fost publicat.`;
  },
  buildInApp(d: D): InAppResult {
    return { title: "Anunț publicat", body: `„${d.job_title ?? ""}" este acum activ.`, data: d };
  },
};

// ─── job_edited ──────────────────────────────────────────────────────────────

export const job_edited = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const title = esc(d.job_title ?? "Anunțul");
    const html = _buildEmail({
      heading: `Anunțul „${title}" a fost modificat`,
      preheader: `Anunțul ${title} a primit actualizări.`,
      bodyHtml: `<p>Salut,</p>
        <p>Anunțul <strong>${title}</strong> pe care îl urmărești a primit actualizări recente.</p>`,
      ctaUrl: d.job_url ?? siteUrl,
      ctaLabel: "Vezi anunțul actualizat",
      siteUrl,
    });
    return { subject: `Anunțul „${title}" a fost modificat`, html };
  },
  buildShort(d: D): string {
    return `Anunțul „${d.job_title ?? ""}" a primit actualizări.`;
  },
  buildInApp(d: D): InAppResult {
    return { title: "Anunț modificat", body: `„${d.job_title ?? ""}" a primit actualizări.`, data: d };
  },
};

// ─── job_expires_tomorrow ────────────────────────────────────────────────────

export const job_expires_tomorrow = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const title = esc(d.job_title ?? "Anunțul");
    const html = _buildEmail({
      heading: `Anunțul „${title}" expiră mâine`,
      preheader: `Anunțul ${title} va fi dezactivat mâine.`,
      bodyHtml: `<p>Salut,</p>
        <p>Anunțul <strong>${title}</strong> va expira <strong>mâine</strong>. Dacă dorești să îl prelungești, accesează panoul de control.</p>`,
      ctaUrl: d.job_url ?? `${siteUrl}/dashboard/jobs`,
      ctaLabel: "Administrează anunțul",
      siteUrl,
    });
    return { subject: `Anunțul „${title}" expiră mâine`, html };
  },
  buildShort(d: D): string {
    return `Anunțul „${d.job_title ?? ""}" expiră mâine.`;
  },
  buildInApp(d: D): InAppResult {
    return { title: "Anunț expiră mâine", body: `„${d.job_title ?? ""}" expiră mâine.`, data: d };
  },
};

// ─── job_unpublished ─────────────────────────────────────────────────────────

export const job_unpublished = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const title = esc(d.job_title ?? "Anunțul");
    const html = _buildEmail({
      heading: `Anunțul „${title}" a fost retras`,
      preheader: `Anunțul ${title} nu mai este activ.`,
      bodyHtml: `<p>Salut,</p>
        <p>Anunțul <strong>${title}</strong> pe care îl urmărești a fost retras și nu mai este vizibil public.</p>`,
      ctaUrl: `${siteUrl}/jobs`,
      ctaLabel: "Explorează alte anunțuri",
      siteUrl,
    });
    return { subject: `Anunțul „${title}" a fost retras`, html };
  },
  buildShort(d: D): string {
    return `Anunțul „${d.job_title ?? ""}" a fost retras.`;
  },
  buildInApp(d: D): InAppResult {
    return { title: "Anunț retras", body: `„${d.job_title ?? ""}" nu mai este activ.`, data: d };
  },
};

// ─── job_archived ────────────────────────────────────────────────────────────

export const job_archived = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const title = esc(d.job_title ?? "Anunțul");
    const html = _buildEmail({
      heading: `Anunțul „${title}" a fost arhivat`,
      preheader: `Anunțul ${title} a fost arhivat.`,
      bodyHtml: `<p>Salut,</p>
        <p>Anunțul <strong>${title}</strong> a fost arhivat și nu mai este vizibil public.</p>`,
      ctaUrl: `${siteUrl}/dashboard/jobs`,
      ctaLabel: "Gestionează anunțurile",
      siteUrl,
    });
    return { subject: `Anunțul „${title}" a fost arhivat`, html };
  },
  buildShort(d: D): string {
    return `Anunțul „${d.job_title ?? ""}" a fost arhivat.`;
  },
  buildInApp(d: D): InAppResult {
    return { title: "Anunț arhivat", body: `„${d.job_title ?? ""}" a fost arhivat.`, data: d };
  },
};

// ─── job_deleted ─────────────────────────────────────────────────────────────

export const job_deleted = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const title = esc(d.job_title ?? "Anunțul");
    const html = _buildEmail({
      heading: `Anunțul „${title}" a fost șters`,
      preheader: `Anunțul ${title} a fost șters definitiv.`,
      bodyHtml: `<p>Salut,</p>
        <p>Anunțul <strong>${title}</strong> a fost șters definitiv.</p>`,
      ctaUrl: `${siteUrl}/dashboard/jobs`,
      ctaLabel: "Gestionează anunțurile",
      siteUrl,
    });
    return { subject: `Anunțul „${title}" a fost șters`, html };
  },
  buildShort(d: D): string {
    return `Anunțul „${d.job_title ?? ""}" a fost șters.`;
  },
  buildInApp(d: D): InAppResult {
    return { title: "Anunț șters", body: `„${d.job_title ?? ""}" a fost șters.`, data: d };
  },
};

// ─── form_created ────────────────────────────────────────────────────────────

export const form_created = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const name = esc(d.form_name ?? "Formularul");
    const html = _buildEmail({
      heading: `Formularul „${name}" a fost creat`,
      preheader: `Formularul ${name} este acum activ.`,
      bodyHtml: `<p>Salut,</p>
        <p>Formularul <strong>${name}</strong> a fost creat cu succes și este disponibil în panoul de control.</p>`,
      ctaUrl: `${siteUrl}/dashboard/forms`,
      ctaLabel: "Gestionează formularele",
      siteUrl,
    });
    return { subject: `Formularul „${name}" a fost creat`, html };
  },
  buildShort(d: D): string {
    return `Formularul „${d.form_name ?? ""}" a fost creat.`;
  },
  buildInApp(d: D): InAppResult {
    return { title: "Formular creat", body: `„${d.form_name ?? ""}" a fost creat.`, data: d };
  },
};

// ─── form_archived ────────────────────────────────────────────────────────────

export const form_archived = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const name = esc(d.form_name ?? "Formularul");
    const html = _buildEmail({
      heading: `Formularul „${name}" a fost arhivat`,
      preheader: `Formularul ${name} a fost arhivat.`,
      bodyHtml: `<p>Salut,</p>
        <p>Formularul <strong>${name}</strong> a fost arhivat și nu mai acceptă răspunsuri noi.</p>`,
      ctaUrl: `${siteUrl}/dashboard/forms`,
      ctaLabel: "Gestionează formularele",
      siteUrl,
    });
    return { subject: `Formularul „${name}" a fost arhivat`, html };
  },
  buildShort(d: D): string {
    return `Formularul „${d.form_name ?? ""}" a fost arhivat.`;
  },
  buildInApp(d: D): InAppResult {
    return { title: "Formular arhivat", body: `„${d.form_name ?? ""}" a fost arhivat.`, data: d };
  },
};

// ─── form_deleted ─────────────────────────────────────────────────────────────

export const form_deleted = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const name = esc(d.form_name ?? "Formularul");
    const html = _buildEmail({
      heading: `Formularul „${name}" a fost șters`,
      preheader: `Formularul ${name} a fost șters definitiv.`,
      bodyHtml: `<p>Salut,</p>
        <p>Formularul <strong>${name}</strong> și toate datele asociate au fost șterse definitiv.</p>`,
      ctaUrl: `${siteUrl}/dashboard/forms`,
      ctaLabel: "Gestionează formularele",
      siteUrl,
    });
    return { subject: `Formularul „${name}" a fost șters`, html };
  },
  buildShort(d: D): string {
    return `Formularul „${d.form_name ?? ""}" a fost șters.`;
  },
  buildInApp(d: D): InAppResult {
    return { title: "Formular șters", body: `„${d.form_name ?? ""}" a fost șters.`, data: d };
  },
};

// ─── application_new ─────────────────────────────────────────────────────────

export const application_new = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const jobTitle = esc(d.job_title ?? "Anunț");
    const company = esc(d.company_name ?? "");
    const applicant = esc(d.applicant_name ?? "Candidat");
    const isCreator = d.recipient_role === "creator";

    const subject = isCreator
      ? `Candidatură nouă pentru „${jobTitle}"`
      : `Candidatura ta pentru „${jobTitle}" a fost înregistrată`;

    const bodyHtml = isCreator
      ? `<p>Salut,</p>
        <p>Candidatul <strong>${applicant}</strong> a aplicat la anunțul <strong>${jobTitle}</strong>.</p>
        ${infoTable([
          detailRow("Post", jobTitle),
          detailRow("Companie", company),
          detailRow("Candidat", applicant),
        ].join(""))}`
      : `<p>Salut <strong>${applicant}</strong>,</p>
        <p>Candidatura ta pentru postul <strong>${jobTitle}</strong> la <strong>${company}</strong> a fost înregistrată cu succes.</p>
        ${infoTable([
          detailRow("Post", jobTitle),
          detailRow("Companie", company),
        ].join(""))}`;

    const html = _buildEmail({
      heading: isCreator ? "Candidatură nouă" : "Candidatură înregistrată",
      preheader: subject,
      bodyHtml,
      ctaUrl: d.job_url ?? `${siteUrl}/dashboard`,
      ctaLabel: isCreator ? "Vezi candidaturile" : "Vezi anunțul",
      siteUrl,
    });
    return { subject, html };
  },
  buildShort(d: D): string {
    return d.recipient_role === "creator"
      ? `${d.applicant_name ?? "Cineva"} a aplicat la „${d.job_title ?? ""}".`
      : `Candidatura ta pentru „${d.job_title ?? ""}" a fost înregistrată.`;
  },
  buildInApp(d: D): InAppResult {
    const isCreator = d.recipient_role === "creator";
    return {
      title: isCreator ? "Candidatură nouă" : "Candidatură înregistrată",
      body: isCreator
        ? `${d.applicant_name ?? ""} a aplicat la „${d.job_title ?? ""}".`
        : `Candidatura ta pentru „${d.job_title ?? ""}" a fost înregistrată.`,
      data: d,
    };
  },
};

// ─── application_withdrawn ───────────────────────────────────────────────────

export const application_withdrawn = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const jobTitle = esc(d.job_title ?? "Anunț");
    const company = esc(d.company_name ?? "");
    const applicant = esc(d.applicant_name ?? "Candidat");
    const reason = (d.reason ?? "") as string;
    const isCreator = d.recipient_role === "creator";

    const reasonHtml = reason
      ? `<p style="margin-top:16px;"><strong>Motiv:</strong></p>
         <blockquote style="margin:8px 0 0;padding:12px 16px;background:#F6F8F5;border-left:4px solid #4CAF50;border-radius:6px;color:#1A2B1F;font-size:14px;line-height:1.6;white-space:pre-wrap;">${esc(reason)}</blockquote>`
      : "";

    const bodyHtml = isCreator
      ? `<p>Salut,</p>
        <p>Candidatul <strong>${applicant}</strong> și-a retras candidatura pentru anunțul <strong>${jobTitle}</strong>.</p>
        ${infoTable([
          detailRow("Anunț", jobTitle),
          detailRow("Companie", company),
          detailRow("Candidat", applicant),
        ].join(""))}
        ${reasonHtml}`
      : `<p>Salut <strong>${applicant}</strong>,</p>
        <p>Candidatura ta pentru postul <strong>${jobTitle}</strong> la <strong>${company}</strong> a fost retrasă cu succes.</p>`;

    const subject = isCreator
      ? `Candidatură retrasă — „${jobTitle}"`
      : `Candidatura ta pentru „${jobTitle}" a fost retrasă`;

    const html = _buildEmail({
      heading: "Candidatură retrasă",
      preheader: subject,
      bodyHtml,
      ctaUrl: d.job_url ?? `${siteUrl}/dashboard`,
      ctaLabel: "Panoul de control",
      siteUrl,
    });
    return { subject, html };
  },
  buildShort(d: D): string {
    return d.recipient_role === "creator"
      ? `${d.applicant_name ?? "Candidat"} și-a retras candidatura pentru „${d.job_title ?? ""}".`
      : `Candidatura ta pentru „${d.job_title ?? ""}" a fost retrasă.`;
  },
  buildInApp(d: D): InAppResult {
    const isCreator = d.recipient_role === "creator";
    return {
      title: "Candidatură retrasă",
      body: isCreator
        ? `${d.applicant_name ?? ""} a retras candidatura pentru „${d.job_title ?? ""}".`
        : `Candidatura ta pentru „${d.job_title ?? ""}" a fost retrasă.`,
      data: d,
    };
  },
};

// ─── application_rejected ────────────────────────────────────────────────────

export const application_rejected = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const jobTitle = esc(d.job_title ?? "Anunț");
    const company = esc(d.company_name ?? "");
    const candidateName = esc(d.candidate_name ?? "Candidat");

    const html = _buildEmail({
      heading: "Candidatura ta a fost analizată",
      preheader: `Candidatura ta pentru „${jobTitle}" la ${company} a fost respinsă.`,
      bodyHtml: `<p>Salut${candidateName !== "Candidat" ? ` <strong>${candidateName}</strong>` : ""},</p>
        <p>Îți mulțumim pentru interesul acordat și pentru că ai aplicat la <strong>${jobTitle}</strong> în cadrul <strong>${company}</strong>.</p>
        <p>În urma procesului de selecție, am decis să continuăm cu alți candidați care corespund mai bine cerințelor actuale ale postului.</p>
        ${infoTable([
          detailRow("Post", jobTitle),
          detailRow("Companie", company),
          detailRow("Status", "Respinsă"),
        ].join(""))}
        <p>Nu te descuraja — continuă să explorezi oportunitățile disponibile pe platformă. Îți dorim mult succes!</p>`,
      ctaUrl: `${siteUrl}/jobs`,
      ctaLabel: "Explorează alte anunțuri",
      siteUrl,
    });
    return { subject: `Candidatura ta pentru „${jobTitle}" — răspuns`, html };
  },
  buildShort(d: D): string {
    return `Candidatura ta pentru „${d.job_title ?? ""}" la ${d.company_name ?? ""} a fost respinsă.`;
  },
  buildInApp(d: D): InAppResult {
    return {
      title: "Candidatură respinsă",
      body: `Candidatura pentru „${d.job_title ?? ""}" la ${d.company_name ?? ""} a fost respinsă.`,
      data: d,
    };
  },
};

// ─── alert_job_match ─────────────────────────────────────────────────────────

export const alert_job_match = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const alertName = esc(d.alert_name ?? "Alertă");
    const jobTitle = esc(d.job_title ?? "Anunț");
    const company = esc(d.company_name ?? "");

    const rows = [
      detailRow("Post", jobTitle),
      company ? detailRow("Companie", company) : "",
      d.location ? detailRow("Locație", esc(String(d.location))) : "",
      d.job_type ? detailRow("Tip", esc(String(d.job_type))) : "",
    ].filter(Boolean).join("");

    const html = _buildEmail({
      heading: `Alertă „${alertName}": anunț nou`,
      preheader: `Alertă „${alertName}": ${jobTitle}${company ? ` la ${company}` : ""}.`,
      bodyHtml: `<p>Salut,</p>
        <p>A apărut un anunț nou care corespunde alertei tale <strong>„${alertName}"</strong>.</p>
        ${infoTable(rows)}
        <p>Aplică acum dacă postul ți se potrivește!</p>`,
      ctaUrl: d.job_url ?? siteUrl,
      ctaLabel: "Vezi anunțul",
      siteUrl,
    });
    return { subject: `Alertă: anunț nou – ${jobTitle}${company ? ` la ${company}` : ""}`, html };
  },
  buildShort(d: D): string {
    return `Alertă „${d.alert_name ?? ""}": „${d.job_title ?? ""}".`;
  },
  buildInApp(d: D): InAppResult {
    return {
      title: `Alertă: anunț potrivit`,
      body: `„${d.job_title ?? ""}" corespunde alertei „${d.alert_name ?? ""}".`,
      data: d,
    };
  },
};

// ─── release_announcement ────────────────────────────────────────────────────

export const release_announcement = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const version = esc(d.version ?? "");
    const title = esc(d.title ?? "Noutăți pe platformă");
    const bodyHtmlContent = (d.body_html as string | undefined) ?? "<p>Platforma a primit actualizări noi.</p>";

    const html = _buildEmail({
      heading: title,
      preheader: version ? `Versiunea ${version} — ${title}` : title,
      bodyHtml: bodyHtmlContent,
      ctaUrl: siteUrl,
      ctaLabel: "Descoperă noutățile",
      siteUrl,
    });
    return { subject: version ? `Noutăți LegalJobs v${version}: ${title}` : `Noutăți LegalJobs: ${title}`, html };
  },
  buildShort(d: D): string {
    return d.version
      ? `Noutăți LegalJobs v${d.version}: ${d.title ?? "actualizare disponibilă"}.`
      : `Noutăți LegalJobs: ${d.title ?? "actualizare disponibilă"}.`;
  },
  buildInApp(d: D): InAppResult {
    return {
      title: d.title ?? "Noutăți platformă",
      body: d.version ? `Versiunea ${d.version} este disponibilă.` : null,
      data: d,
    };
  },
};

// ─── matchmaking ─────────────────────────────────────────────────────────────
//
// Two audiences share the same type key:
//   d.audience === "candidate"  → sent to the job-seeker; CTA → company public page
//   d.audience === "company"    → sent to company members; CTA → candidate public page

export const matchmaking = {
  buildEmail(d: D): EmailResult {
    const siteUrl = (d.site_url as string | undefined) ?? SITE_URL_FALLBACK;
    const isCandidate = d.audience !== "company";
    const overlapList: string[] = Array.isArray(d.overlap) ? d.overlap : [];
    const overlapHtml = overlapList.length > 0
      ? `<ul>${overlapList.map((s: string) => `<li>${esc(s)}</li>`).join("")}</ul>`
      : "";

    if (isCandidate) {
      const companyName = esc(d.company_name ?? "");
      const ctaUrl = d.company_slug ? `${siteUrl}/companies/${d.company_slug}` : siteUrl;
      const html = _buildEmail({
        heading: "Potrivire competențe!",
        preheader: `Competențele tale se potrivesc cu ${companyName}.`,
        bodyHtml: `<p>Salut,</p>
          <p>Am găsit o potrivire între competențele tale și cele ale companiei <strong>${companyName}</strong>.</p>
          ${overlapHtml ? `<p>Competențe comune:${overlapHtml}</p>` : ""}
          <p>Vizitează profilul companiei pentru a vedea oportunitățile disponibile.</p>`,
        ctaUrl,
        ctaLabel: "Vezi compania",
        siteUrl,
      });
      return {
        subject: `Potrivire: competențele tale se potrivesc cu ${companyName}`,
        html,
      };
    } else {
      const userName = esc(d.user_full_name ?? "un candidat");
      const ctaUrl = d.user_slug ? `${siteUrl}/users/${d.user_slug}` : siteUrl;
      const html = _buildEmail({
        heading: "Potrivire competențe!",
        preheader: `${userName} se potrivește cu competențele companiei tale.`,
        bodyHtml: `<p>Salut,</p>
          <p>Am găsit o potrivire: <strong>${userName}</strong> are competențe comune cu compania ta.</p>
          ${overlapHtml ? `<p>Competențe comune:${overlapHtml}</p>` : ""}
          <p>Vizitează profilul candidatului pentru a-l contacta.</p>`,
        ctaUrl,
        ctaLabel: "Vezi candidatul",
        siteUrl,
      });
      return {
        subject: `Potrivire: ${userName} se potrivește cu compania ta`,
        html,
      };
    }
  },
  buildShort(d: D): string {
    const isCandidate = d.audience !== "company";
    if (isCandidate) {
      return `Competențele tale se potrivesc cu ${d.company_name ?? "o companie"} (${d.match_count ?? 0} comune).`;
    }
    return `${d.user_full_name ?? "Un candidat"} se potrivește cu compania ta (${d.match_count ?? 0} competențe comune).`;
  },
  buildInApp(d: D): InAppResult {
    const isCandidate = d.audience !== "company";
    if (isCandidate) {
      return {
        title: "Potrivire competențe",
        body: `Competențele tale se potrivesc cu ${d.company_name ?? "o companie"}.`,
        data: d,
      };
    }
    return {
      title: "Potrivire competențe",
      body: `${d.user_full_name ?? "Un candidat"} are competențe comune cu compania ta.`,
      data: d,
    };
  },
};

// ─── Template registry lookup ─────────────────────────────────────────────────

type Template = {
  buildEmail: (d: D) => EmailResult;
  buildShort: (d: D) => string;
  buildInApp: (d: D) => InAppResult;
};

const TEMPLATES: Record<string, Template> = {
  account_created,
  account_deletion_scheduled,
  password_reset_ok,
  profile_updated,
  daily_digest,
  profile_nudge,
  company_created,
  company_updated,
  company_archived,
  company_deleted,
  company_favorited,
  company_engagement_up,
  job_created,
  job_published,
  job_edited,
  job_expires_tomorrow,
  job_unpublished,
  job_archived,
  job_deleted,
  form_created,
  form_archived,
  form_deleted,
  application_new,
  application_withdrawn,
  application_rejected,
  alert_job_match,
  release_announcement,
  matchmaking,
};

export function getTemplate(type: string): Template | null {
  return TEMPLATES[type] ?? null;
}
