import { lazy, Suspense, useEffect, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PainelAlertasRecentes from '@/Components/Dashboard/PainelAlertasRecentes';
import { BarraFiltroTemporal } from '@/Components/Dashboard/SeletoresPeriodo';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowDown, ArrowLeft, ArrowUp, Clock, Droplets, FileText, Home, User } from 'lucide-react';

const GraficoMetrica = lazy(() => import('@/Components/Dashboard/PainelMetrica'));

const PROPS_GRAFICO = [
    'serieMetrica',
    'metricaSelecionada',
    'periodoSelecionado',
    'dataReferencia',
    'navegacaoPeriodo',
];

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

const CLASSIFICACAO_HERO = {
    normal: 'bg-green-600',
    alerta: 'bg-yellow-600',
    perigo: 'bg-red-600',
};

function classificarUmidade(valor) {
    if (valor === null || valor === undefined) return null;
    if (valor < 30) return 'text-red-600';
    if (valor <= 40) return 'text-orange-500';
    return 'text-blue-600';
}

function dicaDeCampo(classificacao, umidade) {
    if (classificacao === 'perigo') {
        return 'Risco alto de estresse térmico. Evite exposição prolongada ao sol e mantenha os animais em locais sombreados com água disponível.';
    }
    if (classificacao === 'alerta') {
        return 'Condições de atenção. Redobre a hidratação e monitore sinais de desconforto térmico nos animais.';
    }
    if (umidade !== null && umidade !== undefined && umidade < 30) {
        return 'Umidade baixa hoje. Fique atento à hidratação, mesmo com temperatura amena.';
    }
    return 'Condições dentro do normal. Nenhuma ação especial recomendada no momento.';
}

function CampoMetrica({ rotulo, valor, unidade = '', destaque = false, minMax = null, corValor = null, ehUmidade = false }) {
    return (
        <div className={`rounded-lg p-4 text-center ${destaque ? 'bg-gray-800 text-white' : 'bg-gray-50'}`}>
            <p className={`text-2xl font-bold ${destaque ? 'text-white' : (corValor ?? 'text-gray-800')}`}>
                {valor ?? '—'}
                {valor !== null && valor !== undefined ? unidade : ''}
            </p>
            <p className={`text-xs mt-1 ${destaque ? 'text-gray-300' : 'text-gray-500'}`}>{rotulo}</p>
            {minMax && (minMax.maximo || minMax.minimo) && (
                <div className="border-t border-gray-200 mt-2 pt-2 flex justify-center gap-3 flex-wrap">
                    {minMax.maximo && (
                        <span
                            className={`inline-flex items-center gap-0.5 text-xs ${
                                ehUmidade ? classificarUmidade(minMax.maximo.valor) : 'text-red-600'
                            }`}
                        >
                            <ArrowUp className="h-3 w-3 shrink-0" aria-hidden="true" />
                            {minMax.maximo.valor}
                            {unidade} {minMax.maximo.hora}
                        </span>
                    )}
                    {minMax.minimo && (
                        <span
                            className={`inline-flex items-center gap-0.5 text-xs ${
                                ehUmidade ? classificarUmidade(minMax.minimo.valor) : 'text-blue-600'
                            }`}
                        >
                            <ArrowDown className="h-3 w-3 shrink-0" aria-hidden="true" />
                            {minMax.minimo.valor}
                            {unidade} {minMax.minimo.hora}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

function ModoCampo({ estacao, ultimaLeitura, corHero }) {
    if (!ultimaLeitura) {
        return (
            <div className="sm:hidden bg-white rounded-lg shadow-sm p-6 text-center text-sm text-gray-400">
                Sem leituras registradas ainda.
            </div>
        );
    }

    return (
        <div className="sm:hidden space-y-4 pb-20">
            <div className={`${corHero} rounded-lg shadow-sm p-6 text-white text-center`}>
                <p className="text-sm opacity-90">{estacao.nome}</p>
                <p className="text-5xl font-bold mt-2">{ultimaLeitura.temperatura_ar ?? '—'}°</p>
                {ultimaLeitura.itgu_classificacao && (
                    <span className="inline-block mt-2 px-3 py-1 rounded-full bg-white/20 text-xs font-medium uppercase tracking-wide">
                        {ultimaLeitura.itgu_classificacao}
                    </span>
                )}
                <p className="text-xs opacity-75 mt-3">
                    Atualizado{' '}
                    {new Date(ultimaLeitura.registrado_em).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <CampoMetrica
                    rotulo="Umidade"
                    valor={ultimaLeitura.umidade_ar}
                    unidade="%"
                    corValor={classificarUmidade(ultimaLeitura.umidade_ar)}
                />
                <CampoMetrica rotulo="ITGU" valor={ultimaLeitura.itgu} />
                <CampoMetrica rotulo="Sensação Térmica" valor={ultimaLeitura.temp_globo_negro} unidade="°C" />
                <CampoMetrica rotulo="Pressão" valor={ultimaLeitura.pressao} unidade=" hPa" />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-2.5">
                <Droplets className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-amber-900">
                    {dicaDeCampo(ultimaLeitura.itgu_classificacao, ultimaLeitura.umidade_ar)}
                </p>
            </div>

            <Link
                href={route('boletim.show', estacao.id)}
                className="block text-center bg-gray-800 text-white rounded-lg py-3 text-sm font-medium"
            >
                Ver Boletim Completo
            </Link>
        </div>
    );
}

function BarraInferiorMobile({ estacaoId }) {
    const Item = ({ href, rotulo, Icone }) => (
        <Link
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-500 hover:text-gray-800 py-2"
        >
            <Icone className="h-5 w-5" aria-hidden="true" />
            <span className="text-[10px]">{rotulo}</span>
        </Link>
    );

    return (
        <div className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex z-20">
            <Item href={route('dashboard')} rotulo="Início" Icone={Home} />
            <Item href={route('boletim.show', estacaoId)} rotulo="Boletim" Icone={FileText} />
            <Item href={route('leituras.index')} rotulo="Histórico" Icone={Clock} />
            <Item href={route('profile.edit')} rotulo="Perfil" Icone={User} />
        </div>
    );
}

export default function Detalhe({
    estacao,
    ultimaLeitura,
    minMax,
    serieMetrica,
    metricasDisponiveis,
    metricaSelecionada,
    periodosDisponiveis,
    periodoSelecionado,
    dataReferencia,
    navegacaoPeriodo,
    alertasRecentes: alertasIniciais,
}) {
    const [alertasRecentes, setAlertasRecentes] = useState(alertasIniciais);

    useEffect(() => {
        setAlertasRecentes(alertasIniciais);
    }, [alertasIniciais]);

    const navegarFiltro = (params) => {
        router.get(
            route('estacoes.show', estacao.id),
            {
                metrica: params.metrica !== undefined ? params.metrica : metricaSelecionada,
                periodo: params.periodo !== undefined ? params.periodo : periodoSelecionado,
                data: params.data !== undefined ? params.data : dataReferencia,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: PROPS_GRAFICO,
            }
        );
    };

    const handleResolverAlerta = (alertaId) => {
        router.post(
            route('alertas.resolver', alertaId),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['alertasRecentes', 'flash'],
                onSuccess: () => {
                    setAlertasRecentes((atual) =>
                        atual.map((a) => (a.id === alertaId ? { ...a, resolvido: true } : a))
                    );
                },
            }
        );
    };

    const handleReabrirAlerta = (alertaId) => {
        router.post(
            route('alertas.reabrir', alertaId),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['alertasRecentes', 'flash'],
                onSuccess: () => {
                    setAlertasRecentes((atual) =>
                        atual.map((a) => (a.id === alertaId ? { ...a, resolvido: false } : a))
                    );
                },
            }
        );
    };

    const cor = ultimaLeitura?.itgu_classificacao
        ? CLASSIFICACAO_CORES[ultimaLeitura.itgu_classificacao] ?? 'bg-gray-100 text-gray-800'
        : 'bg-gray-100 text-gray-800';

    const corHero = ultimaLeitura?.itgu_classificacao
        ? CLASSIFICACAO_HERO[ultimaLeitura.itgu_classificacao] ?? 'bg-gray-700'
        : 'bg-gray-700';

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: 'Estações', href: route('estacoes.index') }, { label: estacao.nome }]}
            header={
                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href={route('estacoes.index')}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Voltar para Estações"
                        title="Voltar para Estações"
                    >
                        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">{estacao.nome}</h2>
                    {ultimaLeitura?.itgu_classificacao && (
                        <span
                            className={`inline-flex items-center h-6 px-2.5 rounded text-xs font-medium leading-none ${cor}`}
                        >
                            {ultimaLeitura.itgu_classificacao}
                        </span>
                    )}
                    <Link
                        href={route('boletim.show', estacao.id)}
                        className="ml-auto px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Ver Boletim
                    </Link>
                </div>
            }
        >
            <Head title={estacao.nome} />

            <div className="py-6 sm:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    <ModoCampo estacao={estacao} ultimaLeitura={ultimaLeitura} corHero={corHero} />

                    <div className="hidden sm:block space-y-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <p className="text-sm text-gray-500 mb-4">{estacao.localizacao}</p>

                            {ultimaLeitura ? (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        <CampoMetrica
                                            rotulo="Temp. Ar"
                                            valor={ultimaLeitura.temperatura_ar}
                                            unidade="°C"
                                            minMax={minMax.temperatura_ar}
                                        />
                                        <CampoMetrica
                                            rotulo="Umidade"
                                            valor={ultimaLeitura.umidade_ar}
                                            unidade="%"
                                            minMax={minMax.umidade_ar}
                                            corValor={classificarUmidade(ultimaLeitura.umidade_ar)}
                                            ehUmidade
                                        />
                                        <CampoMetrica rotulo="ITGU" valor={ultimaLeitura.itgu} minMax={minMax.itgu} />
                                        <CampoMetrica rotulo="ITU" valor={ultimaLeitura.itu} minMax={minMax.itu} />
                                        <CampoMetrica rotulo="Pressão" valor={ultimaLeitura.pressao} unidade=" hPa" />
                                        <CampoMetrica rotulo="Altitude" valor={ultimaLeitura.altitude} unidade=" m" />
                                        <CampoMetrica
                                            rotulo="Luminosidade"
                                            valor={ultimaLeitura.luminosidade}
                                            unidade="%"
                                            minMax={minMax.luminosidade}
                                        />
                                        <CampoMetrica
                                            rotulo="Índice UV"
                                            valor={ultimaLeitura.indice_uv}
                                            minMax={minMax.indice_uv}
                                        />
                                        <CampoMetrica
                                            rotulo="CO2 eq."
                                            valor={ultimaLeitura.co2_ppm}
                                            unidade=" ppm"
                                            minMax={minMax.co2_ppm}
                                        />
                                        <CampoMetrica
                                            rotulo="TVOC"
                                            valor={ultimaLeitura.tvoc_ppb}
                                            unidade=" ppb"
                                            minMax={minMax.tvoc_ppb}
                                        />
                                        <CampoMetrica
                                            rotulo="Qualid. Ar"
                                            valor={ultimaLeitura.aqi}
                                            unidade="/5"
                                            minMax={minMax.aqi}
                                        />
                                        <CampoMetrica
                                            rotulo="Temp. Globo Negro"
                                            valor={ultimaLeitura.temp_globo_negro}
                                            unidade="°C"
                                            minMax={minMax.temp_globo_negro}
                                        />
                                        <CampoMetrica
                                            rotulo="Chuva"
                                            valor={ultimaLeitura.chuva_mm}
                                            unidade=" mm"
                                        />
                                        <CampoMetrica
                                            rotulo="Vel. Vento"
                                            valor={ultimaLeitura.vel_vento}
                                            unidade=" km/h"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-4">
                                        Atualizado em {new Date(ultimaLeitura.registrado_em).toLocaleString('pt-BR')}
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-gray-400">Sem leituras registradas ainda.</p>
                            )}
                        </div>

                        <BarraFiltroTemporal
                            periodo={periodoSelecionado}
                            periodosDisponiveis={periodosDisponiveis}
                            dataReferencia={dataReferencia}
                            navegacaoPeriodo={navegacaoPeriodo}
                            onNavegarData={(novaData) => navegarFiltro({ data: novaData })}
                            onMudarPeriodo={(periodo) => navegarFiltro({ periodo })}
                        />

                        <Suspense fallback={<CarregandoWidget />}>
                            <GraficoMetrica
                                serieMetrica={serieMetrica}
                                estacoes={[estacao]}
                                metricaSelecionada={metricaSelecionada}
                                metricasDisponiveis={metricasDisponiveis}
                                onSelecionarMetrica={(metrica) => navegarFiltro({ metrica })}
                            />
                        </Suspense>

                        <PainelAlertasRecentes
                            alertas={alertasRecentes}
                            exibirEstacao={false}
                            onResolver={handleResolverAlerta}
                            onReabrir={handleReabrirAlerta}
                            mensagemVazia="Nenhum alerta registrado para esta estação."
                            alturaMaximaClass="max-h-[320px]"
                        />
                    </div>
                </div>
            </div>

            <BarraInferiorMobile estacaoId={estacao.id} />
        </AuthenticatedLayout>
    );
}
