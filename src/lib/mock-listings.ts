// Mock data for the Phase-1 marketing pages. Real data wires in via S-04.x.

export interface MockListing {
  id: string;
  publisher: string;
  channel: string;
  format: string;
  reach: string;
}

export const mockFeaturedListings: MockListing[] = [
  {
    id: 'mock-1',
    publisher: 'Radio Yerevan',
    channel: 'Radio',
    format: 'Morning drive slot · 30s',
    reach: '~180k weekly listeners',
  },
  {
    id: 'mock-2',
    publisher: 'Northern Avenue Billboards',
    channel: 'Outdoor',
    format: 'LED panel · Northern Ave · 7-day rotation',
    reach: '~95k daily impressions',
  },
  {
    id: 'mock-3',
    publisher: 'Studio Granat',
    channel: 'Product placement',
    format: 'Branded prop · feature film',
    reach: '40-50k theatrical viewers',
  },
  {
    id: 'mock-4',
    publisher: 'Armenia TV',
    channel: 'TV',
    format: 'Prime-time bumper · 15s',
    reach: '~250k household impressions',
  },
];
