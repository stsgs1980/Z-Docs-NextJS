'use client';

import { useState, useEffect } from 'react';
import { SelectElementFAB } from '@zai/select-element';

export default function ClientSelectElementWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <SelectElementFAB enableSourceInspection={false} />;
}
