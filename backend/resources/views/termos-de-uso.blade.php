<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Termos de Uso — Smart Weather Platform</title>
<meta name="description" content="Termos de Uso do Smart Weather Platform.">

<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%2314110D'/%3E%3Cpath d='M16 6v10' stroke='%23E7B23B' stroke-width='2' stroke-linecap='round'/%3E%3Ccircle cx='16' cy='5' r='2' fill='%23E7B23B'/%3E%3Cpath d='M10 14a8 8 0 0112 0' stroke='%238FAE9B' stroke-width='2' stroke-linecap='round' fill='none'/%3E%3Cpath d='M7 18a12 12 0 0118 0' stroke='%238FAE9B' stroke-width='1.5' stroke-linecap='round' fill='none' opacity='.6'/%3E%3Cpath d='M9 27l3-6h8l3 6z' fill='%23B34A16'/%3E%3C/svg%3E">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
<link rel="stylesheet" href="{{ asset('landing/css/style.css') }}">

<style>
body { padding-top: 2rem; }
.doc-container { max-width: 760px; margin: 0 auto; padding: 0 1.5rem 6rem; }
.doc-topo { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2.5rem; flex-wrap: wrap; gap: 1rem; }
.doc-atualizado { font-family: var(--fonte-mono); font-size: .78rem; color: var(--sage); margin-bottom: 2.5rem; }
.doc-secao { margin-bottom: 2.5rem; }
.doc-secao h2 { font-size: 1.25rem; color: var(--parchment); margin-bottom: .85rem; }
.doc-secao p, .doc-secao li { color: rgba(244, 239, 228, .78); line-height: 1.75; }
.doc-secao ul { padding-left: 1.25rem; margin-bottom: 1rem; }
.doc-secao li { margin-bottom: .5rem; }
.doc-secao strong { color: var(--parchment); }
.doc-secao code { background: rgba(244, 239, 228, .08); padding: .15rem .4rem; border-radius: 4px; font-family: var(--fonte-mono); font-size: .88em; color: var(--straw); }
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

<p class="eyebrow">Documento legal</p>
<h1 style="color:var(--parchment); font-size:1.9rem; margin-bottom:.5rem;">Termos de Uso</h1>
<p class="doc-atualizado">Última atualização: {{ now()->format('d/m/Y') }}</p>

<div class="doc-secao">
<p>
Ao acessar ou utilizar o <strong>Smart Weather Platform</strong>, você concorda com
os termos descritos a seguir. Caso não concorde, recomendamos não utilizar o sistema.
</p>
</div>

<div class="doc-secao">
<h2>1. Descrição do serviço</h2>
<p>
O Smart Weather Platform é um sistema de monitoramento meteorológico baseado em
estações IoT (ESP32), que coleta, processa e disponibiliza dados ambientais
(temperatura, umidade, índices de conforto térmico, entre outros) através de um
painel web e de uma API pública de consulta.
</p>
</div>

<div class="doc-secao">
<h2>2. Cadastro e conta de usuário</h2>
<ul>
<li>Para acessar funcionalidades administrativas (gerenciar estações, configurar alertas, gerar tokens de API), é necessário criar uma conta com e-mail e senha válidos.</li>
<li>Você é responsável por manter a confidencialidade de suas credenciais de acesso.</li>
<li>Você é responsável por todas as atividades realizadas através da sua conta.</li>
</ul>
</div>

<div class="doc-secao">
<h2>3. Uso aceitável</h2>
<p>Ao usar a plataforma, você concorda em não:</p>
<ul>
<li>Tentar obter acesso não autorizado a contas, estações ou dados de terceiros</li>
<li>Utilizar a API pública de forma a sobrecarregar deliberadamente o serviço, além dos limites de requisição estabelecidos</li>
<li>Utilizar os dados disponibilizados para fins ilícitos</li>
<li>Realizar engenharia reversa do sistema com intenção de prejudicá-lo</li>
</ul>
</div>

<div class="doc-secao">
<h2>4. Dados e conteúdo</h2>
<p>
Os dados de leituras ambientais coletados pelas estações são de titularidade do
operador da plataforma. O acesso via API pública é concedido através de tokens
pessoais, que podem ser revogados a qualquer momento, a critério do administrador
do sistema.
</p>
</div>

<div class="doc-secao">
<h2>5. Disponibilidade do serviço</h2>
<p>
O Smart Weather Platform é oferecido "como está" ("as is"), sem garantias de
disponibilidade contínua, precisão absoluta dos dados de sensores, ou ausência de
interrupções. Trata-se de um projeto de pesquisa e desenvolvimento, hospedado em
infraestrutura de nível gratuito/inicial, sujeita a limitações técnicas.
</p>
</div>

<div class="doc-secao">
<h2>6. Limitação de responsabilidade</h2>
<p>
O operador da plataforma não se responsabiliza por decisões tomadas com base nos
dados disponibilizados pelo sistema, incluindo — mas não se limitando a — decisões
agrícolas, pecuárias ou operacionais. Os dados são fornecidos para fins informativos
e de pesquisa.
</p>
</div>

<div class="doc-secao">
<h2>7. Propriedade intelectual</h2>
<p>
O código-fonte do Smart Weather Platform está disponível publicamente sob licença
de código aberto no
<a href="https://github.com/Renatowilliam21/smart-weather-platform" target="_blank" rel="noopener" style="color: var(--sage);">repositório do projeto</a>.
Consulte a licença específica no repositório para os termos de uso e redistribuição
do código.
</p>
</div>

<div class="doc-secao">
<h2>8. Encerramento de conta</h2>
<p>
Você pode encerrar sua conta a qualquer momento através do painel, em
<strong>Perfil → Excluir Conta</strong>. O operador da plataforma reserva-se o
direito de suspender contas que violem estes termos.
</p>
</div>

<div class="doc-secao">
<h2>9. Alterações nos termos</h2>
<p>
Estes termos podem ser atualizados periodicamente. A data da última atualização
está indicada no topo deste documento.
</p>
</div>

<div class="doc-secao">
<h2>10. Contato</h2>
<p>
Dúvidas sobre estes termos podem ser enviadas para: <code>renatowilliam21@gmail.com</code>
</p>
</div>

</div>
</body>
</html>
