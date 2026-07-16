<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{ $estacao->nome }} — Smart Weather Platform</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; }
body {
margin: 0;
font-family: 'IBM Plex Sans', Arial, sans-serif;
background: #ffffff;
color: #1f2937;
padding: 14px;
}
.rodape {
font-size: 10px;
color: #9ca3af;
text-align: right;
margin-top: 10px;
}
.rodape a {
color: #6b7280;
text-decoration: none;
}
.card {
border: 1px solid #e5e7eb;
border-radius: 10px;
padding: 14px 16px;
}
.nome {
font-size: 12px;
color: #6b7280;
margin: 0 0 2px;
}
.valor-principal {
font-size: 28px;
font-weight: 600;
margin: 0 0 10px;
}
.grid {
display: grid;
grid-template-columns: 1fr 1fr;
gap: 8px;
}
.metrica {
background: #f9fafb;
border-radius: 6px;
padding: 6px 8px;
}
.metrica.perigo { background: #fef2f2; }
.metrica.alerta { background: #fffbeb; }
.metrica-label {
font-size: 10px;
color: #9ca3af;
margin: 0;
}
.metrica-valor {
font-size: 14px;
font-weight: 600;
margin: 0;
}
.metrica.perigo .metrica-valor { color: #b91c1c; }
.metrica.alerta .metrica-valor { color: #b45309; }
.atualizado {
font-size: 10px;
color: #9ca3af;
margin: 10px 0 0;
}
.sem-dados {
font-size: 13px;
color: #9ca3af;
text-align: center;
padding: 20px 0;
}
</style>
</head>
<body>
<div class="card">
<p class="nome">{{ $estacao->nome }}</p>

@if ($leitura)
<p class="valor-principal">{{ $leitura->temperatura_ar ?? '—' }}°C</p>

<div class="grid">
<div class="metrica">
<p class="metrica-label">Umidade</p>
<p class="metrica-valor">{{ $leitura->umidade_ar ?? '—' }}%</p>
</div>
<div class="metrica {{ $leitura->itgu_classificacao }}">
<p class="metrica-label">ITGU</p>
<p class="metrica-valor">{{ $leitura->itgu ?? '—' }}</p>
</div>
</div>

<p class="atualizado">Atualizado em {{ $leitura->registrado_em->format('d/m/Y H:i') }}</p>
@else
<p class="sem-dados">Sem leituras registradas ainda.</p>
@endif

<p class="rodape">
<a href="{{ url('/') }}" target="_blank" rel="noopener">Smart Weather Platform</a>
</p>
</div>

<script>
setTimeout(() => window.location.reload(), 5 * 60 * 1000);
</script>
</body>
</html>
