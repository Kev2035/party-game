# Guida per l'IA che lavora su questo progetto

Leggi questo file per intero prima di modificare qualcosa. Le regole di gioco complete sono in [docs/SPEC.md](docs/SPEC.md); la messa online in [docs/ONLINE.md](docs/ONLINE.md).

## 1. Con chi hai a che fare

Chi ti scrive di solito **non è un programmatore**: ha scaricato il gioco e vuole adattarlo alla propria festa. Quindi:

- parla in modo semplice, spiega cosa hai cambiato e come provarlo;
- se chiede "personalizzalo", comincia da `src/custom/` e fai queste domande: nome della partita? chi gestisce la TV? c'è un festeggiato? c'è un accessorio comune (parrucche, cappelli…)? quanto dura? avete bicchieri e pallina da ping pong? vanno bene i sorsi? avete foto per il Memory? domande sul festeggiato?
- per i contenuti nuovi: **italiano**, tono scherzoso, frasi brevi, apostrofo tipografico `’` nei testi;
- non pubblicare online, non fare push e non cancellare dati senza un sì esplicito.

## 2. Il gioco in un minuto

- **`/host`** gira sul PC collegato alla TV: crea la partita, mostra QR d'ingresso, classifica, timer, finale, podio. È anche l'**arbitro** (motore di gioco).
- **`/play`** gira sui telefoni: ingresso (nickname, emoji, selfie), caccia, sfide.
- Ogni giocatore ha un **simbolo** e un **codice** di 3 cifre segreti, e un **bersaglio** di cui vede solo il simbolo. Trova la persona, inserisce il suo codice, parte una sfida casuale tra i due (45% digitale, 35% fisica, 20% collaborativa). Poi nuovo bersaglio.
- Extra: taglia su chi è primo, 6 **QR nascosti** (4 bonus, 2 missioni da soli con foto-prova), sorsi scenici.
- A tempo scaduto: finale segreto **Torre di tap** (tutti martellano lo schermo per 15 s), poi podio e premi buffi.

Stati della partita (`game.status`): nessuna partita → `lobby` → `running` → `finale` → `ended`.

Invarianti di design da non rompere:

1. **Zero interventi manuali dell'host** durante il gioco: ogni situazione deve risolversi da sola.
2. **Simboli e codici non compaiono mai sulla TV** (solo nel pannello `?debug`).
3. **Il finale non va mai nominato** nell'interfaccia prima che parta.
4. Un telefono che sparisce non deve mai bloccare gli altri: ogni sfida ha una scadenza.
5. TV leggibile da 4-5 metri (1920×1080); telefono usabile con una mano, in verticale.

## 3. Avvio e verifica

Richiede Node.js 22.12+. Stack: Vite 8, React 18, JavaScript senza TypeScript, CSS semplice, rough.js, qrcode, Firebase Realtime Database, Vercel.

```bash
npm install
npm run dev      # http://localhost:5173
npm run check    # controlla contenuti, registro e personalizzazione
npm run build    # deve sempre passare
```

Non c'è una suite di test. Dopo ogni modifica: `npm run check`, `npm run build`, poi una prova nel browser.

**Prova da soli, senza account** (backend finto, tutto nello stesso browser):

1. Apri `/host?debug`, crea una partita da 2 minuti, premi "+5 bot".
2. Apri `/play?slot=1` in un'altra scheda ed entra (`?slot=N` = giocatori diversi nello stesso browser).
3. Premi "Inizia partita". Nel pannello debug scegli una sfida in "Prossime sfide" e premi "⚔️ bot" accanto al giocatore.
4. "bot cacciatori" li fa giocare tra loro; "🤫 Vai al finale segreto" salta al finale.

La scheda `/host` deve restare aperta: senza, i telefoni rispondono "La TV non risponde". Se due schede host sono aperte, comanda la prima (`hostLock`). I browser rallentano le schede in background: se sembra tutto fermo, riporta in primo piano la scheda host.

## 4. Mappa dei file

```
src/
  custom/            ⭐ PERSONALIZZAZIONE (il primo posto da toccare)
    config.js          nome partita, chi organizza, festeggiato, accessorio, durata, sfide escluse
    questions.js       domande sul festeggiato
    memory/            foto del Memory (ignorate da git)
    index.js           legge config.js e mette i ripieghi neutri: gli altri file importano DA QUI
  content/           tutti i testi e i contenuti, senza logica
    challenges.js      nome e istruzioni di ogni sfida (chiave = id) + etichette delle categorie
    quickQuiz.js emojiRebus.js mindMeld.js physical.js missions.js memoryEmojis.js
    texts.js           feed TV, finale, messaggi della caccia
    awards.js          premi del podio
    qr.js              i 6 QR nascosti e i loro messaggi
    symbols.js         emoji avatar, simboli di caccia con il loro nome, nomi dei bot
    tutorial.js        mini tutorial (telefono) e pillole di regole (TV, sala d'attesa)
  challenges/        una sfida per file
    registry.js        elenco delle sfide + scelta casuale + contratto dei moduli
    solo.jsx choice.jsx physical.jsx coop.jsx   "fabbriche" (vedi §6)
    mission.jsx        missione dei QR (kind oneshot)
  game/              logica, niente interfaccia
    engine.js          l'ARBITRO: gira solo su /host
    constants.js       punti, tempi, pesi delle categorie
    scoring.js selectors.js finale.js awards.js identity.js intents.js
  backend/           unico accesso ai dati
    index.js           sceglie mock o firebase da VITE_BACKEND
    mockBackend.js     localStorage + BroadcastChannel
    firebaseBackend.js Realtime Database + accesso anonimo
  host/              schermate TV (CreateGame, Lobby, RunningScreen, FinaleScreen, EndedScreen, QrPrint, DebugPanel)
  play/              schermate telefono (JoinFlow, Tutorial, HuntScreen, ChallengeView, FinalePhone, …)
  ui/                componenti comuni (Rough, Avatar, PhotoCapture, Rain, hooks…)
  utils/             id, foto, testo
  styles.css         tutto il CSS; colori come variabili in :root
scripts/check.mjs          npm run check
scripts/export-photos.mjs  estrae le foto della serata da un export JSON di Firebase
database.rules.json        regole di sicurezza Firebase
```

## 5. Architettura

### Autorità: i telefoni chiedono, l'host decide

I telefoni **non modificano mai** punti, sfide o giocatori. Scrivono un'intenzione con `sendIntent(type, playerId, payload)` in `intents/`; `engine.js` la elabora e, se richiesto, risponde in `replies/<id>`.

Intenzioni esistenti (`handlers` in `engine.js`): `join`, `code`, `skip`, `move`, `qr`. Per aggiungerne una basta un nuovo handler che restituisca `{ ok, message }`.

Eccezioni, scritte direttamente dai telefoni: `presence/<id>` (battito ogni 15 s) e `finaleTaps/<id>` (tocchi del finale).

`engine.js`:
- ogni modifica passa da `exclusive(...)`, che le mette in fila: **non scrivere stato fuori da lì**;
- `tick()` ogni 500 ms: scadenze, bot, bersagli mancanti, fine tempo, finale;
- tutto lo stato sta nel database, quindi ricaricare `/host` non perde nulla. Non tenere stato di gioco in memoria.

### Backend

Interfaccia unica (`src/backend/index.js`): `subscribe, get, set, update, push, transaction, now`. Nessun altro file deve sapere quale backend è attivo. Nei componenti si usa `useDb(path)` → `[valore, caricato]`.

Trappole (valgono per entrambi i backend):
- **oggetti e array vuoti, `null` e `undefined` spariscono**: leggi sempre con un ripiego (`data.claims || {}`);
- usa `db.now()`, mai `Date.now()`, per orari condivisi;
- `update` accetta percorsi come chiavi (`'stats/wins'`), `null` cancella;
- per le cose contese (occupare un giocatore, riscattare un QR) usa `transaction`.

Dati: `game`, `players/<id>`, `challenges/<id>`, `qr/<id>`, `feed/<id>`, `photos/<playerId>`, `proofs/<challengeId>`, `presence`, `intents`, `replies`, `finale`, `finaleTaps`, `hostLock`, `debug`. Se aggiungi dati pesanti, mettili in un nodo a parte (come `photos`) ed elencali in `NO_MIRROR` di `firebaseBackend.js`. Un nuovo nodo non richiede regole nuove (il default è "utenti autenticati"), ma aggiungi una `.validate` in `database.rules.json` se accetta dati grandi.

Le foto sono JPEG base64, 320 px e circa 50 KB (`utils/photo.js`).

### Bersagli e presenza

- Il bersaglio è sempre **l'id di un giocatore registrato** (`pickTarget`); il simbolo mostrato è il suo. Non può esistere un simbolo senza proprietario. Simboli unici fino a 44 giocatori (`SYMBOL_NAMES`).
- "Collegato" non significa "in sala": ogni telefono con la pagina aperta scrive `presence/<id>` ogni 15 s. Oltre `TIMING.OFFLINE_MS` (90 s) senza segnale il giocatore non viene assegnato e, se era il bersaglio di qualcuno, viene sostituito; il cacciatore vede l'avviso (`targetLost`). Chi è in sfida non viene sostituito.
- `useWakeLock` (`PlayApp.jsx`) tiene acceso lo schermo, perché con lo schermo spento il segnale si ferma. Non abbassare `OFFLINE_MS` sotto i 60 s: basterebbe un telefono in tasca per far cambiare bersagli di continuo.
- La carta "Tu sei…" con simbolo e codice resta visibile **anche durante le sfide**: se sparisce, chi viene cercato non sa rispondere.

### Variabili d'ambiente

`.env` (in git) imposta `VITE_BACKEND=mock`. `.env.local` (mai in git) lo sovrascrive con `firebase` e i 5 valori `VITE_FIREBASE_*`; modello in `.env.example`. `VITE_PUBLIC_URL` (facoltativa) cambia l'indirizzo scritto nei QR.

## 6. Ricette

### Personalizzare per una festa
Solo `src/custom/`. Valori `null` = testi neutri. Se in un testo serve il nome del festeggiato, importa `honoree` / `honoreeLabel` da `src/custom/index.js`: **non scrivere nomi propri dentro `content/`**. `honoreeLabel` vale "chi organizza la festa" se manca il festeggiato, quindi costruisci la frase in modo che regga entrambi i casi (`per ${honoreeLabel}`, `di ${honoreeLabel}`).

### Aggiungere domande, rebus, categorie, missioni, premi
Copia una riga nel file giusto di `content/` e lancia `npm run check`.
- Quiz: esattamente 4 `options`, `answer` = indice di quella giusta.
- Rebus: `answer` + 3 `wrong`, `kind` `'film'` o `'canzone'`.
- Missioni: `facing` `'user'` (selfie) o `'environment'` (ti fotografa qualcuno).
- Premi: `score(stats)`, `min`, `detail(n, stats)`; le statistiche sono in `emptyStats()` (`game/scoring.js`).

### Aggiungere una sfida fisica (la più facile)
1. `src/content/challenges.js`: `limbo: { name: 'Limbo', instructions: '…' }`
2. `src/challenges/limbo.jsx`:
   ```jsx
   import { makePhysical } from './physical.jsx'

   export default makePhysical({ id: 'limbo', drinkOnLose: true })
   ```
3. `src/challenges/registry.js`: import e aggiunta a `CHALLENGES`.
4. `npm run check`, poi provala dal pannello debug.

L'`id` deve coincidere con la chiave nei testi e con il nome del file.

### Le fabbriche
| Fabbrica | Per cosa | Esempio da copiare |
|---|---|---|
| `makePhysical` | 1v1 dal vivo, ognuno dichiara chi ha vinto | `colorHunt.jsx` (con dati extra), `noYesNo.jsx` (con timer) |
| `makeCoop` | insieme, entrambi "Fatto!", foto-prova con `photo: 'user'` o `'environment'` | `swap.jsx`, `toastChain.jsx` |
| `makeSolo` | ognuno gioca sul suo telefono, si confronta il punteggio | `perfectSecond.jsx`, `memory.jsx` |
| `makeChoice` | scelta multipla a round (usa `makeSolo`) | `quickQuiz.jsx` |
| nessuna | turni o mosse nascoste | `tris.jsx`, `rps.jsx`, `mindMeld.jsx` |

### Contratto di un modulo sfida
È scritto in cima a `registry.js`. In breve:
- `init({ players, rng })` → `data` iniziale, solo JSON;
- `move(data, { playerId, move, players })` → `null` se non valida, altrimenti `{ data, result? }`. **Gira sull'host, dev'essere pura**: valida sempre la mossa, non modificare `data` sul posto;
- `forceResult(data, players)` → esito quando finisce il tempo della partita;
- `idleResult` / `idleMs` (facoltativi) → esito e attesa se nessuno si muove (base 3 minuti, poi annullata);
- `bot(data, { botId, players, isBot, rng })` → mossa o `null` se non tocca a lui. Serve per provare la sfida, non saltarlo;
- `Component({ ch, meId, opponent, send })` → interfaccia sul telefono. Deve funzionare anche con `ch.state === 'done'`.

`result`: `{ winnerId }`, `{ draw: true }`, `{ disagree: true }`, `{ coop: true }`, `{ coopFail: true }`, `{ timeUp: true }`, `{ cancelled: true }`, `{ missionDone: true }`. Un tipo nuovo va gestito in `scoreResult` e `describeResult` (`scoring.js`) e in `resultFeed` (`engine.js`).

### Togliere una sfida
Per una festa: `disabledChallenges` in `config.js`. Per sempre: elimina file, import e voce in `CHALLENGES`, testi in `content/challenges.js`.

### Cambiare punti, tempi, probabilità
`src/game/constants.js`: `POINTS`, `TIMING`, `FINALE`, `PODIUM`, `KIND_WEIGHTS`.

### QR nascosti
`QR_SPOTS` in `content/qr.js`. Gli `id` sono stampati: **dopo la stampa non cambiarli**. Servono almeno tante missioni quanti QR `oneshot`.

### Tutorial
`content/tutorial.js`: pochi passi, frasi brevi. Si apre da solo al primo ingresso e si riapre da "Come si gioca". I punti citati sono scritti a mano: se cambi `POINTS`, aggiorna anche qui. Mai nominare il finale.

### Stile
Colori e font in `:root` di `styles.css` (evidenziatori `--hl-yellow|pink|green|blue`). Riquadri e bottoni: `Card` e `Button` di `ui/Rough.jsx`. Font da Google in `index.html`. Emoji dello sfondo: `ui/Rain.jsx` e `ui/Stickers.jsx`.

### Foto del Memory
File in `src/custom/memory/`, piccoli (circa 250 px, meno di 30 KB). Se ricevi foto grandi ritaglia il volto e rimpiccioliscile prima, con gli strumenti che hai. Servono 6 coppie: se le foto sono meno si completa con `content/memoryEmojis.js`.

### Tradurre
I testi sono in `content/` e `custom/`, ma diverse scritte dell'interfaccia sono dentro i `.jsx` di `host/`, `play/`, `challenges/` e in `game/scoring.js`, `game/engine.js`, `game/finale.js`. Cambia anche `lang` in `index.html`.

## 7. Cose da sapere prima di "migliorare"

- **Sicurezza**: le regole Firebase permettono di leggere e scrivere a chiunque apra il sito. È una scelta voluta per una festa tra amici; non presentarlo come sicuro e non usarlo per dati sensibili.
- **Una partita alla volta** per database: "Nuova partita" cancella tutto, foto comprese. Per conservarle prima si esporta il JSON da Firebase e si usa `scripts/export-photos.mjs`.
- **Fotocamera**: funziona solo in HTTPS (o su localhost).
- **`npm run deploy`** compila sul PC con `.env.local` e pubblica: verifica che ci sia e che `VITE_BACKEND=firebase`, altrimenti online i telefoni non si parlano.
- Le foto del Memory sono ignorate da git: un deploy fatto collegando il repository a Vercel **non le include** (e nemmeno `.env.local`). Con `npm run deploy` sì.
- Vite 8 e le altre dipendenze sono fissate in `package-lock.json`: non aggiornarle alla vigilia della festa.

## 8. Prima di dire "fatto"

1. `npm run check` e `npm run build` passano.
2. Hai provato la modifica in `/host?debug` con un bot.
3. Funziona anche con `src/custom/config.js` tutto a `null` e la cartella `memory/` vuota.
4. Se hai cambiato regole o struttura, hai aggiornato questo file e `docs/SPEC.md`.
