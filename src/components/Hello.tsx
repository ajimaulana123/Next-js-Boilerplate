'use client';

import { useUser } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export const Hello = () => {
  const t = useTranslations('Dashboard');
  const { user, isLoaded } = useUser();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isLoaded) {
    return null;
  }

  return (
    <p>
      👋
      {' '}
      {t('hello_message', {
        email: user?.primaryEmailAddress?.emailAddress ?? '',
      })}
    </p>
  );
};
