import { getContentRows } from "@/lib/data/content";
import { ContentForm } from "./content-form";

export default async function ContentAdminPage() {
  const rows = await getContentRows();
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Landing texts</h1>
      <p className="mb-6 mt-1 text-sm text-white/55">
        All texts in three languages. Leave EN/HY empty to fall back to RU.
      </p>
      <ContentForm rows={rows} />
    </div>
  );
}
