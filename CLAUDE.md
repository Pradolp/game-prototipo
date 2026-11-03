# CLAUDE.md — CHUTE, jogo de palavras

**CHUTE** é um jogo web de adivinhar palavras em português, no estilo dos jogos de palavra do dia (5 letras, dicas por cores).
Feito para uma jogadora principal (a mãe do autor), que gosta do gênero mas acha pouco ter só uma palavra por dia.
A **diferença principal** é a aba **CHUTE**, ao lado da aba **Palavra do dia**: ela traz uma palavra a mais por dia e o botão **↻**, que a troca **até 3 vezes por dia**.

> Na interface, o nome CHUTE é sempre escrito em maiúsculas.
>
> O jogo precisa ter **nome, visual e textos próprios**. Não copie nome, logo, cores exatas, layout ou textos de jogos existentes (Termo, Wordle etc.). A mecânica do gênero pode ser usada.

## Idioma
- Código (variáveis, funções, arquivos): **inglês**.
- Interface, mensagens ao usuário, commits e documentação: **português do Brasil**.

## Stack (pré-requisitos)
| Item | Escolha | Motivo |
|---|---|---|
| Runtime | **Node.js 24 LTS** (via `nvm`, versão em `.nvmrc`) | Instalado na Fase 0 |
| Gerenciador de pacotes | **npm** | Já vem com o Node, menos uma coisa para instalar |
| Build/dev server | **Vite** | Rápido e simples |
| UI | **React 19 + TypeScript 6.0 (strict)** | Componentes simples, fácil de virar app mobile depois (React Native/Capacitor). TS fixado em `~6.0.3` porque o `typescript-eslint` exige `<6.1`; suba quando ele aceitar o 7 |
| Estilo | **CSS Modules + variáveis CSS** | Sem dependência extra; o tema Tokyo Night (padrão) e o modo daltônico usam variáveis |
| Fontes | **Zilla Slab** (casas e títulos) e **Atkinson Hyperlegible Next** (interface), via `@fontsource`, sob a OFL | Servidas pelo próprio jogo, sem depender de CDN; avisos em `public/THIRD_PARTY_NOTICES.txt` |
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
npm run test:coverage   # Vitest com cobertura (mínimo de 95% em src/game/)
npm run test:e2e   # Playwright
npm run lint
npm run build:wordlist   # regenera src/data/ (veja docs/WORDLIST.md)
```

## Regras do jogo (MVP)
- **Modo:** só 1 palavra. Palavras de **5 letras**, **6 tentativas**.
- **Cores:** letra certa no lugar certo, letra certa no lugar errado, letra ausente. Use a paleta **Tokyo Night** (seção abaixo) e ofereça **modo daltônico**.
- **Letras repetidas:** use o algoritmo de duas passadas. Primeiro marque as letras no lugar certo, depois as letras em lugar errado, descontando o que sobrou de cada letra na resposta. Isso precisa ter testes específicos (ex.: resposta `CASAL`, chute `AAAAA`).
- **Acentos e Ç:** a jogadora digita sem acento. A comparação é feita com a palavra **normalizada** (sem acento, `ç`→`c`), e a exibição mostra a forma acentuada (`MAÇÃS`, `LÁPIS`) quando a palavra é revelada ou acertada.
- **Validação:** o chute precisa estar na lista de palavras válidas; se não estiver, mostre uma mensagem e não gaste a tentativa.
- **Teclado virtual** na tela, com as cores de cada letra, e suporte ao teclado físico. Usa o layout **QWERTY**, igual ao do celular, porque é o que a jogadora já conhece: `Q W E R T Y U I O P` / `A S D F G H J K L` (centralizada) / `Z X C V B N M ⌫ OK`, com `⌫` e `OK` ocupando cerca de 1,5 tecla e uma folga extra entre os dois, para reduzir toques errados.
- **Casas selecionáveis:** a jogadora escolhe qualquer casa da linha atual e preenche em qualquer ordem.
  - Tocar em uma casa a seleciona, vazia ou preenchida, sem apagar nada. Linhas anteriores e futuras não respondem. Com a partida terminada ou um modal aberto, nada é selecionável. Cada linha começa na 1ª casa.
  - **Digitar** escreve na casa selecionada, substituindo a letra que houver. Depois, a seleção vai para a próxima casa vazia à direita; se não houver, para a primeira vazia a partir da esquerda; com a linha cheia, fica na mesma casa.
  - **Apagar (⌫ e Backspace):** na casa com letra, apaga e continua nela. Na casa vazia, volta uma casa à esquerda e apaga a letra dela. Na 1ª casa vazia, não faz nada.
  - **Setas ← e →** movem a seleção uma casa, sem dar a volta nas pontas.
  - **Enviar** com qualquer casa vazia mostra "Faltam letras" e não gasta tentativa. Palavra fora da lista mantém as letras e a seleção. Chute aceito leva à próxima linha, com seleção na 1ª casa.
  - Trocar de aba preserva as letras e a casa selecionada de cada aba.

### Abas: Palavra do dia e CHUTE
Duas abas lado a lado no **canto superior esquerdo**. O jogo sempre abre em "Palavra do dia", e trocar de aba não muda nenhum progresso.

- **Palavra do dia:** uma por dia, **sem reset**, renova à meia-noite (`America/Sao_Paulo`). É determinística pela data: calcule o índice a partir do número de dias desde uma data-época e de uma ordem embaralhada fixa (com seed) da lista de respostas. A palavra precisa ser a mesma ao recarregar a página. É a única que conta para a sequência de dias.
- **CHUTE:** ao abrir a aba pela primeira vez no dia, sorteia uma palavra **sem gastar reset**, diferente da palavra do dia, e registra em `played`.
  - O botão **↻** fica no canto superior direito e aparece **só nesta aba**, com **3 resets por dia**. O contador volta a 3 à meia-noite (`America/Sao_Paulo`).
  - O botão mostra quantos restam (ex.: "↻ 2").
  - O reset só fica disponível **depois que a palavra atual termina**: a jogadora acertou ou usou as 6 tentativas. Com a partida em andamento, é proibido trocar de palavra.
  - Estados do ↻: em andamento, fica desativado e, ao tocar, mostra "Termine esta palavra para trocar"; terminada, fica ativo e troca direto, sem confirmação; sem resets, fica desativado com "Novas palavras amanhã". Sem resets, esta última mensagem vale também com a partida em andamento.
  - Na janela de resultado desta aba, com resets restantes, o botão "Próxima palavra" faz o mesmo que o ↻ e fecha a janela. Sem resets, ele não aparece.
  - O reset troca a palavra e não repete a do dia nem as já jogadas hoje.
  - Palavra terminada conta em jogos, vitórias e distribuição de tentativas, nunca na sequência.
  - Na virada do dia, a palavra em andamento é descartada.
  - O estado da aba também sobrevive ao recarregar a página.
- **No código**, o tipo interno continua `extra`; só a interface usa o nome CHUTE.
- O limite fica no localStorage e é burlável se os dados forem limpos. **Isso é aceitável**: é um jogo de família, não competitivo.

### Sequência de dias
- Conta apenas a **palavra do dia**. A aba CHUTE nunca altera a sequência.
- Se a palavra do dia ficar sem jogar ou sem vencer no dia, a sequência zera. No dia seguinte a uma vitória, ela segue valendo até o fim do dia, enquanto a palavra do dia ainda pode ser vencida.

### Persistência (localStorage, chave versionada `chute:v1:*`)
- Sessão do dia: data, partida do dia e partida de CHUTE (se houver). Cada partida guarda tipo (`daily` | `extra`), resposta, chutes, status, `slots` e `cursor`. A aba aberta não é salva, porque o jogo sempre abre em "Palavra do dia".
- Resets: `{ date, used, played }` (`played` guarda as palavras de CHUTE do dia, para não repetir).
- Estatísticas: jogos, vitórias, sequência atual, melhor sequência, data da última vitória na palavra do dia, distribuição por número de tentativas.
- Preferências: modo daltônico, tamanho da fonte.
- Sempre envolva leitura e escrita em `try/catch` e use valores padrão quando o storage falhar.

## Paleta: Tokyo Night
Decisão do autor: o jogo usa as cores do tema **Tokyo Night**, o mesmo do terminal dele (Ptyxis). O tema é escuro e é o padrão do jogo. Valores exatos da paleta do terminal:

| Token CSS | Cor | Uso |
|---|---|---|
| `--color-bg` | `#1A1B26` | Fundo da página |
| `--color-text` | `#C0CAF5` | Texto principal |
| `--color-text-muted` | `#A9B1D6` | Texto secundário, borda da casa ativa |
| `--color-surface` | `#414868` | Casa "ausente", teclas sem resultado, bordas de casa vazia |
| `--color-correct` | `#9ECE6A` | Letra no lugar certo (verde) |
| `--color-present` | `#E0AF68` | Letra no lugar errado (amarelo) |
| `--color-accent` | `#7AA2F7` | Botões e links; casa "certa" no modo daltônico (azul) |
| `--color-danger` | `#F7768E` | Erros e ações destrutivas |
| `--color-extra-1`, `--color-extra-2` | `#BB9AF7`, `#7DCFFF` | Detalhes (roxo, ciano) |

Regras de uso (contraste medido em WCAG):
- Texto sobre verde, amarelo ou azul é **escuro** (`#1A1B26`): 9,3:1, 8,5:1 e 6,8:1. Sobre `#414868`, é **claro** (`#C0CAF5`): 5,5:1.
- **Verde e amarelo têm quase a mesma luminosidade** (1,09:1): em tela ruim ou para quem é daltônico eles podem se confundir. Por isso a casa "lugar errado" também precisa de uma **marca não colorida** (ex.: borda tracejada ou um ponto no canto), inclusive no modo normal.
- **Modo daltônico:** troca o verde pelo azul `--color-accent` (certa = azul, lugar errado = amarelo), mantendo a marca.
- Use só os tokens; não escreva cores soltas nos componentes.

## Acessibilidade (a jogadora é a prioridade)
- Fonte grande e legível; tamanho ajustável nas preferências.
- Casas, botões e demais alvos de toque com **pelo menos 44×44px**.
- **Exceção:** a largura das teclas de letra do teclado virtual. Em 360px, as 10 colunas do QWERTY dão cerca de 31px por tecla. O autor preferiu o layout conhecido pela jogadora, e em troca a tecla tem pelo menos 52px de altura, usa toda a largura da tela e cresce em telas maiores. `OK` e `⌫` continuam com 44px ou mais.
- Contraste AA no mínimo; modo daltônico.
- Nada depende só da cor: o resultado de cada letra também vai em `aria-label`.
- Animações curtas e respeito a `prefers-reduced-motion`.
- Funciona bem em tela de celular (360px) e de computador.
- Sem anúncios, sem login, sem distrações.

## Lista de palavras
- Duas listas em `src/data/`: `answers` (palavras comuns, curadas, ~1.000–2.000) e `valid` (todas as palavras de 5 letras aceitas como chute).
- Cada entrada guarda a forma acentuada; a forma normalizada é gerada em tempo de build ou de carga.
- Fontes: dicionário VERO (LibreOffice) com afixos expandidos e frequência contada nas frases do Tatoeba. Licenças, critérios e como regerar em `docs/WORDLIST.md`; os avisos exigidos ficam em `public/THIRD_PARTY_NOTICES.txt`.
- Regerar `answers` muda a sequência das palavras do dia.
- A lista de respostas evita palavrões, termos ofensivos, siglas e palavras muito raras.

## Estrutura sugerida
```
src/
  game/        # lógica pura, sem React (evaluate, normalize, daily, resets, session, stats) + testes
  data/        # listas de palavras
  storage/     # wrapper do localStorage
  components/  # Board, Row, Tile, Keyboard, Header, Tabs, ResetButton, Modal, Toast
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
