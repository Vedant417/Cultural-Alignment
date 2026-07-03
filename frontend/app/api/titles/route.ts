import { NextResponse } from "next/server";

const API =
  "https://test.mediashippers.com/api/project/get-projects";

const ORG_ID = "69d88f01e479f2ac99883de2";

export async function GET() {
  try {
    const res = await fetch(
      `${API}?userId=${ORG_ID}&limit=1000`,
      {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }
    );

    const data = await res.json();

    const projects =
      data?.projects ||
      data?.data?.projects ||
      [];

    const titles = projects.map((p: any) => ({
      id: p._id || p.id,
      title:
        p.projectTitle ||
        p.title ||
        p.name ||
        "",
    }));


    return NextResponse.json(titles);

  } catch (err) {
    console.error("ROUTE ERROR:", err);

    return NextResponse.json([]);
  }
}