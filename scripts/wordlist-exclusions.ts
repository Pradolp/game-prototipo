/** Curadoria manual das listas. Critérios em docs/WORDLIST.md. */

/** Mesma regra do jogo: sem acentos, ç -> c, minúsculas. */
export const normalizeWord = (word: string): string =>
  word.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

const words = (text: string): string[] => text.trim().split(/\s+/)

/** Palavrões sem sentido inocente: saem de valid e de answers. */
export const EVERYWHERE_EXCLUSIONS: readonly string[] = words(`
  bosta bostas cagão cuzão fodam fodas foder fodes fodeu fodia fodem merda merdas porra porras
  putas putos
`)

/** Terminações que só aparecem em formas conjugadas, quando a origem é um verbo. */
export const CONJUGATED_ENDINGS = /(?:ou|eu|iu|ei|am|em|mos|ão|ás|rá|ava|ia|sse)$/

/** Têm essas terminações, mas são substantivos ou adjetivos do dia a dia. */
export const CONJUGATED_ENDING_KEEP: readonly string[] = words(`
  ideia macia magia porão verão vigia
`)

/** A forma brasileira vence a de Portugal, mesmo sendo menos frequente no corpus. */
export const PREFERRED_DISPLAY_FORMS: readonly string[] = words(`bebês`)

/** Aceitos como chute, mas nunca sorteados. */
export const ANSWER_ONLY_EXCLUSIONS: readonly string[] = [
  // Termos ofensivos, sexuais ou de uso delicado com outro sentido inocente.
  ...words(`bicha bunda cagar corno crack droga fezes gozar mijar pênis pinto pornô rabos seios
    sexos tesão trans trepa urina útero vadia veado viado`),
  // Vetadas pelo autor na revisão da Fase 1.
  ...words(`burro gorda macho matar morte negro preta`),
  // Conjugações sem outro uso comum, que CONJUGATED_ENDINGS não alcança.
  ...words(`abana abate acaba acabe acabo achas acusa agita ajude ajudo alega aluga andas anime
    anota anote apela apoia apoie ataca atira atire atiro atrai avise basta beija beije brigo
    brota busco cansa canso canta cante capta cause cegas cessa chame chamo chega chego choca
    chora chore chova chove chuta cobro colhe colhi comes conte corra corre corri corro corta
    corto cospe creio cruza cuide cuido culpe culpo curte custa custe dance danço dando deita
    deito deixa deixe deixo desce desci detém deves digas dista dizei dizes dobre dorme dormi
    durma durmo educa eleva emana emite encha enche entra entro envia envie ergue esvai evita
    exibe exige exijo expôs expõe falas fales falhe falte faças fecha feche finge fingi finja
    fique forja frite funde ganha ganhe gaste gosta goste grita grite iluda imita impôs impõe
    janto jogas jogue julga junte levas lendo ligue limpe livra louva manda mande mando minta
    minto molha monta moras morda morde mordi mordo morra morre morri mudas narra nasce nasci
    negue nutre obtém ocupa ocupe odeia odeie odeio pagas pague paira parta parti passa pegas
    pegue pensa pense penso perca perco perde perdi piora pisca plana pondo ponha ponho possa
    posso poupa prevê pulsa punha puder quero reage recai reduz reina reler reluz rende resta
    retém reuni reúne rever rimos rindo rompe ronca rouba sabes saiba salta salve segue segui
    sendo senta sente senti sento serve servi sigas sinta sinto sirva situa sofra sofre sofri
    sofro solte sonha sopra sorri supus supõe surge tende tendo tenha tenho tenta tente tento
    tinge tinha tiras tiver torce torci torço torna torne traga trago trata trate trava treme
    troca valha varre vença vence venci vende vendi vendo venha venho versa vesti viaja viaje
    viajo vives viera vindo volte volto zombe fizer adora adoro anima apaga apara avisa coube cuida
    damos demos deres fazes ferve ficas fomos foram forem fores fosse foste gasta houve íamos ireis
    menti ousas ouves pedes podes saúdo sejas soube teres traía vires viste`),
  // Grafias de Portugal, sem uso no Brasil.
  ...words(`azoto berma betão ecrãs facto loiça motas natas ozono pizas quota rasto rúgbi tarte`),
  // Estrangeirismos não aportuguesados e nomes de povos ou línguas pouco usados.
  ...words(`anglo blues checo chips crude curdo drive games hindi hindu hobby links memes mouse
    saxão shows sites skate spray uigur xerox`),
  // Palavras corretas, mas raras no dia a dia.
  ...words(`aguar asses ateia entes abacá abeto acolá acres afins afora alado âmago anzol áureo avaro bagas bilha bisel
    cetro cólon covil cunho donde dorso durão fados favos fiada foles gabar gamão ganga gizes
    gongo grado gumes hélio húmus ímpio jazia lítio lumes lúcio magma melro mercê mirra moção
    mogno nódoa numes ocaso óvulo páreo pasmo pomes rubro sabre sebes silva sódio talho tenor
    tenra vivaz`),
]
