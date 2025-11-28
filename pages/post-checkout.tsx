import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthData } from '../lib/auth-context';

export default function PostCheckout() {
  const router = useRouter();
  const { refresh } = useAuthData();

  useEffect(() => {
    const syncAndRedirect = async () => {
      await refresh();
      router.replace('/dashboard');
    };
    syncAndRedirect();
  }, [refresh, router]);

  return (
    <main style={{ maxWidth: 720, margin: '60px auto', fontFamily: 'Inter, system-ui, Arial' }}>
      <h2>Finishing up…</h2>
      <p>We&apos;re updating your account. You&apos;ll be redirected to your dashboard momentarily.</p>
    </main>
  );
}
