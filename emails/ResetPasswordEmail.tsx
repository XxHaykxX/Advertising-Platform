import * as React from 'react';
import { Button, Text } from '@react-email/components';

import {
  EmailLayout,
  buttonStyle,
  h1Style,
  mutedStyle,
  paragraphStyle,
} from './_components/Layout';

export interface ResetPasswordEmailProps {
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export default function ResetPasswordEmail({
  name = 'there',
  resetUrl = 'https://advertising-platform.am/auth/reset?token=demo',
  expiresInMinutes = 30,
}: ResetPasswordEmailProps) {
  return (
    <EmailLayout preview="Reset your password">
      <Text style={h1Style}>Reset your password</Text>
      <Text style={paragraphStyle}>Hi {name},</Text>
      <Text style={paragraphStyle}>
        We received a request to reset the password on your account. Use the
        button below to set a new one.
      </Text>
      <Button href={resetUrl} style={buttonStyle}>
        Set new password
      </Button>
      <Text style={{ ...mutedStyle, marginTop: 20 }}>
        This link expires in {expiresInMinutes} minutes. If you didn&apos;t
        request a reset, you can ignore this email — your password stays the
        same.
      </Text>
    </EmailLayout>
  );
}

ResetPasswordEmail.PreviewProps = {
  name: 'Hayk',
  resetUrl: 'https://advertising-platform.am/auth/reset?token=abc123',
  expiresInMinutes: 30,
} satisfies ResetPasswordEmailProps;
