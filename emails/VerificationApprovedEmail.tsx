import * as React from 'react';
import { Button, Text } from '@react-email/components';

import {
  EmailLayout,
  buttonStyle,
  h1Style,
  paragraphStyle,
} from './_components/Layout';

export interface VerificationApprovedEmailProps {
  name: string;
  companyName: string;
  cabinetUrl: string;
}

export default function VerificationApprovedEmail({
  name = 'there',
  companyName = 'Your Company',
  cabinetUrl = 'https://advertising-platform.am/cabinet',
}: VerificationApprovedEmailProps) {
  return (
    <EmailLayout preview={`${companyName} is verified`}>
      <Text style={h1Style}>You&apos;re verified</Text>
      <Text style={paragraphStyle}>Hi {name},</Text>
      <Text style={paragraphStyle}>
        We&apos;ve reviewed your documents for <strong>{companyName}</strong>{' '}
        and approved your account. You can now submit inquiries (if you&apos;re
        an advertiser) or publish listings (if you&apos;re a publisher).
      </Text>
      <Button href={cabinetUrl} style={buttonStyle}>
        Open your cabinet
      </Button>
    </EmailLayout>
  );
}

VerificationApprovedEmail.PreviewProps = {
  name: 'Hayk',
  companyName: 'Demo Media LLC',
  cabinetUrl: 'https://advertising-platform.am/cabinet',
} satisfies VerificationApprovedEmailProps;
