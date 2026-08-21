# Registro de análise — importação de DFDs

## Fonte e escopo

- **Fonte:** planilha pública “Controle de Processos de Compras - 2027 V2”, aba `Form_Responses`.
- **Escopo autorizado:** importar exclusivamente linhas identificadas como **DFD**.
- **Fora do escopo:** PCA, solicitações de abertura, processos de contratação, decisões, documentos e mudanças de status do fluxo institucional.

## Estrutura observada

O CSV exportado possui **65 linhas de dados** e as colunas **Carimbo de data/hora**, **Número do Processo**, **Objeto**, **Modalidade**, **Valor Estimado (R$)**, **Observações**, **Data Estimada**, **Status**, **Link do processo**, **ETAPA ATUAL** e campos operacionais adicionais.

As linhas de origem trazem o marcador **DFD** na coluna “Modalidade” e situação “Em andamento”. Linhas posteriores que exibem “Dispensa”, “RPP”, “TR” ou referências como “DFD 188/2026” representam etapas posteriores ou processos relacionados e **não serão importadas** neste lote.

## Salvaguardas antes da gravação

1. Mapear somente os campos compatíveis com a DFD no ÓRBITA: referência externa, objeto, valor estimado e data desejada.
2. Validar a unidade institucional de destino e deduplicar por referência externa e objeto.
3. Criar as DFDs sem modalidade, sem instauração de processo e sem avanço automático do fluxo.

## Resultado da importação

- **DFDs identificadas e importadas:** 39.
- **Referências externas repetidas ou ausentes:** nenhuma.
- **Unidade de destino:** Câmara Municipal de Foz do Iguaçu — SPAC.
- **Estado de entrada no ÓRBITA:** `submitted`, aguardando triagem da Diretoria de Administração.
- **PCA, solicitações de abertura e processos criados para o lote:** 0.
- **Auditoria:** um evento `demand.imported` por DFD, com referência externa, situação e URL de origem.

As referências foram preservadas em identificadores públicos no padrão `DFD-IMP-<número>-<ano>` e na justificativa de planejamento. O importador é idempotente: uma nova execução reconhece as 39 referências já gravadas e não cria duplicidades.
