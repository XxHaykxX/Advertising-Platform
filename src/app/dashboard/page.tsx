import { redirect } from 'next/navigation';

import { auth } from '@/auth';

export const metadata = {
  title: 'Dashboard — Advertising Platform',
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-8 py-16">
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-tertiary">Dashboard</p>
        <h1 className="text-display-lg tracking-tight text-primary">
          Welcome, {session.user.name}
        </h1>
        <p className="text-body-lg text-secondary">
          Role: <span className="text-primary">{session.user.role}</span>. Your
          cabinet is being built — listings, inquiries, and notifications land
          in Phase 2.
        </p>
      </header>

      <form
        action={async () => {
          'use server';
          const { signOut } = await import('@/auth');
          await signOut({ redirectTo: '/' });
        }}
      >
        <button
          type="submit"
          className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          Log out
        </button>
      </form>
    </main>
  );
}
