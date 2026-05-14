import * as React from 'react';

import { FeaturedListings } from '@/components/marketing/featured-listings';
import { MarketingHero } from '@/components/marketing/hero';
import { HowItWorks } from '@/components/marketing/how-it-works';
import { OurPartners } from '@/components/marketing/our-partners';
import { OurWorks } from '@/components/marketing/our-works';

export default function HomePage() {
  return (
    <>
      <MarketingHero />
      <FeaturedListings />
      <OurPartners />
      <OurWorks />
      <HowItWorks />
    </>
  );
}
