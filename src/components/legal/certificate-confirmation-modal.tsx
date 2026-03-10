'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function CertificateConfirmationModal({ open, onOpenChange, onConfirm, loading }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar generacion de certificado</DialogTitle>
          <DialogDescription className="pt-2 leading-relaxed">
            ¿Confirma que ha verificado todos los datos y desea generar el certificado?
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-slate-600 leading-relaxed">
          Los datos introducidos seran utilizados para generar el documento oficial. Como tecnico firmante, usted asume la responsabilidad sobre su contenido.
        </p>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? 'Generando...' : 'Confirmar y generar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
