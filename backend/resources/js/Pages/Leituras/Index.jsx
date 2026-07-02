import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

const CLASSIFICACAO_CORES = {
    normal: 'bg-green-100 text-green-800',
    alerta: 'bg-yellow-100 text-yellow-800',
    perigo: 'bg-red-100 text-red-800',
};

export default function Index({ leituras, estacoes, filtros }) {
    const [estacaoId, setEstacaoId] = useState(filtros.estacao_id ?? '');
    const [dataInicio, setDataInicio] = useState(filtros.data_inicio ?? '');
    const [dataFim, setDataFim] = useState(filtros.data_fim ?? '');

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
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-3">Estação</th>
                                        <th className="px-6 py-3">Data/Hora</th>
                                        <th className="px-6 py-3">Temp. Ar</th>
                                        <th className="px-6 py-3">Umidade</th>
                                        <th className="px-6 py-3">ITGU</th>
                                        <th className="px-6 py-3">Classificação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {leituras.data.length > 0 ? (
                                        leituras.data.map((leitura) => (
                                            <tr key={leitura.id}>
                                                <td className="px-6 py-4 font-medium text-gray-800">
                                                    {leitura.estacao?.nome ?? 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {leitura.registrado_em
                                                        ? new Date(leitura.registrado_em).toLocaleString('pt-BR')
                                                        : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {leitura.temperatura_ar ?? '—'}°
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {leitura.umidade_ar ?? '—'}%
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {leitura.itgu ?? '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {leitura.itgu_classificacao && (
                                                        <span
                                                            className={`px-2 py-1 rounded text-xs font-medium ${
                                                                CLASSIFICACAO_CORES[leitura.itgu_classificacao] ??
                                                                'bg-gray-100 text-gray-800'
                                                            }`}
                                                        >
                                                            {leitura.itgu_classificacao}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
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