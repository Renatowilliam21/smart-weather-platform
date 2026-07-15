export const METRICAS = {
    itgu: { rotulo: 'ITGU', unidade: '' },
    itu: { rotulo: 'ITU', unidade: '' },
    temperatura_ar: { rotulo: 'Temperatura do Ar', unidade: '°C' },
    umidade_ar: { rotulo: 'Umidade do Ar', unidade: '%' },
    luminosidade: { rotulo: 'Luminosidade', unidade: '%' },
    indice_uv: { rotulo: 'Índice UV', unidade: '' },
};

export function SeletorMetrica({ metricasDisponiveis, metricaSelecionada, onChange }) {
    return (
        <div className="flex flex-wrap gap-2">
            {metricasDisponiveis.map((chave) => (
                <button
                    key={chave}
                    onClick={() => onChange(chave)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        metricaSelecionada === chave
                            ? 'bg-gray-800 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    {METRICAS[chave]?.rotulo ?? chave}
                </button>
            ))}
        </div>
    );
}

const ROTULOS_PERIODO = { dia: 'Dia', mes: 'Mês', ano: 'Ano' };

export function SeletorPeriodo({ periodosDisponiveis, periodoSelecionado, onChange }) {
    return (
        <div className="flex gap-1 bg-gray-100 rounded p-1">
            {periodosDisponiveis.map((chave) => (
                <button
                    key={chave}
                    onClick={() => onChange(chave)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        periodoSelecionado === chave
                            ? 'bg-white text-gray-800 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    {ROTULOS_PERIODO[chave] ?? chave}
                </button>
            ))}
        </div>
    );
}

export function ajustarData(dataISO, periodo, direcao) {
    const d = new Date(dataISO + 'T12:00:00');
    if (periodo === 'mes') {
        d.setMonth(d.getMonth() + direcao);
    } else if (periodo === 'ano') {
        d.setFullYear(d.getFullYear() + direcao);
    } else {
        d.setDate(d.getDate() + direcao);
    }
    return d.toISOString().split('T')[0];
}

export function NavegacaoPeriodo({ periodo, dataReferencia, navegacaoPeriodo, onNavegar }) {
    const hojeISO = new Date().toISOString().split('T')[0];
    const anoAtual = new Date().getFullYear();
    const anosDisponiveis = [anoAtual, anoAtual - 1, anoAtual - 2, anoAtual - 3];

    return (
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5 flex-wrap">
            <button
                onClick={() => onNavegar(ajustarData(dataReferencia, periodo, -1))}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                aria-label="Período anterior"
            >
                ‹
            </button>

            <span className="text-sm font-medium text-gray-700 min-w-[160px] text-center">
                {navegacaoPeriodo?.rotulo}
            </span>

            <button
                onClick={() => navegacaoPeriodo?.pode_avancar && onNavegar(ajustarData(dataReferencia, periodo, 1))}
                disabled={!navegacaoPeriodo?.pode_avancar}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label="Próximo período"
            >
                ›
            </button>

            <span className="w-px h-5 bg-gray-200 mx-1" />

            {periodo === 'dia' && (
                <input
                    type="date"
                    value={dataReferencia}
                    max={hojeISO}
                    onChange={(e) => e.target.value && onNavegar(e.target.value)}
                    className="text-sm border-gray-300 rounded py-1"
                />
            )}
            {periodo === 'mes' && (
                <input
                    type="month"
                    value={dataReferencia.slice(0, 7)}
                    max={hojeISO.slice(0, 7)}
                    onChange={(e) => e.target.value && onNavegar(`${e.target.value}-01`)}
                    className="text-sm border-gray-300 rounded py-1"
                />
            )}
            {periodo === 'ano' && (
                <select
                    value={dataReferencia.slice(0, 4)}
                    onChange={(e) => onNavegar(`${e.target.value}-01-01`)}
                    className="text-sm border-gray-300 rounded py-1"
                >
                    {anosDisponiveis.map((ano) => (
                        <option key={ano} value={ano}>{ano}</option>
                    ))}
                </select>
            )}
        </div>
    );
}
