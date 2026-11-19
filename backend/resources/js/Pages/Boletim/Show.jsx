import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ChuvaBadge, { formatarMm, IconeChuva, obterEstiloChuva } from '@/Components/ChuvaBadge';
import {
    formatarNumero,
    formatarValorMetrica,
    UNIDADES_METRICAS,
    useUnidadeMetrica,
} from '@/Components/Boletim/unidades';
import { Head, Link, router } from '@inertiajs/react';
import { lazy, memo, Suspense, useCallback, useMemo, useState } from 'react';

// Carregado sob demanda via React.lazy (mesmo padrão de Dashboard.jsx e Estacoes/Detalhe.jsx)
// para que o chunk do Recharts (~105 KB gzip) não bloqueie a pintura inicial dos cards e tabelas.
const GraficoBoletim = lazy(() => import('@/Components/Boletim/GraficoBoletim'));

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

/** Mapeia o título dos cards de recorde para a respectiva chave no dicionário de unidades. */
const METRICA_POR_TITULO_CARD = {
    'Hora mais quente': 'temperatura_ar',
    'Dia mais quente': 'temperatura_ar',
    'Hora mais fria': 'temperatura_ar',
    'Dia mais frio': 'temperatura_ar',
    'Maior umidade': 'umidade_ar',
    'Menor umidade': 'umidade_ar',
    'Pico de UV': 'indice_uv',
    'Menor pressão': 'pressao',
    'Maior ITGU': 'itgu',
};

const CORES_CARD = {
    quente: 'border-red-400',
    fria: 'border-blue-400',
    umida: 'border-sky-400',
    seca: 'border-orange-400',
    uv: 'border-violet-400',
    pressao: 'border-teal-400',
};

const SUBTITULOS = {
    dia: 'Comparado à média dos últimos 7 dias (linha pontilhada)',
    semana: 'Cada ponto é a máxima do dia',
    mes: 'Linha pontilhada mostra a média do período',
    ano: 'Barra laranja = mês com a maior média do ano',
};

// Props que mudam ao navegar entre períodos/datas. "estacao" e "auth" ficam de fora:
// não são re-serializadas pelo servidor nem re-enviadas pela rede móvel.
const PROPS_PARCIAIS = ['boletim', 'periodo', 'dataReferencia', 'metrica'];

const AZUL = [62, 143, 209];
const AREIA = [234, 217, 160];
const LARANJA = [199, 98, 45];

const formatarDataLocal = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function formatarValorCard(card) {
    if (card.titulo === 'Dias em alerta térmico') {
        const valor = formatarNumero(card.valor, 0);
        const sufixoTotal = card.unidade ?? '';
        return `${valor}${sufixoTotal}${sufixoTotal.endsWith('dias') ? '' : ' dias'}`;
    }

    if (card.titulo === 'Horas em alerta térmico') {
        return `${formatarNumero(card.valor, 0)}h`;
    }

    const chaveMetrica = card.metrica ?? METRICA_POR_TITULO_CARD[card.titulo];
    if (chaveMetrica) {
        return formatarValorMetrica(card.valor, chaveMetrica, 1);
    }

    return formatarValorMetrica(card.valor, card.unidade ?? '', 1);
}

const CardRecorde = memo(function CardRecorde({ card }) {
    if (card.valor === null || card.valor === undefined) return null;
    const borda = CORES_CARD[card.cor] ?? 'border-gray-300';

    return (
        <div className={`bg-white overflow-hidden shadow-sm sm:rounded-lg border-l-4 ${borda} p-4`}>
            <p className="text-xs text-gray-500 mb-1">{card.titulo}</p>
            <p className="text-2xl font-bold text-gray-800">{formatarValorCard(card)}</p>
            {card.quando && (
                <p className="text-xs text-gray-500 mt-1">
                    {card.quando.includes(':') && !card.quando.includes('–') ? `às ${card.quando}` : card.quando}
                    {card.extra && ` · ${card.extra}`}
                </p>
            )}
        </div>
    );
});

const InfoGrafico = memo(function InfoGrafico({ titulo, subtitulo, serie, metrica, unidade = '' }) {
    const chaveUnidade = UNIDADES_METRICAS[metrica] ? metrica : unidade;

    const resumo = useMemo(() => {
        const validos = serie.filter((p) => p.valor !== null && p.valor !== undefined);
        if (validos.length === 0) return null;

        let pico = validos[0];
        let vale = validos[0];
        let soma = 0;

        for (const p of validos) {
            const v = Number(p.valor);
            if (v > Number(pico.valor)) pico = p;
            if (v < Number(vale.valor)) vale = p;
            soma += v;
        }

        const comMedia = serie.filter((p) => p.media !== null && p.media !== undefined);
        const mediaReferencia = comMedia.length > 0
            ? comMedia.reduce((acc, p) => acc + Number(p.media), 0) / comMedia.length
            : soma / validos.length;

        return { pico, vale, media: mediaReferencia };
    }, [serie]);

    return (
        <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
            <div>
                <p className="text-sm font-semibold text-gray-800">{titulo}</p>
                {subtitulo && <p className="text-xs text-gray-500 mt-0.5">{subtitulo}</p>}
            </div>
            {resumo && (
                <div className="flex flex-wrap gap-3 text-xs">
                    <span className="text-red-600 font-medium">
                        ▲ pico {resumo.pico.rotulo} · {formatarValorMetrica(resumo.pico.valor, chaveUnidade, 1)}
                    </span>
                    <span className="text-blue-600 font-medium">
                        ▼ mínima {resumo.vale.rotulo} · {formatarValorMetrica(resumo.vale.valor, chaveUnidade, 1)}
                    </span>
                    <span className="text-gray-600 font-medium">
                        ◆ média {formatarValorMetrica(resumo.media, chaveUnidade, 1)}
                    </span>
                </div>
            )}
        </div>
    );
});

function EsqueletoGrafico() {
    return <div className="h-[220px] w-full rounded bg-gray-100 animate-pulse" aria-hidden="true" />;
}

const MapaCalor = memo(function MapaCalor({ mapaCalor }) {
    // Cores calculadas uma única vez por mapa (antes: a cada render da página).
    const celulas = useMemo(() => {
        if (!mapaCalor) return [];
        const { minimo, maximo } = mapaCalor;
        const faixa = (maximo - minimo) || 1;
        return mapaCalor.celulas.map((c) => {
            if (c.valor === null || c.valor === undefined) {
                return { ...c, cor: '#E5E7EB', rotuloValor: 'sem dado' };
            }
            const t = (c.valor - minimo) / faixa;
            const [de, para, k] = t < 0.5 ? [AZUL, AREIA, t / 0.5] : [AREIA, LARANJA, (t - 0.5) / 0.5];
            const rgb = de.map((c0, i) => Math.round(c0 + (para[i] - c0) * k));
            return {
                ...c,
                cor: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`,
                rotuloValor: formatarValorMetrica(c.valor, 'temperatura_ar', 1),
            };
        });
    }, [mapaCalor]);

    if (celulas.length === 0) return null;

    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-5">
            <p className="text-sm font-semibold text-gray-800 mb-1">Mapa de calor — temperatura máxima por dia</p>
            <p className="text-xs text-gray-500 mb-4">Azul = mais frio, laranja = mais quente</p>
            <div className="grid grid-cols-7 gap-1.5 mb-3">
                {celulas.map((c) => (
                    <div
                        key={c.dia}
                        title={`Dia ${c.dia}: ${c.rotuloValor}`}
                        className="aspect-square rounded flex items-center justify-center text-xs font-medium text-white"
                        style={{ backgroundColor: c.cor }}
                    >
                        {c.dia}
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{formatarValorMetrica(mapaCalor.minimo, 'temperatura_ar', 1)}</span>
                <div className="flex-1 h-1.5 rounded" style={{ background: 'linear-gradient(90deg, #3E8FD1, #EAD9A0, #C7622D)' }} />
                <span>{formatarValorMetrica(mapaCalor.maximo, 'temperatura_ar', 1)}</span>
            </div>
        </div>
    );
});

const TabelaResumo = memo(function TabelaResumo({ periodo, tabela }) {
    if (!tabela || tabela.length === 0) return null;

    if (periodo === 'dia') {
        return (
            <table className="w-full text-sm text-left">
                <thead className="text-gray-500 text-xs uppercase">
                    <tr>
                        <th className="py-2">Hora</th>
                        <th className="py-2">Temp.</th>
                        <th className="py-2">Umid.</th>
                        <th className="py-2">ITGU</th>
                        <th className="py-2">UV</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {tabela.map((l) => (
                        <tr key={l.rotulo}>
                            <td className="py-1.5">{l.rotulo}</td>
                            <td className="py-1.5 font-mono">{formatarValorMetrica(l.temperatura_ar, 'temperatura_ar', 1)}</td>
                            <td className="py-1.5 font-mono">{formatarValorMetrica(l.umidade_ar, 'umidade_ar', 1)}</td>
                            <td className="py-1.5 font-mono">{formatarValorMetrica(l.itgu, 'itgu', 1)}</td>
                            <td className="py-1.5 font-mono">{formatarValorMetrica(l.indice_uv, 'indice_uv', 1)}</td>
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
                    <th className="py-2">{rotuloColuna}</th>
                    <th className="py-2">Máx.</th>
                    <th className="py-2">Mín.</th>
                    <th className="py-2">Umid. méd.</th>
                    <th className="py-2">{periodo === 'semana' ? 'Alerta?' : 'Dias alerta'}</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {tabela.map((l) => {
                    const diasAlerta = Number(l.dias_alerta ?? 0);
                    return (
                        <tr key={l.rotulo}>
                            <td className="py-1.5">{l.rotulo}</td>
                            <td className="py-1.5 font-mono">{formatarValorMetrica(l.maximo, 'temperatura_ar', 1)}</td>
                            <td className="py-1.5 font-mono">{formatarValorMetrica(l.minimo, 'temperatura_ar', 1)}</td>
                            <td className="py-1.5 font-mono">{formatarValorMetrica(l.umid_media, 'umidade_ar', 1)}</td>
                            <td className="py-1.5 font-mono">
                                {periodo === 'semana'
                                    ? (l.teve_alerta ? 'Sim' : 'Não')
                                    : `${formatarNumero(diasAlerta, 0)} ${diasAlerta === 1 ? 'dia' : 'dias'}`}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
});

const PainelComparacao = memo(function PainelComparacao({ comparacao }) {
    if (!comparacao) return null;

    const diasAbs = Math.abs(Number(comparacao.dias_alerta ?? 0));
    const linhas = [
        { label: 'Temperatura máxima', valor: comparacao.temp_max, metrica: 'temperatura_ar', casas: 1 },
        { label: 'Umidade média', valor: comparacao.umid_media, metrica: 'umidade_ar', casas: 1 },
        { label: 'Dias em alerta', valor: comparacao.dias_alerta, metrica: diasAbs === 1 ? 'dia' : 'dias', casas: 0 },
    ];

    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-5">
            <p className="text-sm font-semibold text-gray-800 mb-3">Comparado ao período anterior</p>
            {linhas.map((l) => {
                const ehNulo = l.valor === null || l.valor === undefined;
                const num = ehNulo ? 0 : Number(l.valor);
                const sinal = num > 0 ? '+' : '';
                const texto = ehNulo ? '—' : `${sinal}${formatarValorMetrica(num, l.metrica, l.casas)}`;

                return (
                    <div key={l.label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 text-sm">
                        <span className="text-gray-700">{l.label}</span>
                        <span className={`font-mono font-semibold ${num > 0 ? 'text-red-600' : num < 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                            {texto}
                        </span>
                    </div>
                );
            })}
        </div>
    );
});

const ResumoChuvaBoletim = memo(function ResumoChuvaBoletim({ periodo, chuva }) {
    if (!chuva?.teve_chuva) return null;

    const estilo = obterEstiloChuva(chuva.chuva_classificacao ?? 'fraca');
    const ehDia = periodo === 'dia';

    return (
        <div className={`overflow-hidden shadow-sm sm:rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 ${estilo.banner}`}>
            <div className="flex items-center gap-3 min-w-0">
                <IconeChuva className={`h-6 w-6 shrink-0 ${estilo.icone}`} />
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">Precipitação registrada no período</p>
                        {ehDia && chuva.chuva_label && <ChuvaBadge chuva={chuva} />}
                    </div>
                    <p className="text-xs opacity-85 mt-0.5">
                        {ehDia
                            ? `Pico de ${formatarMm(chuva.pico_hora_mm)} mm/h às ${chuva.pico_quando} (${chuva.horas_com_chuva}h com chuva)`
                            : `${chuva.dias_com_chuva} ${chuva.dias_com_chuva === 1 ? 'dia' : 'dias'} com chuva${chuva.pico_dia_mm ? ` · maior volume em ${chuva.pico_dia_quando}: ${formatarMm(chuva.pico_dia_mm)} mm` : ''}`}
                    </p>
                </div>
            </div>
            <div className="text-right shrink-0">
                <p className="text-xs opacity-75">Total acumulado</p>
                <p className="text-xl font-bold font-mono">{formatarMm(chuva.total_mm)} mm</p>
            </div>
        </div>
    );
});

export default function Show({ estacao, periodo, dataReferencia, metrica, boletim }) {
    const [carregando, setCarregando] = useState(false);
    const metricaAtiva = metrica || boletim?.metrica || 'temperatura_ar';
    const { rotulo: nomeMetrica, unidade } = useUnidadeMetrica(metricaAtiva);

    // Navegação que exige o servidor (período/data): partial reload + feedback visual imediato.
    const irPara = useCallback((params) => {
        router.get(route('boletim.show', estacao.id), {
            periodo, data: dataReferencia, metrica, ...params,
        }, {
            preserveState: true,
            preserveScroll: true,
            only: PROPS_PARCIAIS,
            onStart: () => setCarregando(true),
            onFinish: () => setCarregando(false),
        });
    }, [estacao.id, periodo, dataReferencia, metrica]);

    // Trocar métrica NÃO vai ao servidor: o boletim já traz as séries de todas as métricas.
    // Só atualizamos a URL (para compartilhar/voltar) com uma visita client-side do Inertia.
    const trocarMetrica = useCallback((novaMetrica) => {
        if (novaMetrica === metrica) return;
        if (!boletim.series) {
            irPara({ metrica: novaMetrica });
            return;
        }
        router.replace({
            url: route('boletim.show', { estacao: estacao.id, periodo, data: dataReferencia, metrica: novaMetrica }, false),
            props: (atuais) => ({
                ...atuais,
                metrica: novaMetrica,
                boletim: {
                    ...atuais.boletim,
                    metrica: novaMetrica,
                    serieChart: atuais.boletim.series[novaMetrica] ?? atuais.boletim.serieChart,
                },
            }),
            preserveState: true,
            preserveScroll: true,
        });
    }, [boletim.series, estacao.id, periodo, dataReferencia, metrica, irPara]);

    const navegarData = useCallback((direcao) => {
        const data = new Date(dataReferencia + 'T00:00:00');
        if (periodo === 'dia') data.setDate(data.getDate() + direcao);
        else if (periodo === 'semana') data.setDate(data.getDate() + direcao * 7);
        else if (periodo === 'mes') data.setMonth(data.getMonth() + direcao);
        else if (periodo === 'ano') data.setFullYear(data.getFullYear() + direcao);
        irPara({ data: formatarDataLocal(data) });
    }, [dataReferencia, periodo, irPara]);

    const serie = boletim.series?.[metrica] ?? boletim.serieChart;

    const tituloGrafico = useMemo(() => {
        const unidadeMetrica = UNIDADES_METRICAS[metrica]?.unidade;
        const rotuloComUnidade = unidadeMetrica ? `${nomeMetrica} (${unidadeMetrica})` : nomeMetrica;
        if (periodo === 'dia') return `${rotuloComUnidade} — ${boletim.rotulo}, por hora`;
        if (periodo === 'ano') return `${rotuloComUnidade} média mensal — ${boletim.rotulo}`;
        return `${rotuloComUnidade} máxima diária — ${boletim.rotulo}`;
    }, [periodo, metrica, nomeMetrica, boletim.rotulo]);

    const breadcrumbs = useMemo(() => [
        { label: 'Estações', href: route('estacoes.index') },
        { label: estacao.nome, href: route('estacoes.show', estacao.id) },
        { label: 'Boletim' },
    ], [estacao.id, estacao.nome]);

    const header = useMemo(() => (
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
    ), [estacao.id, estacao.nome]);

    return (
        <AuthenticatedLayout breadcrumbs={breadcrumbs} header={header}>
            <Head title={`Boletim — ${estacao.nome}`} />

            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex gap-2">
                            {PERIODOS.map((p) => (
                                <button
                                    key={p.valor}
                                    onClick={() => irPara({ periodo: p.valor })}
                                    disabled={carregando}
                                    className={`px-4 py-2 rounded text-sm font-medium disabled:cursor-wait ${
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
                                disabled={carregando}
                                aria-label="Período anterior"
                                className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-wait"
                            >
                                &lsaquo;
                            </button>
                            <p className="text-sm text-gray-600 min-w-[180px] text-center">{boletim.rotulo}</p>
                            <button
                                onClick={() => navegarData(1)}
                                disabled={carregando}
                                aria-label="Próximo período"
                                className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-wait"
                            >
                                &rsaquo;
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        {METRICAS_SELETOR.map((m) => {
                            const unidadeBotao = UNIDADES_METRICAS[m.valor]?.unidade;
                            return (
                                <button
                                    key={m.valor}
                                    onClick={() => trocarMetrica(m.valor)}
                                    disabled={carregando}
                                    className={`px-3 py-1.5 rounded text-xs font-medium ${
                                        metrica === m.valor
                                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                                            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {m.rotulo}{unidadeBotao ? ` (${unidadeBotao})` : ''}
                                </button>
                            );
                        })}
                    </div>

                    <div
                        aria-busy={carregando}
                        className={`space-y-6 transition-opacity duration-150 ${carregando ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        {serie && (
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-5">
                                <InfoGrafico
                                    titulo={tituloGrafico}
                                    subtitulo={SUBTITULOS[periodo]}
                                    serie={serie}
                                    metrica={metrica}
                                    unidade={unidade}
                                />
                                <Suspense fallback={<EsqueletoGrafico />}>
                                    <GraficoBoletim
                                        key={`${periodo}-${metricaAtiva}`}
                                        periodo={periodo}
                                        serie={serie}
                                        metrica={metricaAtiva}
                                        nomeSerie={nomeMetrica}
                                        unidade={unidade}
                                    />
                                </Suspense>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {boletim.recordes.cards.map((card) => (
                                <CardRecorde key={card.titulo} card={card} />
                            ))}
                        </div>

                        <ResumoChuvaBoletim periodo={periodo} chuva={boletim.chuva} />

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
            </div>
        </AuthenticatedLayout>
    );
}
