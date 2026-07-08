import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Stats } from "@/components/stats";
import { Featured } from "@/components/featured";
import { Trust } from "@/components/trust";
import HowItWorks from "@/components/how-it-works";
import GetStarted from "@/components/get-started";
import Why from "@/components/why";
import Faq from "@/components/faq";
import Contact from "@/components/contact";
import { Footer } from "@/components/footer";
import { getProjects } from "@/lib/data/projects";

export default async function Home() {
  const projects = await getProjects();

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Stats />
        <Featured projects={projects.slice(0, 6)} />
        <Trust />
        <HowItWorks />
        <GetStarted />
        <Why />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
