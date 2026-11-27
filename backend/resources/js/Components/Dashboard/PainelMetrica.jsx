import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Info } from 'lucide-react';
import { METRICAS, SeletorMetrica } from '@/Components/Dashboard/SeletoresPeriodo';
import { obterUnidade } from '@/Components/Boletim/unidades';

export default function GraficoMetrica({
    serieMetrica,
    estacoes,
    metricaSelecionada,
    metricasDisponiveis = null,
    onSelecionarMetrica = null,
}) {
    const nomesPorId = Object.fromEntries(estacoes.map((e) => [e.id, e.nome]));
    const infoMetrica = METRICAS[metricaSelecionada] ?? { rotulo: metricaSelecionada, unidade: '' };
    const unidade = obterUnidade(metricaSelecionada) || infoMetrica.unidade?.trim() || '';

    const dadosPorRotulo = {};
    serieMetrica.forEach((ponto) => {
        const chave = 'r_' + ponto.rotulo;
        if (!dadosPorRotulo[chave]) {
            dadosPorRotulo[chave] = { horario: ponto.rotulo };
        }
        const nomeEstacao = nomesPorId[ponto.estacao_id] ?? `Estação ${ponto.estacao_id}`;
        dadosPorRotulo[chave][nomeEstacao] = ponto.valor !== null ? parseFloat(ponto.valor) : null;

        if (metricaSelecionada === 'chuva_mm' && ponto.valor_acumulado !== undefined) {
            dadosPorRotulo[chave][`${nomeEstacao} (Acumulado)`] =
                ponto.valor_acumulado !== null ? parseFloat(ponto.valor_acumulado) : null;
        }
    });

    const dados = Object.values(dadosPorRotulo);
    const idsPresentes = [...new Set(serieMetrica.map((p) => p.estacao_id))];
    const nomesEstacoes = idsPresentes.map((id) => nomesPorId[id] ?? `Estação ${id}`);
    const cores = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea'];

    const temDadosValidos = serieMetrica.some(
        (p) => p.valor !== null && p.valor !== undefined && !isNaN(p.valor)
    );

    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 relative">
            <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                <h3 className="font-semibold text-lg text-gray-800">
                    {infoMetrica.rotulo} —{' '}
                    {metricaSelecionada === 'vel_vento'
                        ? 'Máxima'
                        : metricaSelecionada === 'chuva_mm'
                        ? 'Total'
                        : 'Média'}{' '}
                    por período
                    {infoMetrica.unidade ? ` (${infoMetrica.unidade})` : ''}
                </h3>
                {!temDadosValidos && dados.length > 0 && (
                    <span className="inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 leading-none">
                        Sem leituras no período
                    </span>
                )}
            </div>

            {metricasDisponiveis && onSelecionarMetrica && (
                <div className="mb-5 pb-4 border-b border-gray-100">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 mb-2">
                        Variável exibida no gráfico
                    </p>
                    <SeletorMetrica
                        metricasDisponiveis={metricasDisponiveis}
                        metricaSelecionada={metricaSelecionada}
                        onChange={onSelecionarMetrica}
                    />
                </div>
            )}

            {dados.length > 0 ? (
                <div className="relative">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dados}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="horario" interval={dados.length > 15 ? 2 : 0} tick={{ fontSize: 11 }} />
                            <YAxis
                                domain={temDadosValidos ? ['auto', 'auto'] : [0, 100]}
                                tickFormatter={(value) => `${value} ${unidade}`}
                                width={60}
                            />
                            {temDadosValidos && <Tooltip formatter={(value, name) => [`${value} ${unidade}`, name]} />}
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
                            {metricaSelecionada === 'chuva_mm' &&
                                nomesEstacoes.map((nome, i) => (
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
                                <Info className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
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
