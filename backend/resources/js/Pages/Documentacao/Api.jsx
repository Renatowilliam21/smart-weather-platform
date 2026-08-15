import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

function BlocoCodigo({ children }) {
    return (
        <pre className="bg-gray-900 text-gray-100 text-xs rounded p-4 overflow-x-auto">
            {children}
        </pre>
    );
}

function Endpoint({ metodo, caminho, descricao, parametros, exemplo }) {
    return (
        <div className="border-b border-gray-100 py-6 last:border-0">
            <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 rounded text-xs font-mono font-bold bg-blue-100 text-blue-800">
                    {metodo}
                </span>
                <code className="text-sm font-mono text-gray-800">{caminho}</code>
            </div>
            <p className="text-sm text-gray-600 mb-3">{descricao}</p>
            {parametros && (
                <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Parâmetros de consulta</p>
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                        {parametros.map((p, i) => (
                            <li key={i}><code className="bg-gray-100 px-1 rounded">{p.nome}</code> — {p.descricao}</li>
                        ))}
                    </ul>
                </div>
            )}
            <BlocoCodigo>{exemplo}</BlocoCodigo>
        </div>
    );
}

export default function Api() {
    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: 'Documentação' }, { label: 'API' }]}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Documentação da API Pública
                </h2>
            }
        >
            <Head title="Documentação da API" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="font-semibold text-gray-800 mb-3">Visão geral</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            A API pública permite que sistemas de terceiros consultem dados das estações
                            meteorológicas (somente leitura). Todas as requisições exigem autenticação
                            por token e estão limitadas a <strong>60 requisições por minuto</strong> por token.
                        </p>
                        <p className="text-sm text-gray-600">
                            Gere seu token em{' '}
                            <Link href={route('api-tokens.index')} className="text-blue-600 hover:underline">
                                Tokens de API
                            </Link>.
                        </p>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="font-semibold text-gray-800 mb-3">Autenticação</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Envie o token no cabeçalho <code className="bg-gray-100 px-1 rounded">Authorization</code>:
                        </p>
                        <BlocoCodigo>{`Authorization: Bearer SEU_TOKEN_AQUI`}</BlocoCodigo>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="font-semibold text-gray-800 mb-2">Endpoints</h3>

                        <Endpoint
                            metodo="GET"
                            caminho="/api/v1/estacoes"
                            descricao="Lista todas as estações ativas."
                            exemplo={`curl https://smart-weather-platform.onrender.com/api/v1/estacoes \\
  -H "Authorization: Bearer SEU_TOKEN" \\
  -H "Accept: application/json"`}
                        />

                        <Endpoint
                            metodo="GET"
                            caminho="/api/v1/estacoes/{id}"
                            descricao="Retorna os detalhes de uma estação específica, incluindo a última leitura registrada."
                            exemplo={`curl https://smart-weather-platform.onrender.com/api/v1/estacoes/1 \\
  -H "Authorization: Bearer SEU_TOKEN" \\
  -H "Accept: application/json"`}
                        />

                        <Endpoint
                            metodo="GET"
                            caminho="/api/v1/estacoes/{id}/leituras"
                            descricao="Lista o histórico de leituras de uma estação, paginado."
                            parametros={[
                                { nome: 'data_inicio', descricao: 'Data inicial no formato AAAA-MM-DD' },
                                { nome: 'data_fim', descricao: 'Data final no formato AAAA-MM-DD' },
                                { nome: 'por_pagina', descricao: 'Itens por página (1-100, padrão 25)' },
                            ]}
                            exemplo={`curl "https://smart-weather-platform.onrender.com/api/v1/estacoes/1/leituras?data_inicio=2026-07-01&por_pagina=50" \\
  -H "Authorization: Bearer SEU_TOKEN" \\
  -H "Accept: application/json"`}
                        />
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="font-semibold text-gray-800 mb-3">Códigos de resposta</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li><code className="bg-green-100 text-green-800 px-1 rounded">200</code> — Sucesso</li>
                            <li><code className="bg-red-100 text-red-800 px-1 rounded">401</code> — Token ausente ou inválido</li>
                            <li><code className="bg-red-100 text-red-800 px-1 rounded">404</code> — Estação não encontrada</li>
                            <li><code className="bg-red-100 text-red-800 px-1 rounded">429</code> — Limite de requisições excedido (60/min)</li>
                        </ul>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
