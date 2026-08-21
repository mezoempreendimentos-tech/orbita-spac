import { beforeEach, describe, expect, it, vi } from "vitest";

const planningMocks = vi.hoisted(() => ({
  createDemand: vi.fn(),
  instantiateAuthorizedProcess: vi.fn(),
}));

const twoStagePlanningMocks = vi.hoisted(() => ({
  createDemandConsolidation: vi.fn(),
  createPca: vi.fn(),
  createPcaUpdate: vi.fn(),
  decidePca: vi.fn(),
  createTwoStageOpeningRequest: vi.fn(),
  getDemandControl: vi.fn(),
  startDemandAnalysis: vi.fn(),
  requestDemandComplementation: vi.fn(),
  provideDemandComplementation: vi.fn(),
  approveDemand: vi.fn(),
}));

const accessMocks = vi.hoisted(() => ({
  getUserProcessRoles: vi.fn(),
  getAdministrationOverview: vi.fn(),
}));

const signatureMocks = vi.hoisted(() => ({
  listDocumentSignatureRequests: vi.fn(),
  prepareGovbrSignature: vi.fn(),
}));

vi.mock("./planningService", async importOriginal => ({
  ...(await importOriginal<typeof import("./planningService")>()),
  ...planningMocks,
}));

vi.mock("./planningTwoStageService", async importOriginal => ({
  ...(await importOriginal<typeof import("./planningTwoStageService")>()),
  ...twoStagePlanningMocks,
}));

vi.mock("./procurementService", async importOriginal => ({
  ...(await importOriginal<typeof import("./procurementService")>()),
  getUserProcessRoles: accessMocks.getUserProcessRoles,
}));

vi.mock("./adminService", async importOriginal => ({
  ...(await importOriginal<typeof import("./adminService")>()),
  getAdministrationOverview: accessMocks.getAdministrationOverview,
}));

vi.mock("./documentSignatureService", async importOriginal => ({
  ...(await importOriginal<typeof import("./documentSignatureService")>()),
  ...signatureMocks,
}));

import { appRouter } from "./routers";

const context = (role: "user" | "admin", user = role === "admin" ? { id: 1, role, name: "Admin" } : { id: 2, role, name: "Usuário" }) => ({ user, req: {} as never, res: { clearCookie: vi.fn() } as never });

describe("rotas tRPC do planejamento", () => {
  const requiredDemandData = { supplyLineCnaeCode: "6201-5", supplyLineCnaeDescription: "DESENVOLVIMENTO DE PROGRAMAS DE COMPUTADOR SOB ENCOMENDA", requesterCertified: true, items: [{ title: "Serviço de apoio", objectDescription: "Serviço institucional com escopo suficientemente detalhado.", itemJustification: "Necessário para atender à demanda institucional registrada.", quantity: "1", unitOfMeasure: "serviço", quantityJustification: "Quantidade compatível com a necessidade informada.", estimatedValue: "100.00", estimatedValueJustification: "Estimativa baseada em pesquisa prévia realizada.", priceResearchCertified: true }] };
  const certifiedItem = { itemJustification: "Justificativa individual suficiente para este item.", quantityJustification: "Quantidade compatível com a necessidade.", estimatedValueJustification: "Estimativa baseada em pesquisa prévia.", priceResearchCertified: true };
  beforeEach(() => { vi.clearAllMocks(); accessMocks.getUserProcessRoles.mockResolvedValue([]); });

  it("exige sessão para criação de DFD", async () => {
    const caller = appRouter.createCaller({ user: null, req: {} as never, res: {} as never });
    await expect(caller.planning.createDemand({ unitId: 1, title: "Aquisição de material", objectDescription: "Descrição com tamanho suficiente.", justification: "Justificativa com tamanho suficiente.", ...requiredDemandData })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("bloqueia necessidade superveniente sem justificativa de planejamento", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.planning.createDemand({ unitId: 1, title: "Aquisição de material", objectDescription: "Descrição com tamanho suficiente.", justification: "Justificativa com tamanho suficiente.", isSupervening: true, planningJustification: "", ...requiredDemandData })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(planningMocks.createDemand).not.toHaveBeenCalled();
  });

  it("encaminha itens confirmados da DFD e rejeita uma lista de itens vazia", async () => {
    planningMocks.createDemand.mockResolvedValue({ publicId: "DFD-ITENS" });
    const caller = appRouter.createCaller(context("user"));
    await caller.planning.createDemand({ unitId: 1, title: "Aquisição de mobiliário", objectDescription: "Demanda institucional de mobiliário para salas administrativas.", justification: "Substituição necessária para garantir condições adequadas de trabalho.", ...requiredDemandData, items: [
      { title: "Cadeira ergonômica", objectDescription: "Cadeira com regulagens, rodízios e apoio lombar.", quantity: "12", unitOfMeasure: "unidade", estimatedValue: "750.00", ...certifiedItem },
      { title: "Mesa de reunião", objectDescription: "Mesa para reuniões com oito lugares e acabamento resistente.", quantity: "2", unitOfMeasure: "unidade", estimatedValue: "1250.00", ...certifiedItem },
    ] });
    expect(planningMocks.createDemand).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }), expect.objectContaining({ items: expect.arrayContaining([expect.objectContaining({ title: "Cadeira ergonômica" }), expect.objectContaining({ title: "Mesa de reunião" })]) }));
    await expect(caller.planning.createDemand({ unitId: 1, title: "Aquisição de mobiliário", objectDescription: "Demanda institucional de mobiliário para salas administrativas.", justification: "Substituição necessária para garantir condições adequadas de trabalho.", ...requiredDemandData, items: [] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("encaminha DFD, consolidação, PCA anual, atualização, deliberação, abertura e instauração ao serviço autenticado", async () => {
    planningMocks.createDemand.mockResolvedValue({ publicId: "DFD-1" });
    twoStagePlanningMocks.createDemandConsolidation.mockResolvedValue({ publicId: "CON-1" });
    twoStagePlanningMocks.createPca.mockResolvedValue({ publicId: "PCA-1" });
    twoStagePlanningMocks.createPcaUpdate.mockResolvedValue({ publicId: "ATU-PCA-1" });
    twoStagePlanningMocks.decidePca.mockResolvedValue({ success: true });
    twoStagePlanningMocks.createTwoStageOpeningRequest.mockResolvedValue({ publicId: "ABR-1" });
    planningMocks.instantiateAuthorizedProcess.mockResolvedValue({ publicId: "CD-1" });
    const caller = appRouter.createCaller(context("user"));
    await caller.planning.createDemand({ unitId: 1, title: "Aquisição de material", objectDescription: "Descrição com tamanho suficiente.", justification: "Justificativa com tamanho suficiente.", ...requiredDemandData });
    await caller.planning.createDemandConsolidation({ title: "Consolidação de materiais", demandPublicIds: ["DFD-1"] });
    await caller.planning.createPca({ title: "PCA anual de materiais", planId: 1, demandConsolidationPublicIds: ["CON-1"], demandPublicIds: ["DFD-1"] });
    await caller.planning.createPcaUpdate({ pcaPublicId: "PCA-1", demandPublicIds: ["DFD-1"], title: "Atualização de materiais" });
    await caller.planning.decidePca({ pcaPublicId: "PCA-1", action: "approve", notes: "Deliberação devidamente motivada." });
    await caller.planning.createOpeningRequest({ demandPublicId: "DFD-1", proposedWorkflowType: "direct_contracting", proposedModality: "Dispensa", justification: "Justificativa suficiente para abertura." });
    await caller.planning.instantiateProcess({ requestPublicId: "ABR-1" });
    expect(planningMocks.createDemand).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }), expect.objectContaining({ unitId: 1 }));
    expect(twoStagePlanningMocks.createDemandConsolidation).toHaveBeenCalled();
    expect(twoStagePlanningMocks.createPca).toHaveBeenCalled();
    expect(twoStagePlanningMocks.createPca).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }), expect.objectContaining({ planId: 1, demandPublicIds: ["DFD-1"] }));
    expect(twoStagePlanningMocks.createPcaUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }), expect.objectContaining({ pcaPublicId: "PCA-1", demandPublicIds: ["DFD-1"] }));
    expect(twoStagePlanningMocks.decidePca).toHaveBeenCalled();
    expect(twoStagePlanningMocks.createTwoStageOpeningRequest).toHaveBeenCalled();
    expect(planningMocks.instantiateAuthorizedProcess).toHaveBeenCalled();
  });

  it("encaminha a gestão individual da DFD com ator autenticado e motivação", async () => {
    twoStagePlanningMocks.getDemandControl.mockResolvedValue({ demand: { publicId: "DFD-1", status: "under_review" }, events: [] });
    twoStagePlanningMocks.startDemandAnalysis.mockResolvedValue({ success: true });
    twoStagePlanningMocks.requestDemandComplementation.mockResolvedValue({ success: true });
    twoStagePlanningMocks.provideDemandComplementation.mockResolvedValue({ success: true });
    twoStagePlanningMocks.approveDemand.mockResolvedValue({ success: true });
    const caller = appRouter.createCaller(context("user"));
    await caller.planning.demandControl({ demandPublicId: "DFD-1" });
    await caller.planning.startDemandAnalysis({ demandPublicId: "DFD-1", note: "Conferência inicial da documentação." });
    await caller.planning.requestDemandComplementation({ demandPublicId: "DFD-1", note: "Informe a quantidade detalhada de unidades." });
    await caller.planning.provideDemandComplementation({ demandPublicId: "DFD-1", note: "Quantidade detalhada e memória de cálculo anexadas." });
    await caller.planning.approveDemand({ demandPublicId: "DFD-1", note: "DFD completa e adequada para planejamento." });
    expect(twoStagePlanningMocks.getDemandControl).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }), "DFD-1");
    expect(twoStagePlanningMocks.startDemandAnalysis).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }), "DFD-1", "Conferência inicial da documentação.");
    expect(twoStagePlanningMocks.requestDemandComplementation).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }), expect.objectContaining({ demandPublicId: "DFD-1" }));
    expect(twoStagePlanningMocks.provideDemandComplementation).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }), expect.objectContaining({ demandPublicId: "DFD-1" }));
    expect(twoStagePlanningMocks.approveDemand).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }), expect.objectContaining({ demandPublicId: "DFD-1" }));
  });

  it("rejeita complementação ou aprovação sem motivação suficiente", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.planning.requestDemandComplementation({ demandPublicId: "DFD-1", note: "não" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.planning.provideDemandComplementation({ demandPublicId: "DFD-1", note: "não" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.planning.approveDemand({ demandPublicId: "DFD-1", note: "não" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(twoStagePlanningMocks.requestDemandComplementation).not.toHaveBeenCalled();
    expect(twoStagePlanningMocks.provideDemandComplementation).not.toHaveBeenCalled();
    expect(twoStagePlanningMocks.approveDemand).not.toHaveBeenCalled();
  });

  it("bloqueia gestão e atualização de prazos sem o perfil administrador institucional", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.planning.refreshDeadlines()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.administration.overview()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("permite à conta comum com perfil administrador institucional acessar a gestão", async () => {
    accessMocks.getUserProcessRoles.mockResolvedValue(["administrador"]);
    accessMocks.getAdministrationOverview.mockResolvedValue({ units: [], settings: [], templates: [], suppliers: [], referenceLists: [] });
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.administration.overview()).resolves.toMatchObject({ units: [] });
  });

  it("encaminha a preparação gov.br pela rota autenticada sem executar assinatura externa", async () => {
    signatureMocks.prepareGovbrSignature.mockResolvedValue({ publicId: "ASS-1", status: "awaiting_credentials" });
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.signature.prepareGovbr({ documentScope: "planning", documentId: 21 })).resolves.toMatchObject({ publicId: "ASS-1" });
    expect(signatureMocks.prepareGovbrSignature).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }), { documentScope: "planning", documentId: 21 });
  });
});
