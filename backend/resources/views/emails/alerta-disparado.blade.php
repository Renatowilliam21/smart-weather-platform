<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; }
        .header { background-color: #b91c1c; color: #fff; padding: 20px 24px; }
        .header h1 { margin: 0; font-size: 18px; }
        .body { padding: 24px; color: #374151; }
        .info-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .info-table td { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .info-table td:first-child { color: #6b7280; width: 40%; }
        .info-table td:last-child { font-weight: 600; color: #111827; }
        .footer { padding: 16px 24px; font-size: 12px; color: #9ca3af; text-align: center; }
        .btn { display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #1f2937; color: #fff; text-decoration: none; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠ Alerta de Monitoramento Disparado</h1>
        </div>
        <div class="body">
            <p>Um parâmetro monitorado ultrapassou o limite configurado.</p>

            <table class="info-table">
                <tr>
                    <td>Estação</td>
                    <td>{{ $alertaDisparado->alertaConfig->estacao->nome ?? 'N/A' }}</td>
                </tr>
                <tr>
                    <td>Parâmetro</td>
                    <td>{{ $alertaDisparado->alertaConfig->parametro }}</td>
                </tr>
                <tr>
                    <td>Condição configurada</td>
                    <td>{{ $alertaDisparado->alertaConfig->operador }} {{ $alertaDisparado->alertaConfig->valor_limite }}</td>
                </tr>
                <tr>
                    <td>Valor lido</td>
                    <td>{{ $alertaDisparado->valor_lido }}</td>
                </tr>
                <tr>
                    <td>Data/Hora</td>
                    <td>{{ $alertaDisparado->created_at->format('d/m/Y H:i:s') }}</td>
                </tr>
            </table>

            <a href="{{ url('/dashboard') }}" class="btn">Ver Dashboard</a>
        </div>
        <div class="footer">
            Este é um e-mail automático do Sistema de Monitoramento de Estações Meteorológicas.
        </div>
    </div>
</body>
</html>