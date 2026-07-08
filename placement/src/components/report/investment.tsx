import { BarChart3, Check, Download, Share2 } from "lucide-react";
import { AccentBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApplyDialog } from "@/components/apply-dialog";
import { Reveal } from "@/components/ui/reveal";
import type { ProjectDetailDTO } from "@/lib/types";

const INCLUDED_ITEMS = [
  "Verified scene-level placement opportunities",
  "Brand safety analysis with GARM scoring",
  "Projected performance metrics",
  "Dedicated placement coordinator",
  "Post-campaign performance reporting",
  "Content approval workflow",
];

const COMPARISON_ROWS = [
  { channel: "TV Commercial (30s)", cost: "$150,000+" },
  { channel: "Print Ad Campaign", cost: "$50,000+" },
  { channel: "Influencer Partnership", cost: "$10,000-50,000" },
];

export function Investment({ project }: { project: ProjectDetailDTO }) {
  return (
    <section id="investment" className="py-10">
      <div className="mx-auto w-full max-w-[1200px] px-6 max-sm:px-4">
        <Reveal>
          <h2 className="text-2xl font-bold text-foreground">Investment &amp; Deliverables</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Placement packages and competitive pricing
          </p>
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Reveal delay={0.05}>
            <div className="h-full rounded-2xl border border-border bg-card p-6">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Investment
              </span>
              <div className="mt-1 text-3xl font-extrabold text-foreground">
                {project.budgetRange}
              </div>
              <ul className="mt-5 space-y-2.5">
                {INCLUDED_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="h-full rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <BarChart3 className="h-4 w-4 text-primary" />
                How This Compares
              </div>

              <div className="mt-4 rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success">
                ≈85% cheaper than traditional TV CPM
              </div>

              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-medium">Channel</th>
                    <th className="pb-2 text-right font-medium">Typical Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.channel} className="border-t border-border">
                      <td className="py-2.5 text-muted-foreground">{row.channel}</td>
                      <td className="py-2.5 text-right text-foreground">{row.cost}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-border">
                    <td className="py-2.5">
                      <span className="flex items-center gap-2 font-semibold text-primary">
                        This Platform
                        <AccentBadge>Best value</AccentBadge>
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-primary">
                      {project.cpmRange}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 px-6 py-5">
            <div>
              <h3 className="font-semibold text-foreground">Ready to place your brand?</h3>
              <p className="text-sm text-muted-foreground">
                Submit your interest and our team will reach out within 24 hours.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" size="sm">
                <Download className="mr-1.5 h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="secondary" size="sm">
                <Share2 className="mr-1.5 h-4 w-4" />
                Share
              </Button>
              <ApplyDialog
                projectId={project.id}
                projectTitle={project.title}
                trigger={
                  <Button variant="primary" size="sm">
                    Express Interest
                  </Button>
                }
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
