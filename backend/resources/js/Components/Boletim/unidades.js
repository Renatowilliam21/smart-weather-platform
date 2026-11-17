import { useMemo } from 'react';

/**
 * Dicionário centralizado de grandezas físicas e unidades de medida das estações.
 * Mapeia as chaves do banco de dados (e predições de sensores do hardware) para
 * seus rótulos, unidades e sufixos formatados.
 */
export const UNIDADES_METRICAS = {
    temperatura_ar: { rotulo: 'Temperatura', unidade: '°C', sufixo: '°C', casasDecimais: 1 },
    umidade_ar: { rotulo: 'Umidade', unidade: '%', sufixo: '%', casasDecimais: 1 },
    pressao: { rotulo: 'Pressão', unidade: 'hPa', sufixo: ' hPa', casasDecimais: 1 },
    indice_uv: { rotulo: 'Índice UV', unidade: 'UV', sufixo: ' UV', casasDecimais: 1 },
    itgu: { rotulo: 'ITGU', unidade: '°C', sufixo: '°C', casasDecimais: 1 },
    itu: { rotulo: 'ITU', unidade: '°C', sufixo: '°C', casasDecimais: 1 },
    // Novos sensores do hardware (chaves nominais e colunas correspondentes no banco)
    vento_velocidade: { rotulo: 'Velocidade do Vento', unidade: 'km/h', sufixo: ' km/h', casasDecimais: 1 },
    vel_vento: { rotulo: 'Velocidade do Vento', unidade: 'km/h', sufixo: ' km/h', casasDecimais: 1 },
    chuva_acumulada: { rotulo: 'Chuva Acumulada', unidade: 'mm', sufixo: ' mm', casasDecimais: 1 },
    chuva_mm: { rotulo: 'Chuva Acumulada', unidade: 'mm', sufixo: ' mm', casasDecimais: 1 },
    // Grandezas complementares da estação
    temp_globo_negro: { rotulo: 'Temp. Globo Negro', unidade: '°C', sufixo: '°C', casasDecimais: 1 },
    umid_globo_negro: { rotulo: 'Umid. Globo Negro', unidade: '%', sufixo: '%', casasDecimais: 1 },
    indice_calor: { rotulo: 'Índice de Calor', unidade: '°C', sufixo: '°C', casasDecimais: 1 },
    luminosidade: { rotulo: 'Luminosidade', unidade: 'lx', sufixo: ' lx', casasDecimais: 0 },
    co2_ppm: { rotulo: 'CO₂', unidade: 'ppm', sufixo: ' ppm', casasDecimais: 0 },
    tvoc_ppb: { rotulo: 'TVOC', unidade: 'ppb', sufixo: ' ppb', casasDecimais: 0 },
    aqi: { rotulo: 'Qualidade do Ar', unidade: 'AQI', sufixo: ' AQI', casasDecimais: 0 },
};

/** Mapa direto chave -> símbolo da unidade (ex: UNIDADES_POR_CHAVE.temperatura_ar === '°C'). */
export const UNIDADES_POR_CHAVE = Object.fromEntries(
    Object.entries(UNIDADES_METRICAS).map(([chave, info]) => [chave, info.unidade])
);

/**
 * Normaliza o espaçamento antes da unidade: símbolos como °C, % e h ficam colados
 * ao número (ex: "35°C", "70%", "2h"); grandezas alfabéticas recebem espaço ("1012 hPa", "8 UV").
 */
export function formatarSufixoUnidade(unidade) {
    if (!unidade) return '';
    if (unidade.startsWith(' ')) return unidade;
    if (unidade.startsWith('°') || unidade.startsWith('%') || unidade === 'h') {
        return unidade;
    }
    return ` ${unidade}`;
}

/**
 * Formata um número limitando as casas decimais e removendo zeros finais desnecessários
 * (evita exibir "35.0000°C" ou "28.00°C", mantendo "34.5°C").
 */
export function formatarNumero(valor, casasDecimais = 1) {
    if (valor === null || valor === undefined || valor === '') return null;
    const numero = Number(valor);
    if (Number.isNaN(numero)) return String(valor);
    const fator = 10 ** casasDecimais;
    return String(Math.round((numero + Number.EPSILON) * fator) / fator);
}

/**
 * Formata um valor numérico adicionando o sufixo da métrica (ou unidade direta).
 */
export function formatarValorMetrica(valor, metricaOuUnidade = '', casasDecimais = null, valorVazio = '—') {
    if (valor === null || valor === undefined || valor === '') return valorVazio;

    const info = UNIDADES_METRICAS[metricaOuUnidade];
    const casas = casasDecimais ?? info?.casasDecimais ?? 1;
    const sufixo = info ? info.sufixo : formatarSufixoUnidade(metricaOuUnidade);
    const numeroFormatado = formatarNumero(valor, casas);

    return numeroFormatado === null ? valorVazio : `${numeroFormatado}${sufixo}`;
}

/**
 * Hook para obter metadados e formatadores da métrica ativa no Boletim.
 */
export function useUnidadeMetrica(metrica) {
    return useMemo(() => {
        const info = UNIDADES_METRICAS[metrica] ?? {
            rotulo: metrica,
            unidade: '',
            sufixo: '',
            casasDecimais: 1,
        };

        return {
            ...info,
            formatar: (valor, casas = info.casasDecimais, valorVazio = '—') =>
                formatarValorMetrica(valor, metrica, casas, valorVazio),
        };
    }, [metrica]);
}

