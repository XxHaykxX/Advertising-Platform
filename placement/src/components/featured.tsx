import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { ProjectCard } from "./project-card";
import type { ProjectListDTO } from "@/lib/types";

export function Featured({ projects }: { projects: ProjectListDTO[] }) {
  return (
    <Section id="featured" muted>
      <Container>
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <Reveal>
            <h2 className="text-4xl font-bold md:text-5xl">Featured Productions</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, idx) => (
            <Reveal key={project.id} delay={idx * 0.1}>
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
