import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';

const CLASSIFICACAO_CORES = {
    normal: 'bg-green-100 text-green-800',
    alerta: 'bg-yellow-100 text-yellow-800',
    atencao: 'bg-yellow-100 text-yellow-800',
    atencao_extrema: 'bg-orange-100 text-orange-800',
    perigo: 'bg-red-100 text-red-800',
    perigo_extremo: 'bg-red-200 text-red-900',
};

function Classificacao({ valor }) {
    if (!valor) return <span className="text-gray-300">—</span>;
    return (
        <span
            className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                CLASSIFICACAO_CORES[valor] ?? 'bg-gray-100 text-gray-800'
            }`}
        >
            {valor}
        </span>
    );
}

export default function Index({ leituras, estacoes, filtros }) {
    const [estacaoId, setEstacaoId] = useState(filtros.estacao_id ?? '');
    const [dataInicio, setDataInicio] = useState(filtros.data_inicio ?? '');
    const [dataFim, setDataFim] = useState(filtros.data_fim ?? '');

    const scrollTopoRef = useRef(null);
    const scrollTabelaRef = useRef(null);
    const [larguraTabela, setLarguraTabela] = useState(0);

    useEffect(() => {
        const atualizarLargura = () => {
            if (scrollTabelaRef.current) {
                setLarguraTabela(scrollTabelaRef.current.scrollWidth);
            }
        };
        atualizarLargura();
        window.addEventListener('resize', atualizarLargura);
        return () => window.removeEventListener('resize', atualizarLargura);
    }, [leituras]);

    const sincronizarDoTopo = (e) => {
        if (scrollTabelaRef.current) {
            scrollTabelaRef.current.scrollLeft = e.target.scrollLeft;
        }
    };

    const sincronizarDaTabela = (e) => {
        if (scrollTopoRef.current) {
            scrollTopoRef.current.scrollLeft = e.target.scrollLeft;
        }
    };

    const aplicarFiltros = (e) => {
        e.preventDefault();
        router.get(
            route('leituras.index'),
            {
                estacao_id: estacaoId || undefined,
                data_inicio: dataInicio || undefined,
                data_fim: dataFim || undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const limparFiltros = () => {
        setEstacaoId('');
        setDataInicio('');
        setDataFim('');
        router.get(route('leituras.index'));
    };

    const urlExportacao = () => {
        const params = new URLSearchParams();
        if (estacaoId) params.set('estacao_id', estacaoId);
        if (dataInicio) params.set('data_inicio', dataInicio);
        if (dataFim) params.set('data_fim', dataFim);
        const query = params.toString();
        return route('leituras.export') + (query ? `?${query}` : '');
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: 'Histórico' }]}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Histórico de Leituras
                </h2>
            }
        >
            <Head title="Histórico de Leituras" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Filtros */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <form onSubmit={aplicarFiltros} className="flex flex-wrap items-end gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Estação
                                </label>
                                <select
                                    value={estacaoId}
                                    onChange={(e) => setEstacaoId(e.target.value)}
                                    className="rounded-md border-gray-300 shadow-sm text-sm focus:ring-gray-500 focus:border-gray-500"
                                >
                                    <option value="">Todas</option>
                                    {estacoes.map((estacao) => (
                                        <option key={estacao.id} value={estacao.id}>
                                            {estacao.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    De
                                </label>
                                <input
                                    type="date"
                                    value={dataInicio}
                                    onChange={(e) => setDataInicio(e.target.value)}
                                    className="rounded-md border-gray-300 shadow-sm text-sm focus:ring-gray-500 focus:border-gray-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Até
                                </label>
                                <input
                                    type="date"
                                    value={dataFim}
                                    onChange={(e) => setDataFim(e.target.value)}
                                    className="rounded-md border-gray-300 shadow-sm text-sm focus:ring-gray-500 focus:border-gray-500"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded hover:bg-gray-700"
                                >
                                    Filtrar
                                </button>
                                <button
                                    type="button"
                                    onClick={limparFiltros}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200"
                                >
                                    Limpar
                                </button>
                            </div>
                                    <div className="ml-auto">
                                <a href={urlExportacao()} className="px-4 py-2 bg-green-700 text-white text-sm font-medium rounded hover:bg-green-800 inline-block">
                                    ⬇ Exportar CSV
                                </a>
                            </div>
                            
                        </form>
                    </div>

                    {/* Tabela */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        {/* Barra de rolagem sincronizada no topo, para nao precisar descer ate o fim da tabela */}
                        <div
                            ref={scrollTopoRef}
                            onScroll={sincronizarDoTopo}
                            className="overflow-x-auto overflow-y-hidden border-b border-gray-100"
                            style={{ height: '14px' }}
                        >
                            <div style={{ width: larguraTabela, height: '1px' }} />
                        </div>
                        <div
                            ref={scrollTabelaRef}
                            onScroll={sincronizarDaTabela}
                            className="overflow-x-auto"
                        >
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-3">Estação</th>
                                        <th className="px-6 py-3">Data/Hora</th>
                                        <th className="px-6 py-3">Temp. Ar</th>
                                        <th className="px-6 py-3">Umidade Ar</th>
                                        <th className="px-6 py-3">Temp. Globo Negro</th>
                                        <th className="px-6 py-3">Umid. Globo Negro</th>
                                        <th className="px-6 py-3">ITGU</th>
                                        <th className="px-6 py-3">Classif. ITGU</th>
                                        <th className="px-6 py-3">ITU</th>
                                        <th className="px-6 py-3">Classif. ITU</th>
                                        <th className="px-6 py-3">Índice de Calor</th>
                                        <th className="px-6 py-3">Classif. Calor</th>
                                        <th className="px-6 py-3">Pressão</th>
                                        <th className="px-6 py-3">Altitude</th>
                                        <th className="px-6 py-3">Índice UV</th>
                                        <th className="px-6 py-3">Luminosidade</th>
                                        <th className="px-6 py-3">CO2 eq.</th>
                                        <th className="px-6 py-3">TVOC</th>
                                        <th className="px-6 py-3">AQI</th>
                                        <th className="px-6 py-3">Chuva</th>
                                        <th className="px-6 py-3">Vel. Vento</th>
                                        <th className="px-6 py-3">Dir. Vento</th>
                                        <th className="px-6 py-3">Umid. Solo</th>
                                        <th className="px-6 py-3">Temp. Solo</th>
                                        <th className="px-6 py-3">Condut. Solo</th>
                                        <th className="px-6 py-3">Tensão Bateria</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {leituras.data.length > 0 ? (
                                        leituras.data.map((leitura) => (
                                            <tr key={leitura.id}>
                                                <td className="px-6 py-4 font-medium text-gray-800 whitespace-nowrap">
                                                    {leitura.estacao?.nome ?? 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                                    {leitura.registrado_em
                                                        ? new Date(leitura.registrado_em).toLocaleString('pt-BR')
                                                        : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{leitura.temperatura_ar ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-600">{leitura.umidade_ar ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-600">{leitura.temp_globo_negro ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-600">{leitura.umid_globo_negro ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-600">{leitura.itgu ?? '—'}</td>
                                                <td className="px-6 py-4"><Classificacao valor={leitura.itgu_classificacao} /></td>
                                                <td className="px-6 py-4 text-gray-600">{leitura.itu ?? '—'}</td>
                                                <td className="px-6 py-4"><Classificacao valor={leitura.itu_classificacao} /></td>
                                                <td className="px-6 py-4 text-gray-600">{leitura.indice_calor ?? '—'}</td>
                                                <td className="px-6 py-4"><Classificacao valor={leitura.indice_calor_classificacao} /></td>
                                                <td className="px-6 py-4 text-gray-600">{leitura.pressao ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-600">{leitura.altitude ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-600">{leitura.indice_uv ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-600">{leitura.luminosidade ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-600">{leitura.co2_ppm ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-600">{leitura.tvoc_ppb ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-600">{leitura.aqi ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-600">{leitura.chuva_mm ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-600">{leitura.vel_vento ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-600">{leitura.dir_vento ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-600">{leitura.solo_umidade ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-600">{leitura.solo_temperatura ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-600">{leitura.solo_condutividade ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-600">{leitura.tensao_bateria ?? '—'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={26} className="px-6 py-8 text-center text-gray-400">
                                                Nenhuma leitura encontrada para os filtros aplicados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginação */}
                        {leituras.links.length > 3 && (
                            <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap gap-1">
                                {leituras.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url ?? '#'}
                                        preserveState
                                        preserveScroll
                                        className={`px-3 py-1 rounded text-sm ${
                                            link.active
                                                ? 'bg-gray-800 text-white'
                                                : link.url
                                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                : 'text-gray-300 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}