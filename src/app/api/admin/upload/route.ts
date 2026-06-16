import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { isAuthed } from "@/lib/auth/require";

/* Admin image upload → /public/uploads/<type>/<uuid>.<ext>. Returns the public
   path. Auth is checked here because middleware only guards /admin/* (not /api). */

const TYPES = new Set([
  "posters",
  "gallery",
  "portfolio",
  "partners",
  "actors",
  "misc",
]);
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Не авторизован." }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  let type = String(form?.get("type") || "misc");
  if (!TYPES.has(type)) type = "misc";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан." }, { status: 400 });
  }
  const ext = EXT[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Только JPG, PNG или WebP." },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Файл больше 5 МБ." },
      { status: 413 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), "public", "uploads", type);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, name), buf);

  return NextResponse.json({ path: `/uploads/${type}/${name}` });
}
