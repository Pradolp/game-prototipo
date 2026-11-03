# Prompts para o terminal 2 (executor)

**Como usar:** abra um segundo terminal nesta pasta, rode `claude` e cole **um prompt por vez**, na ordem.
Quando uma fase terminar, volte ao terminal 1 (orquestrador) e diga "fase N pronta" para eu revisar antes da próxima.
De preferência, use `/clear` entre as fases para começar com o contexto limpo. O `CLAUDE.md` é carregado automaticamente.

---

## Plugins
Os 7 plugins do `CLAUDE.md` já estão instalados para o usuário (valem em qualquer terminal). Reinicie o `claude` se ele já estava aberto.
`playwright`, `context7` e `typescript-lsp` dependem do Node, então só funcionam depois da Fase 0.

---

## Fase 0: Setup
```
Leia o CLAUDE.md e o docs/PLANO.md. Execute a Fase 0:
1. O Node não está instalado. Instale o nvm e o Node 24 LTS (me mostre os comandos antes de rodar) e crie um .nvmrc.
2. Rode git init(repostirório já esta criado https://github.com/Pradolp/game-prototipo.git) pode ir adicionadno commits quando sentir necessidade e crie um .gitignore adequado.
3. Faça o scaffold com Vite + React + TypeScript (strict) na raiz do projeto, sem apagar CLAUDE.md nem docs/.
4. Configure ESLint + Prettier, Vitest + Testing Library (jsdom) e Playwright (projetos: Desktop Chrome e Pixel 7).
5. Crie os scripts do package.json: dev, build, preview, test, test:e2e, lint, format.
6. Crie a estrutura de pastas do CLAUDE.md, com um teste de exemplo em src/game/ e um e2e que abre a página.
Pronto quando npm run lint, npm run test, npm run build e npm run test:e2e passarem. Faça um commit inicial.
```

## Fase 1: Lista de palavras
```
Leia o CLAUDE.md. Execute a Fase 1 (lista de palavras):
1. Pesquise uma fonte aberta de palavras do português brasileiro (candidata: github.com/pythonprobr/palavras). Verifique e registre a LICENÇA. Se não for compatível, pare e me avise com alternativas.
2. Crie scripts/build-wordlist.ts. Ele baixa a lista para uma pasta separada (dados não confiáveis), filtra palavras de exatamente 5 letras depois da normalização (sem acento, ç->c), remove nomes próprios, siglas e palavras com hífen ou caracteres fora de a-z, e preserva a forma acentuada.
3. Gere src/data/valid.ts (todas as palavras válidas) e src/data/answers.ts (palavras COMUNS para resposta, ~1.000-2.000). Para escolher as comuns, use um critério de frequência (por exemplo, uma lista de frequência de corpus aberto), também com licença verificada. Remova palavrões e termos ofensivos.
4. Escreva docs/WORDLIST.md com as fontes, as licenças, os critérios e como regerar as listas.
5. Trate as colisões de normalização: palavras diferentes podem virar a mesma forma sem acento (ex.: SÁBIA, SABIA e SABIÁ). Cada forma normalizada deve aparecer uma só vez em answers, com uma forma de exibição definida; informe quantas colisões houve e a regra usada.
6. O repositório é público: as fontes só podem ser usadas se a licença permitir redistribuir os dados, e o aviso de licença exigido deve ir junto.
7. Me mostre 50 respostas aleatórias para eu conferir se são palavras do dia a dia.
8. Ao final, faça o commit incluindo as alterações pendentes em CLAUDE.md e docs/.
```

## Fase 2: Lógica do jogo (TDD)
```
Leia o CLAUDE.md. Execute a Fase 2, escrevendo os testes ANTES da implementação, tudo em src/game/ como funções puras:
- normalize(word): remove acentos, ç->c, maiúsculas.
- evaluateGuess(guess, answer): retorna 'correct' | 'present' | 'absent' por letra, com o algoritmo de duas passadas para letras repetidas. Teste: CASAL x AAAAA, ARARA x RAIAR, SOLTO x OSSOS e palavras acentuadas.
- isValidGuess(guess).
- todayKey(now, tz='America/Sao_Paulo') -> 'YYYY-MM-DD'. Teste a virada do dia perto da meia-noite de Brasília (UTC-3).
- getDailyWord(dateKey): determinística, com ordem embaralhada por seed fixa.
- Resets: canReset(state, today, status) só libera com a palavra terminada, applyReset(state, today, status, rng) sorteia uma palavra diferente da do dia e das já jogadas hoje, com máximo de 3 por dia e renovação quando muda o dia.
- Estatísticas: updateStats(stats, result).
- Reducer do jogo: digitar letra, apagar, enviar chute (inválido não gasta tentativa), vitória, derrota.
Tudo com datas e RNG injetáveis. Apague o src/game/example.test.ts. Pronto quando a cobertura de src/game/ for >= 95%.
```

## Fase 3: Interface
```
Leia o CLAUDE.md. Use a skill frontend-design. Execute a Fase 3:
- Use a paleta Tokyo Night exatamente como está na seção "Paleta" do CLAUDE.md, com os tokens em src/styles/, e não invente outra. A identidade visual continua PRÓPRIA (nome CHUTE, sempre em maiúsculas), acolhedora e com fonte grande, sem copiar o layout de Termo/Wordle.
- Header: duas abas lado a lado no CANTO SUPERIOR ESQUERDO, "Palavra do dia" e "CHUTE", sempre abrindo em "Palavra do dia"; ícones de Ajuda e Estatísticas. Não há título central: o nome CHUTE aparece no título da página ("CHUTE") e na tela de ajuda. No CANTO SUPERIOR DIREITO, SÓ na aba CHUTE, o botão ↻ mostrando quantos resets restam (ex.: "↻ 3"). Com a palavra em andamento, ele fica desativado e, ao tocar, mostra "Termine esta palavra para trocar". Com a palavra terminada, fica ativo e troca direto, sem confirmação. Sem resets, fica desativado com "Novas palavras amanhã", inclusive com a palavra em andamento. Na aba Palavra do dia não há botão ↻. Se o cabeçalho não couber em 360px com fonte grande, use duas linhas, mantendo as abas à esquerda e o ↻ no canto superior direito.
- Board 6x5 com animação de virar a letra (respeitando prefers-reduced-motion), teclado virtual em PT-BR com teclas >= 44px e cores por letra, e suporte ao teclado físico.
- Toasts ("Palavra não encontrada", "Faltam letras"), modal de ajuda, modal de fim de jogo (mostra a palavra acentuada, as estatísticas e quanto falta para a próxima palavra do dia). A sequência exibida vem de `getCurrentStreak`, não do valor salvo.
- Use os hooks e a lógica da Fase 2; nenhuma regra de jogo dentro dos componentes.
Teste no navegador com Playwright em 360px e em desktop e me mande screenshots.
```

## Fase 4: Persistência
```
Leia o CLAUDE.md. Execute a Fase 4: crie src/storage com chaves versionadas chute:v1:* e try/catch. Persista a sessão do dia (partidas das duas abas e resets), as estatísticas e as preferências. A aba aberta não é salva: o jogo sempre abre em "Palavra do dia". Ao voltar para uma aba do navegador que ficou aberta (`visibilitychange`, `focus`) e também antes de cada ação, confira `todayKey` e, se o dia mudou, inicie a sessão do novo dia. Escreva testes E2E com Playwright:
(1) jogar 2 chutes, recarregar e ver os chutes preservados;
(2) na aba CHUTE, confirmar que o ↻ fica desativado com a palavra em andamento, terminar cada palavra, usar os 3 resets e confirmar que o botão fica desabilitado;
(3) simular a virada do dia (relógio do Playwright) e ver os resets voltarem a 3 e a palavra do dia mudar;
(4) vencer e conferir as estatísticas atualizadas;
(5) confirmar que o botão ↻ não aparece na aba Palavra do dia;
(6) com a página aberta, avançar o relógio além da meia-noite, disparar o retorno à aba e ver a nova palavra do dia e os resets em 3.
```

## Fase 5: Acessibilidade e polimento
```
Leia o CLAUDE.md. Execute a Fase 5: adicione o modo daltônico (conforme a seção "Paleta" do CLAUDE.md) e o ajuste de tamanho de fonte; aria-labels em cada letra com o resultado ("letra A, posição certa"); foco visível e navegação por teclado nos modais. Rode uma auditoria (axe via Playwright) e corrija tudo o que for sério ou crítico. Depois rode /code-review e corrija os achados.
```

## Fase 6: Deploy
```
Leia o CLAUDE.md. Prepare o deploy estático. Compare Vercel e GitHub Pages para este caso e recomende um. Configure o que for necessário (base path, build), mas NÃO publique sem eu confirmar. Gere um README.md curto em português, que explique como jogar e como rodar o projeto.
```

---

## Prompt de revisão (para usar no terminal 1, depois de cada fase)
```
A fase N terminou no terminal 2. Revise o que foi feito em relação ao CLAUDE.md e ao docs/PLANO.md: rode os testes, aponte problemas e me diga se posso seguir para a próxima fase.
```
