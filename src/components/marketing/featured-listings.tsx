import * as React from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { mockFeaturedListings } from '@/lib/mock-listings';

export function FeaturedListings() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-20">
      <header className="flex items-baseline justify-between gap-4">
        <h2 className="text-display-lg tracking-tight text-primary">
          Advertising opportunities
        </h2>
        <p className="text-body text-tertiary">Sample — live data after pilot launch</p>
      </header>

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {mockFeaturedListings.map((listing) => (
          <li key={listing.id}>
            <Card className="h-full">
              <CardHeader>
                <p className="text-caption uppercase text-tertiary">
                  {listing.channel}
                </p>
                <CardTitle>{listing.publisher}</CardTitle>
                <CardDescription>{listing.format}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-body text-secondary">
                  Reach: <span className="text-primary">{listing.reach}</span>
                </p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
