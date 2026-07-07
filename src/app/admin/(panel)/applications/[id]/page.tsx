import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getApplication } from "@/lib/data/applications";
import { formatDateTime } from "@/lib/data/format";
import { type AppStatus } from "@/lib/constants";
import { requireSuperadmin } from "@/lib/auth/require";
import { StatusSelect } from "../status-select";
import { NoteForm } from "./note-form";

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/5 py-3 sm:flex-row sm:items-center sm:gap-4">
      <span className="w-40 shrink-0 text-xs uppercase tracking-wide text-white/40">
        {label}
      </span>
      <span className="text-sm text-foreground">{value || "—"}</span>
    </div>
  );
}

export default async function ApplicationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperadmin();

  const { id } = await params;
  const app = await getApplication(Number(id));
  if (!app) notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/applications"
        className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to applications
      </Link>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Application #{app.id}
          </h1>
          <p className="mt-1 text-sm text-white/55">
            {formatDateTime(app.createdAt)}
          </p>
        </div>
        <StatusSelect id={app.id} status={app.status as AppStatus} />
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <Row label="Name" value={app.name} />
        <Row label="Phone" value={app.phone} />
        <Row label="Email" value={app.email} />
        <Row label="Company" value={app.company} />
        <Row label="Project" value={app.projectTitle} />
        <Row label="Budget" value={app.budget} />
        <Row label="PD consent" value={app.consent ? "Yes" : "No"} />
        <div className="pt-3">
          <span className="text-xs uppercase tracking-wide text-white/40">
            Message
          </span>
          <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">
            {app.message || "—"}
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-primary">
          Manager note
        </h2>
        <NoteForm id={app.id} initial={app.note ?? ""} />
      </section>
    </div>
  );
}
