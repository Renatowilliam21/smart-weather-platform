import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function normalizarRotulo(label) {
    if (!label) return '';
    return String(label)
        .replace(/&laquo;|&raquo;/g, '')
        .replace(/&hellip;/g, '…')
        .trim();
}

export default function Pagination({ links = [] }) {
    if (!links || links.length <= 3) {
        return null;
    }

    return (
        <nav
            aria-label="Paginação"
            className="px-6 py-4 border-t border-gray-100 flex items-center flex-wrap gap-1.5"
        >
            {links.map((link, i) => {
                const ehAnterior = i === 0;
                const ehProximo = i === links.length - 1;
                const conteudo = ehAnterior ? (
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                ) : ehProximo ? (
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                ) : (
                    normalizarRotulo(link.label)
                );

                const ariaLabel = ehAnterior
                    ? 'Página anterior'
                    : ehProximo
                    ? 'Próxima página'
                    : `Página ${normalizarRotulo(link.label)}`;

                const classesBase =
                    'inline-flex items-center justify-center min-w-[32px] h-8 px-2.5 rounded text-sm font-medium transition-colors';

                if (!link.url) {
                    return (
                        <span
                            key={i}
                            aria-disabled="true"
                            aria-label={ehAnterior || ehProximo ? ariaLabel : undefined}
                            className={`${classesBase} text-gray-300 bg-gray-50 cursor-not-allowed`}
                        >
                            {conteudo}
                        </span>
                    );
                }

                return (
                    <Link
                        key={i}
                        href={link.url}
                        preserveState
                        preserveScroll
                        aria-label={ariaLabel}
                        aria-current={link.active ? 'page' : undefined}
                        title={ehAnterior || ehProximo ? ariaLabel : undefined}
                        className={`${classesBase} ${
                            link.active
                                ? 'bg-gray-800 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {conteudo}
                    </Link>
                );
            })}
        </nav>
    );
}
