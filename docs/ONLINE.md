# Mettere il gioco online 🌍

Tempo stimato: 20–30 minuti. Servono un account Google (per Firebase) e un account Vercel (gratis, puoi entrare con Google o GitHub).

Il gioco usa **Firebase Realtime Database** (piano gratuito "Spark") per far parlare TV e telefoni, e **Vercel** per pubblicare il sito con un indirizzo `https://…` (obbligatorio per la fotocamera dei telefoni).

---

## 1. Crea il progetto Firebase

1. Vai su **https://console.firebase.google.com** e accedi con Google.
2. **Crea un progetto** (o "Aggiungi progetto"). Nome: per esempio `festa-luca`.
3. Google Analytics: **disattivalo**, non serve. Poi "Crea progetto" e aspetta.

## 2. Crea il database

1. Nel menu a sinistra: **Build (Crea) → Realtime Database** → **Crea database**.
2. Posizione: **Belgio (europe-west1)**, la più vicina all'Italia.
3. Regole: scegli **"Avvia in modalità bloccata"** (le cambiamo subito).
4. Apri la scheda **Regole**, cancella tutto e incolla il contenuto del file [`database.rules.json`](../database.rules.json). Premi **Pubblica**.

   Cosa fanno: solo chi apre il gioco può leggere e scrivere (niente estranei che curiosano nel database), e foto e numeri hanno dimensioni ragionevoli.

## 3. Attiva l'accesso anonimo

Ogni telefono entra in automatico con un "accesso anonimo" di Firebase (nessuna password per gli invitati).

1. Menu a sinistra: **Build → Authentication** → **Inizia**.
2. Scheda **Metodo di accesso** (Sign-in method) → **Anonimo** → **Attiva** → **Salva**.

## 4. Copia la configurazione nel progetto

1. In alto a sinistra, l'ingranaggio ⚙️ → **Impostazioni progetto**.
2. In fondo, "Le tue app": premi l'icona **`</>`** (Web). Nome: `party-game`. **Non** spuntare Firebase Hosting. Premi **Registra app**.
3. Compare un blocco di codice con `const firebaseConfig = { apiKey: "...", ... }`. Tienilo aperto.
4. Nella cartella del progetto, **copia il file `.env.example` e rinomina la copia in `.env.local`**.
5. Apri `.env.local` e incolla i valori al posto dei segnaposto:

   | Nel file `.env.local` | Dal blocco `firebaseConfig` |
   |---|---|
   | `VITE_FIREBASE_API_KEY` | `apiKey` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `VITE_FIREBASE_DATABASE_URL` | `databaseURL` |
   | `VITE_FIREBASE_PROJECT_ID` | `projectId` |
   | `VITE_FIREBASE_APP_ID` | `appId` |

   Se `databaseURL` non compare nel blocco, copialo dalla pagina **Realtime Database**: è l'indirizzo in alto, tipo `https://festa-luca-default-rtdb.europe-west1.firebasedatabase.app`.

> Questi valori non sono segreti (finiscono comunque nel sito pubblicato): la protezione la fanno le regole del punto 2. `.env.local` resta solo sul tuo PC e non va su git.

## 5. Prova sul PC

```
npm install
npm run dev
```

Apri **http://localhost:5173/host?debug** e fai una partita di prova (giocatore #1, bot, sfide, finale).
Ora però TV e giocatori passano da Firebase: puoi anche aprire `/play` in **un altro browser** (es. Edge mentre la TV è su Chrome) e funziona.

Se resta tutto su "Caricamento…": premi F12 → Console e leggi l'errore. Il caso più comune è l'accesso anonimo non attivato (punto 3) o un valore copiato male nel `.env.local`.

**(Facoltativo) prova coi telefoni prima di pubblicare:**
```
npm run dev:https
```
Il terminale mostra un indirizzo tipo `https://192.168.1.10:5173`. Apri **la TV da quell'indirizzo** (`https://192.168.1.10:5173/host?debug`, non da localhost, altrimenti il QR della lobby punta a localhost), accetta l'avviso del certificato, e scansiona il QR coi telefoni (stesso Wi-Fi; anche lì accetta l'avviso).

## 6. Pubblica su Vercel

1. Crea un account su **https://vercel.com** (piano Hobby, gratis).
2. Nel terminale, nella cartella del progetto:
   ```
   npx vercel login
   ```
   Scegli come accedere e conferma dal browser.
3. Pubblica:
   ```
   npm run deploy
   ```
   La prima volta crea il progetto su Vercel con le impostazioni predefinite. Il sito viene compilato **sul tuo PC** usando il tuo `.env.local` e poi caricato.
4. Alla fine compare l'indirizzo pubblico, tipo **`https://party-game-xxxx.vercel.app`**. Lo trovi anche nella dashboard di Vercel (lì puoi anche cambiare il nome del progetto per avere un indirizzo più carino).

Ogni volta che modifichi qualcosa, basta rilanciare `npm run deploy`.

## 7. Prova coi telefoni veri

1. Sul PC apri **`https://<tuo-indirizzo>.vercel.app/host?debug`** e crea una partita da 5 minuti.
2. Scansiona il QR della lobby con 2–3 telefoni: nickname, emoji, **selfie con la fotocamera vera**.
3. Aggiungi qualche bot, inizia, e prova:
   - caccia tra due telefoni veri (simbolo e codice);
   - una sfida digitale (es. Riflessi o Quiz) e una fisica tra due telefoni;
   - una sfida con foto-prova (scegli "Scambio!" in "Prossime sfide" del pannello debug);
   - un QR: dal pannello debug apri la pagina **🖨️ stampa** e inquadra un QR dallo schermo col telefono;
   - **"🤫 Vai al finale segreto"** e martellate i telefoni.
4. Prova anche a chiudere e riaprire il browser di un telefono a metà partita: deve rientrare da solo.

## 8. Prima della festa

- **Stampa i QR nascosti** dalla versione online: `https://<tuo-indirizzo>.vercel.app/host/qr-print` (così puntano all'indirizzo giusto). Gli indirizzi dei QR non cambiano tra una partita e l'altra: si stampano una volta sola.
- **Sulla TV usa `/host` SENZA `?debug`** (il pannello debug mostra i codici di tutti!).
- Personalizza `src/custom/` (nomi, domande, foto), lancia `npm run check` e poi `npm run deploy`.
- Tieni il PC della TV collegato alla corrente e con lo schermo che non va in standby.
- Il piano gratuito di Firebase regge fino a 100 dispositivi collegati insieme: per 15 persone avanza parecchio.

## Domande frequenti

- **Posso tornare al backend finto?** Sì: in `.env.local` metti `VITE_BACKEND=mock` (o cancella il file).
- **Si può barare?** Chi conosce Firebase e smanetta col browser potrebbe modificare i dati. Per una festa tra amici va benissimo così; il database non è leggibile da chi non apre il gioco.
- **Come salvo le foto della serata?** Da Firebase → Realtime Database → menu ⋮ → **Esporta JSON**, poi `node scripts/export-photos.mjs <file.json>`. Fallo **prima** di premere "Nuova partita".
- **Dopo la festa**: dalla TV premi "Nuova partita" (cancella tutto), oppure elimina il progetto da Firebase.
