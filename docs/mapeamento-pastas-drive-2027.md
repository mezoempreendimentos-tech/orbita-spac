# Mapeamento de pastas do Google Drive — processos de 2027

A planilha institucional **Controle de Processos de Compras — 2027 V2** possui a coluna **ID DA PASTA DA CONTRATAÇÃO**. Esse identificador será a referência para preservar uma pasta já existente ao associar ou gerar documentos para um processo importado.

A pasta anual já existente para novos processos é: `16nFE0FZAYBuYbR1h2UylRI2R4tLOdh05`.

Regra operacional: quando o registro possuir um identificador individual de pasta, a ÓRBITA reutiliza essa pasta; quando ele estiver vazio, a ÓRBITA cria uma nova pasta somente sob o destino anual de 2027. As linhas de DFD vistas durante a conferência estavam sem identificador preenchido, portanto não sofrerão criação antecipada de pasta até se tornarem processos e demandarem um documento.

## Validação visual

Em 20/08/2026, a OFICINA foi verificada nos viewports de **1280 × 720** e **375 × 812**. A biblioteca de modelos, os campos de vínculo de arquivos do Drive e o cartão de conexão permaneceram legíveis e sem corte horizontal. A sessão do validador visual não corresponde à conta institucional autorizada; por isso, o cartão exibiu corretamente a ação de conexão, sem alterar a conexão ativa de `carlos@fozdoiguacu.pr.leg.br` registrada no banco.

Após a habilitação da Google Docs API, os quatro modelos foram vinculados: ETP, TR, RPP e edital. A OFICINA foi novamente verificada nos mesmos viewports, com os quatro identificadores visíveis, sem transbordamento horizontal. A criação real de ETP no processo `CD-CHGVTCNCHF` confirmou a criação da pasta `1-wOMQvKPS2sIhCYWfSKgNtDGgfgQBFsl`, o arquivo `1tpseKjrWlqBvRPFZZ-q7CqOpIivDiO71sK1dodXRK5o`, o vínculo ao processo e a substituição integral dos marcadores institucionais.

## Abertura da pasta vinculada

O acesso à TRILHA requer uma sessão institucional autenticada. A validação visual sem essa sessão exibiu corretamente a tela de acesso protegido; a ação de abertura foi coberta por teste de unidade para URL vinculada, identificador importado e ausência de pasta. Em uma sessão autenticada, a ação aparece no cabeçalho da TRILHA e abre a pasta em nova aba, sem criar ou alterar arquivos.

## MAPA — pasta e última modificação

O card do processo no MAPA passou a apresentar a ação de abertura da pasta vinculada e a data de modificação obtida no Google Drive. A visualização foi conferida nos viewports de 1280 × 720 e 375 × 812, preservando a leitura dos grupos, a área de ação e o empilhamento dos controles no celular. A atualização manual consulta o Drive com a autorização individual do usuário e registra o novo horário no processo com evento de auditoria.

## PORTA — impacto financeiro e estimativa anual

A PORTA passou a declarar, de forma explícita, se a DFD acarretará gastos em exercícios financeiros futuros. A seção de itens também passou a orientar que cada valor estimado corresponde exclusivamente ao exercício de elaboração do PCA. A tela foi conferida nos viewports de 1280 × 720 e 375 × 812, preservando campos, controles e textos em uma única coluna no celular.

## Linha de fornecimento — referência CNAE

A classificação será estruturada a partir da CNAE, cuja estrutura detalhada é disponibilizada oficialmente pela CONCLA/IBGE em formato Excel. A seleção institucional deverá usar a lista local administrável derivada dessa referência, evitando dependência de consulta externa durante o preenchimento da DFD.

Também foi validado o endpoint público oficial de classes CNAE do IBGE: `https://servicodados.ibge.gov.br/api/v2/cnae/classes`. A ÓRBITA o consulta apenas no servidor, mantém um cache temporário e registra na DFD o código e a descrição efetivamente selecionados.

## PORTA — CNAE, justificativas e assinatura institucional

A PORTA agora apresenta a seleção de linha principal de fornecimento por consulta oficial de CNAE, campos de justificativa para item, quantidade e valor, certificação de pesquisa prévia por item e declaração de responsabilidade do solicitante. A tela foi conferida nos viewports de 1280 × 720 e 375 × 812, mantendo os campos empilhados e utilizáveis no celular.

## Exportação institucional da DFD

A exportação de DFD em PDF foi verificada por teste de geração real do arquivo e pela compilação de produção. A AGENDA também foi revisada nos viewports de 1280 × 720 e 375 × 812 após a inclusão da ação, sem regressão de largura ou de hierarquia visual.
