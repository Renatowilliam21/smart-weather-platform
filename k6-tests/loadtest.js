import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '15s', target: 1000 }, // Sobe até 20 usuários virtuais em 10 segundos
        { duration: '30s', target: 1000 }, // Mantém 20 usuários por 20 segundos
        { duration: '10s', target: 0 },  // Reduz até 0 usuários em 10 segundos
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% das requisições devem ocorrer em menos de 500ms
    },
};

export default function () {
    // Acessa a página principal do sistema (Landing Page)
    const res = http.get('http://localhost:8000/');

    // Verifica se a página retornou status 200
    check(res, {
        'status foi 200': (r) => r.status === 200
    });

    // Pausa de 1 segundo entre requisições de cada usuário virtual
    sleep(1);
}
