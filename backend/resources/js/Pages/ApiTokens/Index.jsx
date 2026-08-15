import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ tokens, tokenGerado }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
    });

    const [copiado, setCopiado] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('api-tokens.store'), {
            onSuccess: () => reset(),
        });
    };

    const revogar = (tokenId, nome) => {
        if (confirm(`Revogar o token "${nome}"? Qualquer integração usando ele vai parar de funcionar imediatamente.`)) {
            router.delete(route('api-tokens.destroy', tokenId));
        }
    };

    const copiarToken = () => {
        navigator.clipboard.writeText(tokenGerado);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: 'Tokens API' }]}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Tokens de API
                </h2>
            }
        >
            <Head title="Tokens de API" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {tokenGerado && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                            <h3 className="font-semibold text-green-800 mb-2">
                                Token gerado com sucesso!
                            </h3>
                            <p className="text-sm text-green-700 mb-3">
                                Copie agora — por segurança, ele não será mostrado novamente.
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-white border border-green-300 rounded px-3 py-2 text-sm font-mono break-all">
                                    {tokenGerado}
                                </code>
                                <button
                                    type="button"
                                    onClick={copiarToken}
                                    className="px-4 py-2 bg-green-700 text-white text-sm font-medium rounded hover:bg-green-800 whitespace-nowrap"
                                >
                                    {copiado ? 'Copiado!' : 'Copiar'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="font-semibold text-gray-800 mb-4">Gerar novo token</h3>
                        <form onSubmit={submit} className="flex flex-wrap items-end gap-4">
                            <div className="flex-1 min-w-[240px]">
                                <InputLabel htmlFor="name" value="Nome do token (ex: Integração Fazenda X)" />
                                <TextInput
                                    id="name"
                                    className="mt-1 block w-full"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            <PrimaryButton disabled={processing}>Gerar token</PrimaryButton>
                        </form>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Nome</th>
                                    <th className="px-6 py-3">Último uso</th>
                                    <th className="px-6 py-3">Criado em</th>
                                    <th className="px-6 py-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {tokens.length > 0 ? (
                                    tokens.map((token) => (
                                        <tr key={token.id}>
                                            <td className="px-6 py-4 font-medium text-gray-800">{token.name}</td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {token.last_used_at
                                                    ? new Date(token.last_used_at).toLocaleString('pt-BR')
                                                    : 'Nunca usado'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {new Date(token.created_at).toLocaleString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => revogar(token.id, token.name)}
                                                    className="text-red-600 hover:underline"
                                                >
                                                    Revogar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                            Nenhum token gerado ainda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="font-semibold text-gray-800 mb-3">Como usar</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Envie o token no cabeçalho <code className="bg-gray-100 px-1 rounded">Authorization</code> de cada requisição:
                        </p>
                        <pre className="bg-gray-900 text-gray-100 text-xs rounded p-4 overflow-x-auto">
{`curl https://smart-weather-platform.onrender.com/api/v1/estacoes \\
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \\
  -H "Accept: application/json"`}
                        </pre>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
