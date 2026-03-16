'use client';

import { Suspense } from 'react';
import { TierListScreen } from '../features/tier-list/components/TierListScreen';

export default function TierListApp() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-main text-text-main flex items-center justify-center">
          Loading tier list...
        </div>
      }
    >
      <TierListScreen />
    </Suspense>
  );
}
