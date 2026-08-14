import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const PERIODOS = [
    { valor: 'dia', rotulo: 'Dia' },
    { valor: 'semana', rotulo: 'Semana' },
    { valor: 'mes', rotulo: 'Mês' },
    { valor: 'ano', rotulo: 'Ano' },
];

const METRICAS_SELETOR = [
    { valor: 'temperatura_ar', rotulo: 'Temperatura' },
    { valor: 'umidade_ar', rotulo: 'Umidade' },
    { valor: 'pressao', rotulo: 'Press\u00e3o' },
    { valor: 'indice_uv', rotulo: '\u00cdndice UV' },
    { valor: 'itgu', rotulo: 'ITGU' },
    { valor: 'itu', rotulo: 'ITU' },
];

const METRICAS_ROTULOS = {
    temperatura_ar: { rotulo: 'Temperatura', unidade: '°C' },
    umidade_ar: { rotulo: 'Umidade', unidade: '%' },
    itgu: { rotulo: 'ITGU', unidade: '' },
    itu: { rotulo: 'ITU', unidade: '' },
    indice_uv: { rotulo: 'Índice UV', unidade: '' },
    pressao: { rotulo: 'Pressão', unidade: ' hPa' },
};

const CORES_CARD = {
    quente: 'border-red-400',
    fria: 'border-blue-400',
    umida: 'border-sky-400',
    seca: 'border-orange-400',
    uv: 'border-violet-400',
    pressao: 'border-teal-400',
};

function CardRecorde({ card }) {
    if (card.valor === null || card.valor === undefined) return null;
    const borda = CORES_CARD[card.cor] ?? 'border-gray-300';

    return (
        <div className={`bg-white overflow-hidden shadow-sm sm:rounded-lg border-l-4 ${borda} p-4`}>
            <p className="text-xs text-gray-500 mb-1">{card.titulo}</p>
            <p className="text-2xl font-bold text-gray-800">{card.valor}{card.unidade}</p>
            {card.quando && (
                <p className="text-xs text-gray-500 mt-1">
                    {card.quando.includes(':') && !card.quando.includes('–') ? `às ${card.quando}` : card.quando}
                    {card.extra && ` · ${card.extra}`}
                </p>
            )}
        </div>
    );
}

function calcularPicoVale(serie) {
    const validos = serie.filter((p) => p.valor !== null && p.valor !== undefined);
    if (validos.length === 0) return null;
    const pico = validos.reduce((a, b) => (b.valor > a.valor ? b : a));
    const vale = validos.reduce((a, b) => (b.valor < a.valor ? b : a));
    return { pico, vale };
}

function InfoGrafico({ titulo, subtitulo, serie, unidade = '' }) {
    const picoVale = calcularPicoVale(serie);
    return (
        <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
            <div>
                <p className="text-sm font-semibold text-gray-800">{titulo}</p>
                {subtitulo && <p className="text-xs text-gray-500 mt-0.5">{subtitulo}</p>}
            </div>
            {picoVale && (
                <div className="flex gap-3 text-xs">
                    <span className="text-red-600 font-medium">▲ pico {picoVale.pico.rotulo} · {picoVale.pico.valor}{unidade}</span>
                    <span className="text-blue-600 font-medium">▼ mínima {picoVale.vale.rotulo} · {picoVale.vale.valor}{unidade}</span>
                </div>
            )}
        </div>
    );
}

function GraficoLinha({ serie, temMedia }) {
    const temDados = serie.some((p) => p.valor !== null && p.valor !== undefined);
    if (!temDados) {
        return <p className="text-sm text-gray-400 py-8 text-center">Sem dados suficientes para o gráfico.</p>;
    }

    return (
        <ResponsiveContainer width="100%" height={220}>
            <LineChart data={serie} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="rotulo" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                {temMedia && (
                    <Line type="monotone" dataKey="media" stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Média" connectNulls />
                )}
                <Line type="monotone" dataKey="valor" stroke="#C7622D" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Temperatura" connectNulls />
            </LineChart>
        </ResponsiveContainer>
    );
}

function GraficoBarrasAno({ serie }) {
    const valores = serie.map((p) => p.valor).filter((v) => v !== null);
    if (valores.length === 0) {
        return <p className="text-sm text-gray-400 py-8 text-center">Sem dados suficientes para o gráfico.</p>;
    }
    const maxValor = Math.max(...valores);

    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={serie} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="rotulo" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]} name="Temp. média">
                    {serie.map((entrada, i) => (
                        <Cell key={i} fill={entrada.valor === maxValor ? '#C7622D' : '#3E8FD1'} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

function MapaCalor({ mapaCalor }) {
    if (!mapaCalor || mapaCalor.celulas.length === 0) return null;
    const { celulas, minimo, maximo } = mapaCalor;
    const faixa = (maximo - minimo) || 1;

    const cor = (valor) => {
        if (valor === null) return '#E5E7EB';
        const t = (valor - minimo) / faixa;
        const azul = [62, 143, 209], areia = [234, 217, 160], laranja = [199, 98, 45];
        let c;
        if (t < 0.5) {
            const k = t / 0.5;
            c = azul.map((c0, idx) => Math.round(c0 + (areia[idx] - c0) * k));
        } else {
            const k = (t - 0.5) / 0.5;
            c = areia.map((c0, idx) => Math.round(c0 + (laranja[idx] - c0) * k));
        }
        return `rgb(${c[0]},${c[1]},${c[2]})`;
    };

    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-5">
            <p className="text-sm font-semibold text-gray-800 mb-1">Mapa de calor — temperatura máxima por dia</p>
            <p className="text-xs text-gray-500 mb-4">Azul = mais frio, laranja = mais quente</p>
            <div className="grid grid-cols-7 gap-1.5 mb-3">
                {celulas.map((c) => (
                    <div
                        key={c.dia}
                        title={`Dia ${c.dia}: ${c.valor ?? 'sem dado'}°C`}
                        className="aspect-square rounded flex items-center justify-center text-xs font-medium text-white"
                        style={{ backgroundColor: cor(c.valor) }}
                    >
                        {c.dia}
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{minimo}°C</span>
                <div className="flex-1 h-1.5 rounded" style={{ background: 'linear-gradient(90deg, #3E8FD1, #EAD9A0, #C7622D)' }} />
                <span>{maximo}°C</span>
            </div>
        </div>
    );
}

function TabelaResumo({ periodo, tabela }) {
    if (!tabela || tabela.length === 0) return null;

    if (periodo === 'dia') {
        return (
            <table className="w-full text-sm text-left">
                <thead className="text-gray-500 text-xs uppercase">
                    <tr>
                        <th className="py-2">Hora</th><th className="py-2">Temp.</th><th className="py-2">Umid.</th><th className="py-2">ITGU</th><th className="py-2">UV</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {tabela.map((l, i) => (
                        <tr key={i}>
                            <td className="py-1.5">{l.rotulo}</td>
                            <td className="py-1.5 font-mono">{l.temperatura_ar}°C</td>
                            <td className="py-1.5 font-mono">{l.umidade_ar}%</td>
                            <td className="py-1.5 font-mono">{l.itgu}</td>
                            <td className="py-1.5 font-mono">{l.indice_uv}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    const rotuloColuna = periodo === 'semana' ? 'Dia' : 'Mês';
    return (
        <table className="w-full text-sm text-left">
            <thead className="text-gray-500 text-xs uppercase">
                <tr>
                    <th className="py-2">{rotuloColuna}</th><th className="py-2">Máx.</th><th className="py-2">Mín.</th><th className="py-2">Umid. méd.</th>
                    <th className="py-2">{periodo === 'semana' ? 'Alerta?' : 'Dias alerta'}</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {tabela.map((l, i) => (
                    <tr key={i}>
                        <td className="py-1.5">{l.rotulo}</td>
                        <td className="py-1.5 font-mono">{l.maximo}°C</td>
                        <td className="py-1.5 font-mono">{l.minimo}°C</td>
                        <td className="py-1.5 font-mono">{l.umid_media}%</td>
                        <td className="py-1.5 font-mono">{periodo === 'semana' ? (l.teve_alerta ? 'Sim' : 'Não') : l.dias_alerta}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function PainelComparacao({ comparacao }) {
    if (!comparacao) return null;
    const linhas = [
        { label: 'Temperatura máxima', valor: comparacao.temp_max, unidade: '°C' },
        { label: 'Umidade média', valor: comparacao.umid_media, unidade: '%' },
        { label: 'Dias em alerta', valor: comparacao.dias_alerta, unidade: '' },
    ];

    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-5">
            <p className="text-sm font-semibold text-gray-800 mb-3">Comparado ao período anterior</p>
            {linhas.map((l) => (
                <div key={l.label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 text-sm">
                    <span className="text-gray-700">{l.label}</span>
                    <span className={`font-mono font-semibold ${l.valor > 0 ? 'text-red-600' : l.valor < 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                        {l.valor === null ? '—' : (l.valor > 0 ? '+' : '') + l.valor + l.unidade}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default function Show({ estacao, periodo, dataReferencia, metrica, boletim }) {
    const irPara = (params) => {
        router.get(route('boletim.show', estacao.id), {
            periodo, data: dataReferencia, metrica, ...params,
        }, { preserveState: true, preserveScroll: true });
    };

    const trocarPeriodo = (novoPeriodo) => irPara({ periodo: novoPeriodo });
    const trocarMetrica = (novaMetrica) => irPara({ metrica: novaMetrica });

    const navegarData = (direcao) => {
        const data = new Date(dataReferencia + 'T00:00:00');
        if (periodo === 'dia') data.setDate(data.getDate() + direcao);
        else if (periodo === 'semana') data.setDate(data.getDate() + direcao * 7);
        else if (periodo === 'mes') data.setMonth(data.getMonth() + direcao);
        else if (periodo === 'ano') data.setFullYear(data.getFullYear() + direcao);
        irPara({ data: data.toISOString().split('T')[0] });
    };

    const ehPorHora = boletim.granularidade === 'hora';
    const rotuloMaximo = ehPorHora ? 'Máximo do dia' : 'Dia com maior valor';
    const rotuloMinimo = ehPorHora ? 'Mínimo do dia' : 'Dia com menor valor';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href={route('estacoes.show', estacao.id)} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Boletim — {estacao.nome}
                    </h2>
                </div>
            }
        >
            <Head title={`Boletim — ${estacao.nome}`} />

            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex gap-2">
                            {PERIODOS.map((p) => (
                                <button
                                    key={p.valor}
                                    onClick={() => trocarPeriodo(p.valor)}
                                    className={`px-4 py-2 rounded text-sm font-medium ${
                                        periodo === p.valor
                                            ? 'bg-gray-800 text-white'
                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {p.rotulo}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navegarData(-1)}
                                className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                            >
                                &lsaquo;
                            </button>
                            <p className="text-sm text-gray-600 min-w-[180px] text-center">{boletim.rotulo}</p>
                            <button
                                onClick={() => navegarData(1)}
                                className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                            >
                                &rsaquo;
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        {METRICAS_SELETOR.map((m) => (
                            <button
                                key={m.valor}
                                onClick={() => trocarMetrica(m.valor)}
                                className={`px-3 py-1.5 rounded text-xs font-medium ${
                                    metrica === m.valor
                                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                                        : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {m.rotulo}
                            </button>
                        ))}
                    </div>

                    {boletim.serieChart && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-5">
                            <InfoGrafico
                                titulo={(() => {
                                    const nomeMetrica = METRICAS_SELETOR.find((m) => m.valor === metrica)?.rotulo ?? metrica;
                                    if (periodo === 'dia') return `${nomeMetrica} — ${boletim.rotulo}, por hora`;
                                    if (periodo === 'ano') return `${nomeMetrica} média mensal — ${boletim.rotulo}`;
                                    return `${nomeMetrica} máxima diária — ${boletim.rotulo}`;
                                })()}
                                subtitulo={
                                    periodo === 'dia' ? 'Comparado à média dos últimos 7 dias (linha pontilhada)' :
                                    periodo === 'semana' ? 'Cada ponto é a máxima do dia' :
                                    periodo === 'mes' ? 'Linha pontilhada mostra a média do período' :
                                    'Barra laranja = mês com a maior média do ano'
                                }
                                serie={boletim.serieChart}
                                unidade={METRICAS_ROTULOS[metrica]?.unidade ?? ''}
                            />
                            {periodo === 'ano' ? (
                                <GraficoBarrasAno serie={boletim.serieChart} />
                            ) : (
                                <GraficoLinha serie={boletim.serieChart} temMedia={periodo === 'dia' || periodo === 'mes'} />
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {boletim.recordes.cards.map((card, i) => (
                            <CardRecorde key={i} card={card} />
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {boletim.mapaCalor && <MapaCalor mapaCalor={boletim.mapaCalor} />}
                        {boletim.tabela && (
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-5">
                                <p className="text-sm font-semibold text-gray-800 mb-3">
                                    {periodo === 'dia' ? 'Leituras por hora' : periodo === 'semana' ? 'Resumo por dia' : 'Resumo por mês'}
                                </p>
                                <TabelaResumo periodo={periodo} tabela={boletim.tabela} />
                            </div>
                        )}
                        <PainelComparacao comparacao={boletim.comparacaoAnterior} />
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
