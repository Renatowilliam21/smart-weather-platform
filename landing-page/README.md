# Landing Page — Smart Weather Platform

Landing page institucional do projeto **Smart Weather Platform**, sistema de estações
meteorológicas IoT (ESP32) com dashboard em tempo real, desenvolvido para monitoramento
de conforto térmico (ITGU/ITU) no semiárido cearense.

## Como abrir

Não precisa de servidor nem instalação. Basta abrir `index.html` em qualquer navegador.

```
landing-page/
├── index.html          → estrutura da página
├── css/
│   ├── style.css        → estilos finais, é o arquivo carregado pelo index.html
│   └── style.scss        → fonte SASS (variáveis, mixins, nesting) — Aula 4
├── js/
│   ├── sensores.js        → gera os cards de "Funcionalidades" a partir de um array
│   └── main.js             → menu, relógio do painel, revelação ao rolar, formulário
└── README.md
```

## Tecnologias utilizadas (todas vistas em aula)

| Tecnologia | Onde foi usada |
|---|---|
| HTML5 semântico | Estrutura geral (`header`, `nav`, `main`, `section`, `footer`) |
| CSS puro (seletores, hover, transições) | Base de todo `style.css`, seguindo o padrão da Aula 2 |
| SASS (variáveis, mixin, nesting) | `css/style.scss`, com o mesmo conceito de `$primary-color`/`@mixin` da Aula 4 |
| Bootstrap 5.3.7 | Grid responsivo, navbar com colapso mobile, componentes de formulário |
| JavaScript puro (sem frameworks) | Geração de cards a partir de array de objetos — mesma técnica do exemplo `estudantes` feito em aula |

> Optei por JavaScript puro (em vez de jQuery) para a geração dos cards porque foi a
> técnica usada no exemplo mais completo construído em aula (`estudantes/script.js`).
> A Aula 4 também apresentou jQuery (efeitos de `fadeIn`/`fadeOut`); o mesmo tipo de
> transição foi implementado aqui via CSS (`transition`) + `IntersectionObserver`
> nativo, evitando carregar uma biblioteca extra só para isso.

## Checklist da Atividade 2

**1. Estrutura HTML**
- [x] Documento HTML5 válido, com `head`/`body` corretos
- [x] Seções claramente separadas por `<section id="...">`

**2. Menu principal + no mínimo 4 seções**
- [x] Menu principal fixo, responsivo, com âncoras para cada seção
- [x] Hero Section (título, subtítulo, botões, "imagem" — painel de leituras simulado)
- [x] Sobre (propósito do projeto + fluxo de funcionamento numerado)
- [x] Galeria / Cards (seis cards de sensores/índices, gerados via JavaScript)
- [x] Depoimentos (três avaliações simuladas, como permitido no enunciado)
- [x] FAQ (cinco perguntas frequentes, em acordeão nativo `<details>`)
- [x] Contato (formulário com nome, e-mail e mensagem)
- [x] Rodapé (navegação, links do projeto, stack utilizada, direitos autorais)

**3. Estilização**
- [x] Paleta de cores autoral com contraste verificado (tons de barro, palha e sálvia
      sobre fundo escuro / seções claras em papel)
- [x] Espaçamento e alinhamento consistentes (grid de 8px, `container` do Bootstrap)
- [x] Botões estilizados com estado de hover/focus
- [x] Layout responsivo (breakpoints em 991px, 767px e 575px)

## Notas de acessibilidade

- Link "pular para o conteúdo" para usuários de teclado
- Contraste de texto verificado em todas as combinações de fundo
- `:focus-visible` customizado em links, botões e campos de formulário
- FAQ construído com `<details>`/`<summary>` (navegável por teclado e leitor de tela
  sem JavaScript adicional)
- Animações respeitam `prefers-reduced-motion`

