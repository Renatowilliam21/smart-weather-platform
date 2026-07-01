import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Edit({ alertaConfig, estacoes, parametros }) {
    const { data, setData, put, processing, errors } = useForm({
        estacao_id: alertaConfig.estacao_id,
        parametro: alertaConfig.parametro,
        operador: alertaConfig.operador,
        valor_limite: alertaConfig.valor_limite,
        ativo: alertaConfig.ativo,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('alertas-config.update', alertaConfig.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Editar Configuração de Alerta
                </h2>
            }
        >
            <Head title="Editar Configuração de Alerta" />

            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <InputLabel htmlFor="estacao_id" value="Estação" />
                                <select
                                    id="estacao_id"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-gray-500 focus:border-gray-500"
                                    value={data.estacao_id}
                                    onChange={(e) => setData('estacao_id', e.target.value)}
                                    required
                                >
                                    {estacoes.map((estacao) => (
                                        <option key={estacao.id} value={estacao.id}>
                                            {estacao.nome}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.estacao_id} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="parametro" value="Parâmetro monitorado" />
                                <select
                                    id="parametro"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-gray-500 focus:border-gray-500"
                                    value={data.parametro}
                                    onChange={(e) => setData('parametro', e.target.value)}
                                    required
                                >
                                    {Object.entries(parametros).map(([valor, label]) => (
                                        <option key={valor} value={valor}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.parametro} className="mt-2" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="operador" value="Condição" />
                                    <select
                                        id="operador"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-gray-500 focus:border-gray-500"
                                        value={data.operador}
                                        onChange={(e) => setData('operador', e.target.value)}
                                        required
                                    >
                                        <option value=">">Maior que (&gt;)</option>
                                        <option value=">=">Maior ou igual (&gt;=)</option>
                                        <option value="<">Menor que (&lt;)</option>
                                        <option value="<=">Menor ou igual (&lt;=)</option>
                                        <option value="=">Igual a (=)</option>
                                    </select>
                                    <InputError message={errors.operador} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="valor_limite" value="Valor limite" />
                                    <input
                                        id="valor_limite"
                                        type="number"
                                        step="any"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-gray-500 focus:border-gray-500"
                                        value={data.valor_limite}
                                        onChange={(e) => setData('valor_limite', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.valor_limite} className="mt-2" />
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded p-3">
                                Alerta disparado quando: <strong>{parametros[data.parametro]}</strong>{' '}
                                <strong>{data.operador}</strong> <strong>{data.valor_limite || '?'}</strong>
                            </p>

                            <div className="flex items-center">
                                <input
                                    id="ativo"
                                    type="checkbox"
                                    checked={data.ativo}
                                    onChange={(e) => setData('ativo', e.target.checked)}
                                    className="rounded border-gray-300 text-gray-800 shadow-sm focus:ring-gray-500"
                                />
                                <label htmlFor="ativo" className="ml-2 text-sm text-gray-600">
                                    Configuração ativa
                                </label>
                            </div>

                            <div className="flex items-center gap-4">
                                <PrimaryButton disabled={processing}>Salvar Alterações</PrimaryButton>
                                <Link href={route('alertas-config.index')} className="text-sm text-gray-500 hover:underline">
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