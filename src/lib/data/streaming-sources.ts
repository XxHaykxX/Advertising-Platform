import "server-only";
import { prisma } from "@/lib/prisma";

/** Global, editable dictionary of streaming-source options for the Production
 *  Info "Streaming Source" MultiSelect — see prisma/schema.prisma's
 *  StreamingSource model. */
export async function getStreamingSources(): Promise<string[]> {
  const rows = await prisma.streamingSource.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map((s) => s.name);
}
