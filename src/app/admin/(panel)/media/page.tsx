import { requireUser } from "@/lib/auth/require";
import { listUploads } from "@/lib/actions/uploads";
import { MediaManager } from "./media-manager";

export default async function MediaPage() {
  await requireUser();
  const files = await listUploads();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-foreground">Media</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Every uploaded image ({files.length}). Delete removes the file from disk.
      </p>
      <MediaManager files={files} />
    </div>
  );
}
