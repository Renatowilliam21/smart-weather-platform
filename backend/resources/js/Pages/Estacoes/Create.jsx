import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        nome: '',
        localizacao: '',
        latitude: '',
        longitude: '',
        ativo: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('estacoes.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Nova Estação
                </h2>
            }
        >
            <Head title="Nova Estação" />

            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
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
                                        placeholder="-5.1281"
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
                                        placeholder="-39.7286"
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
                                <PrimaryButton disabled={processing}>Criar Estação</PrimaryButton>
                                <Link href={route('estacoes.index')} className="text-sm text-gray-500 hover:underline">
                                    Cancelar
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}