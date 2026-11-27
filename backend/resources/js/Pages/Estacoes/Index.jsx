import ConfirmModal from '@/Components/ConfirmModal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ExternalLink, Plus } from 'lucide-react';
import { useState } from 'react';

export default function Index({ estacoes }) {
    const [estacaoParaExcluir, setEstacaoParaExcluir] = useState(null);
    const [excluindo, setExcluindo] = useState(false);

    const executarExclusao = () => {
        if (!estacaoParaExcluir) return;
        setExcluindo(true);
        router.delete(route('estacoes.destroy', estacaoParaExcluir.id), {
            onFinish: () => {
                setExcluindo(false);
                setEstacaoParaExcluir(null);
            },
        });
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: 'Estações' }]}
            header={
                <div className="flex justify-between items-center gap-3 flex-wrap">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Estações Meteorológicas
                    </h2>
                    <Link
                        href={route('estacoes.create')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Nova Estação
                    </Link>
                </div>
            }
        >
            <Head title="Estações" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-3">Nome</th>
                                        <th className="px-6 py-3">Localização</th>
                                        <th className="px-6 py-3">Leituras</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {estacoes.length > 0 ? (
                                        estacoes.map((estacao) => (
                                            <tr key={estacao.id} className="hover:bg-gray-50/70 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-800">
                                                    <Link
                                                        href={route('estacoes.show', estacao.id)}
                                                        className="inline-flex items-center gap-1.5 text-gray-900 hover:text-indigo-600 hover:underline transition-colors"
                                                        title={`Ver detalhes de ${estacao.nome}`}
                                                    >
                                                        <span>{estacao.nome}</span>
                                                        <ExternalLink className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500">
                                                    {estacao.localizacao ?? '—'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-500">
                                                    {estacao.leituras_count}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center h-6 px-2.5 rounded text-xs font-medium leading-none ${
                                                            estacao.ativo
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}
                                                    >
                                                        {estacao.ativo ? 'Ativa' : 'Inativa'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap space-x-3">
                                                    <Link
                                                        href={route('estacoes.show', estacao.id)}
                                                        className="text-indigo-600 hover:underline font-medium"
                                                    >
                                                        Detalhes
                                                    </Link>
                                                    <Link
                                                        href={route('estacoes.edit', estacao.id)}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        Editar
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEstacaoParaExcluir(estacao)}
                                                        className="text-red-600 hover:underline"
                                                    >
                                                        Remover
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                                Nenhuma estação cadastrada.{' '}
                                                <Link href={route('estacoes.create')} className="text-blue-600 hover:underline">
                                                    Criar a primeira
                                                </Link>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal
                show={Boolean(estacaoParaExcluir)}
                onClose={() => !excluindo && setEstacaoParaExcluir(null)}
                onConfirm={executarExclusao}
                processing={excluindo}
                title="Remover estação meteorológica"
                message={
                    estacaoParaExcluir
                        ? `Tem certeza que deseja remover a estação "${estacaoParaExcluir.nome}"? Todas as leituras associadas também serão permanentemente removidas.`
                        : ''
                }
                confirmLabel="Sim, remover"
            />
        </AuthenticatedLayout>
    );
}
