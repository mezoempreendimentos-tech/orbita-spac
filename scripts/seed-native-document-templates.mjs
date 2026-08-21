import mysql from 'mysql2/promise';

const templates = [
  {
    code: 'MODELO_ETP_ORBITA',
    title: 'Modelo gerador — Estudo Técnico Preliminar',
    documentType: 'ETP',
    content: 'Processo: {{PROCESSO}}\nObjeto: {{OBJETO}}\nUnidade requisitante: {{UNIDADE_REQUISITANTE}}\nValor estimado: {{VALOR}}\n\n1. Descrição da necessidade\n2. Requisitos da contratação\n3. Levantamento de mercado\n4. Estimativa de quantidades e valores\n5. Solução proposta\n6. Resultados pretendidos\n7. Conclusão',
  },
  {
    code: 'MODELO_TR_ORBITA',
    title: 'Modelo gerador — Termo de Referência',
    documentType: 'TR',
    content: 'Processo: {{PROCESSO}}\nObjeto: {{OBJETO}}\nUnidade requisitante: {{UNIDADE_REQUISITANTE}}\nValor estimado: {{VALOR}}\n\n1. Definição do objeto\n2. Fundamentação da contratação\n3. Descrição da solução\n4. Requisitos\n5. Modelo de execução\n6. Gestão e fiscalização\n7. Critérios de medição e pagamento\n8. Seleção do fornecedor\n9. Adequação orçamentária',
  },
  {
    code: 'MODELO_RPP_ORBITA',
    title: 'Modelo gerador — Relatório de Pesquisa de Preços',
    documentType: 'RPP',
    content: 'Processo: {{PROCESSO}}\nObjeto: {{OBJETO}}\nUnidade requisitante: {{UNIDADE_REQUISITANTE}}\nValor estimado: {{VALOR}}\n\n1. Objeto e escopo da pesquisa\n2. Fontes consultadas\n3. Preços coletados\n4. Metodologia de tratamento\n5. Memória de cálculo\n6. Valor estimado e conclusão',
  },
  {
    code: 'MODELO_EDITAL_ORBITA',
    title: 'Modelo gerador — Edital ou aviso de contratação',
    documentType: 'EDITAL',
    content: 'Processo: {{PROCESSO}}\nObjeto: {{OBJETO}}\nUnidade requisitante: {{UNIDADE_REQUISITANTE}}\nValor estimado: {{VALOR}}\n\n1. Identificação do procedimento\n2. Objeto\n3. Participação e habilitação\n4. Critério de julgamento\n5. Propostas e prazos\n6. Obrigações\n7. Anexos e publicação',
  },
];

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  for (const template of templates) {
    await connection.execute(
      `INSERT INTO document_templates (code, title, documentType, templateKind, content, active)
       VALUES (?, ?, ?, 'document', ?, true)
       ON DUPLICATE KEY UPDATE
        title = VALUES(title), documentType = VALUES(documentType), templateKind = VALUES(templateKind),
        content = VALUES(content), active = VALUES(active), version = version + 1`,
      [template.code, template.title, template.documentType, template.content],
    );
  }
  console.log(`Seeded ${templates.length} native document templates.`);
} finally {
  await connection.end();
}
