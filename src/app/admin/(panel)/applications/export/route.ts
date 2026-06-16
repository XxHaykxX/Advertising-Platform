import { prisma } from "@/lib/prisma";
import { STATUS_LABEL, type AppStatus } from "@/lib/constants";

/* CSV export of all applications. Protected by admin middleware.
   Semicolon-delimited + UTF-8 BOM so Excel (RU locale) opens it cleanly. */

function cell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

const HEADERS = [
  "ID",
  "Дата",
  "Имя",
  "Телефон",
  "Email",
  "Компания",
  "Проект",
  "Бюджет",
  "Статус",
  "Сообщение",
  "Заметка",
  "Согласие",
];

export async function GET() {
  const apps = await prisma.application.findMany({
    orderBy: { createdAt: "desc" },
  });

  const lines = [HEADERS.map(cell).join(";")];
  for (const a of apps) {
    lines.push(
      [
        a.id,
        a.createdAt.toISOString(),
        a.name,
        a.phone,
        a.email,
        a.company,
        a.projectTitle,
        a.budget,
        STATUS_LABEL[a.status as AppStatus] ?? a.status,
        a.message,
        a.note,
        a.consent ? "да" : "нет",
      ]
        .map(cell)
        .join(";"),
    );
  }

  const csv = "﻿" + lines.join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="applications.csv"`,
    },
  });
}
