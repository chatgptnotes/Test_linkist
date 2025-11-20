'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/profile-dashboard');
  }, [router]);

  return null;
}
