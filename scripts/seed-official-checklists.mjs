import fs from 'node:fs/promises';
import mysql from 'mysql2/promise';

const sourcePath = '/home/ubuntu/official-checklists/official-checklists-extracted.json';
const officialSource = 'https://www.fozdoiguacu.pr.leg.br/transparencia/modelos/modelos-de-licitacoes-e-contratos/listas-de-verificacao';

const definitions = [
  ['recebimento-original.docx', 'LV_CD_RECEBIMENTO_PROCESSO', 'Lista de verificação — recebimento do processo', 'INITIAL_DEMAND'],
  ['etp-original.docx', 'LV_CD_ETP', 'Lista de verificação — Estudo Técnico Preliminar', 'ETP_REVIEW'],
  ['pesquisa-precos-original.docx', 'LV_CD_PESQUISA_PRECOS', 'Lista de verificação — pesquisa de preços', 'PRICE_RESEARCH'],
  ['tr-dispensa-original.docx', 'LV_CD_TR_DISPENSA', 'Lista de verificação — Termo de Referência para dispensa', 'TR_FINAL'],
  ['tr-inex-original.docx', 'LV_CD_TR_INEXIGIBILIDADE', 'Lista de verificação — Termo de Referência para inexigibilidade', 'TR_FINAL'],
  ['tr-eventos-original.docx', 'LV_CD_TR_EVENTOS', 'Lista de verificação — Termo de Referência para inexigibilidade de curso/evento', 'TR_FINAL'],
  ['minuta-contrato-original.docx', 'LV_CD_MINUTA_CONTRATO', 'Lista de verificação — minuta de contrato', 'CONTRACT_DRAFT'],
  ['aviso-original.docx', 'LV_CD_AVISO_CONTRATACAO', 'Lista de verificação — aviso de contratação direta', 'NOTICE'],
  ['fornecedor-original.docx', 'LV_CD_SELECAO_FORNECEDOR', 'Lista de verificação — seleção de fornecedor', 'PROPOSAL_REVIEW'],
  ['saneamento-original.docx', 'LV_CD_SANEAMENTO', 'Lista de verificação — saneamento do processo', 'LEGAL_CORRECTIONS'],
  ['arquivamento-original.docx', 'LV_CD_ARQUIVAMENTO', 'Lista de verificação — arquivamento do processo', 'ARCHIVE'],
];

function questionsFromParagraphs(paragraphs) {
  const questions = [];
  for (let index = 0; index < paragraphs.length; index += 1) {
    const label = paragraphs[index];
    if (!/^\d+(?:\.\d+)?$/.test(label)) continue;
    let cursor = index + 1;
    while (cursor < paragraphs.length && paragraphs[cursor] === 'Resposta') cursor += 1;
    const question = paragraphs[cursor];
    if (!question || question === 'Resposta' || question.startsWith('Lista de Verificação')) continue;
    questions.push(`${label}. ${question}`);
  }
  return questions;
}

const data = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  let imported = 0;
  let itemCount = 0;
  for (const [fileName, code, title, workflowStepKey] of definitions) {
    const questions = questionsFromParagraphs(data[fileName] ?? []);
    if (questions.length === 0) throw new Error(`Nenhum item foi extraído de ${fileName}.`);
    const content = questions.join('\n');
    await connection.execute(
      `INSERT INTO document_templates
        (code, title, documentType, templateKind, workflowStepKey, officialSourceUrl, sourceVerifiedAt, content, active)
       VALUES (?, ?, 'CHECKLIST_OFICIAL_CONTRATACAO_DIRETA', 'checklist', ?, ?, NOW(), ?, true)
       ON DUPLICATE KEY UPDATE
        title = VALUES(title), documentType = VALUES(documentType), templateKind = VALUES(templateKind),
        workflowStepKey = VALUES(workflowStepKey), officialSourceUrl = VALUES(officialSourceUrl),
        sourceVerifiedAt = VALUES(sourceVerifiedAt), content = VALUES(content), active = VALUES(active),
        version = version + 1`,
      [code, title, workflowStepKey, officialSource, content],
    );
    imported += 1;
    itemCount += questions.length;
  }
  console.log(`Imported ${imported} official checklists with ${itemCount} verifiable items.`);
} finally {
  await connection.end();
}
