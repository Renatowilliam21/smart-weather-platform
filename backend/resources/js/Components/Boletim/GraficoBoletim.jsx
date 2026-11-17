import { memo, useCallback, useMemo } from 'react';
import {
    LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatarValorMetrica, UNIDADES_METRICAS } from '@/Components/Boletim/unidades';

// Este módulo é carregado sob demanda (React.lazy em Pages/Boletim/Show.jsx), para que o
// chunk do Recharts (~105 KB gzip / ~360 KB de JS para parsear) não bloqueie a primeira
// pintura dos cards e tabelas em celulares.

// Objetos constantes fora do componente: referências estáveis evitam que o Recharts
// considere as props "novas" e recalcule layout a cada render.
const MARGEM = { top: 10, right: 10, left: 0, bottom: 0 };
const TICK = { fontSize: 11, fill: '#6B7280' };
const DOMINIO = ['auto', 'auto'];
const TOOLTIP_ESTILO = { fontSize: 12, borderRadius: 8 };
const DOT = { r: 3 };
const ACTIVE_DOT = { r: 5 };
const RAIO_BARRA = [4, 4, 0, 0];
const LARGURA_EIXO_Y = 56;

// Em mobile a barra de endereço aparece/some no scroll e dispara resize; sem debounce
// o gráfico inteiro é re-renderizado a cada frame.
const DEBOUNCE_RESIZE_MS = 200;

function SemDados() {
    return <p className="text-sm text-gray-400 py-8 text-center">Sem dados suficientes para o gráfico.</p>;
}

const GraficoLinha = memo(function GraficoLinha({ serie, temMedia, nomeSerie, chaveUnidade }) {
    const temDados = useMemo(() => serie.some((p) => p.valor !== null && p.valor !== undefined), [serie]);

    const formatarEixoY = useCallback(
        (valor) => formatarValorMetrica(valor, chaveUnidade, 1, ''),
        [chaveUnidade]
    );

    const formatarTooltip = useCallback(
        (valor, nome) => [formatarValorMetrica(valor, chaveUnidade, 1), nome],
        [chaveUnidade]
    );

    if (!temDados) return <SemDados />;

    return (
        <ResponsiveContainer width="100%" height={220} debounce={DEBOUNCE_RESIZE_MS}>
            <LineChart data={serie} margin={MARGEM}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="rotulo" tick={TICK} />
                <YAxis width={LARGURA_EIXO_Y} tick={TICK} domain={DOMINIO} tickFormatter={formatarEixoY} />
                <Tooltip contentStyle={TOOLTIP_ESTILO} formatter={formatarTooltip} />
                {temMedia && (
                    <Line type="monotone" dataKey="media" stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="5 5"
                        dot={false} name="Média" connectNulls isAnimationActive={false} />
                )}
                <Line type="monotone" dataKey="valor" stroke="#C7622D" strokeWidth={2.5} dot={DOT} activeDot={ACTIVE_DOT}
                    name={nomeSerie} connectNulls isAnimationActive={false} />
            </LineChart>
        </ResponsiveContainer>
    );
});

const GraficoBarrasAno = memo(function GraficoBarrasAno({ serie, nomeSerie, chaveUnidade }) {
    const maxValor = useMemo(() => {
        const valores = serie.map((p) => p.valor).filter((v) => v !== null && v !== undefined);
        return valores.length ? Math.max(...valores) : null;
    }, [serie]);

    const formatarEixoY = useCallback(
        (valor) => formatarValorMetrica(valor, chaveUnidade, 1, ''),
        [chaveUnidade]
    );

    const formatarTooltip = useCallback(
        (valor, nome) => [formatarValorMetrica(valor, chaveUnidade, 1), nome],
        [chaveUnidade]
    );

    if (maxValor === null) return <SemDados />;

    return (
        <ResponsiveContainer width="100%" height={220} debounce={DEBOUNCE_RESIZE_MS}>
            <BarChart data={serie} margin={MARGEM}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="rotulo" tick={TICK} />
                <YAxis width={LARGURA_EIXO_Y} tick={TICK} domain={DOMINIO} tickFormatter={formatarEixoY} />
                <Tooltip contentStyle={TOOLTIP_ESTILO} formatter={formatarTooltip} />
                <Bar dataKey="valor" radius={RAIO_BARRA} name={nomeSerie || 'Média'} isAnimationActive={false}>
                    {serie.map((entrada) => (
                        <Cell key={entrada.rotulo} fill={entrada.valor === maxValor ? '#C7622D' : '#3E8FD1'} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
});

export default function GraficoBoletim({ periodo, serie, metrica = 'temperatura_ar', nomeSerie, unidade }) {
    const chaveUnidade = UNIDADES_METRICAS[metrica] ? metrica : (unidade ?? metrica);
    const rotuloSerie = nomeSerie ?? UNIDADES_METRICAS[metrica]?.rotulo ?? 'Valor';

    return periodo === 'ano'
        ? <GraficoBarrasAno serie={serie} nomeSerie={rotuloSerie} chaveUnidade={chaveUnidade} />
        : <GraficoLinha serie={serie} temMedia={periodo === 'dia' || periodo === 'mes'} nomeSerie={rotuloSerie} chaveUnidade={chaveUnidade} />;
}
