import { AlertTriangle, BellOff, CheckCircle2, Clock, RotateCcw } from 'lucide-react';

export const PARAMETROS_ALERTA = {
    temp_globo_negro: { rotulo: 'Temp. Globo Negro', unidade: '°C' },
    umid_globo_negro: { rotulo: 'Umid. Globo Negro', unidade: '%' },
    temperatura_ar: { rotulo: 'Temperatura do Ar', unidade: '°C' },
    umidade_ar: { rotulo: 'Umidade do Ar', unidade: '%' },
    pressao: { rotulo: 'Pressão Atmosférica', unidade: ' hPa' },
    indice_uv: { rotulo: 'Índice UV', unidade: '' },
    luminosidade: { rotulo: 'Luminosidade', unidade: '%' },
    co2_ppm: { rotulo: 'CO2 equivalente', unidade: ' ppm' },
    tvoc_ppb: { rotulo: 'TVOC', unidade: ' ppb' },
    aqi: { rotulo: 'Qualidade do Ar (AQI)', unidade: '' },
    indice_calor: { rotulo: 'Índice de Calor', unidade: '°C' },
    chuva_mm: { rotulo: 'Chuva', unidade: ' mm' },
    vel_vento: { rotulo: 'Velocidade do Vento', unidade: ' km/h' },
    solo_umidade: { rotulo: 'Umidade do Solo', unidade: '%' },
    solo_temperatura: { rotulo: 'Temperatura do Solo', unidade: '°C' },
    tensao_bateria: { rotulo: 'Tensão da Bateria', unidade: ' V' },
    itgu: { rotulo: 'ITGU', unidade: '' },
    itu: { rotulo: 'ITU', unidade: '' },
};

function formatarParametro(chave) {
    return PARAMETROS_ALERTA[chave]?.rotulo ?? chave ?? 'Parâmetro';
}

function formatarComUnidade(valor, chave) {
    if (valor === null || valor === undefined) return '—';
    const unidade = PARAMETROS_ALERTA[chave]?.unidade ?? '';
    return `${valor}${unidade}`;
}

export default function PainelAlertasRecentes({
    alertas = [],
    exibirEstacao = true,
    onResolver = null,
    onReabrir = null,
    mensagemVazia = 'Nenhum alerta registrado.',
    alturaMaximaClass = 'max-h-[300px]',
}) {
    const qtdAtivos = alertas.filter((a) => !a.resolvido).length;

    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-4">
                <h3 className="font-semibold text-lg text-gray-800">Alertas Recentes</h3>
                {alertas.length > 0 && (
                    <span
                        className={`inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium leading-none ${
                            qtdAtivos > 0
                                ? 'bg-red-100 text-red-800'
                                : 'bg-emerald-100 text-emerald-800'
                        }`}
                    >
                        {qtdAtivos > 0
                            ? `${qtdAtivos} ${qtdAtivos === 1 ? 'ativo' : 'ativos'}`
                            : 'Todos resolvidos'}
                    </span>
                )}
            </div>

            {alertas.length > 0 ? (
                <ul className={`space-y-2.5 overflow-y-auto pr-1 ${alturaMaximaClass}`}>
                    {alertas.map((alerta) => {
                        const ativo = !alerta.resolvido;
                        const nomeParametro = formatarParametro(alerta.parametro);
                        const operadorTexto = alerta.operador ? `${alerta.operador} ` : '';

                        return (
                            <li
                                key={alerta.id}
                                className={`rounded-lg border border-l-4 p-3 transition-colors ${
                                    ativo
                                        ? 'border-gray-200 border-l-red-500 bg-red-50/40'
                                        : 'border-gray-100 border-l-emerald-500 bg-gray-50/70'
                                }`}
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex items-start gap-2.5 min-w-0">
                                        {ativo ? (
                                            <AlertTriangle
                                                className="h-4 w-4 text-red-600 shrink-0 mt-0.5"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <CheckCircle2
                                                className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5"
                                                aria-hidden="true"
                                            />
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 truncate">
                                                {exibirEstacao && alerta.estacao_nome
                                                    ? `${alerta.estacao_nome} — ${nomeParametro}`
                                                    : nomeParametro}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-0.5">
                                                Lido:{' '}
                                                <span className="font-semibold text-gray-800">
                                                    {formatarComUnidade(alerta.valor_lido, alerta.parametro)}
                                                </span>{' '}
                                                <span className="text-gray-500">
                                                    (limite: {operadorTexto}
                                                    {formatarComUnidade(alerta.valor_limite, alerta.parametro)})
                                                </span>
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-1 inline-flex items-center gap-1">
                                                <Clock className="h-3 w-3" aria-hidden="true" />
                                                {new Date(alerta.created_at).toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <span
                                            className={`inline-flex items-center h-6 px-2.5 rounded text-xs font-medium leading-none ${
                                                alerta.resolvido
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {alerta.resolvido ? 'Resolvido' : 'Ativo'}
                                        </span>

                                        {alerta.resolvido && onReabrir && (
                                            <button
                                                type="button"
                                                onClick={() => onReabrir(alerta.id)}
                                                className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
                                            >
                                                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                                                Reabrir
                                            </button>
                                        )}

                                        {!alerta.resolvido && onResolver && (
                                            <button
                                                type="button"
                                                onClick={() => onResolver(alerta.id)}
                                                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                                            >
                                                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                                                Resolver
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div className="py-10 flex flex-col items-center justify-center text-center text-gray-400">
                    <BellOff className="h-8 w-8 text-gray-300 mb-2" aria-hidden="true" />
                    <p className="text-sm">{mensagemVazia}</p>
                </div>
            )}
        </div>
    );
}
