export const ESTILOS_CHUVA = {
    sem_chuva: {
        badge: 'bg-gray-100 text-gray-600',
        borda: 'border-gray-300',
        texto: 'text-gray-600',
    },
    fraca: {
        badge: 'bg-sky-100 text-sky-800',
        borda: 'border-sky-400',
        texto: 'text-sky-700',
    },
    moderada: {
        badge: 'bg-blue-100 text-blue-800',
        borda: 'border-blue-500',
        texto: 'text-blue-700',
    },
    intensa: {
        badge: 'bg-indigo-100 text-indigo-800',
        borda: 'border-indigo-500',
        texto: 'text-indigo-700',
    },
    muito_intensa: {
        badge: 'bg-purple-100 text-purple-800',
        borda: 'border-purple-500',
        texto: 'text-purple-800',
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
            className={`inline-block px-2 py-1 rounded text-xs font-medium ${estilo.badge} ${className}`}
        >
            {chuva.chuva_label}
            {temVolume ? ` · ${formatarMm(volume)} ${unidade}` : ''}
        </span>
    );
}
