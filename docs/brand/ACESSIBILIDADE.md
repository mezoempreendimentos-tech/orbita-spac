# Lista de verificação de acessibilidade

## Estrutura e leitura

- Há um único `h1` que descreve a tela.
- A ordem dos títulos corresponde à hierarquia do conteúdo.
- A ordem de tabulação acompanha a ordem visual.
- Ampliação a 200% não oculta ações nem informações.

## Controles

- Todo campo possui `label` programaticamente associado.
- Campos obrigatórios não dependem apenas de asterisco.
- Erros identificam o problema e sugerem correção.
- Botões com apenas ícone possuem nome acessível.
- Estado desabilitado é comunicado semanticamente.

## Cor e contraste

- Texto normal atende contraste mínimo de 4,5:1.
- Texto grande e elementos gráficos essenciais atendem 3:1.
- Foco é claramente visível.
- Estado não é comunicado apenas pela cor.

## Movimento e mensagens

- Animações respeitam `prefers-reduced-motion`.
- Mensagens críticas não desaparecem antes de serem lidas.
- Atualizações assíncronas relevantes usam região viva adequada.

## Testes mínimos por entrega

- Teclado: Chrome ou Edge.
- Leitor de tela: NVDA/Windows ou VoiceOver/macOS/iOS.
- Zoom: 200% e 400% nas telas essenciais.
- Temas claro e escuro quando disponíveis.
- Larguras de 360, 768, 1024 e 1440 px.
