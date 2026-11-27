import { Transition } from '@headlessui/react';
import { usePage } from '@inertiajs/react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const ESTILOS_TOAST = {
    success: {
        container: 'bg-white border-l-4 border-emerald-500 text-gray-800',
        iconeClass: 'text-emerald-500',
        titulo: 'Sucesso',
        Icone: CheckCircle2,
    },
    error: {
        container: 'bg-white border-l-4 border-red-500 text-gray-800',
        iconeClass: 'text-red-500',
        titulo: 'Erro',
        Icone: AlertCircle,
    },
    warning: {
        container: 'bg-white border-l-4 border-amber-500 text-gray-800',
        iconeClass: 'text-amber-500',
        titulo: 'Atenção',
        Icone: AlertTriangle,
    },
    info: {
        container: 'bg-white border-l-4 border-blue-500 text-gray-800',
        iconeClass: 'text-blue-500',
        titulo: 'Informação',
        Icone: Info,
    },
};

export default function FlashToast() {
    const { flash } = usePage().props;
    const [notificacao, setNotificacao] = useState(null);
    const [visivel, setVisivel] = useState(false);

    useEffect(() => {
        if (!flash) return;

        const tipo = ['error', 'warning', 'success', 'info'].find((chave) => Boolean(flash[chave]));
        if (!tipo) return;

        setNotificacao({ tipo, mensagem: flash[tipo] });
        setVisivel(true);

        const timer = setTimeout(() => {
            setVisivel(false);
        }, 4500);

        return () => clearTimeout(timer);
    }, [flash?.id, flash?.success, flash?.error, flash?.warning, flash?.info]);

    const config = notificacao ? ESTILOS_TOAST[notificacao.tipo] ?? ESTILOS_TOAST.info : ESTILOS_TOAST.info;
    const Icone = config.Icone;

    return (
        <div
            aria-live="polite"
            className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-end px-4 sm:top-6 sm:px-6"
        >
            <Transition
                show={visivel && Boolean(notificacao)}
                enter="transform ease-out duration-300 transition"
                enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-4"
                enterTo="translate-y-0 opacity-100 sm:translate-x-0"
                leave="transition ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
            >
                <div
                    role="status"
                    className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg shadow-lg ring-1 ring-black/5 ${config.container}`}
                >
                    <div className="flex items-start gap-3 p-4">
                        <Icone className={`h-5 w-5 shrink-0 mt-0.5 ${config.iconeClass}`} aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900">{config.titulo}</p>
                            <p className="mt-0.5 text-sm text-gray-600">{notificacao?.mensagem}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setVisivel(false)}
                            className="inline-flex rounded-md text-gray-400 hover:text-gray-600 focus:outline-none"
                            aria-label="Fechar notificação"
                        >
                            <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </Transition>
        </div>
    );
}
