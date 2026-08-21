# Guia de implantação assistida — ÓRBITA v1

> **Finalidade.** Este roteiro organiza uma implantação controlada da primeira versão operacional da ÓRBITA. Ele não substitui a validação do jurídico, do controle interno, da autoridade competente e da área de compras do órgão.

## 1. Antes de iniciar o piloto

A ÓRBITA deve começar com uma unidade institucional real, um grupo restrito de usuários e um processo de teste autorizado pela instituição. A primeira tela protegida solicita o nome e a sigla da unidade inicial; essa informação cria o contexto organizacional da plataforma e é registrada em auditoria. Não se deve usar dados fictícios, documentos simulados ou decisões administrativas reais apenas para testar a interface.

| Preparação | Responsável sugerido | Evidência de conclusão |
|---|---|---|
| Definir unidade-piloto e sigla | Administração do órgão | Ato ou registro interno de designação |
| Selecionar contas institucionais para o piloto | Administração e TI | Contas autenticadas ao menos uma vez na plataforma |
| Validar perfis e segregação de funções | Compras, jurídico e controle interno | Matriz de papéis aprovada |
| Definir checklist local para contratação direta | Compras e jurídico | Modelo homologado na OFICINA ou documentação equivalente |
| Confirmar alçadas, prazos e documentos locais | Autoridade competente | Normativo interno ou orientação formal |
| Definir destino e responsável por publicações | Compras e comunicação institucional | Matriz de publicação e comprovantes |

## 2. Configuração inicial e acesso

Após a primeira autenticação, a pessoa administradora configura a unidade inicial no formulário **Configurar a ÓRBITA**. Em seguida, cada integrante do piloto precisa acessar a plataforma com a própria conta institucional uma vez. Isso permite que a conta apareça em **Perfis**, evitando a criação manual de usuários sem identidade verificada.

Na tela **Perfis**, a administração atribui um ou mais papéis por unidade. Essas atribuições não representam uma delegação jurídica por si só; elas configuram as permissões do sistema segundo a delegação e a matriz interna que já tenham sido aprovadas.

| Papel no sistema | Uso operacional principal |
|---|---|
| Demandante | Inicia e complementa a demanda e a documentação inicial. |
| Chefia de compras | Confere instrução, revisa marcos e conduz saneamentos. |
| Compras e instrumentalização | Produzem instrução, pesquisa, TR e publicações conforme atribuição. |
| Contabilidade | Registra a manifestação orçamentária e o empenho. |
| Jurídico | Registra manifestação, parecer e recomendações. |
| Agente de contratação | Conduz avisos, propostas, habilitação, sessão e julgamento. |
| Autoridade competente | Registra decisão de autorização, adjudicação ou homologação. |
| Gestão e fiscalização | Atuam nas etapas posteriores de formalização, execução e acompanhamento. |

## 3. Roteiro de validação do piloto

O piloto deve usar um processo institucional autorizado para teste, sem emitir decisão externa automática. O objetivo é verificar que o fluxo, as responsabilidades, os documentos e os retornos representam o modo de trabalho real antes de habilitar uso mais amplo.

| Caso de validação | Ação esperada na ÓRBITA | Critério de aceite |
|---|---|---|
| Demanda | Criar um DFD no PORTA e selecionar contratação direta ou licitação | Processo recebe identificadores, etapa inicial e registro na MEMÓRIA |
| Planejamento | Vincular ou justificar a ausência de item no PAC | A justificativa permanece associada à demanda |
| Checklist | Concluir, dispensar justificadamente ou marcar item não aplicável | O avanço fica bloqueado enquanto houver item obrigatório pendente |
| Tarefa | Criar e concluir tarefa vinculada à etapa | A tarefa aparece na etapa e impede avanço se marcada como obrigatória |
| Anexo | Enviar documento de até 8 MB na etapa em execução | Metadados, versão, autor e vínculo com o processo são preservados |
| Devolução | Retornar o processo a uma etapa anterior com motivação | A linha do tempo registra origem, destino, autor e motivo |
| Decisão | Concluir ou dispensar etapa com justificativa | A transição cria evento auditável e atualiza responsável atual |
| Pesquisa | Consultar o processo no MAPA | A busca exibe identificador, objeto, unidade, etapa e situação atuais |

## 4. Limites da primeira versão

A primeira versão torna operacionais a formalização de demandas, as duas trilhas de workflow, checklists, tarefas, anexos, devoluções, memória de eventos, busca e atribuições de perfil. Ela **não deve afirmar que enviou informações ao PNCP, ao sítio oficial ou a qualquer portal externo** até que as credenciais, o contrato de integração, os campos obrigatórios e a homologação técnica do órgão tenham sido confirmados. A fila de publicações existe como estrutura de controle e deverá ser ativada com conectores revisados.

Integrações que alterem prazos, publiquem atos, recebam propostas, realizem pagamentos ou enviem informações para sistemas externos devem passar por homologação em ambiente controlado, com logs, responsável designado e plano de reversão. Alertas automáticos recorrentes e notificações externas serão definidos após a instituição validar a matriz de prazos e responsáveis.

## 5. Conformidade e atualização de regras

A Lei nº 14.133/2021 orienta o desenho de planejamento, transparência, segregação de funções e rastreabilidade, mas a ÓRBITA deve ser configurada de acordo com os atos normativos, regulamentos, alçadas e modelos específicos do órgão.[1] O PNCP é o ponto centralizado de divulgação e dispõe de materiais oficiais para integração de sistemas de contratações.[2] A equipe jurídica e a área de compras devem validar especialmente os campos de publicação, as hipóteses de contratação direta, os prazos, os modelos e as permissões antes de colocar qualquer fluxo em produção.

## 6. Próximos marcos técnicos

Após o piloto, o trabalho seguirá com a parametrização do PAC, modelos institucionais, gestão de contratos, fiscalização, fornecedores, publicações integradas e indicadores. Cada marco deve ser liberado somente após cenário de teste, validação do responsável de negócio e registro das regras aprovadas.

## 7. Análise de compatibilidade com a LGPD

O módulo **PRIVACIDADE** fica disponível dentro da área protegida da ÓRBITA. Ele permite selecionar um processo e registrar o inventário de tratamento, finalidade, hipótese legal indicada, necessidade, retenção, descarte, segurança, compartilhamentos, fatores de atenção, riscos, medidas de mitigação e decisão humana. A análise não emite parecer jurídico, não autoriza o tratamento e não substitui a consulta ao encarregado ou ao jurídico.

| Situação identificada | Comportamento da ÓRBITA | Ação institucional necessária |
|---|---|---|
| Dados pessoais comuns | Solicita inventário, finalidade, necessidade, retenção e controles. | Revisar a adequação dos dados à finalidade. |
| Dados sensíveis, público vulnerável, monitoramento ou automação exclusiva | Cria sinal de revisão reforçada e alerta no processo. | Consultar jurídico e/ou encarregado LGPD. |
| Critérios de risco combinados | Recomenda avaliar RIPD e mantém a análise em revisão até decisão humana. | Definir se o RIPD é necessário e registrar a motivação. |
| Risco residual alto | Mantém alerta aberto e exige salvaguardas ou aceitação formal motivada. | Implementar controle, redefinir tratamento ou aceitar risco com alçada definida. |

A ANPD orienta que o RIPD descreva o tratamento, os tipos de dados, a segurança, os riscos e as medidas de mitigação; também recomenda avaliação prévia ou tão logo seja identificado tratamento com potencial de alto risco.[3] As regras da ÓRBITA são configuráveis e operam como triagem para essa revisão, não como qualificação jurídica automática.

## Referências

[1] [Lei nº 14.133, de 1º de abril de 2021 — Planalto](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm)

[2] [Portal Nacional de Contratações Públicas — página oficial](https://www.gov.br/rededeparcerias/pt-br/servicos/portal-nacional-de-contratacoes-publicas-pncp)

[3] [Perguntas e respostas sobre o Relatório de Impacto à Proteção de Dados Pessoais — ANPD](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/relatorio-de-impacto-a-protecao-de-dados-pessoais-ripd)
