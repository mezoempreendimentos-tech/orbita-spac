# ÓRBITA - Pacote de Implementação 1.0.0

Este pacote traduz o Design System da ÓRBITA em arquivos utilizáveis pela equipe de desenvolvimento. Ele não substitui os manuais aprovados: o Manual de Identidade Visual define a marca; o Design System define as regras de interface; este pacote fornece os ativos e a base técnica.

## Começo rápido

1. Copie `fonts/`, `tokens/`, `css/` e `assets/` para o projeto.
2. Importe `css/orbita.css` na aplicação ou consuma `tokens/orbita.tokens.json` no pipeline adotado pela equipe.
3. Consulte `manifests/icons.json` antes de associar ícones a subsistemas e módulos.
4. Abra `examples/index.html` para visualizar uma implementação de referência sem dependências externas.
5. Execute `qa/validate-package.sh` antes de publicar alterações no pacote.

## Estrutura

- `assets/brand`: assinaturas completa, intermediária e símbolo, em SVG, PDF e PNG.
- `assets/favicons`: favicon e ícones de aplicativo.
- `assets/subsystems`: símbolos e linhas ambientais dos três subsistemas.
- `assets/modules`: arquivos-mestres dos 20 pictogramas.
- `assets/modules-current-color`: versões SVG controláveis por CSS.
- `assets/modules-png`: exportações em 16, 20, 24 e 32 px.
- `tokens`: fonte de verdade de cores, tipografia, espaçamentos, dimensões e movimento.
- `css`: base independente de framework e componentes de referência.
- `manifests`: relações oficiais entre nomes, ativos e subsistemas.
- `examples`: tela demonstrativa e catálogo de componentes.
- `docs`: orientação de integração, acessibilidade e governança.
- `qa`: inventário, verificações e somas de integridade.

## Regra essencial da marca

- Marca-mãe completa: comunicação institucional, autenticação, capa e encerramento.
- Versão intermediária: navegação e espaços em que o descritivo ficaria ilegível.
- Símbolo: favicon, avatar ou espaço realmente restrito.

Nunca distorça a imagem. Em HTML, defina apenas largura ou altura e preserve `height: auto` ou `object-fit: contain`.

## Estado do pacote

Versão 1.0.0. Base pronta para integração e validação no produto real. Ajustes motivados pela tecnologia da aplicação devem ser registrados, testados e versionados; não devem alterar silenciosamente a identidade aprovada.
