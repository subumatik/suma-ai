import { createClient } from "@/lib/supabase/server";
import { searchYargitay, getYargitayDocument } from "@/lib/yargitay";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query, pageSize = 10, pageNumber = 1, fetchDetailId } = await req.json();

    if (fetchDetailId) {
      // Tek bir kararın detayını çek
      const detail = await getYargitayDocument(String(fetchDetailId));
      return Response.json({ detail });
    }

    if (!query || typeof query !== "string") {
      return Response.json({ error: "query is required" }, { status: 400 });
    }

    const result = await searchYargitay(query, pageSize, pageNumber);
    return Response.json(result);
  } catch (error: any) {
    console.error("Yargıtay search API Error:", error);
    return Response.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
