# My Gym 🏋️

Il mio diario di allenamento: un'app per iPhone che funziona **offline**, senza account e senza costi.
I dati (allenamenti, pesi, progressi) restano **solo sul telefono**.

---

## 1. Pubblicare l'app (una volta sola)

Serve per avere un indirizzo internet da aprire con Safari dall'iPhone. È gratis.

### 1.1 Crea l'account GitHub
1. Vai su <https://github.com> e tocca **Sign up**.
2. Segui i passaggi (email, password, nome utente). Annota il **nome utente**: servirà.

### 1.2 Crea il "contenitore" dell'app
1. Su GitHub, in alto a destra, tocca **+ → New repository**.
2. **Repository name**: `my-gym` (qualsiasi nome va bene, ma poi l'indirizzo cambia).
3. Scegli **Public** (con l'account gratuito le pagine web richiedono un repository pubblico).
4. **Non** spuntare "Add a README" né altri file.
5. Tocca **Create repository**.

### 1.3 Carica il codice
Apri il **Terminale** (in VS Code: menu *Terminal → New Terminal*) nella cartella del progetto e incolla, riga per riga
(sostituisci `TUO-UTENTE` con il tuo nome utente GitHub):

```bash
git init -b main
git add .
git commit -m "Prima versione di My Gym"
git remote add origin https://github.com/TUO-UTENTE/my-gym.git
git push -u origin main
```

Se è la prima volta che usi `git`, il Mac può chiederti di installare gli strumenti da riga di comando: accetta e ripeti.
Alla richiesta di accesso, GitHub ti guida nel login dal browser.

### 1.4 Attiva GitHub Pages
1. Nel repository, vai su **Settings → Pages**.
2. Sotto **Build and deployment → Source** scegli **GitHub Actions**.

### 1.5 Aspetta la pubblicazione
1. Vai nella scheda **Actions** del repository: vedrai "Deploy su GitHub Pages" in corso.
2. Dopo 1–2 minuti compare un segno ✅ verde.
3. L'app è online all'indirizzo:

   **`https://TUO-UTENTE.github.io/my-gym/`**

> ⚠️ **Privacy.** Chi conosce questo indirizzo può aprire l'app e vedere la tua foto di sfondo e gli esercizi/pesi iniziali.
> **I tuoi allenamenti e progressi no**: restano solo sul tuo telefono. Non condividere il link se non vuoi.

---

## 2. Installarla sull'iPhone

**Importante:** usa **Safari** (non Chrome).

1. Apri Safari e vai all'indirizzo dell'app.
2. Tocca il tasto **Condividi** (il quadrato con la freccia verso l'alto, in basso).
3. Scorri e tocca **Aggiungi a Home**.
4. Tocca **Aggiungi** in alto a destra.
5. Apri **My Gym** dall'icona nella Home, come una qualsiasi app.

La prima apertura deve avvenire **con internet**: dopo, l'app funziona anche senza rete (anche in palestra senza campo).

---

## 3. Usarla

1. Apri l'app e tocca **Sì, andiamo**.
2. Scegli gli esercizi di oggi (oppure una scorciatoia Petto / Dorsali / Spalle) e tocca **Inizia**.
3. Per ogni serie: fai l'esercizio, correggi ripetizioni e kg con **+ / −** se serve, poi tocca **✓**. Parte il timer di recupero.
4. A fine giornata tocca **Termina**: vedi il riepilogo.
5. In **Storico** trovi gli allenamenti passati e, in **Progressi**, grafici e record di ogni esercizio.

Se chiudi l'app a metà, l'allenamento resta salvato: dalla Home tocca **Riprendi** (oppure **Scarta** per annullarlo).

---

## 4. Fare il backup (da fare ogni tanto!)

I dati sono solo sul telefono: se perdi o resetti l'iPhone, senza backup si perdono. L'app ti avvisa in Home se l'ultimo backup ha più di 14 giorni.

1. **Impostazioni** (icona ingranaggio in Home) → **Esporta backup**.
2. Si apre il foglio di condivisione: scegli **Salva su File** (meglio su iCloud Drive) oppure invialo a te stesso.

**Ripristinare** (su un telefono nuovo o dopo un problema):
1. Installa l'app come al punto 2.
2. **Impostazioni → Importa backup…** e scegli il file.
3. **Unisci** aggiunge i dati senza cancellare quelli attuali; **Sostituisci tutto** li rimpiazza con quelli del file.

---

## 5. Aggiornare l'app

Quando modifichi qualcosa (per esempio gli esercizi in `src/seed.ts`, o chiedi nuove funzioni):

```bash
git add .
git commit -m "Descrizione della modifica"
git push
```

Dopo 1–2 minuti la nuova versione è online (controlla la scheda **Actions**).
Sull'iPhone: **chiudi completamente My Gym** (scorri via dalla schermata delle app) e **riaprila due volte**: la prima scarica l'aggiornamento, la seconda lo usa.
I tuoi dati non vengono toccati.

### Cambiare esercizi, kg e schede iniziali
Modifica [`src/seed.ts`](src/seed.ts), poi aggiorna come sopra. Nelle Impostazioni, **Carica dati iniziali** aggiunge solo ciò che manca (non cancella né sovrascrive nulla).
Gli esercizi si possono comunque modificare direttamente dall'app.

### Cambiare la foto di sfondo
Sostituisci il file `public/hero.jpg` con un'altra immagine (meglio verticale, sotto 1 MB) e aggiorna come sopra.

---

## 6. Provarla sul computer (facoltativo)

Servono [Node.js](https://nodejs.org) 20 o superiore.

```bash
npm install      # solo la prima volta
npm run dev      # avvia l'app: apri l'indirizzo "Network" da Safari sull'iPhone (stesso Wi-Fi)
npm run build    # controlla che tutto compili
```

> Con `npm run dev` l'app funziona ma **non offline**: il funzionamento offline si vede solo sulla versione pubblicata.

---

## 7. Problemi comuni

| Problema | Cosa fare |
|---|---|
| **Actions** mostra una ❌ rossa | Apri l'esecuzione fallita e leggi l'errore; di solito basta correggere e fare di nuovo `git push`. Controlla anche che in *Settings → Pages* la sorgente sia **GitHub Actions**. |
| Pagina bianca o errore 404 | Controlla l'indirizzo: deve finire con `/my-gym/` (con la barra finale) e coincidere con il nome del repository. |
| Non vedo gli aggiornamenti | Chiudi del tutto l'app e riaprila due volte (punto 5). |
| "Aggiungi a Home" non c'è | Stai usando un browser diverso da Safari, oppure sei dentro un'altra app (es. il browser di WhatsApp). Apri il link direttamente in Safari. |
| Ho perso i dati | Ripristina dal file di backup (punto 4). Se non ne hai uno, purtroppo non sono recuperabili: i dati non sono mai su internet. |
| I dati spariscono dopo settimane senza usare l'app | iOS può cancellare i dati dei siti non usati: tieni l'app **installata in Home** e usala regolarmente (l'app chiede già la memoria "persistente"). Fai comunque i backup. |

---

## Struttura del progetto (per chi vuole curiosare)

```
src/
  seed.ts          esercizi, kg e schede iniziali (modificabile)
  db/              database locale (IndexedDB): modelli, accesso ai dati
  lib/             backup, statistiche, timer/beep, wake lock, immagini
  screens/         Home, scelta esercizi, allenamento, storico, impostazioni…
  components/      pezzi riutilizzabili (stepper, grafico, tab bar…)
public/            icone, foto degli esercizi, sfondo
.github/workflows/deploy.yml   pubblicazione automatica su GitHub Pages
```

Le foto degli esercizi provengono dal dataset libero [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (licenza Unlicense).
