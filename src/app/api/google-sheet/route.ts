import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const allowedHosts = new Set(["docs.google.com", "sheets.googleapis.com", "script.google.com", "script.googleusercontent.com"]);

export async function GET(request: NextRequest) {
  const supplied = request.nextUrl.searchParams.get("url") || process.env.GOOGLE_SHEET_CSV_URL;
  if (!supplied) return NextResponse.json({ error: "URL Google Sheet belum ditetapkan." }, { status: 400 });
  let url: URL;
  try { url = new URL(supplied); } catch { return NextResponse.json({ error: "URL tidak sah." }, { status: 400 }); }
  if (url.protocol !== "https:" || !allowedHosts.has(url.hostname)) return NextResponse.json({ error: "Hanya URL Google Sheets atau Apps Script HTTPS dibenarkan." }, { status: 400 });
  try {
    const response = await fetch(url, { cache: "no-store", redirect: "follow" });
    if (!response.ok) throw new Error(`Google mengembalikan status ${response.status}`);
    const csv = await response.text();
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Sumber data gagal dicapai." }, { status: 502 });
  }
}
