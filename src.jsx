import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { experience, identifyPosting, sameRole, prepare } from "./application.mjs";
import "./style.css";

const storageKey = "applydesk-v1";
const blankJob = { url: "", title: "", company: "", location: "", description: "", name: "", language: "de" };
const statuses = ["Draft", "Ready", "Applied", "Interview", "Closed"];

function readJobs() {
  try {
    const jobs = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(jobs) ? jobs : [];
  } catch {
    return [];
  }
}

function App() {
  const [jobs, setJobs] = useState(readJobs);
  const [form, setForm] = useState(blankJob);
  const [enabled, setEnabled] = useState(() => experience.map(item => item.label));
  const [active, setActive] = useState(() => jobs[0]?.id ?? null);
  const [filter, setFilter] = useState("All");
  const [notice, setNotice] = useState("");
  const selected = jobs.find(job => job.id === active);
  const posting = identifyPosting(form.url);
  const duplicate = posting && form.title.trim() && form.company.trim() && jobs.find(job => sameRole(job, {
    ...posting, title: form.title, company: form.company, location: form.location.trim(),
  }));
  const visibleJobs = jobs.filter(job => filter === "All" || job.status === filter);

  function save(next) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setJobs(next);
      return true;
    } catch {
      setNotice("Browser storage is unavailable or full. Your changes could not be saved.");
      return false;
    }
  }

  function updateSelected(changes) {
    save(jobs.map(job => job.id === active ? { ...job, ...changes } : job));
  }

  function changeField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
    setNotice("");
  }

  function createDraft(event) {
    event.preventDefault();
    if (!posting) {
      setNotice("Enter a LinkedIn job link or a Stepstone.de listing link.");
      return;
    }
    const details = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]));
    if (!details.title || !details.company || !details.description) {
      setNotice("Enter a job title, company and job description.");
      return;
    }
    if (duplicate) {
      setNotice("This role may already be in your tracker. Use the link in the form to check.");
      return;
    }
    const job = {
      ...details, ...posting, id: crypto.randomUUID(), status: "Draft",
      ...prepare(details, enabled),
    };
    if (save([job, ...jobs])) {
      setActive(job.id);
      setFilter("All");
      setForm({ ...blankJob, name: form.name, language: form.language });
      setNotice("Draft created. Review it in the application editor.");
    }
  }

  function downloadDraft() {
    const parts = [
      selected.title + " · " + selected.company,
      selected.url,
      selected.language === "de" ? "Lebenslauf – Stichpunkte" : "CV bullet suggestions",
      selected.bullets || "",
      selected.language === "de" ? "Anschreiben" : "Cover letter",
      selected.letter,
    ];
    const url = URL.createObjectURL(new Blob([parts.join("\n\n")], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "application-" + selected.company.replace(/[^\p{L}\p{N}]+/gu, "-") + ".txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <header className="top"><div className="wrap masthead">
        <a href="./" className="brand"><span aria-hidden="true">A</span> ApplyDesk</a>
        <p>Stepstone & LinkedIn application tracker</p>
      </div></header>
      <main className="wrap">
        <section className="intro">
          <div><h1>Job applications</h1><p>Prepare your documents, then apply on the original posting.</p></div>
          <dl><div><dt>Tracked</dt><dd>{jobs.length}</dd></div><div><dt>Applied or interviewing</dt><dd>{jobs.filter(job => ["Applied", "Interview"].includes(job.status)).length}</dd></div></dl>
        </section>
        <div className="layout">
          <section className="card">
            <h2>New application</h2>
            <form onSubmit={createDraft}>
              <label>Job URL<input type="url" name="url" value={form.url} onChange={changeField} required placeholder="https://…" /></label>
              {posting && <p className="hint">{posting.board} listing detected</p>}
              <div className="pair">
                <label>Job title<input name="title" value={form.title} onChange={changeField} required /></label>
                <label>Company<input name="company" value={form.company} onChange={changeField} required /></label>
              </div>
              <div className="pair">
                <label>Location<input name="location" value={form.location} onChange={changeField} placeholder="Optional" /></label>
                <label>Draft language<select name="language" value={form.language} onChange={changeField}><option value="de">Deutsch</option><option value="en">English</option></select></label>
              </div>
              <label>Job description<textarea name="description" rows="5" value={form.description} onChange={changeField} required placeholder="Paste the description and requirements." /></label>
              <label>Name for cover letter<input name="name" value={form.name} onChange={changeField} placeholder="Optional" /></label>
              <details><summary>Review experience used in drafts</summary>
                {experience.map(item => <label className="check" key={item.label}>
                  <input type="checkbox" checked={enabled.includes(item.label)}
                    onChange={event => setEnabled(event.target.checked ? [...enabled, item.label] : enabled.filter(label => label !== item.label))} />
                  <span><strong>{item.label}</strong><small>{item[form.language]}</small></span>
                </label>)}
              </details>
              {duplicate && <div className="alert">Possible duplicate. <button className="text-button" type="button" onClick={() => { setActive(duplicate.id); setFilter("All"); }}>View existing application</button></div>}
              <button className="primary" type="submit">Prepare draft</button>
              <p className="hint" role="status">{notice}</p>
            </form>
          </section>
          <div className="stack">
            <section className="card">
              <div className="heading"><h2>Tracker</h2>
                <label className="filter">Status <select value={filter} onChange={event => setFilter(event.target.value)}>
                  {["All", ...statuses].map(status => <option key={status}>{status}</option>)}
                </select></label>
              </div>
              {visibleJobs.length === 0 && <p className="hint">{jobs.length ? "No applications at this status." : "Prepare a draft to add your first application."}</p>}
              <ul className="tracker">{visibleJobs.map(job =>
                <li key={job.id}>
                  <button type="button" className="job" aria-pressed={active === job.id} onClick={() => setActive(job.id)}>
                    <span><strong>{job.title}</strong><small>{job.company} · {job.board}{job.location && " · " + job.location}</small></span>
                    <span className="status">{job.status}</span>
                  </button>
                </li>
              )}</ul>
            </section>
            {selected && <section className="card editor" aria-label="Application editor">
              <div className="heading"><h2>{selected.title}</h2><a href={selected.url} target="_blank" rel="noreferrer">Open posting ↗</a></div>
              <label>Application status<select value={selected.status} onChange={event => updateSelected({ status: event.target.value })}>
                {statuses.map(status => <option key={status}>{status}</option>)}
              </select></label>
              <label>CV bullet suggestions<textarea rows="4" value={selected.bullets} onChange={event => updateSelected({ bullets: event.target.value })}
                placeholder="No experience matched the posting keywords. Add a bullet from your own experience." /></label>
              <label>Cover letter<textarea rows="10" value={selected.letter} onChange={event => updateSelected({ letter: event.target.value })} /></label>
              {selected.unmatched.length > 0 && <details><summary>Posting bullets to review ({selected.unmatched.length})</summary>
                <p className="hint">These lines had no keyword match in your selected experience. They may include benefits or duties.</p>
                <ul>{selected.unmatched.map((line, index) => <li key={index}>{line}</li>)}</ul>
              </details>}
              <button className="secondary" type="button" onClick={downloadDraft}>Download draft (.txt)</button>
            </section>}
          </div>
        </div>
        <footer>Drafts and tracker data are stored in this browser.</footer>
      </main>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
