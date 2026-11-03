# CLAUDE.md — Jogo de palavras (nome provisório: "Palavrinha")

Jogo web de adivinhar palavras em português, no estilo dos jogos de palavra do dia (5 letras, dicas por cores).
Feito para uma jogadora principal (a mãe do autor), que gosta do gênero mas acha pouco ter só uma palavra por dia.
A **diferença principal** é o botão **Reset**, no canto superior direito, que sorteia uma palavra extra **até 3 vezes por dia**.

> O jogo precisa ter **nome, visual e textos próprios**. Não copie nome, logo, cores exatas, layout ou textos de jogos existentes (Termo, Wordle etc.). A mecânica do gênero pode ser usada.

## Idioma
- Código (variáveis, funções, arquivos): **inglês**.
- Interface, mensagens ao usuário, commits e documentação: **português do Brasil**.

## Stack (pré-requisitos)
| Item | Escolha | Motivo |
|---|---|---|
| Runtime | **Node.js 24 LTS** (via `nvm`) | Ainda **não está instalado** nesta máquina |
| Gerenciador de pacotes | **npm** | Já vem com o Node, menos uma coisa para instalar |
| Build/dev server | **Vite** | Rápido e simples |
| UI | **React 19 + TypeScript (strict)** | Componentes simples, fácil de virar app mobile depois (React Native/Capacitor) |
| Estilo | **CSS Modules + variáveis CSS** | Sem dependência extra; os temas (claro/escuro/alto contraste) usam variáveis |
| Estado | `useReducer` + hooks próprios | O jogo é pequeno, não precisa de Redux/Zustand |
| Persistência | **localStorage** (sem backend, sem login) | Tudo fica no aparelho |
| Testes unitários | **Vitest + Testing Library** | Lógica do jogo 100% testada |
| Testes E2E | **Playwright** | Testa o fluxo real no navegador, inclusive em tamanho de celular |
| Lint/format | ESLint + Prettier | — |
| Hospedagem | **Vercel** ou **GitHub Pages** (estático, gratuito) | Definir na fase de deploy |
| Futuro | PWA (`vite-plugin-pwa`) → depois, se precisar, Capacitor para Android/iOS | Fora do MVP |

## Comandos (depois do scaffold)
```bash
npm install
npm run dev        # servidor local
npm run build      # build de produção
npm run test       # Vitest
npm run test:e2e   # Playwright
npm run lint
```

## Regras do jogo (MVP)
- **Modo:** só 1 palavra. Palavras de **5 letras**, **6 tentativas**.
- **Cores:** letra certa no lugar certo, letra certa no lugar errado, letra ausente. Use paleta própria e ofereça **modo daltônico/alto contraste**.
- **Letras repetidas:** use o algoritmo de duas passadas. Primeiro marque as letras no lugar certo, depois as letras em lugar errado, descontando o que sobrou de cada letra na resposta. Isso precisa ter testes específicos (ex.: resposta `CASAL`, chute `AAAAA`).
- **Acentos e Ç:** a jogadora digita sem acento. A comparação é feita com a palavra **normalizada** (sem acento, `ç`→`c`), e a exibição mostra a forma acentuada (`MAÇÃ`, `PÉROLA`) quando a palavra é revelada ou acertada.
- **Validação:** o chute precisa estar na lista de palavras válidas; se não estiver, mostre uma mensagem e não gaste a tentativa.
- **Teclado virtual** na tela, com as cores de cada letra, e suporte ao teclado físico.

### Palavra do dia + Resets
- **Palavra do dia:** é determinística pela data no fuso `America/Sao_Paulo`. Calcule o índice a partir do número de dias desde uma data-época e de uma ordem embaralhada fixa (com seed) da lista de respostas. A palavra precisa ser a mesma ao recarregar a página.
- **Reset (canto superior direito):** sorteia uma palavra **diferente** da palavra do dia e das já jogadas hoje. São **3 resets por dia**, e o contador volta a 3 à meia-noite (`America/Sao_Paulo`).
  - O botão mostra quantos restam (ex.: "↻ 2"). Com 0, fica desabilitado e explica: "Novas palavras amanhã".
  - Resetar no meio de uma partida pede **confirmação** ("Trocar de palavra? A partida atual será perdida").
  - O estado da partida extra também sobrevive ao recarregar a página.
- O limite fica no localStorage e é burlável se os dados forem limpos. **Isso é aceitável**: é um jogo de família, não competitivo.

### Persistência (localStorage, chave versionada `palavrinha:v1:*`)
- Partida atual: data, tipo (`daily` | `extra`), resposta, chutes, status.
- Resets: `{ date, used }`.
- Estatísticas: jogos, vitórias, sequência atual, melhor sequência, distribuição por número de tentativas.
- Preferências: tema, alto contraste, tamanho da fonte.
- Sempre envolva leitura e escrita em `try/catch` e use valores padrão quando o storage falhar.

## Acessibilidade (a jogadora é a prioridade)
- Fonte grande e legível; tamanho ajustável nas preferências.
- Teclas do teclado virtual com **pelo menos 44×44px**.
- Contraste AA no mínimo; modo alto contraste/daltônico.
- Nada depende só da cor: o resultado de cada letra também vai em `aria-label`.
- Animações curtas e respeito a `prefers-reduced-motion`.
- Funciona bem em tela de celular (360px) e de computador.
- Sem anúncios, sem login, sem distrações.

## Lista de palavras
- Duas listas em `src/data/`: `answers` (palavras comuns, curadas, ~1.000–2.000) e `valid` (todas as palavras de 5 letras aceitas como chute).
- Cada entrada guarda a forma acentuada; a forma normalizada é gerada em tempo de build ou de carga.
- Fonte candidata: `github.com/pythonprobr/palavras`, filtrada por 5 letras e sem nomes próprios. **Verifique a licença antes de usar** e registre a fonte em `docs/WORDLIST.md`.
- A lista de respostas evita palavrões, termos ofensivos, siglas e palavras muito raras.

## Estrutura sugerida
```
src/
  game/        # lógica pura, sem React (evaluate, normalize, daily, resets, stats) + testes
  data/        # listas de palavras
  storage/     # wrapper do localStorage
  components/  # Board, Row, Tile, Keyboard, Header, ResetButton, Modal, Toast
  hooks/       # useGame, usePersistentState
  styles/      # tokens/variáveis, temas
e2e/           # testes Playwright
docs/          # PLANO.md, PROMPTS.md, WORDLIST.md
```

## Convenções
- A lógica do jogo fica em `src/game/` como **funções puras** e testadas. Os componentes só exibem e despacham ações.
- Datas sempre passam por uma função `todayKey()` com fuso fixo e são injetáveis nos testes. Nunca use `new Date()` solto pela lógica.
- O RNG do sorteio é injetável, para os testes serem determinísticos.
- Antes de considerar uma tarefa pronta, rode `npm run lint && npm run test` e confira no navegador.

## Plugins recomendados do Claude Code
Instale com `/plugin install <nome>@claude-plugins-official`:
- `frontend-design`: interface com identidade visual própria.
- `feature-dev`: fluxo de explorar → arquitetar → implementar → revisar.
- `typescript-lsp`: diagnósticos de tipo.
- `playwright`: abrir o jogo no navegador e testar.
- `context7`: documentação atualizada de Vite, React, Vitest e Playwright.
- `code-review` e `commit-commands`: revisão e commits.
