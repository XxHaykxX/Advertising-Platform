import * as React from 'react';
import { Button, Text } from '@react-email/components';

import {
  EmailLayout,
  buttonStyle,
  h1Style,
  mutedStyle,
  paragraphStyle,
} from './_components/Layout';

export interface InquiryStatusEmailProps {
  name: string;
  inquiryRef: string;
  newStatus: string;
  inquiryUrl: string;
  message?: string;
}

export default function InquiryStatusEmail({
  name = 'there',
  inquiryRef = 'INQ-0001',
  newStatus = 'In Progress',
  inquiryUrl = 'https://advertising-platform.am/cabinet/inquiries/demo',
  message,
}: InquiryStatusEmailProps) {
  return (
    <EmailLayout preview={`${inquiryRef} is now ${newStatus}`}>
      <Text style={h1Style}>Inquiry update</Text>
      <Text style={paragraphStyle}>Hi {name},</Text>
      <Text style={paragraphStyle}>
        Your inquiry <strong>{inquiryRef}</strong> moved to{' '}
        <strong>{newStatus}</strong>.
      </Text>
      {message ? (
        <Text
          style={{
            ...paragraphStyle,
            backgroundColor: '#f0f0f3',
            padding: '12px 14px',
            borderRadius: 6,
          }}
        >
          {message}
        </Text>
      ) : null}
      <Button href={inquiryUrl} style={buttonStyle}>
        Open the inquiry
      </Button>
      <Text style={{ ...mutedStyle, marginTop: 20 }}>
        Reply in-app to keep the conversation with our team in one place.
      </Text>
    </EmailLayout>
  );
}

InquiryStatusEmail.PreviewProps = {
  name: 'Hayk',
  inquiryRef: 'INQ-0042',
  newStatus: 'Awaiting Advertiser',
  inquiryUrl: 'https://advertising-platform.am/cabinet/inquiries/inq-0042',
  message: 'Publisher confirmed availability and proposed a rate of $X.',
} satisfies InquiryStatusEmailProps;
