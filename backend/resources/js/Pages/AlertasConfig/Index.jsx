import ConfirmModal from '@/Components/ConfirmModal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export default function Index({ alertasConfig }) {
    const [configParaExcluir, setConfigParaExcluir] = useState(null);
    const [excluindo, setExcluindo] = useState(false);

    const executarExclusao = () => {
        if (!configParaExcluir) return;
        setExcluindo(true);
        router.delete(route('alertas-config.destroy', configParaExcluir.id), {
            onFinish: () => {
                setExcluindo(false);
                setConfigParaExcluir(null);
            },
        });
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: 'Alertas' }]}
            header={
                <div className="flex justify-between items-center gap-3 flex-wrap">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Configurações de Alerta
                    </h2>
                    <Link
                        href={route('alertas-config.create')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Nova Configuração
                    </Link>
                </div>
            }
        >
            <Head title="Configurações de Alerta" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-3">Estação</th>
                                        <th className="px-6 py-3">Parâmetro</th>
                                        <th className="px-6 py-3">Condição</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {alertasConfig.length > 0 ? (
                                        alertasConfig.map((config) => (
                                            <tr key={config.id} className="hover:bg-gray-50/70 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-800">
                                                    {config.estacao_nome}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {config.parametro_label}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 font-mono">
                                                    {config.operador} {config.valor_limite}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center h-6 px-2.5 rounded text-xs font-medium leading-none ${
                                                            config.ativo
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}
                                                    >
                                                        {config.ativo ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap space-x-3">
                                                    <Link
                                                        href={route('alertas-config.edit', config.id)}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        Editar
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfigParaExcluir(config)}
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
                                                Nenhuma configuração de alerta cadastrada.{' '}
                                                <Link href={route('alertas-config.create')} className="text-blue-600 hover:underline">
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
                show={Boolean(configParaExcluir)}
                onClose={() => !excluindo && setConfigParaExcluir(null)}
                onConfirm={executarExclusao}
                processing={excluindo}
                title="Remover configuração de alerta"
                message={
                    configParaExcluir
                        ? `Deseja remover a configuração de alerta "${configParaExcluir.parametro_label}" da estação "${configParaExcluir.estacao_nome}"?`
                        : ''
                }
                confirmLabel="Sim, remover"
            />
        </AuthenticatedLayout>
    );
}
