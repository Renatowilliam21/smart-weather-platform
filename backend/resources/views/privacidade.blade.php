<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Política de Privacidade — Smart Weather Platform</title>
<meta name="description" content="Política de Privacidade do Smart Weather Platform, em conformidade com a LGPD.">

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
.doc-caixa { background: var(--panel); border: 1px solid rgba(244, 239, 228, .08); border-radius: var(--raio); padding: 1.5rem; margin-top: 1rem; }
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
<h1 style="color:var(--parchment); font-size:1.9rem; margin-bottom:.5rem;">Política de Privacidade</h1>
<p class="doc-atualizado">Última atualização: {{ now()->format('d/m/Y') }}</p>

<div class="doc-secao">
<p>
Esta Política de Privacidade descreve como o <strong>Smart Weather Platform</strong>
("nós", "sistema" ou "plataforma") coleta, usa, armazena e protege dados no âmbito
do uso do serviço, em conformidade com a Lei Geral de Proteção de Dados Pessoais
(Lei nº 13.709/2018 — LGPD).
</p>
</div>

<div class="doc-secao">
<h2>1. Quem somos</h2>
<p>
O Smart Weather Platform é um projeto pessoal de pesquisa e desenvolvimento aplicado,
com estações meteorológicas IoT instaladas na região de Boa Viagem, Ceará. O
responsável pelo tratamento de dados pode ser contatado através do e-mail informado
na seção "Contato" ao final deste documento.
</p>
</div>

<div class="doc-secao">
<h2>2. Quais dados coletamos</h2>
<p>Dividimos os dados tratados pela plataforma em duas categorias distintas:</p>

<div class="doc-caixa">
<p><strong>2.1 Dados de conta de usuário (dados pessoais)</strong></p>
<ul>
<li>Nome completo</li>
<li>Endereço de e-mail</li>
<li>Senha (armazenada com hash criptográfico, nunca em texto puro)</li>
<li>Data de criação e último acesso à conta</li>
</ul>
</div>

<div class="doc-caixa" style="margin-top: 1rem;">
<p><strong>2.2 Dados de estações e sensores (dados ambientais, não pessoais)</strong></p>
<ul>
<li>Leituras de temperatura, umidade, pressão, radiação UV, luminosidade e índices de conforto térmico</li>
<li>Localização geográfica (latitude/longitude) das estações meteorológicas físicas</li>
<li>Data e hora de cada leitura</li>
</ul>
<p style="margin-top: .75rem; font-size: .9rem; color: rgba(244,239,228,.6);">
Esses dados referem-se exclusivamente a condições ambientais e à posição de
equipamentos — não identificam nem se referem a nenhuma pessoa física.
</p>
</div>
</div>

<div class="doc-secao">
<h2>3. Para que usamos esses dados</h2>
<ul>
<li><strong>Dados de conta:</strong> autenticação, controle de acesso ao painel administrativo, envio de notificações de alerta por e-mail quando um limite configurado é ultrapassado.</li>
<li><strong>Dados de sensores:</strong> exibição no painel público e privado, geração de gráficos históricos, disponibilização via API pública para consumo de terceiros autorizados.</li>
</ul>
</div>

<div class="doc-secao">
<h2>4. Com quem compartilhamos dados</h2>
<p>Não vendemos nem compartilhamos dados pessoais com terceiros para fins comerciais. Utilizamos os seguintes serviços de infraestrutura, que processam dados em nosso nome:</p>
<ul>
<li><strong>Render.com</strong> — hospedagem da aplicação e do banco de dados</li>
<li><strong>Brevo</strong> — envio de e-mails transacionais (notificações de alerta)</li>
<li><strong>Sentry</strong> — monitoramento técnico de erros (configurado para não capturar dados pessoais como e-mail ou IP)</li>
</ul>
<p>Os dados de leitura ambiental e localização de estações podem ser disponibilizados publicamente através da API do sistema, mediante token de acesso.</p>
</div>

<div class="doc-secao">
<h2>5. Seus direitos como titular de dados</h2>
<p>Nos termos da LGPD, você tem direito a:</p>
<ul>
<li>Confirmar a existência de tratamento de seus dados</li>
<li>Acessar seus dados pessoais</li>
<li>Corrigir dados incompletos, inexatos ou desatualizados</li>
<li>Solicitar a exclusão de seus dados pessoais (disponível diretamente na tela de perfil da sua conta)</li>
<li>Solicitar a portabilidade de seus dados a outro fornecedor</li>
<li>Revogar o consentimento a qualquer momento</li>
</ul>
<p>
Você pode excluir sua própria conta e todos os dados pessoais associados diretamente
pelo painel, em <strong>Perfil → Excluir Conta</strong>, sem necessidade de contato prévio.
</p>
</div>

<div class="doc-secao">
<h2>6. Segurança</h2>
<p>Adotamos medidas técnicas para proteger seus dados, incluindo:</p>
<ul>
<li>Conexão criptografada (HTTPS) em toda a plataforma</li>
<li>Senhas armazenadas com hash criptográfico (bcrypt)</li>
<li>Limitação de tentativas de login para prevenir ataques de força bruta</li>
<li>Tokens de acesso à API revogáveis a qualquer momento</li>
</ul>
</div>

<div class="doc-secao">
<h2>7. Retenção de dados</h2>
<p>
Adotamos critérios distintos de retenção conforme a natureza do dado, em
conformidade com o princípio da necessidade previsto na LGPD (Art. 6º, III):
</p>

<div class="doc-caixa">
<p><strong>7.1 Dados de conta (pessoais)</strong></p>
<p style="margin-top: .5rem;">
Mantidos enquanto sua conta estiver ativa. São excluídos permanentemente e de
forma irreversível assim que você solicitar a exclusão da conta, em
<strong>Perfil → Excluir Conta</strong>, sem prazo de carência.
</p>
</div>

<div class="doc-caixa" style="margin-top: 1rem;">
<p><strong>7.2 Dados de leituras ambientais (não pessoais)</strong></p>
<p style="margin-top: .5rem;">
Mantidos por <strong>tempo indeterminado</strong>. Esta decisão se justifica
porque tais dados: (i) não identificam pessoas físicas, referindo-se
exclusivamente a condições ambientais e localização de equipamentos; (ii)
constituem série histórica de valor científico crescente ao longo do tempo,
enquadrando-se na hipótese de tratamento para fins de estudo por órgão de
pesquisa prevista no Art. 7º, IV da LGPD; e (iii) fundamentam publicações
acadêmicas e análises de tendência climática de longo prazo, que perderiam
validade caso os dados fossem descartados periodicamente.
</p>
<p style="margin-top: .75rem;">
Leituras vinculadas a uma estação de sua propriedade podem ser removidas
mediante solicitação específica, conforme detalhado na Seção 5.
</p>
</div>

<p style="margin-top: 1rem; font-size: .9rem; color: rgba(244,239,228,.6);">
Este critério é revisado periodicamente e pode ser atualizado caso a finalidade
da pesquisa ou o volume de dados justifiquem uma política de arquivamento no
futuro — qualquer mudança será refletida nesta página.
</p>
</div>

<div class="doc-secao">
<h2>8. Cookies</h2>
<p>
Utilizamos cookies estritamente necessários para autenticação e manutenção de sessão.
Não utilizamos cookies de rastreamento publicitário ou analytics de terceiros.
</p>
</div>

<div class="doc-secao">
<h2>9. Alterações a esta política</h2>
<p>
Esta política pode ser atualizada periodicamente. A data da última atualização está
indicada no topo deste documento.
</p>
</div>

<div class="doc-secao">
<h2>10. Contato</h2>
<p>
Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em
contato: <code>renatowilliam21@gmail.com</code>
</p>
</div>

</div>
</body>
</html>
