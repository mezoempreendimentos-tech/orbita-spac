# Modelo de análise LGPD — ÓRBITA

> **Natureza do módulo.** A ferramenta organiza evidências e sinaliza pontos de atenção para a revisão do controlador, do encarregado e da área jurídica. Ela não qualifica automaticamente uma operação como lícita, ilícita, compatível ou incompatível com a LGPD.

## Base de modelagem

A LGPD define dado pessoal, dado pessoal sensível, agentes de tratamento, tratamento, uso compartilhado e relatório de impacto à proteção de dados pessoais (RIPD), além de estabelecer princípios de finalidade, adequação, necessidade, transparência, segurança, prevenção e responsabilização.[1] Para processos do Poder Público, a ANPD publicou orientação específica sobre tratamento de dados pessoais.[2]

As perguntas e respostas da ANPD sobre RIPD orientam que o relatório descreva o tratamento, os tipos de dados, a metodologia de segurança, riscos, salvaguardas e medidas de mitigação; também recomendam que avaliações de alto risco e revisões contínuas sejam documentadas antes ou durante a operação de tratamento.[3] A ÓRBITA transformará esses pontos em campos estruturados e auditáveis por processo de contratação.

| Dimensão do módulo | Registro estruturado na ÓRBITA | Finalidade operacional |
|---|---|---|
| Inventário de tratamento | Dados pessoais, dados sensíveis, categorias de titulares, fonte, volume, operação e sistemas envolvidos | Tornar visível o tratamento associado à contratação |
| Finalidade e hipótese | Finalidade específica, necessidade/proporcionalidade e hipótese legal indicada | Preparar evidência para revisão humana |
| Compartilhamento e retenção | Operadores, compartilhamentos internos/externos, transferência internacional, retenção e descarte | Identificar dependências e ciclo de vida do dado |
| Risco e salvaguardas | Fator de risco, probabilidade, impacto, risco residual, controle e responsável | Direcionar plano de mitigação rastreável |
| Revisão | Recomendação de atenção, indicação de RIPD, opinião do encarregado e decisão registrada | Separar sinal técnico de decisão institucional |

## Regras de sinalização configuráveis

O sistema indicará **revisão reforçada** quando houver dados pessoais sensíveis, dados de crianças/adolescentes ou outro público vulnerável, larga escala, monitoramento de área acessível ao público, decisão exclusivamente automatizada, compartilhamento externo ou transferência internacional. A combinação de um critério geral — larga escala ou impacto significativo — com um critério específico é apresentada pela ANPD como referência de alto risco, mas esses indicadores serão apenas uma triagem configurável e não uma conclusão jurídica automática.[3]

| Sinal | Efeito no sistema |
|---|---|
| Nenhum dado pessoal | Permite registrar a justificativa de não aplicabilidade e revisão opcional. |
| Dados pessoais comuns | Solicita finalidade, necessidade, retenção, segurança e compartilhamentos. |
| Dados sensíveis ou público vulnerável | Sinaliza revisão pelo encarregado/DPO e registra salvaguardas reforçadas. |
| Critério geral + específico de alto risco | Recomenda avaliação RIPD e bloqueia apenas o encerramento da análise de privacidade até que exista decisão humana registrada. |
| Risco residual alto | Mantém alerta aberto até a implementação de mitigação ou aceitação formal autorizada. |

## Referências

[1] [Lei nº 13.709, de 14 de agosto de 2018 — LGPD, Planalto](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)

[2] [Guia orientativo — Tratamento de dados pessoais pelo Poder Público, ANPD](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_tratamento_de_dados_pessoais_pelo_poder_publico)

[3] [Perguntas e respostas sobre RIPD, ANPD](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/relatorio-de-impacto-a-protecao-de-dados-pessoais-ripd)
