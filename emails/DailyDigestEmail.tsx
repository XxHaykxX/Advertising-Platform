import * as React from 'react';
import { Button, Section, Text } from '@react-email/components';

import {
  EmailLayout,
  buttonStyle,
  h1Style,
  mutedStyle,
  paragraphStyle,
} from './_components/Layout';

export interface DailyDigestEmailProps {
  name: string;
  period: string;
  items: Array<{ label: string; count: number }>;
  cabinetUrl: string;
}

export default function DailyDigestEmail({
  name = 'there',
  period = 'today',
  items = [],
  cabinetUrl = 'https://advertising-platform.am/cabinet',
}: DailyDigestEmailProps) {
  const total = items.reduce((sum, i) => sum + i.count, 0);
  return (
    <EmailLayout preview={`Your activity for ${period}`}>
      <Text style={h1Style}>Your daily digest</Text>
      <Text style={paragraphStyle}>Hi {name},</Text>
      <Text style={paragraphStyle}>
        Here&apos;s what happened in your account {period} ({total}{' '}
        {total === 1 ? 'item' : 'items'}):
      </Text>
      <Section style={{ margin: '12px 0 20px' }}>
        {items.length === 0 ? (
          <Text style={mutedStyle}>Nothing new today.</Text>
        ) : (
          items.map((item) => (
            <Text
              key={item.label}
              style={{
                ...paragraphStyle,
                borderBottom: '1px solid #e5e5ea',
                padding: '8px 0',
                margin: 0,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>{item.label}</span>
              <strong>{item.count}</strong>
            </Text>
          ))
        )}
      </Section>
      <Button href={cabinetUrl} style={buttonStyle}>
        Open your cabinet
      </Button>
      <Text style={{ ...mutedStyle, marginTop: 20 }}>
        You can turn off the daily digest in your account settings.
      </Text>
    </EmailLayout>
  );
}

DailyDigestEmail.PreviewProps = {
  name: 'Hayk',
  period: 'today',
  items: [
    { label: 'New inquiries assigned', count: 3 },
    { label: 'Awaiting your response', count: 2 },
    { label: 'Status changes', count: 5 },
  ],
  cabinetUrl: 'https://advertising-platform.am/cabinet',
} satisfies DailyDigestEmailProps;
