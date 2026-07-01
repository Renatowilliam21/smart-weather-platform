import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ estacoes }) {
    const confirmarExclusao = (estacao) => {
        if (confirm(`Tem certeza que deseja remover a estação "${estacao.nome}"? Todas as leituras associadas também serão removidas.`)) {
            router.delete(route('estacoes.destroy', estacao.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Estações Meteorológicas
                    </h2>
                    <Link
                        href={route('estacoes.create')}
                        className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded hover:bg-gray-700"
                    >
                        + Nova Estação
                    </Link>
                </div>
            }
        >
            <Head title="Estações" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
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
                                        <tr key={estacao.id}>
                                            <td className="px-6 py-4 font-medium text-gray-800">
                                                {estacao.nome}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {estacao.localizacao ?? '—'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {estacao.leituras_count}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                                        estacao.ativo
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    {estacao.ativo ? 'Ativa' : 'Inativa'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-3">
                                                <Link
                                                    href={route('estacoes.edit', estacao.id)}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    Editar
                                                </Link>
                                                <button
                                                    onClick={() => confirmarExclusao(estacao)}
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
        </AuthenticatedLayout>
    );
}