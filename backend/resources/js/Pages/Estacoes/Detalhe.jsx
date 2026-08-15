import { lazy, Suspense } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { SeletorMetrica, SeletorPeriodo, NavegacaoPeriodo, METRICAS } from '@/Components/Dashboard/SeletoresPeriodo';

const GraficoMetrica = lazy(() => import('@/Components/Dashboard/PainelMetrica'));

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
                {valor ?? '—'}{valor !== null && valor !== undefined ? unidade : ''}
            </p>
            <p className={`text-xs mt-1 ${destaque ? 'text-gray-300' : 'text-gray-500'}`}>{rotulo}</p>
            {minMax && (minMax.maximo || minMax.minimo) && (
                <div className="border-t border-gray-200 mt-2 pt-2 flex justify-center gap-3">
                    {minMax.maximo && (
                        <span className={`text-xs ${ehUmidade ? classificarUmidade(minMax.maximo.valor) : 'text-red-600'}`}>
                            ↑ {minMax.maximo.valor}{unidade} {minMax.maximo.hora}
                        </span>
                    )}
                    {minMax.minimo && (
                        <span className={`text-xs ${ehUmidade ? classificarUmidade(minMax.minimo.valor) : 'text-blue-600'}`}>
                            ↓ {minMax.minimo.valor}{unidade} {minMax.minimo.hora}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

// Modo campo: layout dedicado para telas pequenas (celular em campo),
// focado nos dados essenciais de forma bem legivel, sem precisar rolar
// muito nem depender do mouse/hover que o layout desktop usa.
function ModoCampo({ estacao, ultimaLeitura, cor, corHero }) {
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
                    Atualizado {new Date(ultimaLeitura.registrado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <CampoMetrica rotulo="Umidade" valor={ultimaLeitura.umidade_ar} unidade="%" corValor={classificarUmidade(ultimaLeitura.umidade_ar)} />
                <CampoMetrica rotulo="ITGU" valor={ultimaLeitura.itgu} />
                <CampoMetrica rotulo="Índice UV" valor={ultimaLeitura.indice_uv} />
                <CampoMetrica rotulo="Pressão" valor={ultimaLeitura.pressao} unidade=" hPa" />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900">
                    💧 {dicaDeCampo(ultimaLeitura.itgu_classificacao, ultimaLeitura.umidade_ar)}
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
    const Item = ({ href, rotulo, icone }) => (
        <Link href={href} className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-500 hover:text-gray-800 py-2">
            {icone}
            <span className="text-[10px]">{rotulo}</span>
        </Link>
    );

    return (
        <div className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex z-20">
            <Item
                href={route('dashboard')}
                rotulo="Início"
                icone={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>}
            />
            <Item
                href={route('boletim.show', estacaoId)}
                rotulo="Boletim"
                icone={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" /></svg>}
            />
            <Item
                href={route('leituras.index')}
                rotulo="Histórico"
                icone={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>}
            />
            <Item
                href={route('profile.edit')}
                rotulo="Perfil"
                icone={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>}
            />
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
    alertasRecentes,
}) {
    const construirUrl = (params) => {
        const query = new URLSearchParams({
            ...(params.metrica !== undefined ? { metrica: params.metrica } : { metrica: metricaSelecionada }),
            ...(params.periodo !== undefined ? { periodo: params.periodo } : { periodo: periodoSelecionado }),
            ...(params.data !== undefined ? { data: params.data } : { data: dataReferencia }),
        });
        return route('estacoes.show', estacao.id) + '?' + query.toString();
    };

    const cor = ultimaLeitura?.itgu_classificacao
        ? CLASSIFICACAO_CORES[ultimaLeitura.itgu_classificacao] ?? 'bg-gray-100 text-gray-800'
        : 'bg-gray-100 text-gray-800';

    const corHero = ultimaLeitura?.itgu_classificacao
        ? CLASSIFICACAO_HERO[ultimaLeitura.itgu_classificacao] ?? 'bg-gray-700'
        : 'bg-gray-700';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href={route('dashboard')} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        {estacao.nome}
                    </h2>
                    {ultimaLeitura?.itgu_classificacao && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${cor}`}>
                            {ultimaLeitura.itgu_classificacao}
                        </span>
                    )}
                    <Link
                        href={route('boletim.show', estacao.id)}
                        className="ml-auto px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Ver Boletim
                    </Link>
                </div>
            }
        >
            <Head title={estacao.nome} />

            <div className="py-6 sm:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    <ModoCampo estacao={estacao} ultimaLeitura={ultimaLeitura} cor={cor} corHero={corHero} />

                    <div className="hidden sm:block space-y-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <p className="text-sm text-gray-500 mb-4">{estacao.localizacao}</p>

                            {ultimaLeitura ? (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        <CampoMetrica rotulo="Temp. Ar" valor={ultimaLeitura.temperatura_ar} unidade="°C" minMax={minMax.temperatura_ar} />
                                        <CampoMetrica rotulo="Umidade" valor={ultimaLeitura.umidade_ar} unidade="%" minMax={minMax.umidade_ar} corValor={classificarUmidade(ultimaLeitura.umidade_ar)} ehUmidade />
                                        <CampoMetrica rotulo="ITGU" valor={ultimaLeitura.itgu} minMax={minMax.itgu} />
                                        <CampoMetrica rotulo="ITU" valor={ultimaLeitura.itu} minMax={minMax.itu} />
                                        <CampoMetrica rotulo="Pressão" valor={ultimaLeitura.pressao} unidade=" hPa" />
                                        <CampoMetrica rotulo="Altitude" valor={ultimaLeitura.altitude} unidade=" m" />
                                        <CampoMetrica rotulo="Luminosidade" valor={ultimaLeitura.luminosidade} unidade="%" minMax={minMax.luminosidade} />
                                        <CampoMetrica rotulo="Índice UV" valor={ultimaLeitura.indice_uv} minMax={minMax.indice_uv} />
                                        <CampoMetrica rotulo="CO2 eq." valor={ultimaLeitura.co2_ppm} unidade=" ppm" minMax={minMax.co2_ppm} />
                                        <CampoMetrica rotulo="TVOC" valor={ultimaLeitura.tvoc_ppb} unidade=" ppb" minMax={minMax.tvoc_ppb} />
                                        <CampoMetrica rotulo="Qualid. Ar" valor={ultimaLeitura.aqi} unidade="/5" minMax={minMax.aqi} />
                                        <CampoMetrica rotulo="Temp. Globo Negro" valor={ultimaLeitura.temp_globo_negro} unidade="°C" minMax={minMax.temp_globo_negro} />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-4">
                                        Atualizado em {new Date(ultimaLeitura.registrado_em).toLocaleString('pt-BR')}
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-gray-400">Sem leituras registradas ainda.</p>
                            )}
                        </div>

                        <div className="flex justify-between items-center gap-3 flex-wrap">
                            <NavegacaoPeriodo
                                periodo={periodoSelecionado}
                                dataReferencia={dataReferencia}
                                navegacaoPeriodo={navegacaoPeriodo}
                                onNavegar={(novaData) => router.get(construirUrl({ data: novaData }))}
                            />
                            <div className="flex items-center gap-3 flex-wrap">
                                <SeletorPeriodo
                                    periodosDisponiveis={periodosDisponiveis}
                                    periodoSelecionado={periodoSelecionado}
                                    onChange={(periodo) => router.get(construirUrl({ periodo }))}
                                />
                                <SeletorMetrica
                                    metricasDisponiveis={metricasDisponiveis}
                                    metricaSelecionada={metricaSelecionada}
                                    onChange={(metrica) => router.get(construirUrl({ metrica }))}
                                />
                            </div>
                        </div>

                        <Suspense fallback={<CarregandoWidget />}>
                            <GraficoMetrica
                                serieMetrica={serieMetrica}
                                estacoes={[estacao]}
                                metricaSelecionada={metricaSelecionada}
                            />
                        </Suspense>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="font-semibold text-lg text-gray-800 mb-4">Alertas Recentes</h3>
                            {alertasRecentes.length > 0 ? (
                                <ul className="divide-y divide-gray-100">
                                    {alertasRecentes.map((alerta) => (
                                        <li key={alerta.id} className="py-3 flex justify-between items-center gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{alerta.parametro}</p>
                                                <p className="text-xs text-gray-500">
                                                    Valor lido: {alerta.valor_lido} (limite: {alerta.valor_limite})
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {new Date(alerta.created_at).toLocaleString('pt-BR')}
                                                </p>
                                            </div>
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium shrink-0 ${
                                                    alerta.resolvido ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}
                                            >
                                                {alerta.resolvido ? 'Resolvido' : 'Ativo'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-400">Nenhum alerta registrado para esta estação.</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            <BarraInferiorMobile estacaoId={estacao.id} />
        </AuthenticatedLayout>
    );
}
