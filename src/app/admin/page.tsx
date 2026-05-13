import { redirect } from 'next/navigation';

import { auth } from '@/auth';

export const metadata = {
  title: 'Admin — Advertising Platform',
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/dashboard');

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-8 py-16">
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-tertiary">Admin</p>
        <h1 className="text-display-lg tracking-tight text-primary">
          Super Admin
        </h1>
        <p className="text-body-lg text-secondary">
          Welcome, {session.user.name}. The full admin queue, verification
          tools, and analytics land in Epic 8 (S-08.x → S-09.x → S-10.x).
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
