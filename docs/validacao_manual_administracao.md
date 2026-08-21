# Validação manual — Administração

Em **15 de agosto de 2026**, a validação visual autenticada foi executada manualmente pelo responsável no navegador Firefox já conectado à plataforma ÓRBITA. A confirmação recebida foi de que a tela de Administração estava **funcionando**.

Esta comprovação cobre a abertura autenticada do módulo sem criar DFD, PCA, fornecedores, listas, itens ou qualquer outro registro administrativo oficial. As capturas **Tela1.png** (desktop) e **Tela2.png** (largura móvel) foram fornecidas pelo responsável e mostram a tela **Administração → Listas configuráveis**, com os campos de código, nome, descrição, situação e a ação de salvar visíveis.

| Evidência | Acesso preservado | Escopo verificado |
|---|---|---|
| Desktop | [/manus-storage/administracao-desktop-validada_2e5f3dfb.png](/manus-storage/administracao-desktop-validada_2e5f3dfb.png) | Administração autenticada e painel de itens da lista |
| Móvel | [/manus-storage/administracao-movel-validada_fadc1f9b.png](/manus-storage/administracao-movel-validada_fadc1f9b.png) | Administração autenticada em largura reduzida, com formulário acessível |

> A validação automatizada complementar permanece coberta pelos testes de serviço, de rota e de políticas. A conexão direta da sessão do Firefox ao ambiente de automação não foi necessária após o fornecimento das evidências visuais.

## Evidência móvel posterior

Em **17 de agosto de 2026**, o responsável confirmou explicitamente que **PORTA e OFICINA funcionam sem zoom** em dispositivo móvel. As capturas preservadas em `/home/ubuntu/webdev-static-assets/orbita-validation/porta-sem-zoom.jpg` e `/home/ubuntu/webdev-static-assets/orbita-validation/oficina-sem-zoom.jpg` demonstram título, texto de apoio, seleção e campos contidos na largura do dispositivo, sem rolagem horizontal.

Na mesma rodada de validação, o responsável confirmou que os menus **FLUXO** e **FAROL** carregam painéis operacionais, sem exibir a antiga mensagem de módulo em preparação.
