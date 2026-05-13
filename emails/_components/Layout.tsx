import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

// Brand tokens — kept inline (email CSS must not rely on external stylesheets).
export const brand = {
  bg: '#f5f5f7',
  surface: '#ffffff',
  text: '#0a0a0f',
  textMuted: '#5a5a65',
  border: '#e5e5ea',
  accent: '#3fb91a', // light-mode accent variant for email contrast
  accentText: '#ffffff',
} as const;

const fontStack =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif';

const main: React.CSSProperties = {
  backgroundColor: brand.bg,
  fontFamily: fontStack,
  margin: 0,
  padding: '24px 0',
};

const container: React.CSSProperties = {
  backgroundColor: brand.surface,
  border: `1px solid ${brand.border}`,
  borderRadius: 10,
  maxWidth: 560,
  margin: '0 auto',
  padding: '32px 32px 28px',
};

const wordmark: React.CSSProperties = {
  color: brand.text,
  fontSize: 16,
  fontWeight: 600,
  letterSpacing: '-0.01em',
  margin: 0,
};

const footer: React.CSSProperties = {
  color: brand.textMuted,
  fontSize: 12,
  lineHeight: '18px',
  marginTop: 24,
};

const divider: React.CSSProperties = {
  borderColor: brand.border,
  borderWidth: '0 0 1px 0',
  margin: '28px 0 20px',
};

export interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Text style={wordmark}>
              ADVERTISING<span style={{ color: brand.accent }}>.</span>
            </Text>
          </Section>
          <Hr style={divider} />
          {children}
          <Hr style={divider} />
          <Text style={footer}>
            You received this email because you have an account on Advertising
            Platform. If this wasn&apos;t you, please ignore this message or
            contact support.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Re-usable typographic helpers used across templates.
export const h1Style: React.CSSProperties = {
  color: brand.text,
  fontSize: 22,
  fontWeight: 600,
  lineHeight: '28px',
  margin: '0 0 12px',
};

export const paragraphStyle: React.CSSProperties = {
  color: brand.text,
  fontSize: 15,
  lineHeight: '22px',
  margin: '0 0 12px',
};

export const mutedStyle: React.CSSProperties = {
  color: brand.textMuted,
  fontSize: 13,
  lineHeight: '20px',
  margin: '0 0 8px',
};

export const buttonStyle: React.CSSProperties = {
  backgroundColor: brand.accent,
  color: brand.accentText,
  display: 'inline-block',
  padding: '12px 20px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  textDecoration: 'none',
};

export const codeBoxStyle: React.CSSProperties = {
  backgroundColor: '#f0f0f3',
  border: `1px solid ${brand.border}`,
  borderRadius: 8,
  color: brand.text,
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  fontSize: 24,
  fontWeight: 600,
  letterSpacing: '0.2em',
  padding: '14px 20px',
  textAlign: 'center',
  margin: '12px 0 20px',
};
