<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; }
        .header { background-color: #7f1d1d; color: #fff; padding: 20px 24px; }
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
            <h1>🔴 Estação sem comunicação</h1>
        </div>
        <div class="body">
            <p>Uma estação parou de enviar dados dentro do tempo esperado.</p>

            <table class="info-table">
                <tr>
                    <td>Estação</td>
                    <td>{{ $evento->estacao->nome ?? 'N/A' }}</td>
                </tr>
                <tr>
                    <td>Localização</td>
                    <td>{{ $evento->estacao->localizacao ?? 'N/A' }}</td>
                </tr>
                <tr>
                    <td>Detectado em</td>
                    <td>{{ $evento->detectado_em->format('d/m/Y H:i:s') }}</td>
                </tr>
            </table>

            <p style="margin-top: 16px; font-size: 14px; color: #6b7280;">
                Verifique a conexão WiFi, alimentação elétrica e funcionamento do ESP32 no local.
            </p>

            <a href="{{ url('/dashboard') }}" class="btn">Ver Dashboard</a>
        </div>
        <div class="footer">
            Este é um e-mail automático do Sistema de Monitoramento de Estações Meteorológicas.
        </div>
    </div>
</body>
</html>
