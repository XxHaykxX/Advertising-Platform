import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSuperadmin } from "@/lib/auth/require";
import { createMember } from "../actions";
import { UserForm } from "../user-form";

export default async function NewMemberPage() {
  await requireSuperadmin();

  return (
    <div>
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to users
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-bold text-foreground">Create member</h1>
      <UserForm action={createMember} />
    </div>
  );
}
