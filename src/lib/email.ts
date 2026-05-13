import * as React from 'react';
import * as Sentry from '@sentry/nextjs';
import { Resend } from 'resend';
import type { NotificationType } from '@prisma/client';

import { prisma } from '@/lib/prisma';

// ─── Resend singleton ───────────────────────────────────────────────────────
// Lazy so that build-time evaluation doesn't crash when RESEND_API_KEY is empty.

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  _resend = new Resend(key);
  return _resend;
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM || 'noreply@advertising-platform.local';
}

// ─── sendEmail — bare wrapper around Resend SDK ─────────────────────────────

export interface SendEmailParams<TProps extends Record<string, unknown>> {
  to: string | string[];
  subject: string;
  template: React.ComponentType<TProps>;
  data: TProps;
}

export interface SendEmailResult {
  sent: boolean;
  providerId?: string;
  error?: Error;
}

export async function sendEmail<TProps extends Record<string, unknown>>({
  to,
  subject,
  template: Template,
  data,
}: SendEmailParams<TProps>): Promise<SendEmailResult> {
  const resend = getResend();
  if (!resend) {
    // No API key configured (e.g., local dev without Resend setup).
    // Treat as a clean no-op rather than throwing — caller's Notification
    // row was already written and that's the source of truth for the user.
    return { sent: false, error: new Error('RESEND_API_KEY is not set') };
  }

  try {
    const { data: response, error } = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      react: React.createElement(Template, data),
    });

    if (error) {
      return { sent: false, error: new Error(error.message) };
    }
    return { sent: true, providerId: response?.id };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return { sent: false, error };
  }
}

// ─── tryEmailSend — Notification-first, never-throw wrapper ─────────────────
// Writes the in-app Notification row first (source of truth), then attempts
// the email send. Failures are logged to Sentry but never bubble up — the
// caller's flow (registration, status change, etc.) must not be blocked.

export interface TryEmailSendParams<TProps extends Record<string, unknown>>
  extends SendEmailParams<TProps> {
  userId: string;
  notification: {
    type: NotificationType;
    title: string;
    body?: string;
    link?: string;
  };
}

export interface TryEmailSendResult {
  notificationId: string;
  email: SendEmailResult;
}

export async function tryEmailSend<TProps extends Record<string, unknown>>({
  userId,
  notification,
  ...sendParams
}: TryEmailSendParams<TProps>): Promise<TryEmailSendResult> {
  // 1. Persist Notification row first — this is the user-visible truth.
  const row = await prisma.notification.create({
    data: {
      userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      link: notification.link,
    },
  });

  // 2. Attempt email delivery. Failures are reported but do not throw.
  const email = await sendEmail(sendParams);

  if (!email.sent && email.error) {
    Sentry.captureException(email.error, {
      tags: { service: 'email', notificationType: notification.type },
      extra: {
        userId,
        notificationId: row.id,
        to: sendParams.to,
        subject: sendParams.subject,
      },
    });
  }

  return { notificationId: row.id, email };
}
