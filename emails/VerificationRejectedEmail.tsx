import * as React from 'react';
import { Button, Text } from '@react-email/components';

import {
  EmailLayout,
  buttonStyle,
  h1Style,
  mutedStyle,
  paragraphStyle,
} from './_components/Layout';

export interface VerificationRejectedEmailProps {
  name: string;
  companyName: string;
  reason: string;
  appealUrl: string;
}

export default function VerificationRejectedEmail({
  name = 'there',
  companyName = 'Your Company',
  reason = 'Documents could not be verified.',
  appealUrl = 'https://advertising-platform.am/cabinet/verification',
}: VerificationRejectedEmailProps) {
  return (
    <EmailLayout preview={`${companyName} verification needs attention`}>
      <Text style={h1Style}>Verification needs attention</Text>
      <Text style={paragraphStyle}>Hi {name},</Text>
      <Text style={paragraphStyle}>
        We couldn&apos;t verify <strong>{companyName}</strong> based on the
        documents you submitted. Here&apos;s what our team noted:
      </Text>
      <Text
        style={{
          ...paragraphStyle,
          backgroundColor: '#fdecec',
          borderLeft: '3px solid #d93636',
          padding: '12px 14px',
          borderRadius: 6,
        }}
      >
        {reason}
      </Text>
      <Button href={appealUrl} style={buttonStyle}>
        Resubmit documents
      </Button>
      <Text style={{ ...mutedStyle, marginTop: 20 }}>
        You can update your submission and we&apos;ll review it again. If you
        have questions, just reply to this email.
      </Text>
    </EmailLayout>
  );
}

VerificationRejectedEmail.PreviewProps = {
  name: 'Hayk',
  companyName: 'Demo Media LLC',
  reason:
    'Tax ID on the certificate does not match the company name in your profile.',
  appealUrl: 'https://advertising-platform.am/cabinet/verification',
} satisfies VerificationRejectedEmailProps;
