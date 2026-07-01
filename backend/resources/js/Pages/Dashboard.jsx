import { useState, useEffect, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CLASSIFICACAO_CORES = {
    normal: 'bg-green-100 text-green-800',
    alerta: 'bg-yellow-100 text-yellow-800',
    perigo: 'bg-red-100 text-red-800',
};

function SeletorEstacao({ estacoes, estacaoSelecionada, onChange }) {
    return (
        <select
            value={estacaoSelecionada ?? ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            className="rounded-md border-gray-300 shadow-sm text-sm focus:ring-gray-500 focus:border-gray-500"
        >
            <option value="">Todas as estações</option>
            {estacoes.map((estacao) => (
                <option key={estacao.id} value={estacao.id}>
                    {estacao.nome}
                </option>
            ))}
        </select>
    );
}

function EstacaoCard({ estacao }) {
    const leitura = estacao.ultima_leitura;
    const cor = leitura?.itgu_classificacao
        ? CLASSIFICACAO_CORES[leitura.itgu_classificacao] ?? 'bg-gray-100 text-gray-800'
        : 'bg-gray-100 text-gray-800';

    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-semibold text-lg text-gray-800">{estacao.nome}</h3>
                    <p className="text-sm text-gray-500">{estacao.localizacao}</p>
                </div>
                {leitura?.itgu_classificacao && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${cor}`}>
                        {leitura.itgu_classificacao}
                    </span>
                )}
            </div>

            {leitura ? (
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-2xl font-bold text-gray-800">
                            {leitura.temperatura_ar ?? '—'}°
                        </p>
                        <p className="text-xs text-gray-500">Temp. Ar</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-800">
                            {leitura.umidade_ar ?? '—'}%
                        </p>
                        <p className="text-xs text-gray-500">Umidade</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-800">
                            {leitura.itgu ?? '—'}
                        </p>
                        <p className="text-xs text-gray-500">ITGU</p>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-gray-400">Sem leituras registradas</p>
            )}

            {leitura?.registrado_em && (
                <p className="text-xs text-gray-400 mt-4">
                    Atualizado em {new Date(leitura.registrado_em).toLocaleString('pt-BR')}
                </p>
            )}
        </div>
    );
}

function GraficoItgu({ serieItgu, estacoes }) {
    const nomesPorId = Object.fromEntries(estacoes.map(e => [e.id, e.nome]));

    const dadosPorTimestamp = {};
    serieItgu.forEach((leitura) => {
        const ts = new Date(leitura.registrado_em).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
        if (!dadosPorTimestamp[ts]) {
            dadosPorTimestamp[ts] = { horario: ts };
        }
        const nomeEstacao = nomesPorId[leitura.estacao_id] ?? `Estação ${leitura.estacao_id}`;
        dadosPorTimestamp[ts][nomeEstacao] = parseFloat(leitura.itgu);
    });

    const dados = Object.values(dadosPorTimestamp);
    const idsPresentes = [...new Set(serieItgu.map(l => l.estacao_id))];
    const nomesEstacoes = idsPresentes.map(id => nomesPorId[id] ?? `Estação ${id}`);
    const cores = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea'];

    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-4">ITGU — Últimas 24h</h3>
            {dados.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dados}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="horario" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {nomesEstacoes.map((nome, i) => (
                            <Line
                                key={nome}
                                type="monotone"
                                dataKey={nome}
                                stroke={cores[i % cores.length]}
                                connectNulls
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-sm text-gray-400">Sem dados nas últimas 24h</p>
            )}
        </div>
    );
}

function ListaAlertas({ alertas }) {
    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-4">Alertas Recentes</h3>
            {alertas.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                    {alertas.map((alerta) => (
                        <li key={alerta.id} className="py-3 flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-800">
                                    {alerta.estacao_nome} — {alerta.parametro}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Valor lido: {alerta.valor_lido} (limite: {alerta.valor_limite})
                                </p>
                            </div>
                            <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                    alerta.resolvido
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                }`}
                            >
                                {alerta.resolvido ? 'Resolvido' : 'Ativo'}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-400">Nenhum alerta registrado</p>
            )}
        </div>
    );
}

function MapaEstacoes({ estacoes }) {
    const comCoordenadas = estacoes.filter((e) => e.latitude && e.longitude);
    const centro = comCoordenadas.length > 0
        ? [parseFloat(comCoordenadas[0].latitude), parseFloat(comCoordenadas[0].longitude)]
        : [-5.1, -39.1];

    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-4">Localização das Estações</h3>
            {comCoordenadas.length > 0 ? (
                <MapContainer center={centro} zoom={10} style={{ height: '300px', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    {comCoordenadas.map((estacao) => (
                        <Marker
                            key={estacao.id}
                            position={[parseFloat(estacao.latitude), parseFloat(estacao.longitude)]}
                        >
                            <Popup>
                                <strong>{estacao.nome}</strong>
                                <br />
                                {estacao.localizacao}
                                {estacao.ultima_leitura && (
                                    <>
                                        <br />
                                        ITGU: {estacao.ultima_leitura.itgu ?? '—'}
                                    </>
                                )}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            ) : (
                <p className="text-sm text-gray-400">Nenhuma estação com coordenadas cadastradas</p>
            )}
        </div>
    );
}

export default function Dashboard({
    estacoes: estacoesIniciais,
    serieItgu: serieInicial,
    alertasRecentes: alertasIniciais,
    estacaoSelecionada,
}) {
    const [estacoes, setEstacoes] = useState(estacoesIniciais);
    const [serieItgu, setSerieItgu] = useState(serieInicial);
    const [alertasRecentes, setAlertasRecentes] = useState(alertasIniciais);

    // Sincroniza o estado local sempre que o Inertia trouxer novos props
    // (ex: ao trocar a estação selecionada no seletor)
    useEffect(() => {
        setEstacoes(estacoesIniciais);
        setSerieItgu(serieInicial);
        setAlertasRecentes(alertasIniciais);
    }, [estacoesIniciais, serieInicial, alertasIniciais]);

    const atualizarDados = useCallback(async () => {
        try {
            const params = estacaoSelecionada ? `?estacao_id=${estacaoSelecionada}` : '';
            const response = await fetch(`/api/dashboard/refresh${params}`, {
                headers: { Accept: 'application/json' },
            });
            if (!response.ok) return;
            const data = await response.json();
            setEstacoes(data.estacoes);
            setSerieItgu(data.serieItgu);
            setAlertasRecentes(data.alertasRecentes);
        } catch (error) {
            console.error('Falha ao atualizar dashboard:', error);
        }
    }, [estacaoSelecionada]);

    useEffect(() => {
        const intervalo = setInterval(atualizarDados, 30000);
        return () => clearInterval(intervalo);
    }, [atualizarDados]);

    const handleSelecionarEstacao = (estacaoId) => {
        router.get(
            route('dashboard'),
            estacaoId ? { estacao_id: estacaoId } : {},
            { preserveState: true, preserveScroll: true }
        );
    };

    const estacoesFiltradas = estacaoSelecionada
        ? estacoes.filter((e) => e.id === estacaoSelecionada)
        : estacoes;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Dashboard — Monitoramento de Estações Meteorológicas
                    </h2>
                    <SeletorEstacao
                        estacoes={estacoes}
                        estacaoSelecionada={estacaoSelecionada}
                        onChange={handleSelecionarEstacao}
                    />
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {estacoesFiltradas.length > 0 ? (
                            estacoesFiltradas.map((estacao) => (
                                <EstacaoCard key={estacao.id} estacao={estacao} />
                            ))
                        ) : (
                            <div className="col-span-full bg-white shadow-sm sm:rounded-lg p-6 text-center text-gray-400">
                                Nenhuma estação cadastrada ainda.
                            </div>
                        )}
                    </div>

                    <GraficoItgu serieItgu={serieItgu} estacoes={estacoes} />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ListaAlertas alertas={alertasRecentes} />
                        <MapaEstacoes estacoes={estacoesFiltradas} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}