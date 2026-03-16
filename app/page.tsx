import { Suspense } from 'react';
import { TierListScreen } from '../features/tier-list/components/TierListScreen';

export default function TierListApp() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-main" />}>
      <TierListScreen />
    </Suspense>
  );
}
