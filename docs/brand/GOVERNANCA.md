# Manutenção e governança técnica

## Fonte de verdade

- Marca: arquivos em `assets/brand/svg` e Manual de Identidade Visual aprovado.
- Relação de módulos: `manifests/icons.json`.
- Valores visuais: `tokens/orbita.tokens.json`.
- Componentes: `manifests/componentes.json` e Design System aprovado.

## Alterações

Uma alteração deve indicar motivo, responsável, versão, componentes afetados e evidência de validação. Cores, nomes de módulos, pictogramas e assinaturas não devem ser acrescentados informalmente dentro de uma tela.

Use versionamento semântico:

- `PATCH`: correção sem mudança de uso.
- `MINOR`: novo componente ou opção compatível.
- `MAJOR`: alteração incompatível que exige migração.

## Qualidade por versão

- Validar estrutura do pacote.
- Gerar inventário e somas SHA-256.
- Testar contraste e navegação por teclado.
- Conferir ícones e marcas visualmente.
- Registrar mudanças em `CHANGELOG.md`.

Exceções temporárias devem ter justificativa, prazo e responsável; caso contrário, tornam-se inconsistências permanentes.
