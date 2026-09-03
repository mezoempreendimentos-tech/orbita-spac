# Guia do desenvolvedor

## O que este pacote resolve

Ele reduz decisões repetidas. A equipe recebe cores com nomes consistentes, espaçamentos definidos, ícones relacionados aos módulos corretos e componentes de referência. Isso acelera a implementação e diminui divergências entre telas.

## 1. Instalação

Para uma aplicação HTML simples, carregue:

```html
<link rel="stylesheet" href="/orbita/css/orbita.css">
```

Projetos com pipeline próprio podem consumir `tokens/orbita.tokens.json`, `orbita-tokens.scss` ou `orbita-tokens.ts`. Escolha apenas um formato como fonte no projeto para não criar valores divergentes.

## 2. Marca

Use SVG sempre que possível. Ele mantém nitidez em qualquer escala. PNG serve a ambientes que não aceitam vetor; PDF destina-se principalmente à produção gráfica.

```html
<img
  src="/orbita/assets/brand/svg/signature-intermediate.svg"
  alt="ÓRBITA"
  width="184"
  height="auto"
>
```

Não aplique largura e altura incompatíveis. A regra `height: auto` evita a marca achatada.

## 3. Ícones de módulos

Consulte `manifests/icons.json`. O arquivo informa a relação oficial nome -> subsistema -> cor -> ativo. As versões `currentColor` permitem que a cor seja controlada por CSS sem editar o SVG:

```html
<span class="module-icon" style="color: #367CFF">
  <svg aria-hidden="true"><use href="..." /></svg>
</span>
```

Para imagens externas, use os SVGs oficiais ou PNGs nos tamanhos entregues. Não use emoji, ícone genérico ou símbolo do subsistema para representar um módulo.

## 4. Tokens

Um token é apenas um valor com nome. Em vez de escrever `#367CFF` em dezenas de lugares, a aplicação usa `--orbita-subsystem-flow`. Se a regra mudar no futuro, a atualização acontece em um ponto controlado.

```css
.fluxo-da-contratacao {
  color: var(--orbita-subsystem-flow);
  gap: var(--orbita-space-4);
}
```

## 5. Componentes

As classes fornecidas são referência funcional e visual independente de framework. Em React, Angular, Vue ou outra tecnologia, a equipe pode reimplementar a mesma anatomia e os mesmos estados, preservando tokens e acessibilidade.

Todo componente interativo deve contemplar pelo menos: padrão, hover, foco visível, acionado, desabilitado e carregamento quando aplicável.

## 6. Responsividade

- Até 639 px: navegação deve assumir padrão móvel; conteúdos em uma coluna.
- De 640 a 959 px: sidebar pode ser recolhida para 72 px.
- A partir de 960 px: sidebar expandida em 280 px.
- Conteúdo principal: largura máxima de 1440 px.

Esses pontos são referências de comportamento, não tamanhos de aparelhos específicos.

## 7. Acessibilidade mínima

- Navegação completa por teclado.
- Foco visível em todos os controles.
- Nome acessível em botões que exibem somente ícone.
- Cor nunca como único meio de transmitir estado.
- Mensagem de erro junto ao campo e resumo no topo quando houver múltiplos erros.
- Alvo interativo de 44 px; 48 px quando o uso por toque for predominante.
- Respeito a `prefers-reduced-motion`.

## 8. Fluxo recomendado

1. Identifique a tela e seus estados.
2. Reutilize componentes existentes.
3. Aplique tokens, não valores soltos.
4. Use o ativo oficial do módulo.
5. Teste teclado, contraste, zoom, tema e largura reduzida.
6. Registre exceções e alterações no changelog.

## 9. O que ainda depende do produto

Este pacote não conhece a tecnologia, o repositório, os dados reais nem o modelo de autenticação da aplicação. A integração final deve validar desempenho, compatibilidade com o framework, leitores de tela e fluxos reais. Essa validação técnica não reabre as decisões de identidade já aprovadas.
