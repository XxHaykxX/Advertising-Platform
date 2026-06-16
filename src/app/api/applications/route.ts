import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNewApplicationEmail } from "@/lib/mailer";

function clean(v: unknown) {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

/* ── In-memory submit rate limit (per IP) ── */
const WINDOW_MS = 10 * 60 * 1000;
const MAX = 5;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || rec.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX;
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0] : req.headers.get("x-real-ip"))?.trim() || "local";
}

export async function POST(req: Request) {
  try {
    const data = await req.json().catch(() => ({}));

    // Honeypot: bots fill the hidden field → silently accept, store nothing.
    if (clean(data.website)) return NextResponse.json({ ok: true });

    if (rateLimited(clientIp(req))) {
      return NextResponse.json(
        { error: "Слишком много заявок. Попробуйте позже." },
        { status: 429 },
      );
    }

    const name = clean(data.name);
    const phone = clean(data.phone);
    const consent = Boolean(data.consent);

    if (!name || !phone || !consent) {
      return NextResponse.json(
        { error: "Имя, телефон и согласие обязательны." },
        { status: 400 },
      );
    }

    const projectTitle = clean(data.project);
    let projectId: number | null = null;
    if (projectTitle) {
      const match = await prisma.project.findFirst({
        where: { titleRu: projectTitle },
        select: { id: true },
      });
      projectId = match?.id ?? null;
    }

    const app = await prisma.application.create({
      data: {
        name,
        phone,
        email: clean(data.email),
        company: clean(data.company),
        projectId,
        projectTitle,
        budget: clean(data.budget),
        message: clean(data.message),
        consent,
      },
    });

    // Don't fail the request if the notification email errors.
    sendNewApplicationEmail(app).catch((e) =>
      console.error("[applications] email failed:", e),
    );

    return NextResponse.json({ ok: true, id: app.id });
  } catch (e) {
    console.error("[applications] error:", e);
    return NextResponse.json({ error: "Ошибка сервера." }, { status: 500 });
  }
}
