import * as React from 'react';
import { Text } from '@react-email/components';

import {
  EmailLayout,
  codeBoxStyle,
  h1Style,
  mutedStyle,
  paragraphStyle,
} from './_components/Layout';

export interface VerifyEmailProps {
  name: string;
  code: string;
  expiresInMinutes: number;
}

export default function VerifyEmail({
  name = 'there',
  code = '000000',
  expiresInMinutes = 10,
}: VerifyEmailProps) {
  return (
    <EmailLayout preview={`Your verification code is ${code}`}>
      <Text style={h1Style}>Confirm your email</Text>
      <Text style={paragraphStyle}>Hi {name},</Text>
      <Text style={paragraphStyle}>
        Enter this code to finish creating your Advertising Platform account.
      </Text>
      <Text style={codeBoxStyle}>{code}</Text>
      <Text style={mutedStyle}>
        This code expires in {expiresInMinutes} minutes. If you didn&apos;t
        request it, you can ignore this email.
      </Text>
    </EmailLayout>
  );
}

VerifyEmail.PreviewProps = {
  name: 'Hayk',
  code: '482917',
  expiresInMinutes: 10,
} satisfies VerifyEmailProps;
