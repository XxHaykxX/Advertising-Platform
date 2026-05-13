import * as React from 'react';

import { ForgotForm } from './_form';

export const metadata = {
  title: 'Reset your password — Advertising Platform',
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-display-lg tracking-tight text-primary">
          Forgot your password?
        </h1>
        <p className="text-body-lg text-secondary">
          Enter your email and we&apos;ll send a link to set a new one.
        </p>
      </header>

      <ForgotForm />
    </div>
  );
}
