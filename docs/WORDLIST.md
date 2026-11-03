# Listas de palavras

| Arquivo | Conteúdo | Palavras |
|---|---|---|
| `src/data/valid.ts` | Tudo que é aceito como chute | 18.088 |
| `src/data/answers.ts` | Palavras comuns que podem ser sorteadas | 1.412 |

Os dois arquivos são gerados por `scripts/build-wordlist.ts`. Não edite à mão: mude a curadoria em `scripts/wordlist-exclusions.ts` e gere de novo.

> **Atenção:** a palavra do dia depende da posição em `answers`. Depois que o jogo estiver no ar, regerar a lista muda a sequência das próximas palavras.

## Fontes e licenças

O repositório é público, então só entram fontes que permitem redistribuir os dados. Os avisos exigidos vão junto em `public/THIRD_PARTY_NOTICES.txt` e `public/licenses/`. Por estarem em `public/`, também são publicados com o site.

| Fonte | Uso | Licença | Situação |
|---|---|---|---|
| [VERO, dicionário pt_BR do LibreOffice](https://github.com/LibreOffice/dictionaries/tree/4f1df64b2e8e14751aa7c2205d170ca016071315/pt_BR) (`pt_BR.dic`, `pt_BR.aff`) | Palavras e formas acentuadas | LGPLv3 e Mozilla Public License, segundo o `README_en.txt` | Usada, com versão fixada por commit e SHA-256 |
| [Tatoeba](https://tatoeba.org/pt-br/downloads), frases em português (`por_sentences.tsv.bz2`) | Contagem de frequência | CC BY 2.0 FR | Usada: só as contagens ficam no repositório, com atribuição |

### Pontos de licença

- O README do VERO diz "LGPLv3 **e** Mozilla Public License", sem dizer a versão da MPL nem se a escolha é livre. Por cautela, o projeto cumpre as duas: os textos da LGPLv3, GPLv3 e MPL-2.0 acompanham o repositório, e `valid.ts` e `answers.ts` trazem o aviso no cabeçalho. A MPL-2.0 foi escolhida por ser a versão atual e a usada por `pythonprobr/palavras` para os mesmos dados.
- `valid.ts` e `answers.ts` continuam sob as licenças do VERO. Isso vale para esses arquivos de dados, não para o resto do código.
- O bundle do site perde comentários, e por isso o aviso também é publicado em `/THIRD_PARTY_NOTICES.txt`. A tela de ajuda ou de créditos deve ter um link para esse arquivo (a fazer na Fase 3).

### Fontes avaliadas e rejeitadas

| Fonte | Motivo |
|---|---|
| [`pythonprobr/palavras`](https://github.com/pythonprobr/palavras) (MPL-2.0) | A licença serve, mas a lista não expande os afixos do Hunspell: faltavam 1.877 palavras de 5 letras do corpus, como `antes`, `vezes`, `certo`, `disse` e `tenho`. O jogo recusaria esses chutes |
| [`hermitdave/FrequencyWords`](https://github.com/hermitdave/FrequencyWords) | O MIT do repositório vale só para o código. O conteúdo é CC BY-SA 4.0, cujo share-alike não tem compatibilidade declarada com MPL/LGPL, e `answers.ts` derivaria das duas fontes |
| [`rspeer/wordfreq`](https://github.com/rspeer/wordfreq) | Os dados também são CC BY-SA 4.0 |
| [`fserb/pt-br`](https://github.com/fserb/pt-br) | Declara MIT, mas o README não identifica os corpora e dicionários de origem, então não dá para confirmar o direito de relicenciar |

## Como as listas são geradas

1. **Download:** `pt_BR.dic` e `pt_BR.aff` vão para `.wordlist-cache/`, pasta ignorada pelo git. O conteúdo é tratado como dado não confiável: nada ali é executado, o SHA-256 é conferido e só entra no repositório o que passa pelos filtros abaixo.
2. **Expansão:** as regras de prefixo e sufixo do `.aff` geram plurais, femininos e conjugações. Entradas com `FORBIDDENWORD` saem.
3. **Filtros de `valid`:**
   - entradas com maiúscula saem (17.303 nomes próprios e siglas no dicionário inteiro);
   - formas com hífen ou caractere que não seja letra saem;
   - a forma normalizada (sem acento, `ç`→`c`, minúscula) precisa casar com `^[a-z]{5}$`;
   - radicais que só existem antes de clítico saem (`afogá`, de `afogá-lo`).
4. **Frequência:** só contam tokens em minúsculas, inteiros e com hífen preservado. Assim, `Maria` e `Paulo` não contam, e `afogá-lo` não vira `afogá`. O resultado fica em `scripts/data/tatoeba-por-freq.tsv`, porque o export do Tatoeba muda toda semana e não tem versão.
5. **Filtros de `answers`:** a palavra precisa aparecer pelo menos **5 vezes** no corpus e sobreviver à curadoria abaixo.

## Curadoria

Está em `scripts/wordlist-exclusions.ts`, depois de leitura manual de todas as candidatas.

- **Palavrões sem sentido inocente:** saem de `valid` e de `answers`. A jogadora que digitar um deles vê "palavra não encontrada".
- **Termos ofensivos, sexuais ou delicados com outro sentido** (`pinto`, `veado`, `bicha`, `gozar`): são aceitos como chute, mas nunca sorteados.
- **Conjugações:** ficam fora de `answers`. Uma regra de terminações (`-ou`, `-eu`, `-am`, `-mos`, `-sse`...) atua nas formas geradas só por verbos, e uma lista explícita cobre o resto. Infinitivos e particípios ficam. Todas continuam aceitas como chute.
- **Vetos do autor** (`morte`, `morta`, `morto`, `matar`, `negro`, `negra`, `preto`, `preta`, `gordo`, `gorda`, `burro`, `burra`, `macho`): aceitos como chute, mas nunca sorteados.
- **Fora de `answers` também:** grafias de Portugal (`facto`, `ecrãs`), estrangeirismos não aportuguesados (`mouse`, `hobby`) e palavras corretas, mas raras (`bisel`, `melro`).

Para vetar uma palavra, inclua-a em `ANSWER_ONLY_EXCLUSIONS` e gere de novo.

## Colisões de normalização

Palavras diferentes podem ter a mesma forma sem acento, e o jogo compara só a forma normalizada. Cada forma normalizada aparece **uma só vez** em cada lista, com uma forma de exibição.

- **Colisões:** 1.364 em `valid` e 180 em `answers` (156 com duas formas, 23 com três e 1 com quatro).
- **Regra, em ordem:**
  1. forma listada em `PREFERRED_DISPLAY_FORMS` (`bebês` vence `bebés`, de Portugal);
  2. forma mais frequente no corpus;
  3. forma com menos acentos;
  4. ordem alfabética.
- **Exemplo:** `sabia` vence `sábia` e `sabiá`.
- **Efeito no jogo:** a resposta sempre aparece com a forma escolhida; se a jogadora pensou em SÁBIA, verá SABIA ao acertar.

## Como regerar

```bash
nvm use
npm run build:wordlist                          # usa o snapshot de frequência; o resultado é reproduzível
npm run build:wordlist -- --refresh-frequency   # reconta com o Tatoeba atual (exige o comando bzip2)
npm run test
```

Para atualizar o VERO, troque `VERO_COMMIT` e os SHA-256 em `scripts/build-wordlist.ts`, confira de novo a licença e apague `.wordlist-cache/`.
