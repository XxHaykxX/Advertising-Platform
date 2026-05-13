import * as React from 'react';

import { FeaturedListings } from '@/components/marketing/featured-listings';
import { MarketingHero } from '@/components/marketing/hero';
import { HowItWorks } from '@/components/marketing/how-it-works';

export default function HomePage() {
  return (
    <>
      <MarketingHero />
      <FeaturedListings />
      <HowItWorks />
    </>
  );
}
