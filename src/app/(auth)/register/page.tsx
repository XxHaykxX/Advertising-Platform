import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Megaphone, Radio } from 'lucide-react';

import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Create your account — Advertising Platform',
};

interface RoleCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function RoleCard({ href, icon, title, description }: RoleCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-start gap-4 rounded-lg border border-border-subtle bg-surface p-5',
        'transition-colors duration-200 ease-out-expo',
        'hover:border-border-strong hover:bg-surface-elevated',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40'
      )}
    >
      <span className="mt-0.5 text-accent">{icon}</span>
      <span className="flex-1">
        <span className="block text-h3 font-medium text-primary">{title}</span>
        <span className="mt-1 block text-body text-secondary">{description}</span>
      </span>
      <ArrowRight
        size={20}
        className="mt-1 text-tertiary transition-transform duration-200 ease-out-expo group-hover:translate-x-1 group-hover:text-primary"
      />
    </Link>
  );
}

export default function RegisterRolePage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-tertiary">Step 1 of 2</p>
        <h1 className="text-display-lg tracking-tight text-primary">
          Pick your lane
        </h1>
        <p className="text-body-lg text-secondary">
          Are you placing ads, or selling ad space? You can extend your account later.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <RoleCard
          href="/register/personal?role=advertiser"
          icon={<Megaphone size={24} />}
          title="Advertiser"
          description="Brands, studios, agencies. Find ad slots and send inquiries."
        />
        <RoleCard
          href="/register/personal?role=publisher"
          icon={<Radio size={24} />}
          title="Publisher"
          description="TV, radio, outdoor, video, product placement. List your inventory."
        />
      </div>

      <p className="text-body text-secondary">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-primary underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
