export const experience = [
  { label: "Cybersecurity testing", keywords: /cyber|security|sicherheit|18031|penetration|burp|nmap|wireshark|iot/i,
    en: "Performed EN 18031 certification testing at Eurofins, using Linux, Burp Suite, Nmap and Wireshark.",
    de: "Führte bei Eurofins Zertifizierungsprüfungen nach EN 18031 mit Linux, Burp Suite, Nmap und Wireshark durch." },
  { label: "Android development", keywords: /android|kotlin|mobile|infotainment|rxjava|junit/i,
    en: "Developed an Android infotainment media test app in Kotlin as a working student at e-solutions.",
    de: "Entwickelte als Werkstudent bei e-solutions eine Android-Medientest-App für Infotainmentsysteme in Kotlin." },
  { label: "Computer science master’s thesis", keywords: /informatik|computer science|energy|energie|regression|research|datenanalyse/i,
    en: "Analyzed Android smartphone energy consumption using ridge regression in my computer science master’s thesis at the University of Passau.",
    de: "Analysierte in meiner Informatik-Masterarbeit an der Universität Passau den Energieverbrauch von Android-Smartphones mit Ridge-Regression." },
  { label: "IT support", keywords: /support|helpdesk|service desk/i,
    en: "Gained practical experience in IT support.",
    de: "Sammelte praktische Erfahrung im IT-Support." }
];
//identifies the posting
export function identifyPosting(value) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase();
    const path = url.pathname.replace(/\/$/, "");
    if (host === "linkedin.com" || host.endsWith(".linkedin.com")) {
      const id = path.match(/^\/jobs\/view\/(?:[^/]*-)?(\d+)$/)?.[1] ??
        (path === "/jobs/search" ? url.searchParams.get("currentJobId") : null);
      if (/^\d+$/.test(id ?? "")) return { board: "LinkedIn", key: "linkedin:" + id, url: "https://www.linkedin.com/jobs/view/" + id + "/" };
    }
    if (host === "stepstone.de" || host === "www.stepstone.de") {
      const id = path.match(/^\/stellenangebote--[^/]+--(\d+)-inline\.html$/i)?.[1];
      if (id) return { board: "Stepstone", key: "stepstone:" + id, url: url.origin + path };
    }
  } catch {
    return null;
  }
  return null;
}

function normalize(value) {
  return value.normalize("NFKC").toLowerCase().replace(/\(\s*(?:m\/w\/d|m\/f\/d|w\/m\/d|d\/m\/w)\s*\)/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function sameRole(first, second) {
  return first.key === second.key || (
    normalize(first.company) === normalize(second.company) &&
    normalize(first.title) === normalize(second.title) &&
    (!first.location || !second.location || normalize(first.location) === normalize(second.location))
  );
}

export function prepare(job, enabledLabels) {
  const matches = experience.filter(item => enabledLabels.includes(item.label) && item.keywords.test(job.title + "\n" + job.description));
  const bullets = matches.map(item => item[job.language]).join("\n");
  const german = job.language === "de";
  const description = job.description.split(/\n+/).map(line => line.trim());
  const requirements = description.filter(line => /^(?:[-•*–]|\d+[.)])\s*/.test(line)).slice(0, 18)
    .map(line => line.replace(/^(?:[-•*–]|\d+[.)])\s*/, ""));
  const unmatched = requirements.filter(line => line && !matches.some(item => item.keywords.test(line)));
  const evidence = bullets || (german ? "[Hier belegbare Erfahrung zur Stelle ergänzen.]" : "[Add relevant experience you can substantiate.]");
  const letter = german
    ? "Sehr geehrtes Recruiting-Team,\n\nich bewerbe mich bei " + job.company + " für die Position „" + job.title + "“.\n\n" + evidence + "\n\nGerne erläutere ich Ihnen in einem persönlichen Gespräch, wie ich meine Erfahrung in Ihr Team einbringen kann.\n\nMit freundlichen Grüßen\n" + (job.name || "[Ihr Name]")
    : "Dear hiring team,\n\nI’m applying for the " + job.title + " position at " + job.company + ".\n\n" + evidence + "\n\nI’d welcome the opportunity to discuss how my experience could contribute to your team.\n\nKind regards,\n" + (job.name || "[Your name]");
  return {bullets, letter, unmatched};
}
