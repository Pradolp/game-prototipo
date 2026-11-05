# Plano do projeto

## Decisões tomadas (03/11/2026)
- **Plataforma:** web primeiro; app mobile só se fizer falta depois.
- **Abas:** "Palavra do dia" (uma por dia, sem reset) e "CHUTE" (uma palavra por dia, mais **3 resets por dia** que a trocam, sempre depois que a palavra atual termina). Tudo renova à meia-noite (horário de Brasília).
- **Modos:** só 1 palavra no MVP. O único modo com mais palavras previsto é o desafio Triplete, com 3; os modos com 2 e 4 palavras foram descartados.
- **Dados:** localStorage, sem login e sem servidor.
- **Nome:** CHUTE, definitivo. O repositório no GitHub mantém o nome atual.
- **Repositório:** continua público no GitHub (`Pradolp/game-prototipo`).
- **Cores:** paleta Tokyo Night, igual à do terminal do autor; detalhes no `CLAUDE.md`.

## O que precisa ser feito
| Fase | Entrega | Pronto quando |
|---|---|---|
| 0. Setup | Node 24 via nvm, `git init`, scaffold Vite+React+TS, ESLint/Prettier, Vitest, Playwright | `npm run dev`, `test` e `lint` passam |
| 1. Lista de palavras | Script que gera `answers` e `valid` a partir de uma fonte com licença OK; `docs/WORDLIST.md` | Listas versionadas, com acentos preservados e sem nomes próprios |
| 2. Lógica do jogo | `normalize`, `evaluateGuess` (letras repetidas), `isValidGuess`, `getDailyWord`, sorteio da aba CHUTE, controle de resets, estatísticas | Testes unitários cobrindo os casos-limite |
| 3. Interface | Header (abas **Palavra do dia** e **CHUTE** no canto superior esquerdo, ajuda, estatísticas, **↻ N** no canto superior direito só na aba CHUTE), Board, Teclado virtual, Toasts, Modais | Jogável no navegador em 360px e no desktop |
| 4. Persistência | Partidas das duas abas, resets, estatísticas e preferências sobrevivem ao recarregar | Teste E2E: jogar, recarregar e ver o mesmo estado |
| 5. Acessibilidade e polimento | Modo daltônico, fonte ajustável, aria-labels, reduced-motion, animações | Revisão de acessibilidade sem pendências graves |
| 6. Deploy | Vercel + link para a jogadora | Abre no celular dela |
| Backlog | PWA instalável, desafio Triplete (seção abaixo), compartilhar resultado, app (Capacitor) | — |

## Ideia futura: desafio Triplete
Novo desafio com 3 palavras, em uma aba própria. O nome vem do futebol: triplete é ganhar três títulos, e cada palavra acertada é um título.

- **Formato recomendado:** três palavras em sequência, com tabuleiro e casas no tamanho atual, um total de tentativas para as três (10 a 12, a calibrar jogando) e um placar de ⚽⚽⚽ no topo.
- **Formato descartado:** três tabuleiros lado a lado, porque as casas ficariam com cerca de 20px em 360px de largura e cada tecla precisaria mostrar três cores.
- **Cabeçalho:** a aba "Palavra do dia" passa a se chamar **"Hoje"**, para as três abas e os três ícones caberem em uma linha em 360px. Decisão do autor.
- **Antes de decidir o formato:** ver o teste no celular da jogadora e perguntar se ela prefere as três palavras ao mesmo tempo ou uma de cada vez.

## Riscos e cuidados
- **Lista de palavras:** é o ponto mais trabalhoso. Uma resposta rara ou estranha frustra a jogadora, então a curadoria manual de `answers` vale a pena.
- **Licença da lista:** confirme antes de publicar.
- **Fuso horário:** a virada do dia e dos resets usa `America/Sao_Paulo`, não UTC.
- **Identidade própria:** nada de nome, visual ou textos copiados de outros jogos.
- **Limite de resets no localStorage:** dá para burlar limpando os dados do navegador, e isso foi aceito conscientemente.
