# Etapa financeira da DFD — rubrica e ciência do gasto

## Regra institucional

A DFD deverá passar pelo **Financeiro**, representado inicialmente pelo perfil institucional `contabilidade`, **antes da triagem da Diretoria de Administração**. O Financeiro informa o código numérico da rubrica orçamentária — por exemplo, `339039` — e registra ciência do gasto para apoiar o planejamento e a inclusão na LOA.

O catálogo inicial foi incorporado ao sistema a partir da aba **PC Desp-2027** da planilha oficial `PC-DESPESA-PR-2027-Versao1.0a-publicada_em_06_08_2026.xlsx`. Ele contém somente classificações até o elemento de despesa — `cdDesdobramento=00` e `cdDetalhamento=00` — e está versionado como **PC Desp-2027 · versão 1.0a · TCE-PR**. O usuário pode digitar o código completo, como `339039`, um prefixo, como `3390`, ou termos da descrição, como `outros serviços pessoa jurídica`. O sistema exige a seleção de um elemento válido; não permite salvar apenas um prefixo ou texto livre.

## Ordem do fluxo

1. O requisitante preenche e emite a DFD na PORTA. O sistema ÓRBITA registra a emissão e coloca a DFD no estado `financial_review`.
2. O Financeiro indica a rubrica orçamentária, registra a ciência do gasto e, quando necessário, inclui uma observação objetiva. Essa ação fica registrada na DFD e na trilha de auditoria.
3. Após a classificação financeira, a DFD fica disponível para a triagem da **Diretoria de Administração**.
4. A Diretoria de Administração analisa, pode pedir complementação, revisar a prioridade e registrar ocorrências, sem impedir o encaminhamento à Presidência no prazo final.
5. A Presidência continua sendo a única autoridade competente para aprovar integralmente, aprovar parcialmente por item/valor ou rejeitar a DFD.
6. Somente DFD aprovada ou parcialmente aprovada, com classificação financeira registrada, pode integrar a consolidação ou o PCA.

Se a classificação financeira ou a triagem não forem concluídas até o prazo final do calendário, a DFD ainda assim deve ser encaminhada à Presidência. O encaminhamento não cria aprovação automática e não elimina a competência exclusiva da Presidência.

## Rastreabilidade

O sistema ÓRBITA armazena o código informado, a data da ciência, o usuário do Financeiro que registrou o ato e uma observação opcional. A ação gera evento na trilha da DFD e registro de auditoria. A rubrica e a ciência também aparecem no PDF da DFD.

A consolidação bloqueia DFDs sem rubrica e sem ciência financeira. O mesmo bloqueio é aplicado à inclusão direta de uma DFD no PCA e às atualizações do PCA.

## Papéis institucionais

O **SPAC** é o Setor de Planejamento e Acompanhamento das Contratações. A **Diretoria de Administração** conduz a triagem e a consolidação. **ÓRBITA** é o sistema que registra estados, documentos, prazos, alertas e trilhas.

## Limite desta entrega

Nesta rodada foi criado o catálogo inicial da planilha 2027 e a busca por código/descrição. Ainda não há catálogo versionado para os demais exercícios, classificação automática a partir do objeto da DFD nem modelagem da LOA como documento independente. A lista de outros exercícios e sua política de vigência dependem da definição do Financeiro e da normativa institucional.

## Referências

A estrutura geral da DFD, da análise, da compilação e da consolidação deve ser compatibilizada com a Lei nº 14.133/2021, o Decreto nº 10.947/2022 e a regulamentação interna do órgão. A posição do Financeiro, a exigência de ciência do gasto e a trava para consolidação são regras institucionais do projeto, não uma afirmação de que o decreto federal imponha este fluxo específico.

[Lei nº 14.133/2021][1] · [Decreto nº 10.947/2022][2] · [Guia do TCU sobre PCA][3]

**Autor:** Manus AI

[1]: https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm "Lei nº 14.133/2021"
[2]: https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/decreto/d10947.htm "Decreto nº 10.947/2022"
[3]: https://licitacoesecontratos.tcu.gov.br/2-3-2-3-plano-de-contratacoes-anual-pca/ "Guia do TCU sobre PCA"

*Observação: os exemplos são ilustrativos; o documento está sujeito à homologação normativa.*
