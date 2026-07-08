import { getProjects } from "@/lib/data/projects";
import { CatalogView } from "./catalog-view";

export default async function CatalogPage() {
  const projects = await getProjects();
  return <CatalogView projects={projects} />;
}
