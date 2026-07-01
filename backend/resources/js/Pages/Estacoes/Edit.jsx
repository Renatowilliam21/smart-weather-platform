import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Edit({ estacao }) {
    const { data, setData, put, processing, errors } = useForm({
        nome: estacao.nome ?? '',
        localizacao: estacao.localizacao ?? '',
        latitude: estacao.latitude ?? '',
        longitude: estacao.longitude ?? '',
        ativo: estacao.ativo ?? true,
    });

    const [tokenVisivel, setTokenVisivel] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        put(route('estacoes.update', estacao.id));
    };

    const regenerarToken = () => {
        if (confirm('Regenerar o token vai invalidar o token atual. O ESP32 precisará ser reconfigurado. Continuar?')) {
            router.post(route('estacoes.regenerar-token', estacao.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Editar Estação
                </h2>
            }
        >
            <Head title="Editar Estação" />

            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <InputLabel htmlFor="nome" value="Nome" />
                                <TextInput
                                    id="nome"
                                    className="mt-1 block w-full"
                                    value={data.nome}
                                    onChange={(e) => setData('nome', e.target.value)}
                                    required
                                    autoFocus
                                />
                                <InputError message={errors.nome} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="localizacao" value="Localização" />
                                <TextInput
                                    id="localizacao"
                                    className="mt-1 block w-full"
                                    value={data.localizacao}
                                    onChange={(e) => setData('localizacao', e.target.value)}
                                />
                                <InputError message={errors.localizacao} className="mt-2" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="latitude" value="Latitude" />
                                    <TextInput
                                        id="latitude"
                                        type="number"
                                        step="any"
                                        className="mt-1 block w-full"
                                        value={data.latitude}
                                        onChange={(e) => setData('latitude', e.target.value)}
                                    />
                                    <InputError message={errors.latitude} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="longitude" value="Longitude" />
                                    <TextInput
                                        id="longitude"
                                        type="number"
                                        step="any"
                                        className="mt-1 block w-full"
                                        value={data.longitude}
                                        onChange={(e) => setData('longitude', e.target.value)}
                                    />
                                    <InputError message={errors.longitude} className="mt-2" />
                                </div>
                            </div>

                            <div className="flex items-center">
                                <input
                                    id="ativo"
                                    type="checkbox"
                                    checked={data.ativo}
                                    onChange={(e) => setData('ativo', e.target.checked)}
                                    className="rounded border-gray-300 text-gray-800 shadow-sm focus:ring-gray-500"
                                />
                                <label htmlFor="ativo" className="ml-2 text-sm text-gray-600">
                                    Estação ativa
                                </label>
                            </div>

                            <div className="flex items-center gap-4">
                                <PrimaryButton disabled={processing}>Salvar Alterações</PrimaryButton>
                                <Link href={route('estacoes.index')} className="text-sm text-gray-500 hover:underline">
                                    Voltar
                                </Link>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="font-semibold text-gray-800 mb-2">Token de API (ESP32)</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Use esse token no header <code className="bg-gray-100 px-1 rounded">X-API-Token</code> das
                            requisições do ESP32 para esta estação.
                        </p>

                        <div className="flex items-center gap-2">
                            <code className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm font-mono break-all">
                                {tokenVisivel ? estacao.token_api : '•'.repeat(32)}
                            </code>
                            <button
                                type="button"
                                onClick={() => setTokenVisivel(!tokenVisivel)}
                                className="text-sm text-blue-600 hover:underline whitespace-nowrap"
                            >
                                {tokenVisivel ? 'Ocultar' : 'Mostrar'}
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={regenerarToken}
                            className="mt-4 text-sm text-red-600 hover:underline"
                        >
                            Regenerar token
                        </button>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}