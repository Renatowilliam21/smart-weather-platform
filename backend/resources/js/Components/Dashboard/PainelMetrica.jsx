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

        if (metricaSelecionada === 'chuva_mm' && ponto.valor_acumulado !== undefined) {
            dadosPorRotulo[chave][`${nomeEstacao} (Acumulado)`] = ponto.valor_acumulado !== null ? parseFloat(ponto.valor_acumulado) : null;
        }
    });

    const dados = Object.values(dadosPorRotulo);
    const idsPresentes = [...new Set(serieMetrica.map(p => p.estacao_id))];
    const nomesEstacoes = idsPresentes.map(id => nomesPorId[id] ?? `Estação ${id}`);
    const cores = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea'];

    const temDadosValidos = serieMetrica.some(
        (p) => p.valor !== null && p.valor !== undefined && !isNaN(p.valor)
    );

    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 relative">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h3 className="font-semibold text-lg text-gray-800">
                    {infoMetrica.rotulo} — {metricaSelecionada === 'vel_vento' ? 'Máxima' : metricaSelecionada === 'chuva_mm' ? 'Total' : 'Média'} por período
                    {infoMetrica.unidade ? ` (${infoMetrica.unidade})` : ''}
                </h3>
                {!temDadosValidos && dados.length > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        Sem leituras no período
                    </span>
                )}
            </div>

            {dados.length > 0 ? (
                <div className="relative">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dados}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="horario" interval={dados.length > 15 ? 2 : 0} tick={{ fontSize: 11 }} />
                            <YAxis domain={temDadosValidos ? ['auto', 'auto'] : [0, 100]} />
                            {temDadosValidos && <Tooltip />}
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
                            {metricaSelecionada === 'chuva_mm' && nomesEstacoes.map((nome, i) => (
                                <Line
                                    key={`${nome}_acumulado`}
                                    type="monotone"
                                    dataKey={`${nome} (Acumulado)`}
                                    stroke={cores[i % cores.length]}
                                    strokeDasharray="5 5"
                                    connectNulls={false}
                                    dot={false}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>

                    {!temDadosValidos && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                            <div className="bg-white/90 backdrop-blur-xs px-4 py-2.5 rounded-lg border border-gray-200 shadow-sm text-sm text-gray-600 flex items-center gap-2">
                                <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Nenhum dado registrado para esta métrica no período selecionado</span>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-sm text-gray-400 py-8 text-center">Nenhuma estação ou dado disponível.</p>
            )}
        </div>
    );
}
