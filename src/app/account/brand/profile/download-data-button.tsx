"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBrandDataExport } from "../actions";

/** "Download my data (JSON)" — fetches the export string from a Server
 *  Action, then triggers a client-side Blob download. No dedicated API route
 *  needed, keeping this entirely inside src/app/account/brand/**. */
export function DownloadDataButton({ label }: { label: string }) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      const json = await getBrandDataExport();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "brand-data.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" variant="secondary" size="md" disabled={pending} className="gap-2" onClick={handleClick}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {label}
    </Button>
  );
}
