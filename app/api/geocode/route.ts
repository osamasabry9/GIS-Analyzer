import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const limit = url.searchParams.get("limit") ?? "7";

  // upstream Photon
  const upstream = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=${limit}`;
  const upstreamRes = await fetch(upstream);

  // Mirror status & body
  const data = await upstreamRes.text();
  return new NextResponse(data, {
    status: upstreamRes.status,
    headers: {
      "content-type": upstreamRes.headers.get("content-type") ?? "application/json",
    },
  });
}
