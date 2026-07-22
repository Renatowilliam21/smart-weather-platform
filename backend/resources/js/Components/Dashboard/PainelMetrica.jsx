import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { METRICAS } from '@/Components/Dashboard/SeletoresPeriodo';

export default function GraficoMetrica({ serieMetrica, estacoes, metricaSelecionada }) {
    const nomesPorId = Object.fromEntries(estacoes.map(e => [e.id, e.nome]));
    const infoMetrica = METRICAS[metricaSelecionada] ?? { rotulo: metricaSelecionada, unidade: '' };

  const dadosPorRotulo = {};
    serieMetrica.forEach((ponto) => {
        // Prefixo "r_" evita que o JavaScript reordene as chaves numericamente
        // (chaves que parecem numeros puros sao sempre listadas primeiro,
        // ignorando a ordem de insercao - um comportamento nativo do proprio
        // motor JS, nao um bug do React). Isso preserva a ordem correta que
        // o backend ja envia (01, 02, 03... 31).
        const chave = 'r_' + ponto.rotulo;
        if (!dadosPorRotulo[chave]) {
            dadosPorRotulo[chave] = { horario: ponto.rotulo };
        }
        const nomeEstacao = nomesPorId[ponto.estacao_id] ?? `Estação ${ponto.estacao_id}`;
        dadosPorRotulo[chave][nomeEstacao] = ponto.valor !== null ? parseFloat(ponto.valor) : null;
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
