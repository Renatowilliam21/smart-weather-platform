import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export const METRICAS = {
    itgu: { rotulo: 'ITGU', unidade: '°C' },
    itu: { rotulo: 'ITU', unidade: '°C' },
    temperatura_ar: { rotulo: 'Temperatura do Ar', unidade: '°C' },
    umidade_ar: { rotulo: 'Umidade do Ar', unidade: '%' },
    luminosidade: { rotulo: 'Luminosidade', unidade: '%' },
    indice_uv: { rotulo: 'Índice UV', unidade: 'UV' },
    co2_ppm: { rotulo: 'CO2 equivalente', unidade: 'ppm' },
    tvoc_ppb: { rotulo: 'TVOC', unidade: 'ppb' },
    aqi: { rotulo: 'Índice de Qualidade do Ar', unidade: '(1-5)' },
    indice_calor: { rotulo: 'Índice de Calor (NOAA)', unidade: '°C' },
    chuva_mm: { rotulo: 'Chuva', unidade: 'mm' },
    vel_vento: { rotulo: 'Vel. Vento', unidade: 'km/h' },
};

export function SeletorMetrica({ metricasDisponiveis, metricaSelecionada, onChange }) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {metricasDisponiveis.map((chave) => (
                <button
                    key={chave}
                    type="button"
                    onClick={() => onChange(chave)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        metricaSelecionada === chave
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                >
                    {METRICAS[chave]?.rotulo ?? chave}
                </button>
            ))}
        </div>
    );
}

const ROTULOS_PERIODO = { dia: 'Dia', semana: 'Semana', mes: 'Mês', ano: 'Ano' };

export function SeletorPeriodo({ periodosDisponiveis, periodoSelecionado, onChange, disabled = false }) {
    return (
        <div className="inline-flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {periodosDisponiveis.map((item) => {
                const chave = typeof item === 'string' ? item : item.valor;
                const rotulo = typeof item === 'string' ? (ROTULOS_PERIODO[chave] ?? chave) : item.rotulo;

                return (
                    <button
                        key={chave}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(chave)}
                        className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors disabled:cursor-wait ${
                            periodoSelecionado === chave
                                ? 'bg-gray-800 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                        }`}
                    >
                        {rotulo}
                    </button>
                );
            })}
        </div>
    );
}

export function ajustarData(dataISO, periodo, direcao) {
    const d = new Date(dataISO + 'T12:00:00');
    if (periodo === 'mes') {
        d.setDate(1);
        d.setMonth(d.getMonth() + direcao);
    } else if (periodo === 'ano') {
        d.setDate(1);
        d.setFullYear(d.getFullYear() + direcao);
    } else if (periodo === 'semana') {
        d.setDate(d.getDate() + direcao * 7);
    } else {
        d.setDate(d.getDate() + direcao);
    }
    return d.toISOString().split('T')[0];
}

export function NavegacaoPeriodo({ periodo, dataReferencia, navegacaoPeriodo, onNavegar, disabled = false }) {
    const hojeISO = new Date().toISOString().split('T')[0];
    const anoAtual = new Date().getFullYear();
    const anosDisponiveis = [anoAtual, anoAtual - 1, anoAtual - 2, anoAtual - 3];
    const podeAvancar = navegacaoPeriodo?.pode_avancar ?? true;

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onNavegar(ajustarData(dataReferencia, periodo, -1))}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-40"
                    aria-label="Período anterior"
                >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>

                <span className="text-sm font-medium text-gray-700 min-w-[165px] px-2 text-center">
                    {navegacaoPeriodo?.rotulo}
                </span>

                <button
                    type="button"
                    onClick={() => podeAvancar && onNavegar(ajustarData(dataReferencia, periodo, 1))}
                    disabled={disabled || !podeAvancar}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-30 disabled:hover:bg-gray-50"
                    aria-label="Próximo período"
                >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
            </div>

            <span className="hidden sm:inline-block w-px h-5 bg-gray-200 mx-1" aria-hidden="true" />

            <div className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-gray-400 shrink-0" aria-hidden="true" />
                {(periodo === 'dia' || periodo === 'semana') && (
                    <input
                        type="date"
                        value={dataReferencia}
                        max={hojeISO}
                        disabled={disabled}
                        onChange={(e) => e.target.value && onNavegar(e.target.value)}
                        aria-label="Selecionar data no calendário"
                        className="text-sm border-gray-300 rounded-md py-1 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                )}
                {periodo === 'mes' && (
                    <input
                        type="month"
                        value={dataReferencia.slice(0, 7)}
                        max={hojeISO.slice(0, 7)}
                        disabled={disabled}
                        onChange={(e) => e.target.value && onNavegar(`${e.target.value}-01`)}
                        aria-label="Selecionar mês no calendário"
                        className="text-sm border-gray-300 rounded-md py-1 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                )}
                {periodo === 'ano' && (
                    <select
                        value={dataReferencia.slice(0, 4)}
                        disabled={disabled}
                        onChange={(e) => onNavegar(`${e.target.value}-01-01`)}
                        aria-label="Selecionar ano"
                        className="text-sm border-gray-300 rounded-md py-1 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        {anosDisponiveis.map((ano) => (
                            <option key={ano} value={ano}>
                                {ano}
                            </option>
                        ))}
                    </select>
                )}
            </div>
        </div>
    );
}

export function BarraFiltroTemporal({
    periodo,
    periodosDisponiveis,
    dataReferencia,
    navegacaoPeriodo,
    onNavegarData,
    onMudarPeriodo,
    disabled = false,
}) {
    return (
        <div className="bg-white border border-gray-200 shadow-xs sm:rounded-lg px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
            <NavegacaoPeriodo
                periodo={periodo}
                dataReferencia={dataReferencia}
                navegacaoPeriodo={navegacaoPeriodo}
                onNavegar={onNavegarData}
                disabled={disabled}
            />
            <SeletorPeriodo
                periodosDisponiveis={periodosDisponiveis}
                periodoSelecionado={periodo}
                onChange={onMudarPeriodo}
                disabled={disabled}
            />
        </div>
    );
}
