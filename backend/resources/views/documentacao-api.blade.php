<!DOCTYPE html>
<html lang="pt-BR">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Documentação da API — Smart Weather Platform</title>
	<meta name="description" content="Documentação pública da API de consumo de dados das estações meteorológicas do Smart Weather Platform.">

	<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%2314110D'/%3E%3Cpath d='M16 6v10' stroke='%23E7B23B' stroke-width='2' stroke-linecap='round'/%3E%3Ccircle cx='16' cy='5' r='2' fill='%23E7B23B'/%3E%3Cpath d='M10 14a8 8 0 0112 0' stroke='%238FAE9B' stroke-width='2' stroke-linecap='round' fill='none'/%3E%3C/svg%3E">

	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">

	<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
	<link rel="stylesheet" href="{{ asset('landing/css/style.css') }}">

	<style>
		body { padding-top: 2rem; }
		.doc-container { max-width: 780px; margin: 0 auto; padding: 0 1.5rem 6rem; }
		.doc-topo { display: flex; align-items: center; justify-content: space-between; margin-bottom: 3rem; flex-wrap: wrap; gap: 1rem; }
		.doc-secao { margin-bottom: 3rem; }
		.doc-secao h2 { font-size: 1.4rem; color: var(--parchment); margin-bottom: .75rem; }
		.doc-secao p { color: rgba(244, 239, 228, .75); line-height: 1.7; margin-bottom: 1rem; }
		.doc-secao code { background: rgba(244, 239, 228, .08); padding: .15rem .4rem; border-radius: 4px; font-family: var(--fonte-mono); font-size: .88em; color: var(--straw); }
		.doc-endpoint { background: var(--panel); border: 1px solid rgba(244, 239, 228, .08); border-radius: var(--raio); padding: 1.5rem; margin-bottom: 1.25rem; }
		.doc-metodo { display: inline-block; font-family: var(--fonte-mono); font-size: .7rem; font-weight: 600; padding: .25rem .6rem; border-radius: 999px; background: rgba(143, 174, 155, .15); color: var(--sage); margin-right: .6rem; }
		.doc-caminho { font-family: var(--fonte-mono); font-size: .95rem; color: var(--parchment); }
		.doc-pre { background: #0d0b08; border: 1px solid rgba(244, 239, 228, .08); border-radius: 10px; padding: 1rem 1.25rem; font-family: var(--fonte-mono); font-size: .82rem; color: rgba(244, 239, 228, .85); overflow-x: auto; margin-top: 1rem; white-space: pre; }
		.doc-lista { list-style: none; padding: 0; margin: 0; }
		.doc-lista li { padding: .5rem 0; border-bottom: 1px solid rgba(244, 239, 228, .06); font-size: .92rem; color: rgba(244, 239, 228, .8); }
		.doc-lista li:last-child { border-bottom: none; }
		.badge-codigo { font-family: var(--fonte-mono); font-size: .78rem; padding: .1rem .5rem; border-radius: 5px; margin-right: .6rem; }
		.badge-200 { background: rgba(143, 174, 155, .18); color: var(--sage); }
		.badge-erro { background: rgba(179, 74, 22, .18); color: #e08a5c; }
		.doc-voltar { color: var(--sage); font-size: .9rem; }
	</style>
</head>
<body>
	<div class="doc-container">

		<div class="doc-topo">
			<a href="{{ url('/') }}" class="marca" style="display:flex;align-items:center;gap:.6rem;">
				<svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
					<rect width="32" height="32" rx="7" fill="#1F2420"/>
					<path d="M16 7v9" stroke="#E7B23B" stroke-width="2" stroke-linecap="round"/>
					<circle cx="16" cy="6" r="1.8" fill="#E7B23B"/>
					<path d="M10.5 15a7.5 7.5 0 0111 0" stroke="#8FAE9B" stroke-width="1.8" stroke-linecap="round" fill="none"/>
				</svg>
				<span class="marca-texto"><strong>SMART&nbsp;WEATHER</strong><small>PLATFORM · ESTAÇÕES&nbsp;IoT</small></span>
			</a>
			<a href="{{ url('/') }}" class="doc-voltar">&larr; Voltar ao início</a>
		</div>

		<p class="eyebrow">Documentação técnica</p>
		<h1 style="color:var(--parchment); font-size:2rem; margin-bottom:2.5rem;">API Pública de Consumo</h1>

		<div class="doc-secao">
			<h2>Visão geral</h2>
			<p>
				Esta API permite que sistemas de terceiros consultem os dados das estações meteorológicas
				(somente leitura). Todas as requisições exigem um token de autenticação e estão limitadas
				a <strong style="color:var(--parchment)">60 requisições por minuto</strong> por token.
			</p>
		</div>

		<div class="doc-secao">
			<h2>Como obter um token</h2>
			<p>
				Os tokens são gerados manualmente pelo administrador do sistema. Solicite acesso enviando
				um e-mail para <code>renatowilliam21@gmail.com</code>, informando a finalidade de uso.
			</p>
		</div>

		<div class="doc-secao">
			<h2>Autenticação</h2>
			<p>Envie o token no cabeçalho <code>Authorization</code> de cada requisição:</p>
			<div class="doc-pre">Authorization: Bearer SEU_TOKEN_AQUI</div>
		</div>

		<div class="doc-secao">
			<h2>Endpoints</h2>

			<div class="doc-endpoint">
				<span class="doc-metodo">GET</span><span class="doc-caminho">/api/v1/estacoes</span>
				<p style="margin-top:.75rem;">Lista todas as estações ativas.</p>
				<div class="doc-pre">curl https://smart-weather-platform.onrender.com/api/v1/estacoes \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Accept: application/json"</div>
			</div>

			<div class="doc-endpoint">
				<span class="doc-metodo">GET</span><span class="doc-caminho">/api/v1/estacoes/{id}</span>
				<p style="margin-top:.75rem;">Detalhes de uma estação, incluindo a última leitura registrada.</p>
				<div class="doc-pre">curl https://smart-weather-platform.onrender.com/api/v1/estacoes/1 \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Accept: application/json"</div>
			</div>

			<div class="doc-endpoint">
				<span class="doc-metodo">GET</span><span class="doc-caminho">/api/v1/estacoes/{id}/leituras</span>
				<p style="margin-top:.75rem;">Histórico de leituras, paginado. Parâmetros opcionais:</p>
				<ul class="doc-lista">
					<li><code>data_inicio</code> — data inicial (AAAA-MM-DD)</li>
					<li><code>data_fim</code> — data final (AAAA-MM-DD)</li>
					<li><code>por_pagina</code> — itens por página (1–100, padrão 25)</li>
				</ul>
				<div class="doc-pre">curl "https://smart-weather-platform.onrender.com/api/v1/estacoes/1/leituras?data_inicio=2026-07-01&por_pagina=50" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Accept: application/json"</div>
			</div>
		</div>

		<div class="doc-secao">
			<h2>Códigos de resposta</h2>
			<ul class="doc-lista">
				<li><span class="badge-codigo badge-200">200</span> Sucesso</li>
				<li><span class="badge-codigo badge-erro">401</span> Token ausente ou inválido</li>
				<li><span class="badge-codigo badge-erro">404</span> Estação não encontrada</li>
				<li><span class="badge-codigo badge-erro">429</span> Limite de requisições excedido (60/min)</li>
			</ul>
		</div>

		<div class="doc-secao">
			<h2>Exemplos em outras linguagens</h2>
			<p><strong style="color:var(--parchment)">Python:</strong></p>
			<div class="doc-pre">import requests

resposta = requests.get(
    "https://smart-weather-platform.onrender.com/api/v1/estacoes",
    headers={"Authorization": "Bearer SEU_TOKEN"}
)
print(resposta.json())</div>

			<p style="margin-top:1.5rem;"><strong style="color:var(--parchment)">JavaScript:</strong></p>
			<div class="doc-pre">fetch("https://smart-weather-platform.onrender.com/api/v1/estacoes", {
    headers: { Authorization: "Bearer SEU_TOKEN" }
})
    .then(r => r.json())
    .then(dados => console.log(dados));</div>
		</div>

	</div>
</body>
</html>
