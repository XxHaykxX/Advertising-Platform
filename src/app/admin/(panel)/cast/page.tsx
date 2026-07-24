import { requireContentEditor } from "@/lib/auth/require";
import { getPersons } from "@/lib/data/persons";
import { CastManager } from "./cast-manager";

export default async function CastPage() {
  await requireContentEditor();
  const persons = await getPersons();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-foreground">Cast & Crew</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Global directory of people ({persons.length}). Reused across projects via the cast/crew autocomplete.
      </p>
      <CastManager persons={persons} />
    </div>
  );
}
