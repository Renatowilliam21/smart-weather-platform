/**
 * Geração dinâmica dos cards de "Funcionalidades" a partir de um array de
 * objetos — mesma técnica usada no exemplo de perfis de estudantes feito em
 * aula (JavaScript puro, sem dependências).
 */

const sensores = [
	{
		icone: "bi-thermometer-half",
		nome: "Temperatura do ar",
		descricao: "Leitura do BME280, exposto ao ambiente externo, fora do globo negro.",
		leitura: "27.4",
		unidade: "°C",
		status: "instalado"
	},
	{
		icone: "bi-droplet-half",
		nome: "Umidade relativa",
		descricao: "Percentual de umidade do ar, atualizado a cada ciclo de leitura.",
		leitura: "61",
		unidade: "%",
		status: "instalado"
	},
	{
		icone: "bi-brightness-high",
		nome: "Índice UV",
		descricao: "Sensor GUVA-S12SD estima a intensidade da radiação ultravioleta.",
		leitura: "6.8",
		unidade: "moderado",
		status: "instalado"
	},
	{
		icone: "bi-sun",
		nome: "Luminosidade",
		descricao: "LDR indica intensidade de luz ambiente — útil para detectar nebulosidade.",
		leitura: "42",
		unidade: "%",
		status: "instalado"
	},
	{
		icone: "bi-graph-up-arrow",
		nome: "Índice ITGU",
		descricao: "Calculado a partir do globo negro — mede o efeito real da carga solar.",
		leitura: "74.2",
		unidade: "alerta",
		status: "calculado"
	},
	{
		icone: "bi-graph-up",
		nome: "Índice ITU",
		descricao: "Calculado a partir da temperatura de bulbo seco, sem efeito de radiação.",
		leitura: "71.8",
		unidade: "normal",
		status: "calculado"
	}
];

const rotuloStatus = {
	instalado: "Sensor ativo",
	calculado: "Índice calculado",
	previsto: "Em breve"
};

const container = document.getElementById("grade-sensores");

if (container) {
	sensores.forEach(sensor => {
		const card = document.createElement("article");
		card.className = "card-sensor reveal";

		card.innerHTML = `
			<div class="card-sensor-topo">
				<span class="card-sensor-icone"><i class="bi ${sensor.icone}" aria-hidden="true"></i></span>
				<span class="badge-status ${sensor.status === "previsto" ? "badge-status--previsto" : ""}">
					${rotuloStatus[sensor.status] ?? sensor.status}
				</span>
			</div>
			<h3>${sensor.nome}</h3>
			<p>${sensor.descricao}</p>
			<p class="card-sensor-leitura">${sensor.leitura}<small>${sensor.unidade}</small></p>
		`;

		container.appendChild(card);
	});
}
