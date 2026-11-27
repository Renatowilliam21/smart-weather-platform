import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({
    show = false,
    onClose = () => {},
    onConfirm = () => {},
    title = 'Confirmar ação',
    message = '',
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    processing = false,
}) {
    return (
        <Modal show={show} maxWidth="md" onClose={onClose}>
            <div className="p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                        <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed">{message}</p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton type="button" onClick={onClose} disabled={processing}>
                        {cancelLabel}
                    </SecondaryButton>
                    <DangerButton type="button" onClick={onConfirm} disabled={processing}>
                        {confirmLabel}
                    </DangerButton>
                </div>
            </div>
        </Modal>
    );
}
