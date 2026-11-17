import { useMemo } from 'react';

/**
 * Dicionário centralizado de grandezas físicas e unidades de medida das estações.
 * Mapeia as chaves do banco de dados, sufixos de agregação (_media, _max, _min)
 * e os novos sensores do hardware para suas respectivas unidades.
 */
export const UNIDADES_METRICAS = {
    temperatura_ar: { rotulo: 'Temperatura', unidade: '°C', sufixo: ' °C', casasDecimais: 1 },
    temperatura_ar_media: { rotulo: 'Temperatura', unidade: '°C', sufixo: ' °C', casasDecimais: 1 },
    temperatura_ar_max: { rotulo: 'Temperatura', unidade: '°C', sufixo: ' °C', casasDecimais: 1 },
    temperatura_ar_min: { rotulo: 'Temperatura', unidade: '°C', sufixo: ' °C', casasDecimais: 1 },

    umidade_ar: { rotulo: 'Umidade', unidade: '%', sufixo: '%', casasDecimais: 1 },
    umidade_ar_media: { rotulo: 'Umidade', unidade: '%', sufixo: '%', casasDecimais: 1 },
    umidade_ar_max: { rotulo: 'Umidade', unidade: '%', sufixo: '%', casasDecimais: 1 },
    umidade_ar_min: { rotulo: 'Umidade', unidade: '%', sufixo: '%', casasDecimais: 1 },
    umid_media: { rotulo: 'Umidade', unidade: '%', sufixo: '%', casasDecimais: 1 },

    pressao: { rotulo: 'Pressão', unidade: 'hPa', sufixo: ' hPa', casasDecimais: 1 },
    pressao_media: { rotulo: 'Pressão', unidade: 'hPa', sufixo: ' hPa', casasDecimais: 1 },
    pressao_max: { rotulo: 'Pressão', unidade: 'hPa', sufixo: ' hPa', casasDecimais: 1 },
    pressao_min: { rotulo: 'Pressão', unidade: 'hPa', sufixo: ' hPa', casasDecimais: 1 },

    indice_uv: { rotulo: 'Índice UV', unidade: 'UV', sufixo: ' UV', casasDecimais: 1 },
    indice_uv_media: { rotulo: 'Índice UV', unidade: 'UV', sufixo: ' UV', casasDecimais: 1 },
    indice_uv_max: { rotulo: 'Índice UV', unidade: 'UV', sufixo: ' UV', casasDecimais: 1 },
    indice_uv_min: { rotulo: 'Índice UV', unidade: 'UV', sufixo: ' UV', casasDecimais: 1 },

    itgu: { rotulo: 'ITGU', unidade: '°C', sufixo: ' °C', casasDecimais: 1 },
    itgu_media: { rotulo: 'ITGU', unidade: '°C', sufixo: ' °C', casasDecimais: 1 },
    itgu_max: { rotulo: 'ITGU', unidade: '°C', sufixo: ' °C', casasDecimais: 1 },
    itgu_min: { rotulo: 'ITGU', unidade: '°C', sufixo: ' °C', casasDecimais: 1 },

    itu: { rotulo: 'ITU', unidade: '°C', sufixo: ' °C', casasDecimais: 1 },
    itu_media: { rotulo: 'ITU', unidade: '°C', sufixo: ' °C', casasDecimais: 1 },
    itu_max: { rotulo: 'ITU', unidade: '°C', sufixo: ' °C', casasDecimais: 1 },
    itu_min: { rotulo: 'ITU', unidade: '°C', sufixo: ' °C', casasDecimais: 1 },

    // Novos sensores do hardware (chaves nominais e colunas do banco)
    vento_velocidade: { rotulo: 'Velocidade do Vento', unidade: 'km/h', sufixo: ' km/h', casasDecimais: 1 },
    vel_vento: { rotulo: 'Velocidade do Vento', unidade: 'km/h', sufixo: ' km/h', casasDecimais: 1 },
    vel_vento_media: { rotulo: 'Velocidade do Vento', unidade: 'km/h', sufixo: ' km/h', casasDecimais: 1 },
    vel_vento_max: { rotulo: 'Velocidade do Vento', unidade: 'km/h', sufixo: ' km/h', casasDecimais: 1 },

    chuva_acumulada: { rotulo: 'Chuva Acumulada', unidade: 'mm', sufixo: ' mm', casasDecimais: 1 },
    chuva_mm: { rotulo: 'Chuva Acumulada', unidade: 'mm', sufixo: ' mm', casasDecimais: 1 },
    chuva_mm_soma: { rotulo: 'Chuva Acumulada', unidade: 'mm', sufixo: ' mm', casasDecimais: 1 },

    // Demais sensores do banco
    temp_globo_negro: { rotulo: 'Temp. Globo Negro', unidade: '°C', sufixo: ' °C', casasDecimais: 1 },
    umid_globo_negro: { rotulo: 'Umid. Globo Negro', unidade: '%', sufixo: '%', casasDecimais: 1 },
    indice_calor: { rotulo: 'Índice de Calor', unidade: '°C', sufixo: ' °C', casasDecimais: 1 },
    luminosidade: { rotulo: 'Luminosidade', unidade: 'lx', sufixo: ' lx', casasDecimais: 0 },
    co2_ppm: { rotulo: 'CO₂', unidade: 'ppm', sufixo: ' ppm', casasDecimais: 0 },
    tvoc_ppb: { rotulo: 'TVOC', unidade: 'ppb', sufixo: ' ppb', casasDecimais: 0 },
    aqi: { rotulo: 'Qualidade do Ar', unidade: 'AQI', sufixo: ' AQI', casasDecimais: 0 },
};

/** Mapa direto chave -> símbolo da unidade (ex: UNIDADES_POR_CHAVE.indice_uv === 'UV'). */
export const UNIDADES_POR_CHAVE = Object.fromEntries(
    Object.entries(UNIDADES_METRICAS).map(([chave, info]) => [chave, info.unidade])
);

const UNIDADES_CONHECIDAS = new Set(['°C', '%', 'hPa', 'UV', 'km/h', 'mm', 'lx', 'ppm', 'ppb', 'AQI', 'h', 'dia', 'dias']);

/**
 * Resolve os metadados de unidade mesmo quando a chave chega com sufixo de agregação
 * (ex: "indice_uv_media", "indice_uv_max"), pelo rótulo ("Índice UV") ou já como símbolo ("UV").
 */
export function resolverInfoMetrica(chaveOuUnidade) {
    if (!chaveOuUnidade) {
        return { rotulo: '', unidade: '', sufixo: '', casasDecimais: 1 };
    }

    const texto = String(chaveOuUnidade).trim();

    if (UNIDADES_METRICAS[texto]) {
        return UNIDADES_METRICAS[texto];
    }

    const chaveNormalizada = texto
        .toLowerCase()
        .replace(/(_media|_max|_min|_avg|_soma|_qtd|_acumulada|_acumulado)$/i, '');

    if (UNIDADES_METRICAS[chaveNormalizada]) {
        return UNIDADES_METRICAS[chaveNormalizada];
    }

    // Fallback por correspondência parcial do nome/rótulo da métrica
    if (chaveNormalizada.includes('uv')) return UNIDADES_METRICAS.indice_uv;
    if (chaveNormalizada.includes('itgu')) return UNIDADES_METRICAS.itgu;
    if (chaveNormalizada.includes('itu')) return UNIDADES_METRICAS.itu;
    if (chaveNormalizada.includes('umid')) return UNIDADES_METRICAS.umidade_ar;
    if (chaveNormalizada.includes('press')) return UNIDADES_METRICAS.pressao;
    if (chaveNormalizada.includes('vento')) return UNIDADES_METRICAS.vento_velocidade;
    if (chaveNormalizada.includes('chuva')) return UNIDADES_METRICAS.chuva_acumulada;
    if (chaveNormalizada.includes('temp') || chaveNormalizada.includes('calor')) return UNIDADES_METRICAS.temperatura_ar;

    // Caso já tenha sido passada a própria unidade (ex: "°C", "UV", "hPa")
    if (UNIDADES_CONHECIDAS.has(texto)) {
        return {
            rotulo: texto,
            unidade: texto,
            sufixo: formatarSufixoUnidade(texto),
            casasDecimais: 1,
        };
    }

    return {
        rotulo: texto,
        unidade: texto,
        sufixo: formatarSufixoUnidade(texto),
        casasDecimais: 1,
    };
}

/**
 * Retorna apenas o símbolo da unidade para uma chave (ex: obterUnidade('indice_uv_media') === 'UV').
 */
export function obterUnidade(chaveOuUnidade) {
    return resolverInfoMetrica(chaveOuUnidade).unidade;
}

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
 * (evita exibir "35.0000°C" ou "28.00°C", mantendo "34.5°C" ou "5.34").
 */
export function formatarNumero(valor, casasDecimais = 2) {
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

    const info = resolverInfoMetrica(metricaOuUnidade);
    const casas = casasDecimais ?? info.casasDecimais ?? 1;
    const sufixo = formatarSufixoUnidade(info.unidade);
    const numeroFormatado = formatarNumero(valor, casas);

    return numeroFormatado === null ? valorVazio : `${numeroFormatado}${sufixo}`;
}

/**
 * Hook para obter metadados e formatadores da métrica ativa no Boletim.
 */
export function useUnidadeMetrica(metrica) {
    return useMemo(() => {
        const info = resolverInfoMetrica(metrica);

        return {
            ...info,
            formatar: (valor, casas = info.casasDecimais, valorVazio = '—') =>
                formatarValorMetrica(valor, metrica, casas, valorVazio),
        };
    }, [metrica]);
}
