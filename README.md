# Spårning av Fair Trade-kaffe

Node.js-backend som registrerar kaffepartiers förflyttningar mellan odlare,
rosterier och kaféer i en Proof-of-Work-blockkedja.

Repo: [Kalleanka123456/Banckend_1](https://github.com/Kalleanka123456/Banckend_1)

## Kom igång

Kräver Node.js 24.x.

```sh
npm install
npm start
```

Servern använder port `3000` som standard. Ändra port med `PORT`. För
utveckling med automatisk omstart:

```sh
npm run dev
```

Kör alla enhets- och API-tester med `npm test`, eller starta Vitest i
watch-läge med `npm run test:watch`.

## Konfiguration

Vitest sätter `NODE_ENV=test`; standard-svårighetsgraden är då `1`, men riktig
Proof-of-Work utförs ändå. I övriga miljöer är standarden `2`. Ange
`MINING_DIFFICULTY=3` för difficulty `3`. Tillåtna värden är heltal `1`–`6`.

PowerShell-exempel:

```powershell
$env:MINING_DIFFICULTY = "3"
npm start
```

## API

Alla API-anrop använder JSON. Kedjan och kön lagras i minnet och försvinner när
servern stängs av.

### `GET /blockchain`

Returnerar hela kedjan och status (`200`):

```json
{
  "chain": [
    {
      "index": 0,
      "timestamp": 0,
      "transactions": [],
      "previousHash": "0",
      "nonce": 282,
      "hash": "00b93b4388740744711710bb0a60662bc344133136f749b94c406b29caaf0389"
    }
  ],
  "blockCount": 1,
  "difficulty": 2,
  "pendingTransactionCount": 0,
  "isValid": true
}
```

Genesisblockets nonce och hash varierar med svårighetsgraden.

### `POST /transactions`

Lägg till en transaktion (`201`):

```json
{
  "sender": "Farm A",
  "recipient": "Roastery B",
  "batchId": "FT-2026-001",
  "weightKg": 250
}
```

Alla fyra fält krävs. Namn och parti-id måste vara strängar som inte är tomma
eller enbart blanksteg. Vikten måste vara ett ändligt, positivt tal. Extra
fält avvisas. Ogiltig eller felaktig JSON ger `400` och ändrar inte kön.

### `POST /mine`

Minerar väntande transaktioner och returnerar blocket (`201`). Tom kö ger `400`;
en ogiltig kedja ger `409`. Oväntade serverfel ger `500`.

## Teknik och struktur

JavaScript med CommonJS, Express 5, Vitest 5, Supertest och Node.js inbyggda
`crypto`-modul.

```text
src/
  app.js                 # Express-app, separat från serverstart
  server.js
  blockchain/
    Block.js
    Blockchain.js
    Transaction.js
    crypto.js
tests/
  unit/
  integration/
```

Block hashas med SHA-256 över en fast ordnad serialisering av dess fält och
transaktioner. Mining ökar nonce tills hashen börjar med rätt antal nollor.
Validering kontrollerar hash, Proof-of-Work, index och länken till föregående
block. Genesisblocket skapas när kedjan initieras. Transaktioner valideras
innan de läggs i kön; efter mining tas endast de inkluderade posterna bort.

## TDD-historik

Varje test skrevs och kördes före sin implementation. Test- och
implementation-commits är separata:

1. **Hashning:** [test `8181de8`](https://github.com/Kalleanka123456/Banckend_1/commit/8181de8a7f1c72ce55c4623e734325bfc61cb366) saknades hashmodulen och misslyckades; [implementation `0f60167`](https://github.com/Kalleanka123456/Banckend_1/commit/0f60167be910b20489bb60d1db844cfeba4e2cae) lade till deterministisk SHA-256-hashning.
2. **Mining:** [test `a7f5e92`](https://github.com/Kalleanka123456/Banckend_1/commit/a7f5e92b23aabd4f96e3cb7b6bfd601e4359d780) saknade blockimplementationen och misslyckades; [implementation `5894326`](https://github.com/Kalleanka123456/Banckend_1/commit/589432648707cbb1d275a07c8240da417d26dbab) lade till mining och hashkontroll.
3. **Transaktioner och kedja:** [test `e982f6d`](https://github.com/Kalleanka123456/Banckend_1/commit/e982f6daa72294af351e253b0ff0f9be5385152d) saknade validering och kedjehantering; [implementation `4c46913`](https://github.com/Kalleanka123456/Banckend_1/commit/4c46913852e914cbbdc2df88c6aa2818de60d2cb) lade till dem.
4. **API:** [test `cd6651e`](https://github.com/Kalleanka123456/Banckend_1/commit/cd6651e1a8dd29e5a2864e59d5cb8841973a0702) saknade Express-appen; [implementation `48cd3bd`](https://github.com/Kalleanka123456/Banckend_1/commit/48cd3bd432ff2e185933f542e4e1d5314695df48) lade till API-endpoints.

Commitlänkarna fungerar efter att de lokala ändringarna har pushats till GitHub.

## Begränsningar

- En enda servernod; ingen distribuerad konsensus eller beständig lagring.
- Ingen autentisering, digital signering eller extern verifiering av Fair
  Trade-certifiering.
- Mining körs synkront och kan blockera servern, särskilt vid hög difficulty.
