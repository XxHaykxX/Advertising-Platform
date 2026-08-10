import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireContentEditor } from "@/lib/auth/require";
import { createAdSpace } from "../actions";
import { AdSpaceForm } from "../ad-space-form";
import { translateAdSpaceAction } from "../translate-action";
import { adSpaceChannelOptions } from "../write";

export default async function NewAdSpacePage() {
  await requireContentEditor();

  return (
    <div>
      <Link
        href="/admin/ad-spaces"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to ad spaces
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-bold text-foreground">New ad space</h1>
      <AdSpaceForm
        action={createAdSpace}
        translateAction={translateAdSpaceAction}
        channels={adSpaceChannelOptions("en")}
        mode="staff"
        submitLabel="Create ad space"
        cancelHref="/admin/ad-spaces"
      />
    </div>
  );
}
