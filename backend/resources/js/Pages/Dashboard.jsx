import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';

// Carregados sob demanda: Leaflet (mapa) e Recharts (grafico) sao bibliotecas
// pesadas que nao precisam estar no bundle principal do Dashboard.
const MapaEstacoes = lazy(() => import('@/Components/Dashboard/MapaEstacoes'));
const GraficoMetrica = lazy(() => import('@/Components/Dashboard/PainelMetrica'));

import { SeletorMetrica, SeletorPeriodo, NavegacaoPeriodo } from '@/Components/Dashboard/SeletoresPeriodo';

function CarregandoWidget({ altura = 300 }) {
    return (
        <div
            className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 flex items-center justify-center text-sm text-gray-400"
            style={{ minHeight: altura }}
        >
            Carregando...
        </div>
    );
}

const CLASSIFICACAO_CORES = {
    normal: 'bg-green-100 text-green-800',
    alerta: 'bg-yellow-100 text-yellow-800',
    perigo: 'bg-red-100 text-red-800',
};

function SeletorEstacao({ estacoes, estacaoSelecionada, onChange }) {
    return (
        <select
            value={estacaoSelecionada ?? ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            className="rounded-md border-gray-300 shadow-sm text-sm focus:ring-gray-500 focus:border-gray-500"
        >
            <option value="">Todas as estações</option>
            {estacoes.map((estacao) => (
                <option key={estacao.id} value={estacao.id}>
                    {estacao.nome}
                </option>
            ))}
        </select>
    );
}

function EstacaoCard({ estacao }) {
    const leitura = estacao.ultima_leitura;
    const cor = leitura?.itgu_classificacao
        ? CLASSIFICACAO_CORES[leitura.itgu_classificacao] ?? 'bg-gray-100 text-gray-800'
        : 'bg-gray-100 text-gray-800';

    return (
        <Link href={route('estacoes.show', estacao.id)} className={`block bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 hover:shadow-md transition-shadow ${estacao.offline ? "ring-2 ring-red-300" : ""}`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                        {estacao.nome}
                        {estacao.offline && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                Offline
                            </span>
                        )}
                    </h3>
                    <p className="text-sm text-gray-500">{estacao.localizacao}</p>
                </div>
                {leitura?.itgu_classificacao && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${cor}`}>
                        {leitura.itgu_classificacao}
                    </span>
                )}
            </div>

            {leitura ? (
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-2xl font-bold text-gray-800">
                            {leitura.temperatura_ar ?? '—'}°
                        </p>
                        <p className="text-xs text-gray-500">Temp. Ar</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-800">
                            {leitura.umidade_ar ?? '—'}%
                        </p>
                        <p className="text-xs text-gray-500">Umidade</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-800">
                            {leitura.itgu ?? '—'}
                        </p>
                        <p className="text-xs text-gray-500">ITGU</p>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-gray-400">Sem leituras registradas</p>
            )}

            {leitura?.registrado_em && (
                <p className="text-xs text-gray-400 mt-4">
                    Atualizado em {new Date(leitura.registrado_em).toLocaleString('pt-BR')}
                </p>
            )}
        </Link>
    );
}

function ListaAlertas({ alertas, onResolver, onReabrir }) {
    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-4">Alertas Recentes</h3>
            {alertas.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                    {alertas.map((alerta) => (
                        <li key={alerta.id} className="py-3 flex justify-between items-center gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                    {alerta.estacao_nome} — {alerta.parametro}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Valor lido: {alerta.valor_lido} (limite: {alerta.valor_limite})
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {new Date(alerta.created_at).toLocaleString('pt-BR')}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                        alerta.resolvido
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}
                                >
                                    {alerta.resolvido ? 'Resolvido' : 'Ativo'}
                                </span>
                                {alerta.resolvido ? (
                                    <button
                                        onClick={() => onReabrir(alerta.id)}
                                        className="text-xs text-gray-500 hover:underline whitespace-nowrap"
                                    >
                                        Reabrir
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onResolver(alerta.id)}
                                        className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                                    >
                                        Resolver
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-400">Nenhum alerta registrado</p>
            )}
        </div>
    );
}

export default function Dashboard({
    estacoes: estacoesIniciais,
    serieMetrica: serieInicial,
    metricasDisponiveis,
    metricaSelecionada,
    periodosDisponiveis,
    periodoSelecionado,
    dataReferencia,
    navegacaoPeriodo: navegacaoPeriodoInicial,
    alertasRecentes: alertasIniciais,
    estacaoSelecionada,
}) {
    const [estacoes, setEstacoes] = useState(estacoesIniciais);
    const [serieMetrica, setSerieMetrica] = useState(serieInicial);
    const [alertasRecentes, setAlertasRecentes] = useState(alertasIniciais);
    const [navegacaoPeriodo, setNavegacaoPeriodo] = useState(navegacaoPeriodoInicial);

    useEffect(() => {
        setEstacoes(estacoesIniciais);
        setSerieMetrica(serieInicial);
        setAlertasRecentes(alertasIniciais);
        setNavegacaoPeriodo(navegacaoPeriodoInicial);
    }, [estacoesIniciais, serieInicial, alertasIniciais, navegacaoPeriodoInicial]);

    const atualizarDados = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (estacaoSelecionada) params.set('estacao_id', estacaoSelecionada);
            if (metricaSelecionada) params.set('metrica', metricaSelecionada);
            if (periodoSelecionado) params.set('periodo', periodoSelecionado);
            if (dataReferencia) params.set('data', dataReferencia);
            const response = await fetch(`/api/dashboard/refresh?${params.toString()}`, {
                headers: { Accept: 'application/json' },
            });
            if (!response.ok) return;
            const data = await response.json();
            setEstacoes(data.estacoes);
            setSerieMetrica(data.serieMetrica);
            setAlertasRecentes(data.alertasRecentes);
            setNavegacaoPeriodo(data.navegacaoPeriodo);
        } catch (error) {
            console.error('Falha ao atualizar dashboard:', error);
        }
    }, [estacaoSelecionada, metricaSelecionada, periodoSelecionado, dataReferencia]);

    useEffect(() => {
        const intervalo = setInterval(atualizarDados, 30000);
        return () => clearInterval(intervalo);
    }, [atualizarDados]);

    const handleSelecionarEstacao = (estacaoId) => {
        router.get(
            route('dashboard'),
            {
                ...(estacaoId ? { estacao_id: estacaoId } : {}),
                ...(metricaSelecionada ? { metrica: metricaSelecionada } : {}),
                ...(periodoSelecionado ? { periodo: periodoSelecionado } : {}),
                ...(dataReferencia ? { data: dataReferencia } : {}),
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSelecionarMetrica = (metrica) => {
        router.get(
            route('dashboard'),
            {
                ...(estacaoSelecionada ? { estacao_id: estacaoSelecionada } : {}),
                metrica,
                ...(periodoSelecionado ? { periodo: periodoSelecionado } : {}),
                ...(dataReferencia ? { data: dataReferencia } : {}),
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSelecionarPeriodo = (periodo) => {
        router.get(
            route('dashboard'),
            {
                ...(estacaoSelecionada ? { estacao_id: estacaoSelecionada } : {}),
                ...(metricaSelecionada ? { metrica: metricaSelecionada } : {}),
                periodo,
                ...(dataReferencia ? { data: dataReferencia } : {}),
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleNavegarData = (novaData) => {
        router.get(
            route('dashboard'),
            {
                ...(estacaoSelecionada ? { estacao_id: estacaoSelecionada } : {}),
                ...(metricaSelecionada ? { metrica: metricaSelecionada } : {}),
                ...(periodoSelecionado ? { periodo: periodoSelecionado } : {}),
                data: novaData,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleResolverAlerta = (alertaId) => {
        router.post(route('alertas.resolver', alertaId), {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setAlertasRecentes((atual) =>
                    atual.map((a) => (a.id === alertaId ? { ...a, resolvido: true } : a))
                );
            },
        });
    };

    const handleReabrirAlerta = (alertaId) => {
        router.post(route('alertas.reabrir', alertaId), {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setAlertasRecentes((atual) =>
                    atual.map((a) => (a.id === alertaId ? { ...a, resolvido: false } : a))
                );
            },
        });
    };

    const estacoesFiltradas = estacaoSelecionada
        ? estacoes.filter((e) => e.id === estacaoSelecionada)
        : estacoes;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Dashboard — Monitoramento de Estações Meteorológicas
                    </h2>
                    <SeletorEstacao
                        estacoes={estacoes}
                        estacaoSelecionada={estacaoSelecionada}
                        onChange={handleSelecionarEstacao}
                    />
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {estacoesFiltradas.length > 0 ? (
                            estacoesFiltradas.map((estacao) => (
                                <EstacaoCard key={estacao.id} estacao={estacao} />
                            ))
                        ) : (
                            <div className="col-span-full bg-white shadow-sm sm:rounded-lg p-6 text-center text-gray-400">
                                Nenhuma estação cadastrada ainda.
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center gap-3 flex-wrap">
                        <NavegacaoPeriodo
                            periodo={periodoSelecionado}
                            dataReferencia={dataReferencia}
                            navegacaoPeriodo={navegacaoPeriodo}
                            onNavegar={handleNavegarData}
                        />
                        <div className="flex items-center gap-3 flex-wrap">
                            <SeletorPeriodo
                                periodosDisponiveis={periodosDisponiveis}
                                periodoSelecionado={periodoSelecionado}
                                onChange={handleSelecionarPeriodo}
                            />
                            <SeletorMetrica
                                metricasDisponiveis={metricasDisponiveis}
                                metricaSelecionada={metricaSelecionada}
                                onChange={handleSelecionarMetrica}
                            />
                        </div>
                    </div>

                    <Suspense fallback={<CarregandoWidget />}>
                        <GraficoMetrica
                            serieMetrica={serieMetrica}
                            estacoes={estacoes}
                            metricaSelecionada={metricaSelecionada}
                        />
                    </Suspense>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ListaAlertas
                            alertas={alertasRecentes}
                            onResolver={handleResolverAlerta}
                            onReabrir={handleReabrirAlerta}
                        />
                        <Suspense fallback={<CarregandoWidget />}>
                            <MapaEstacoes estacoes={estacoesFiltradas} />
                        </Suspense>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}