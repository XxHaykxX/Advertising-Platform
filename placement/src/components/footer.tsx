import Link from "next/link";
import { Share2, X, Video } from "lucide-react";
import { Container } from "@/components/ui/container";

export function Footer() {
  return (
    <footer className="bg-section border-t border-border">
      <Container className="py-16 max-sm:py-12">
        {/* Top section: Wordmark and tagline */}
        <div className="mb-12">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl font-bold text-foreground">
              <span className="text-primary">FP</span> Placement
            </h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Discover premium brand placement opportunities in film and TV.
          </p>
        </div>

        {/* Link columns */}
        <div className="mb-12 grid grid-cols-3 gap-8 md:grid-cols-1">
          {/* Product */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/catalog"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Browse Projects
                </Link>
              </li>
              <li>
                <Link
                  href="/#how-it-works"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/#faq"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/#about"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/#contact"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social icons */}
        <div className="mb-6 flex gap-4">
          <Link
            href="#"
            className="text-muted-foreground transition-colors hover:text-primary"
            aria-label="LinkedIn"
          >
            <Share2 size={20} />
          </Link>
          <Link
            href="#"
            className="text-muted-foreground transition-colors hover:text-primary"
            aria-label="Twitter"
          >
            <X size={20} />
          </Link>
          <Link
            href="#"
            className="text-muted-foreground transition-colors hover:text-primary"
            aria-label="YouTube"
          >
            <Video size={20} />
          </Link>
        </div>

        {/* Bottom: Copyright */}
        <div className="border-t border-border pt-6">
          <p className="text-[13px] text-muted-foreground">
            © 2026 FP Placement. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
