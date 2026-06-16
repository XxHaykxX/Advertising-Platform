import nodemailer from "nodemailer";

export type ApplicationMail = {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  company?: string | null;
  projectTitle?: string | null;
  budget?: string | null;
  message?: string | null;
};

/**
 * Notifies the manager about a new application. In dev (no SMTP_HOST set) it
 * logs to the console instead of sending — wire real SMTP creds in .env for prod.
 */
export async function sendNewApplicationEmail(app: ApplicationMail) {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
    NOTIFY_EMAIL,
  } = process.env;

  const subject = `Новая заявка #${app.id} — ${app.name}`;
  const lines = [
    `Имя: ${app.name}`,
    `Телефон: ${app.phone}`,
    app.email ? `Email: ${app.email}` : null,
    app.company ? `Компания: ${app.company}` : null,
    app.projectTitle ? `Проект: ${app.projectTitle}` : null,
    app.budget ? `Бюджет: ${app.budget}` : null,
    app.message ? `Сообщение: ${app.message}` : null,
  ].filter(Boolean);
  const text = lines.join("\n");

  if (!SMTP_HOST || !NOTIFY_EMAIL) {
    console.log(`\n[mailer:dev] ${subject}\n${text}\n`);
    return;
  }

  const port = Number(SMTP_PORT) || 465;
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });

  await transport.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: NOTIFY_EMAIL,
    subject,
    text,
  });
}
