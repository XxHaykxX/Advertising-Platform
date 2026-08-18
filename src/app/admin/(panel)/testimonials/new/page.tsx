import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSuperadmin } from "@/lib/auth/require";
import { createTestimonial } from "../actions";
import { TestimonialForm } from "../testimonial-form";

export default async function NewTestimonialPage() {
  await requireSuperadmin();

  return (
    <div>
      <Link
        href="/admin/testimonials"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to testimonials
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-bold text-foreground">New testimonial</h1>
      <TestimonialForm action={createTestimonial} submitLabel="Create testimonial" />
    </div>
  );
}
