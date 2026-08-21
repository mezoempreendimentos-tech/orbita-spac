# Análise inicial consolidada — ÓRBITA

## Fontes já analisadas

Foram lidos o documento funcional da ÓRBITA, a apresentação executiva dos módulos e a estrutura interna do fluxo Bizagi de **Contratação Direta**, complementada pela visualização inicial do PDF exportado.

## Constatações confirmadas até aqui

O sistema pretendido não é apenas um painel de acompanhamento. Ele precisa cobrir o **ciclo completo de contratação**, desde o recebimento da demanda até a execução contratual, as publicações obrigatórias e a preservação do histórico institucional.

Os módulos centrais confirmados são: **PORTA**, **AGENDA**, **TRILHA**, **LUPA**, **RÉGUA**, **TERMÔMETRO**, **LASTRO**, **ORÁCULO**, **MAESTRO**, **ELO**, **VIGIA**, **ECO**, **VITRINE**, além dos módulos transversais **ÁGUIA**, **FAROL**, **MAPA**, **BÚSSOLA**, **ÍMÃ**, **OFICINA**, **ATLAS** e **MEMÓRIA**.

Pela apresentação, a **TRILHA** deve funcionar como o motor do fluxo interno, identificando etapas necessárias, distribuindo responsabilidades, controlando dependências, permitindo retornos para correção, registrando inclusões e dispensas e suportando percursos não lineares.

Os módulos transversais possuem função operacional clara. O **FAROL** centraliza prazos e pendências; o **MAPA** oferece consulta por múltiplos filtros; a **BÚSSOLA** produz indicadores e estatísticas; o **ÍMÃ** mantém cadastro e regularidade de fornecedores; a **OFICINA** controla modelos e minutas versionadas; o **ATLAS** organiza base normativa e conhecimento; e a **MEMÓRIA** registra movimentações, decisões, prazos, versões e justificativas.

## Achados confirmados do fluxo Bizagi de Contratação Direta

O processo contém múltiplas **raias de responsabilidade**: Setor Demandante, Chefe do Setor de Compras, Setor de Compras, Encarregado de Instrumentalização e Pesquisa de Contratações, Setor de Contabilidade, Diretoria Jurídica, Agente de Contratação, Encarregado pela Gestão e Acompanhamento de Contratos e Presidente.

O fluxo não é linear. Há decisões explícitas sobre **dispensa de ETP**, **satisfação de exigências legais**, **existência de dotação**, **viabilidade de adequação orçamentária**, **aplicabilidade de parecer referencial**, **existência de recomendações jurídicas**, **recebimento de propostas**, **viabilidade de repetição de publicação**, **autorização da contratação**, **anulação ou revogação**, e **necessidade de termo de contrato**.

Também ficaram confirmados vários **artefatos documentais obrigatórios** no processo de contratação direta: ETP, lista de verificação do ETP, minuta de TR, TR final, relatório de pesquisa de preços e sua lista de verificação, declaração de adequação orçamentária e financeira, aviso de contratação direta, comprovante de publicação, documentos de habilitação, justificativa de escolha do fornecedor, parecer referencial, parecer jurídico, parecer técnico, minuta de termo de contrato, termo de contrato, nota de empenho, termo de anulação, termo de revogação e lista de verificação de arquivamento.

O fluxo confirma ainda quatro exigências estruturais para a primeira versão operacional do sistema: **controle de documentos por etapa**, **retorno para etapa anterior**, **registro formal das verificações por checklist** e **atualização do Processo de Formalização de Demanda ao final do percurso**.

## Achados complementares do PDF exportado do fluxo de Contratação Direta

A leitura visual das páginas tabulares do fluxo confirmou a sequência operacional e o encadeamento dos responsáveis. O **Setor Demandante** elabora o ETP quando cabível; o **Chefe do Setor de Compras** valida exigências legais e checklists; o **Encarregado de Instrumentalização e Pesquisa de Contratações** atua na minuta do TR e no ajuste para previsão orçamentária; o **Setor de Compras** conduz pesquisa de preços, publicações e saneamentos; o **Setor de Contabilidade** decide sobre dotação, indisponibilidade ou necessidade de alteração orçamentária; a **Diretoria Jurídica** emite parecer jurídico; o **Agente de Contratação** conduz o aviso, recebe propostas, analisa habilitação e consolida a escolha do fornecedor; a **Presidência** autoriza, anula ou revoga; e a **Gestão de Contratos** instaura o processo de acompanhamento da execução contratual.

O fluxo detalha decisões de negócio importantes para o motor do sistema. Se não houver dotação e não for viável a adequação, o processo precisa ser **sobrestado ou redirecionado**. Se houver recomendações no parecer jurídico, o processo deve ser devolvido ao agente público responsável para **correção ou justificativa formal de não atendimento**. Se a decisão presidencial apontar nulidade, o processo retorna à **etapa imediatamente anterior ao ato nulo**. Se houver revogação, as informações devem ser atualizadas no processo de formalização da demanda e o procedimento deve ser **arquivado**.

O fluxo também separa dois desfechos relevantes da contratação direta. Quando houver **termo de contrato**, o processo segue para cadastro contratual e depois para emissão de nota de empenho. Quando não houver termo, o arquivamento depende de checklist próprio, mas ainda assim a execução contratual e os registros finais permanecem controlados. Em ambos os casos, há exigência de **publicações em site oficial, PNCP e Mural de Licitações/TCE**, além do registro dos comprovantes ou certidões correspondentes.

Esses achados reforçam que a implementação não pode depender de status soltos em telas. Será necessário um **motor de estados com transições condicionais**, papéis por etapa, anexação documental obrigatória, histórico de decisão, versionamento de peças e possibilidade de retorno formal entre fases.

## Implicação arquitetural inicial

Essas evidências indicam que a primeira versão do sistema precisa de: autenticação por perfis, banco de dados relacional, motor de workflow configurável por tipo de contratação, armazenamento de anexos, trilha de auditoria imutável, gestão de modelos documentais, alertas de prazo e uma camada pública separada para transparência.
