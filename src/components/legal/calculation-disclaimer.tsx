import { AlertTriangle } from 'lucide-react';

export function CalculationDisclaimer() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 mb-4">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
      <p className="text-sm text-amber-700">
        Los resultados de calculo son orientativos. Como tecnico competente, usted es el unico responsable de verificar todos los calculos antes de firmar el certificado.
      </p>
    </div>
  );
}
