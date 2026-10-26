import type { Handler } from "@netlify/functions";

const allowedHosts = new Set(["docs.google.com", "sheets.googleapis.com", "script.google.com", "script.googleusercontent.com"]);

export const handler: Handler = async (event) => {
  const supplied = event.queryStringParameters?.url || process.env.GOOGLE_SHEET_CSV_URL;
  if (!supplied) return { statusCode: 400, body: JSON.stringify({ error: "URL Google Sheet belum ditetapkan." }) };
  try {
    const url = new URL(supplied);
    if (url.protocol !== "https:" || !allowedHosts.has(url.hostname)) return { statusCode: 400, body: JSON.stringify({ error: "Hos sumber tidak dibenarkan." }) };
    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) throw new Error(`Status sumber ${response.status}`);
    return { statusCode: 200, headers: { "Content-Type": "text/csv; charset=utf-8", "Cache-Control": "no-store" }, body: await response.text() };
  } catch (error) {
    return { statusCode: 502, body: JSON.stringify({ error: error instanceof Error ? error.message : "Sambungan gagal." }) };
  }
};
