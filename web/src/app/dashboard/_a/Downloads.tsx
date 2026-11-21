"use client";

// Client-side file downloads built from data the page already loaded (no extra request, nothing leaves the browser).

function save(filename: string, type: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const csvCell = (v: string | number): string => {
  let s = String(v);
  // Stop spreadsheets from running a cell as a formula.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function CsvDownload({ filename, rows, label, primary }: { filename: string; rows: (string | number)[][]; label: string; primary?: boolean }) {
  return (
    <button type="button" className={`btn btn-sm ${primary ? "btn-secondary" : ""}`} onClick={() => save(filename, "text/csv;charset=utf-8", rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n")}>
      {label}
    </button>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");
const icsDate = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

/** Downloads a calendar reminder (.ics) for tomorrow at 17:00: "Play KudiCubs with {name}". */
export function PlayReminder({ nickname }: { nickname: string }) {
  function make() {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(17, 0, 0, 0);
    const end = new Date(start.getTime() + 15 * 60_000);
    const summary = `Play KudiCubs with ${nickname}`.replace(/[,;\\]/g, " ");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//KudiCubs//Parent Dashboard//EN",
      "BEGIN:VEVENT",
      `UID:${crypto.randomUUID()}@kudicubs`,
      `DTSTAMP:${icsDate(new Date())}`,
      `DTSTART:${icsDate(start)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${summary}`,
      "DESCRIPTION:A short first mission takes about five minutes.",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    save("kudicubs-play-together.ics", "text/calendar;charset=utf-8", ics);
  }
  return (
    <button type="button" className="btn btn-sm btn-secondary" onClick={make} title="Downloads a calendar reminder for tomorrow at 5 pm">
      Remind me to play together
    </button>
  );
}
