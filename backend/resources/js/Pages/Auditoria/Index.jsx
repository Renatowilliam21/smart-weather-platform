import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const ROTULOS_ACAO = {
    created: 'Criado',
    updated: 'Atualizado',
    deleted: 'Removido',
};

const CORES_ACAO = {
    created: 'bg-green-100 text-green-800',
    updated: 'bg-blue-100 text-blue-800',
    deleted: 'bg-red-100 text-red-800',
};

function DetalhesMudanca({ properties }) {
    if (!properties?.attributes) return null;

    const antigos = properties.old ?? {};
    const novos = properties.attributes ?? {};
    const campos = Object.keys(novos);

    if (campos.length === 0) return null;

    return (
        <div className="mt-1 text-xs text-gray-500 space-y-0.5">
            {campos.map((campo) => (
                <div key={campo}>
                    <span className="font-medium">{campo}:</span>{' '}
                    {antigos[campo] !== undefined && (
                        <span className="line-through text-gray-400">{String(antigos[campo])}</span>
                    )}{' '}
                    <span className="text-gray-700">{String(novos[campo])}</span>
                </div>
            ))}
        </div>
    );
}

export default function Index({ registros }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Log de Auditoria
                </h2>
            }
        >
            <Head title="Auditoria" />

            <div className="py-12">
                <div className="max-w-6xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Ação</th>
                                    <th className="px-6 py-3">Item</th>
                                    <th className="px-6 py-3">Detalhes</th>
                                    <th className="px-6 py-3">Usuário</th>
                                    <th className="px-6 py-3">Quando</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {registros.data.length > 0 ? (
                                    registros.data.map((registro) => (
                                        <tr key={registro.id}>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                                        CORES_ACAO[registro.description] ?? 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {ROTULOS_ACAO[registro.description] ?? registro.description}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-800">
                                                {registro.subject_type}
                                                <span className="text-gray-400"> #{registro.subject_id}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <DetalhesMudanca properties={registro.properties} />
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {registro.causer_nome}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                                {new Date(registro.created_at).toLocaleString('pt-BR')}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                            Nenhum registro de auditoria ainda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {registros.links.length > 3 && (
                            <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap gap-1">
                                {registros.links.map((link, i) => (
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
