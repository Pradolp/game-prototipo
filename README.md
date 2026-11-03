# CHUTE

Jogo web de adivinhar palavras em português, com palavras de 5 letras e dicas por cores. Foi feito para uma jogadora que gosta do gênero e acha pouco ter só uma palavra por dia.

## Como jogar

Você tem 6 tentativas para descobrir a palavra. Digite sem acento: `MACAS` vale para `MAÇÃS`. Depois de cada chute, as casas mostram:

- **Verde:** a letra está na palavra, no lugar certo.
- **Amarelo com marca:** a letra está na palavra, em outro lugar.
- **Cinza:** a letra não está na palavra.

Toque em qualquer casa da linha atual para preenchê-la na ordem que preferir.

O jogo tem duas abas:

- **Palavra do dia:** uma palavra por dia, a única que conta para a sequência de dias.
- **CHUTE:** uma palavra a mais por dia. Quando ela terminar, o botão **↻** troca a palavra até 3 vezes por dia.

Nas Configurações, você encontra o modo daltônico e três tamanhos de fonte. O progresso fica salvo só no seu aparelho: não há login, anúncios nem servidor.

## Como rodar

Requer Node.js 24 (a versão está em `.nvmrc`).

```bash
npm install
npm run dev              # servidor local
npm run build            # build de produção, em dist/
npm run lint
npm run test             # testes unitários
npm run test:coverage    # testes com cobertura
npm run test:e2e         # testes no navegador
```

Na primeira vez, instale o navegador dos testes e2e com `npx playwright install chromium`.

## Publicação

O site é estático e foi preparado para a [Vercel](https://vercel.com). O `vercel.json` define o build e os cabeçalhos de segurança.

A Content-Security-Policy só permite arquivos do próprio site. Se o jogo passar a usar algo externo ou um script embutido na página, ela precisa ser atualizada.

## Licenças

As listas de palavras e as fontes têm licenças próprias, descritas em [`docs/WORDLIST.md`](docs/WORDLIST.md) e em [`public/THIRD_PARTY_NOTICES.txt`](public/THIRD_PARTY_NOTICES.txt).
