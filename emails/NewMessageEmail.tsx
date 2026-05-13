import * as React from 'react';
import { Button, Text } from '@react-email/components';

import {
  EmailLayout,
  buttonStyle,
  h1Style,
  mutedStyle,
  paragraphStyle,
} from './_components/Layout';

export interface NewMessageEmailProps {
  name: string;
  inquiryRef: string;
  senderLabel: string;
  preview: string;
  inquiryUrl: string;
}

export default function NewMessageEmail({
  name = 'there',
  inquiryRef = 'INQ-0001',
  senderLabel = 'Our team',
  preview = '...',
  inquiryUrl = 'https://advertising-platform.am/cabinet/inquiries/demo',
}: NewMessageEmailProps) {
  return (
    <EmailLayout preview={`New message in ${inquiryRef}`}>
      <Text style={h1Style}>New message</Text>
      <Text style={paragraphStyle}>Hi {name},</Text>
      <Text style={paragraphStyle}>
        <strong>{senderLabel}</strong> sent a message in inquiry{' '}
        <strong>{inquiryRef}</strong>:
      </Text>
      <Text
        style={{
          ...paragraphStyle,
          backgroundColor: '#f0f0f3',
          padding: '12px 14px',
          borderRadius: 6,
          fontStyle: 'italic',
        }}
      >
        {preview}
      </Text>
      <Button href={inquiryUrl} style={buttonStyle}>
        Open the chat
      </Button>
      <Text style={{ ...mutedStyle, marginTop: 20 }}>
        Reply in-app — replies to this email won&apos;t reach the sender.
      </Text>
    </EmailLayout>
  );
}

NewMessageEmail.PreviewProps = {
  name: 'Hayk',
  inquiryRef: 'INQ-0042',
  senderLabel: 'Advertising Platform team',
  preview:
    'We just got a rate confirmation from the publisher — please review and confirm on your side.',
  inquiryUrl: 'https://advertising-platform.am/cabinet/inquiries/inq-0042',
} satisfies NewMessageEmailProps;
