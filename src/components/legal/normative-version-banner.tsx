'use client';

import { useState, useEffect } from 'react';
import { Info, X } from 'lucide-react';

const ENGINE_VERSION = '2026-03-01';
const STORAGE_KEY = 'normative_banner_dismissed';

export function NormativeVersionBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed !== ENGINE_VERSION) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, ENGINE_VERSION);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 mb-4">
      <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
      <p className="flex-1 text-sm text-blue-700">
        Motor de calculo actualizado a {ENGINE_VERSION}. Normativa incorporada: REBT 2002 + ITC-BT vigentes a {ENGINE_VERSION}. Verifique siempre la conformidad con la normativa aplicable en el momento de la firma.
      </p>
      <button onClick={dismiss} className="flex-shrink-0 rounded p-1 text-blue-400 hover:bg-blue-100 hover:text-blue-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
