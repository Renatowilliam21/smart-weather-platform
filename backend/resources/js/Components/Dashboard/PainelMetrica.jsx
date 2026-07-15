import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { METRICAS } from '@/Components/Dashboard/SeletoresPeriodo';

export default function GraficoMetrica({ serieMetrica, estacoes, metricaSelecionada }) {
    const nomesPorId = Object.fromEntries(estacoes.map(e => [e.id, e.nome]));
    const infoMetrica = METRICAS[metricaSelecionada] ?? { rotulo: metricaSelecionada, unidade: '' };

    const dadosPorRotulo = {};
    serieMetrica.forEach((ponto) => {
        if (!dadosPorRotulo[ponto.rotulo]) {
            dadosPorRotulo[ponto.rotulo] = { horario: ponto.rotulo, _ordem: Object.keys(dadosPorRotulo).length };
        }
        const nomeEstacao = nomesPorId[ponto.estacao_id] ?? `Estação ${ponto.estacao_id}`;
        dadosPorRotulo[ponto.rotulo][nomeEstacao] = ponto.valor !== null ? parseFloat(ponto.valor) : null;
    });

    const dados = Object.values(dadosPorRotulo);
    const idsPresentes = [...new Set(serieMetrica.map(p => p.estacao_id))];
    const nomesEstacoes = idsPresentes.map(id => nomesPorId[id] ?? `Estação ${id}`);
    const cores = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea'];

    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-4">
                {infoMetrica.rotulo} — Hoje (média por hora){infoMetrica.unidade ? ` (${infoMetrica.unidade})` : ''}
            </h3>
            {dados.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dados}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="horario" interval={dados.length > 15 ? 1 : 0} />
                        <YAxis domain={['auto', 'auto']} />
                        <Tooltip />
                        <Legend />
                        {nomesEstacoes.map((nome, i) => (
                            <Line
                                key={nome}
                                type="monotone"
                                dataKey={nome}
                                stroke={cores[i % cores.length]}
                                connectNulls={false}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-sm text-gray-400">Sem dados hoje para esta métrica</p>
            )}
        </div>
    );
}
