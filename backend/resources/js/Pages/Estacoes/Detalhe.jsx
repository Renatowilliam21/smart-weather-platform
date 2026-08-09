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

function classificarUmidade(valor) {
    if (valor === null || valor === undefined) return null;
    if (valor < 30) return 'text-red-600';
    if (valor <= 40) return 'text-orange-500';
    return 'text-blue-600';
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
                </div>
            }
        >
            <Head title={estacao.nome} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

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
        </AuthenticatedLayout>
    );
}
