# Party Game: regole e specifica

Come funziona il gioco e perché. Per la struttura del codice vedi [AGENTS.md](../AGENTS.md).

Lingua dell'interfaccia: **italiano**. Tono: scherzoso, frasi brevi.

---

## 1. Il concetto in breve

- Un PC collegato via HDMI alla TV mostra lo **schermo host**: crea la partita, mostra il QR per entrare, la classifica in tempo reale, il timer, il finale segreto e il podio.
- Ogni invitato scansiona il QR col telefono, inserisce un nickname, si scatta un selfie ed entra nella **lobby**.
- Quando l'host preme "Inizia", parte una partita **breve e intensa da 45 minuti** (durata configurabile). Tutti giocano attivamente. L'host può terminarla prima.
- Durante la partita ogni giocatore riceve un **bersaglio**: il simbolo emoji di un altro giocatore. Non sa chi è: deve girare per la stanza e chiedere. Trovata la persona, inserisce il suo codice e parte una **sfida** tra i due. Finita la sfida, nuovo bersaglio, e così via.
- Le sfide danno punti. In più ci sono **QR nascosti** in casa.
- Allo scadere del tempo parte un **finale segreto** (nessuno lo sa in anticipo) a cui partecipano tutti contemporaneamente: la **Torre di tap**. Poi podio animato e statistiche buffe.

Principio guida: **zero interventi manuali dell'host durante il gioco**. Tutte le regole devono risolversi da sole. L'host gioca anche lui dal suo telefono.

---

## 2. Stack tecnico

- **Vite + React** (JavaScript, niente TypeScript), CSS semplice (niente framework UI pesanti).
- **rough.js** per bordi e riquadri disegnati a mano.
- **qrcode** (libreria npm) per generare i QR.
- Backend realtime: **Firebase Realtime Database**; per le prove un **backend finto locale** (vedi sotto).
- Deploy finale: **Vercel**.

### Astrazione del backend (importante)
Tutta la comunicazione con il backend passa da un unico modulo `src/backend/index.js` che espone un'interfaccia tipo:

```
subscribe(path, callback) -> unsubscribe
get(path)
set(path, value)
update(path, partialValue)
push(path, value) -> id
transaction(path, updaterFn)   // per operazioni atomiche (claim QR, occupare un giocatore)
```

Implementazioni:
- `mockBackend.js`: stato in `localStorage` + sincronizzazione tra schede con `BroadcastChannel`. Permette di provare tutto aprendo la scheda host e più schede giocatore nello stesso browser.
- `firebaseBackend.js`: stessa interfaccia su Firebase Realtime Database.

Si passa dall'uno all'altro con una variabile d'ambiente (`VITE_BACKEND=mock|firebase`). Nessun altro file deve sapere quale backend è attivo.

### Autorità di gioco: lo schermo host
Lo schermo host (sempre acceso sul PC) è l'**arbitro**: i telefoni scrivono solo "intenzioni" (mi unisco, inserisco questo codice, faccio questa mossa, ho vinto io), e l'host le elabora: assegna bersagli, valida le mosse, calcola punti, gestisce il timer e il finale. Se la scheda host viene ricaricata, riprende dallo stato salvato senza perdere nulla.

### Foto
Le foto (avatar e foto-prova) vengono compresse lato client (max 320px lato lungo, JPEG qualità ~0.7, obiettivo < 50KB) e salvate come stringa base64 direttamente nel database. Niente Firebase Storage.

---

## 3. Route

- `/host` — schermo TV (creazione partita, lobby, partita, finale)
- `/host/qr-print` — pagina stampabile con i QR nascosti
- `/play` — app del giocatore (telefono)
- `/play?qr=<id>` — destinazione dei QR nascosti

---

## 4. Modello dati (indicativo)

```
game: {
  name, status: "setup" | "lobby" | "running" | "finale" | "ended",
  durationMs, startedAt, endsAt,
  settings: { drinksEnabled: true },
  leaderId
}
finale: {
  state: "intro" | "countdown" | "tapping" | "results",
  startsAt, endsAt,
  taps: { <playerId>: count }
}
players/<id>: {
  nickname, emoji, photo (base64 | null),
  points, symbol, code,              // simbolo e codice personali, unici
  targetId, status: "idle" | "in_challenge",
  stats: { played, wins, losses, draws, disagreements, qrFound, targetSkips, finaleTaps },
  joinedAt, lastSeen
}
challenges/<id>: {
  type, kind: "digital_1v1" | "physical_1v1" | "coop" | "oneshot",
  players: [a, b], state: "active" | "done",
  data: {...},                       // stato specifico del minigioco
  claims: { a: winnerId, b: winnerId },
  result: { winnerId | "draw" | "coop" }, pointsAwarded: {...},
  proofPhoto (opzionale)
}
qr/<id>: { label, type: "bonus" | "oneshot", foundBy: [ids], lockedBy }
feed/<id>: { text, ts, photo? }      // eventi mostrati sulla TV
```

---

## 5. Flussi

### 5.1 Creazione partita (host)
Form: **nome partita** (valore iniziale in `src/custom/config.js`), **durata** (default 45 min), **sorsi attivi** (toggle, default sì). Bottone "Crea" → lobby.

### 5.2 Lobby (host + giocatori)
- TV: nome partita grande, **QR gigante** che punta a `/play` (URL completo), URL scritto sotto, griglia dei giocatori entrati con foto e nickname che compaiono con animazione. Bottone "Inizia partita" (attivo con almeno 2 giocatori).
- Telefono: inserisci nickname → scegli un'emoji → scatta un selfie con la fotocamera frontale (`getUserMedia` con anteprima, fallback a `<input type="file" accept="image/*" capture="user">`; foto facoltativa, se manca si usa l'emoji). Poi schermata "Sei dentro! Aspetta che <chi organizza> dia il via".
- Appena entrato, il telefono mostra un mini tutorial di 4 schermate (si può saltare e riaprire con "Come si gioca"). In sala d'attesa la TV mostra le regole in pillole a rotazione.
- L'ID del giocatore si salva in `localStorage`: se il telefono ricarica o chiude il browser, riaprendo `/play` rientra direttamente.
- **Ingresso in ritardo** permesso anche a partita iniziata: parte da 0 punti, nessun vantaggio.

### 5.3 La caccia (cuore del gioco)
Ogni giocatore ha:
- un **simbolo** personale (emoji unica da un pool di animali/oggetti, diversa dall'emoji avatar scelta),
- un **codice** personale di 3 cifre, unico.

Schermata principale del telefono durante la partita:
- In alto: punti, posizione in classifica, timer residuo.
- Al centro: **"Cerca: 🐙"** — il simbolo del proprio bersaglio. Il giocatore non sa chi è, deve chiedere in giro.
- Carta "Tu sei…": il proprio simbolo (con il nome) e il proprio codice, da mostrare a chi ti cerca. Resta visibile anche durante le sfide.
- Campo per inserire il codice del bersaglio trovato + bottone "Sfida!".
- Bottone **"Cambia bersaglio"** (sempre disponibile, cooldown di 60 secondi tra un cambio e l'altro).

Regole:
- Simboli e codici **non vengono mai mostrati sulla TV** (altrimenti la caccia non ha senso).
- Inserendo un codice: se corrisponde al bersaglio → parte la sfida. Se il codice è di un altro giocatore che non è il tuo bersaglio → messaggio "Non è lui/lei! Cerchi 🐙". Se codice inesistente → "Codice sbagliato".
- Se il bersaglio è già in una sfida → "È impegnato in una sfida, riprova tra poco".
- Chi viene "trovato" viene trascinato nella sfida anche se stava cacciando: finita la sfida riprende con il suo bersaglio di prima.
- Il cacciatore, finita la sfida, riceve un **nuovo bersaglio casuale** (escluso sé stesso e la persona appena sfidata, se ci sono alternative).
- Assegnazione bersagli completamente casuale, nessuna logica di "chi hai già incontrato".
- Occupare un giocatore per una sfida deve essere atomico (`transaction`), per evitare che due persone lo sfidino nello stesso istante.

### 5.4 Sfide
Quando due giocatori si incontrano, l'host sceglie una sfida casuale con questi pesi:
- **45%** digitali 1v1
- **35%** fisiche 1v1
- **20%** collaborative

Evitare di riproporre a un giocatore la stessa sfida appena fatta.

Entrambi i telefoni mostrano: nome della sfida, **istruzioni in una o due righe**, foto/nome dell'avversario, e poi il minigioco (se digitale) o i bottoni di esito (se fisica).

**Sfide digitali**: si giocano sui due telefoni sincronizzati, l'app decide il vincitore.

**Sfide fisiche 1v1** (regola della fiducia): a fine sfida ognuno preme "Ho vinto io" o "Ha vinto lui/lei".
- Se le due indicazioni coincidono → punti normali.
- Se non coincidono (entrambi dicono di aver vinto, o entrambi dicono che ha vinto l'altro) → **1 punto a testa**, e la TV mostra nel feed un messaggio ironico ("Disaccordo tra X e Y: nessuno vince 🤨").

**Sfide collaborative**: entrambi premono "Fatto!". Alcune richiedono una **foto-prova** che viene mostrata nel feed della TV.

**Sorsi** (solo se attivi nelle impostazioni): alcune sfide mostrano a chi perde "🍺 Fai un sorso". Puramente scenico, non influisce sui punti. Niente shot o quantità.

Ogni sfida si annulla da sola se nessuno interagisce per 3 minuti (nessun punto).

Ritmo: la partita dura solo 45 minuti, quindi le sfide devono essere rapide. Niente durata fissa, ma ogni sfida deve chiudersi in pochi minuti al massimo.

### 5.5 Punteggi
| Esito | Punti |
|---|---|
| Vittoria 1v1 | 3 |
| Sconfitta 1v1 | 1 (partecipazione) |
| Pareggio (es. tris) | 2 a testa |
| Disaccordo su sfida fisica | 1 a testa |
| Sfida collaborativa completata | 2 a testa |
| Battere il leader in classifica (**taglia 👑**) | +2 extra |
| QR bonus: primo a trovarlo | 5 |
| QR bonus: chi lo trova dopo | 1 (una volta per giocatore) |
| QR one-shot completato | 6 |
| Finale segreto: 1°, 2°, 3° | 10, 7, 5 |
| Finale segreto: 4° e 5° | 3 |
| Finale segreto: tutti gli altri | 1 |

Il leader porta una corona 👑 sulla TV e sul proprio telefono ("Hai una taglia sulla testa!").

### 5.6 QR nascosti
- La pagina `/host/qr-print` genera una pagina A4 stampabile con **6 QR**, ognuno con un'etichetta piccola tipo "QR #3".
- 4 QR **bonus** e 2 QR **one-shot**.
- **Bonus**: scansionandolo (apre `/play?qr=<id>`) il giocatore riceve 5 punti se è il primo, 1 punto se lo trova dopo. Ogni giocatore può riscattare ogni QR una sola volta.
- **One-shot**: il primo che lo scansiona riceve una sfida speciale da fare da solo (vedi catalogo), con conferma "Fatto!" e foto-prova obbligatoria. Vale 6 punti. Dopo, il QR è **bloccato per tutti** ("Troppo tardi! L'ha già preso X").
- Il riscatto è atomico (`transaction`).
- Se un QR viene scansionato da chi non è ancora entrato in partita, prima si passa dal flusso di ingresso.
- La TV annuncia nel feed: "🔍 X ha trovato un QR nascosto!".

### 5.7 Finale segreto: la Torre di tap
Nessuno sa che esiste: non va mai nominato nell'interfaccia prima del momento.

Sequenza:
1. **Tempo scaduto.** Le sfide in corso vengono chiuse (quelle digitali si risolvono con lo stato attuale; quelle fisiche senza esito danno 1 punto a testa). La TV mostra "⏳ Tempo scaduto..." poi, dopo una pausa, **"...ma non è finita! 🤫 FINALE SEGRETO"**.
2. **Intro** (circa 10 secondi): sulla TV e sui telefoni una spiegazione di una riga: "Tocca lo schermo più veloce che puoi per costruire la tua torre!". Mostra anche i punti in palio.
3. **Countdown** 3-2-1 sincronizzato sulla TV e sui telefoni.
4. **Tapping** per **15 secondi**. Il telefono mostra un enorme bottone da martellare con feedback a ogni tocco (vibrazione leggera, se supportata, e piccola animazione). Il conteggio è locale e il telefono invia il totale aggiornato ogni ~200ms.
5. **TV durante il tapping**: una colonna per giocatore, affiancate, ognuna fatta di blocchi impilati (un blocco ogni N tocchi, con N scelto per riempire bene lo schermo), con la foto del giocatore in cima che sale. Colonne con colori da evidenziatore diversi, stile doodle. Effetto "la torre trema" quando cresce veloce.
6. **Risultati**: le torri si fermano, si evidenziano i primi 5 e vengono assegnati i punti del finale (vedi tabella 5.5). Poi la classifica generale si riordina con animazione, così si vede chi ha ribaltato la situazione.
7. Si passa al podio (5.9).

Dettagli:
- Il multi-touch è ammesso: più dita = più tocchi. Fa parte del caos.
- Chi non tocca mai prende comunque 1 punto.
- Il conteggio finale valido è l'ultimo totale ricevuto entro la fine dei 15 secondi (più una tolleranza di 500ms per la latenza).
- In debug, i bot simulano tocchi a velocità casuali.

### 5.8 Schermo TV durante la partita
Layout pensato per 1920×1080, leggibile da lontano:
- Nome partita + **timer grande** (conto alla rovescia).
- **Classifica** di tutti i giocatori (fino a ~20) con foto, nickname, punti; corona sul leader; animazione quando qualcuno sale di posizione.
- **Feed** degli ultimi eventi (vittorie, disaccordi, QR trovati, foto-prova con miniatura).
- Bottone discreto "Termina partita" (con conferma): avvia comunque il finale segreto.

Il timer arrivato a zero avvia automaticamente il finale segreto. Negli ultimi 5 minuti il timer diventa rosso e pulsa.

### 5.9 Podio
- Tutti i telefoni passano alla schermata "Partita finita! Guarda la TV".
- TV: **podio animato** (3°, poi 2°, poi 1° con pausa drammatica), foto grandi, poi una carrellata di **premi buffi** calcolati dalle statistiche, per esempio:
  - 🔥 Il più sfidato (più sfide giocate)
  - 🎯 Il cecchino (miglior rapporto vittorie)
  - 🤥 Il più litigioso (più disaccordi)
  - 🔍 Il segugio (più QR trovati)
  - 🔄 L'indeciso (più cambi bersaglio)
  - 🏗️ L'architetto (torre più alta nel finale)
- Poi classifica completa.

---

## 6. Catalogo sfide

Implementa ogni sfida come modulo separato in `src/challenges/`, con un registro centrale (`registry.js`) che contiene per ciascuna: id, nome, tipo, istruzioni brevi, eventuale flag `drinkOnLose`. Deve essere facile aggiungerne altre.

### Digitali 1v1 (l'app decide)
1. **Tris** — classico 3×3 a turni. Pareggio = 2 punti a testa.
2. **Sasso Carta Forbice** — al meglio di 3, scelte simultanee nascoste, rivelazione con animazione.
3. **Riflessi** — lo schermo diventa verde dopo un tempo casuale (2-6s): tocca il prima possibile. Chi tocca prima del verde perde subito. Il tempo si misura sul telefono, l'host confronta.
4. **Quiz lampo** — 3 domande a scelta multipla, stesse domande per entrambi; vince chi ne indovina di più, a parità il più veloce. Pool in `src/content/quickQuiz.js`, con domande generali divertenti più le domande personali **"Quanto conosci <festeggiato>?"** in `src/custom/questions.js`.
5. **Memory lampo** — griglia di 12 carte (foto in `src/custom/memory/`, altrimenti emoji), 30 secondi: chi trova più coppie vince. (Niente "tap battle": il tap veloce è riservato al finale segreto.)
6. **Simon** — sequenza di colori sempre più lunga, ognuno sul proprio telefono; vince chi arriva più lontano.
7. **Calcolo veloce** — 5 operazioni semplici (es. 7×8, 45+38), vince chi finisce prima senza errori (un errore = +3 secondi di penalità).
8. **Il secondo perfetto** — tieni premuto il dito per esattamente 5 secondi senza vedere il tempo; vince chi si avvicina di più.
9. **Emoji rebus** — indovina il film/canzone dalle emoji, 4 opzioni, 3 round. Pool in `src/content/emojiRebus.js`.
10. **Più alto o più basso** — carta mostrata, indovina se la prossima è più alta o più bassa; si va avanti finché si sbaglia; vince chi fa la serie più lunga.

### Fisiche 1v1 (fiducia: entrambi indicano il vincitore)
1. **Pollice di ferro** — braccio di ferro col pollice, al meglio di 3.
2. **Caccia al colore** — l'app mostra un colore casuale: il primo che porta un oggetto di quel colore all'avversario vince.
3. **Né sì né no** — 1 minuto di conversazione: chi dice "sì" o "no" perde. Timer sul telefono.
4. **Scioglilingua** — l'app mostra uno scioglilingua: a turno, chi lo dice 3 volte di fila senza errori vince.
5. **Catena di categorie** — l'app mostra una categoria (es. "marche di birra", "canzoni italiane"): a turno dite un elemento, chi si blocca per 5 secondi o ripete perde.
6. **Beer pong 1v1** — pallina da ping pong in un bicchiere da beer pong, dalla stessa linea a 2 passi abbondanti: 3 tiri a testa alternati, vince chi ne mette di più; in caso di parità un tiro a testa a oltranza.
7. **Morra cinese con le dita** — pari o dispari, al meglio di 5.
8. **Flip cup** — bicchiere dritto sul bordo del tavolo col fondo che sporge, colpetto da sotto e deve atterrare capovolto: si parte insieme, vince il primo che lo gira 3 volte (anche non di fila).
9. **Piramide di bicchieri** — ognuno con 6 bicchieri impilati: si parte insieme, si monta una piramide 3-2-1 e poi la si richiude in una pila sola; vince il primo che finisce.

### Collaborative (entrambi premono "Fatto!", 2 punti a testa)
1. **Mente unica** (digitale) — l'app dà una categoria, entrambi scrivono una parola sul proprio telefono senza parlarsi; se coincidono (confronto senza maiuscole/accenti) completate. 3 tentativi, altrimenti 1 punto a testa.
2. **Scambio!** — scambiatevi l'accessorio della festa (o uno qualsiasi) e fatevi un selfie. *Foto-prova.*
3. **Stretta di mano segreta** — inventatene una e mostratela a una terza persona.
4. **Selfie di gruppo** — selfie con almeno 3 persone con l'accessorio della festa (o con una faccia buffa). *Foto-prova.*
5. **Auguri in rima** — componete una rima di auguri per il festeggiato (o per chi organizza) e recitatela a qualcuno.
6. **Statue** — fatevi fotografare in una posa da statua greca. *Foto-prova.*
7. **Brindisi a catena** — brindate con 3 persone diverse entro 1 minuto.

### One-shot dei QR (da solo, 6 punti, foto-prova obbligatoria)
1. **Il discorso** — fai un discorso di 30 secondi in onore del festeggiato davanti ad almeno 3 persone.
2. **La parata** — fai il giro della stanza con l'andatura di un animale a scelta, filmato o fotografato da qualcuno.
3. **Il trenino** — organizza un trenino di almeno 4 persone.
4. Altre in `src/content/missions.js`: la serenata, il ritratto, il tango.

Tutti i testi delle sfide (istruzioni, categorie, scioglilingua, domande) devono stare in file di contenuto separati in `src/content/`, così si modificano senza toccare la logica.

---

## 7. Stile grafico: "foglio di carta e doodle"

- Sfondo a **foglio a quadretti** (pattern CSS), leggero effetto carta.
- Font scritti a mano da Google Fonts: **Caveat** o **Patrick Hand** per titoli e testi, un font leggibile per i numeri dei punti.
- Bottoni, card e riquadri con bordi disegnati a mano tramite **rough.js** (o SVG con tratto irregolare).
- Emoji usate come "adesivi" leggermente ruotati sparsi nelle schermate.
- Palette: carta crema, inchiostro blu scuro, evidenziatori (giallo, rosa, verde, azzurro) per i 4 colori del quiz e gli accenti.
- Animazioni brevi e giocose (rimbalzi, leggere rotazioni). Niente di pesante: deve girare fluido su telefoni economici.
- Telefono: tutto pensato per una mano sola, bottoni grandi, testo grande, funziona bene in verticale.
- TV: tutto leggibile da 4-5 metri.

---

## 8. Strumenti di test (importanti)

- Nello schermo host, con `?debug` nell'URL: pannello per **aggiungere giocatori finti** (bot con nickname ed emoji casuali), per vedere la TV con 15 persone.
- I bot possono partecipare alle sfide rispondendo a caso dopo qualche secondo, per testare una sfida da soli contro un bot.
- Possibilità di impostare in debug una durata partita brevissima (es. 2 minuti) e un bottone "Vai al finale segreto" per testarlo subito.
- Bottone debug per resettare tutta la partita.

---

## 9. Robustezza

- Un telefono senza segnale da più di 90 secondi non viene assegnato come bersaglio. Se lo era già, il cacciatore riceve un nuovo bersaglio e un avviso ("il telefono di 🐳 Balena non è più collegato").
- Telefoni bloccati, cali di rete e ricaricamenti non devono mai rompere la partita.
- La fotocamera dei telefoni richiede HTTPS: per le prove in casa c'è `npm run dev:https`.
