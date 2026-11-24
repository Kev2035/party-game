# Party Game 🎉

Un gioco per feste in casa: la **TV** fa da tabellone, ogni invitato gioca **dal proprio telefono** scansionando un QR. Niente app da installare.

Ognuno riceve un bersaglio segreto (un simbolo): deve girare per la stanza, trovare chi ce l'ha e inserire il suo codice. Parte una sfida, si guadagnano punti, si riceve un nuovo bersaglio. Ci sono 26 sfide (digitali, fisiche e collaborative), QR nascosti per casa, un finale a sorpresa e un podio con i premi buffi.

- **Giocatori**: da 2 in su, pensato per 8-20
- **Durata**: 45 minuti (modificabile)
- **Lingua**: italiano
- **Costo**: zero (piani gratuiti di Firebase e Vercel)

> 🤖 **Vuoi farlo modificare a un'IA?** Apri la cartella con Claude Code, Cursor, Copilot o simili e chiedi quello che vuoi: in [AGENTS.md](AGENTS.md) c'è tutto quello che le serve per capire il gioco.

## Provalo subito sul tuo PC

Serve [Node.js](https://nodejs.org) 22.12 o più recente.

```bash
npm install
npm run dev
```

Apri **http://localhost:5173/host?debug**, crea una partita, aggiungi qualche bot dal pannello in basso e apri "giocatore #1". Così com'è funziona **in un solo browser**, senza account: ti serve per provarlo e personalizzarlo.

## Personalizzalo per la tua festa

Tutto sta in **[`src/custom/`](src/custom)**, ed è tutto facoltativo: se non tocchi niente, il gioco funziona con testi neutri.

| Cosa | Dove |
|---|---|
| Nome della partita, chi gestisce la TV, festeggiato, accessorio comune (parrucca, cappello…), durata, sfide da escludere | `src/custom/config.js` |
| Domande "Quanto conosci il festeggiato?" | `src/custom/questions.js` |
| Foto degli amici per il Memory | `src/custom/memory/` (senza foto usa le emoji) |

I testi generali (quiz, rebus, scioglilingua, missioni, premi, messaggi) sono in `src/content/`.

Dopo le modifiche lancia `npm run check`: ti dice se c'è un errore nei contenuti.

## Giocare davvero, con i telefoni

Per collegare TV e telefoni serve mettere il gioco online: circa 30 minuti, una volta sola. Segui **[docs/ONLINE.md](docs/ONLINE.md)**.

## Cosa serve la sera della festa

- Un PC collegato alla TV, sempre acceso, con la pagina `/host` aperta (**senza** `?debug`: il pannello mostra i codici di tutti)
- Telefoni con internet
- I 6 QR nascosti, stampati da `/host/qr-print`
- Per alcune sfide: bicchieri di plastica e una pallina da ping pong. Se non li hai, escludi `beerPong`, `flipCup` e `cupStack` in `config.js`

I "sorsi" 🍺 sono solo scenici e si disattivano quando si crea la partita.

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run dev` | avvia il gioco su http://localhost:5173 |
| `npm run dev:https` | HTTPS sulla rete di casa, per provare la fotocamera dei telefoni |
| `npm run check` | controlla contenuti e personalizzazione |
| `npm run build` | compila il sito in `dist/` |
| `npm run deploy` | pubblica su Vercel |
| `npm run emulators` | emulatore Firebase locale (serve Java) |

## Documentazione

- [AGENTS.md](AGENTS.md): guida tecnica per un'IA (o per chi programma)
- [docs/ONLINE.md](docs/ONLINE.md): Firebase e Vercel passo passo
- [docs/SPEC.md](docs/SPEC.md): regole complete del gioco

## Privacy

Selfie e foto-prova restano nel database Firebase di chi organizza finché non si preme "Nuova partita" o si elimina il progetto. Le foto in `src/custom/memory/` sono ignorate da git, ma **diventano pubbliche con il sito** quando lo pubblichi: chiedi il permesso agli amici.
