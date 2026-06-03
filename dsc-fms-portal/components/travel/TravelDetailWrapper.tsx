'use client';

import { TravelProvider } from '@/context/TravelContext';
import { ReactNode } from 'react';

interface Props {
  travelId: string;
  children: ReactNode;
}

export default function TravelDetailWrapper({ travelId, children }: Props) {
  return (
    <TravelProvider travelId={travelId}>
      {children}
    </TravelProvider>
  );
}
