export const DIRECT_CONTRACTING_STEPS = [
  { key: "INITIAL_DEMAND", title: "Formalização da demanda", module: "PORTA", role: "demandante", checklist: "DFD preenchido e documentação inicial conferida." },
  { key: "ETP", title: "Estudo Técnico Preliminar", module: "LUPA", role: "demandante", checklist: "ETP elaborado ou dispensa formalmente justificada." },
  { key: "ETP_REVIEW", title: "Verificação do ETP", module: "RÉGUA", role: "chefia_compras", checklist: "Lista de verificação do ETP concluída." },
  { key: "TR_DRAFT", title: "Minuta do Termo de Referência", module: "TERMÔMETRO", role: "instrumentalizacao", checklist: "Minuta do TR produzida e vinculada ao processo." },
  { key: "PRICE_RESEARCH", title: "Pesquisa de preços", module: "TERMÔMETRO", role: "compras", checklist: "Relatório, fontes e lista de verificação de preços concluídos." },
  { key: "BUDGET", title: "Manifestação orçamentária", module: "LASTRO", role: "contabilidade", checklist: "Disponibilidade ou adequação orçamentária formalmente registrada." },
  { key: "TR_FINAL", title: "Termo de Referência final", module: "TERMÔMETRO", role: "instrumentalizacao", checklist: "TR ajustado à manifestação orçamentária." },
  { key: "CONTRACT_DRAFT", title: "Minuta contratual e análise", module: "MAESTRO", role: "gestao_contratos", checklist: "Minuta de contrato ou justificativa de dispensa de instrumento registrada." },
  { key: "NOTICE", title: "Aviso de contratação direta", module: "ECO", role: "agente_contratacao", checklist: "Aviso preparado e destinos de publicação definidos." },
  { key: "PROPOSAL_REVIEW", title: "Propostas, habilitação e escolha", module: "MAESTRO", role: "agente_contratacao", checklist: "Propostas e habilitação analisadas; escolha motivada." },
  { key: "LEGAL", title: "Parecer jurídico", module: "ORÁCULO", role: "juridico", checklist: "Parecer ou enquadramento referencial registrado." },
  { key: "LEGAL_CORRECTIONS", title: "Atendimento às recomendações", module: "TRILHA", role: "agente_contratacao", checklist: "Recomendações atendidas ou justificativa formal registrada." },
  { key: "TECHNICAL_REVIEW", title: "Saneamento e parecer técnico", module: "RÉGUA", role: "chefia_compras", checklist: "Instrução revisada e parecer técnico emitido." },
  { key: "AUTHORIZATION", title: "Autorização da contratação", module: "MAESTRO", role: "autoridade_competente", checklist: "Ato de autorização, anulação ou revogação motivado." },
  { key: "PUBLICATION", title: "Publicações e comprovantes", module: "VITRINE", role: "compras", checklist: "Publicações e respectivos comprovantes registrados." },
  { key: "CONTRACT_SETUP", title: "Formalização e gestão do contrato", module: "ELO", role: "gestao_contratos", checklist: "Cadastro contratual ou registro de contratação sem instrumento concluído." },
  { key: "COMMITMENT_NOTE", title: "Nota de empenho", module: "LASTRO", role: "contabilidade", checklist: "Nota de empenho emitida ou exceção formalmente registrada." },
  { key: "ARCHIVE", title: "Atualização da demanda e arquivamento", module: "MEMÓRIA", role: "chefia_compras", checklist: "DFD atualizado e checklist de arquivamento concluído." },
] as const;

export type DirectContractingStepKey = (typeof DIRECT_CONTRACTING_STEPS)[number]["key"];

export const directStepByKey = new Map(DIRECT_CONTRACTING_STEPS.map(step => [step.key, step]));

export const BIDDING_STEPS = [
  { key: "INITIAL_DEMAND", title: "Formalização da demanda", module: "PORTA", role: "demandante", checklist: "DFD preenchido e documentação inicial conferida." },
  { key: "ETP", title: "Estudo Técnico Preliminar", module: "LUPA", role: "demandante", checklist: "ETP elaborado ou dispensa formalmente justificada." },
  { key: "ETP_REVIEW", title: "Verificação do ETP", module: "RÉGUA", role: "chefia_compras", checklist: "Lista de verificação do ETP concluída." },
  { key: "TR_DRAFT", title: "Minuta do Termo de Referência", module: "TERMÔMETRO", role: "instrumentalizacao", checklist: "Minuta do TR produzida e vinculada ao processo." },
  { key: "PRICE_RESEARCH", title: "Pesquisa de preços", module: "TERMÔMETRO", role: "compras", checklist: "Relatório, fontes e lista de verificação de preços concluídos." },
  { key: "BUDGET", title: "Manifestação orçamentária", module: "LASTRO", role: "contabilidade", checklist: "Disponibilidade ou adequação orçamentária formalmente registrada." },
  { key: "TR_FINAL", title: "Termo de Referência final", module: "TERMÔMETRO", role: "instrumentalizacao", checklist: "TR ajustado à manifestação orçamentária." },
  { key: "LEGAL", title: "Parecer jurídico", module: "ORÁCULO", role: "juridico", checklist: "Parecer jurídico e recomendações vinculados ao processo." },
  { key: "NOTICE", title: "Edital e publicação", module: "ECO", role: "agente_contratacao", checklist: "Edital, anexos e destinos de publicação conferidos." },
  { key: "COMPETITIVE_SESSION", title: "Recebimento de propostas e sessão", module: "MAESTRO", role: "agente_contratacao", checklist: "Propostas, lances e registros da sessão disponibilizados." },
  { key: "JUDGMENT", title: "Julgamento e habilitação", module: "MAESTRO", role: "agente_contratacao", checklist: "Julgamento, habilitação e classificação motivados." },
  { key: "APPEALS", title: "Recursos e contrarrazões", module: "MAESTRO", role: "agente_contratacao", checklist: "Intenções, recursos e decisões registrados ou fase encerrada sem recurso." },
  { key: "ADJUDICATION", title: "Adjudicação", module: "MAESTRO", role: "agente_contratacao", checklist: "Adjudicação formalizada e vinculada à proposta vencedora." },
  { key: "HOMOLOGATION", title: "Homologação", module: "MAESTRO", role: "autoridade_competente", checklist: "Homologação ou decisão alternativa motivada." },
  { key: "PUBLICATION", title: "Publicações e comprovantes", module: "VITRINE", role: "compras", checklist: "Publicações e respectivos comprovantes registrados." },
  { key: "CONTRACT_SETUP", title: "Formalização e gestão do contrato", module: "ELO", role: "gestao_contratos", checklist: "Cadastro contratual concluído." },
  { key: "COMMITMENT_NOTE", title: "Nota de empenho", module: "LASTRO", role: "contabilidade", checklist: "Nota de empenho emitida ou exceção formalmente registrada." },
  { key: "ARCHIVE", title: "Atualização da demanda e arquivamento", module: "MEMÓRIA", role: "chefia_compras", checklist: "DFD atualizado e checklist de arquivamento concluído." },
] as const;

export const workflowStepsFor = (workflowType: "direct_contracting" | "bidding") => workflowType === "bidding" ? BIDDING_STEPS : DIRECT_CONTRACTING_STEPS;
