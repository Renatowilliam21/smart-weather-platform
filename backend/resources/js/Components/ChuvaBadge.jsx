export const ESTILOS_CHUVA = {
    sem_chuva: {
        badge: 'bg-gray-100 text-gray-600 border border-gray-200',
        banner: 'bg-gray-50 border border-gray-200 text-gray-800',
        texto: 'text-gray-600',
        icone: 'text-gray-400',
    },
    fraca: {
        badge: 'bg-sky-100 text-sky-800 border border-sky-200',
        banner: 'bg-sky-50 border border-sky-200 text-sky-900',
        texto: 'text-sky-700',
        icone: 'text-sky-600',
    },
    moderada: {
        badge: 'bg-blue-100 text-blue-800 border border-blue-300',
        banner: 'bg-blue-50 border border-blue-300 text-blue-950',
        texto: 'text-blue-700',
        icone: 'text-blue-600',
    },
    intensa: {
        badge: 'bg-indigo-100 text-indigo-800 border border-indigo-300',
        banner: 'bg-indigo-50 border border-indigo-300 text-indigo-950',
        texto: 'text-indigo-700',
        icone: 'text-indigo-600',
    },
    muito_intensa: {
        badge: 'bg-purple-100 text-purple-900 border border-purple-300',
        banner: 'bg-purple-50 border border-purple-300 text-purple-950',
        texto: 'text-purple-800',
        icone: 'text-purple-700',
    },
};

export function obterEstiloChuva(classificacao) {
    return ESTILOS_CHUVA[classificacao] ?? ESTILOS_CHUVA.sem_chuva;
}

export function formatarMm(valor) {
    if (valor === null || valor === undefined || valor === '') return '—';
    const numero = Number(valor);
    if (Number.isNaN(numero)) return '—';
    return String(Math.round((numero + Number.EPSILON) * 100) / 100);
}

export function IconeChuva({ className = 'h-4 w-4' }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
            <path d="M8 19v2" />
            <path d="M8 13v2" />
            <path d="M16 19v2" />
            <path d="M16 13v2" />
            <path d="M12 21v2" />
            <path d="M12 15v2" />
        </svg>
    );
}

export default function ChuvaBadge({
    chuva,
    mostrarVolume = false,
    unidade = 'mm/h',
    exibirSemChuva = false,
    className = '',
}) {
    if (!chuva) return null;
    if (!chuva.chovendo && !exibirSemChuva) return null;

    const estilo = obterEstiloChuva(chuva.chuva_classificacao);
    const volume = chuva.chuva_ultima_hora_mm;
    const temVolume = mostrarVolume && volume !== null && volume !== undefined;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${estilo.badge} ${className}`}
        >
            {chuva.chovendo && <IconeChuva className={`h-3.5 w-3.5 shrink-0 ${estilo.icone}`} />}
            <span>{chuva.chuva_label}</span>
            {temVolume && (
                <span className="font-mono opacity-85">
                    · {formatarMm(volume)} {unidade}
                </span>
            )}
        </span>
    );
}

