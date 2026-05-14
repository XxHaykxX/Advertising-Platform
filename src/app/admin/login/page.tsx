import * as React from 'react';

import { AdminLoginForm } from './_form';

export const metadata = {
  title: 'Admin login — Advertising Platform',
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">
        <header className="mb-8 flex flex-col gap-2">
          <p className="text-caption uppercase text-tertiary">Super Admin</p>
          <h1 className="text-display-lg tracking-tight text-primary">
            Sign in to the console
          </h1>
          <p className="text-body-lg text-secondary">
            Two-factor authentication is required for every session.
          </p>
        </header>

        <AdminLoginForm />
      </div>
    </main>
  );
}
