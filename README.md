# Fair Trade Coffee Blockchain API

An educational Node.js backend for tracking Fair Trade coffee batches as they
move between farms, roasteries, and cafes. Transfers are recorded as
transactions in a Proof-of-Work blockchain so the history can be checked for
tampering.

GitHub repository: [Kalleanka123456/Banckend_1](https://github.com/Kalleanka123456/Banckend_1)

## Technology

- Node.js 24.x (recommended and used for verification)
- JavaScript with CommonJS modules
- Express 5
- Vitest 5
- Supertest
- Node.js built-in `crypto` module (SHA-256)

## Requirements and setup

Install Node.js 24.x (used for development and verification), then install
dependencies from the repository root:

```sh
npm install
```

Start the API:

```sh
npm start
```

The server listens on port `3000` by default. Set `PORT` to use another port.
For development with Node's file watcher:

```sh
npm run dev
```

## Tests

Run the complete unit and integration test suite:

```sh
npm test
```

Run Vitest in watch mode:

```sh
npm run test:watch
```

Vitest is configured with `NODE_ENV=test`, so a default `Blockchain` uses
difficulty `1` in tests. Mining still performs real Proof-of-Work; tests do not
bypass the hash search. In other environments the default difficulty is `2`.
Set `MINING_DIFFICULTY=3` to use difficulty `3` in production. For example, in
PowerShell:

```powershell
$env:MINING_DIFFICULTY = "3"
npm start
```

The configured difficulty must be an integer from `1` through `6`. Difficulty
`2` or `3` is recommended for production; higher values increase mining time.

## API

The server uses JSON request and response bodies. The blockchain is kept in
memory by the server process.

### `GET /blockchain`

Returns the complete chain and current state:

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

The genesis nonce and hash are determined by Proof-of-Work and can vary with
the configured difficulty. The endpoint responds with HTTP `200`; `isValid`
reports whether every block, link, and proof currently verifies.

### `POST /transactions`

Adds a transfer to the pending queue:

```json
{
  "sender": "Farm A",
  "recipient": "Roastery B",
  "batchId": "FT-2026-001",
  "weightKg": 250
}
```

A successful request returns HTTP `201`:

```json
{
  "message": "Transaction added to pending queue.",
  "transaction": {
    "sender": "Farm A",
    "recipient": "Roastery B",
    "batchId": "FT-2026-001",
    "weightKg": 250
  },
  "pendingTransactionCount": 1
}
```

The four fields are required. Names and batch IDs must be non-blank strings;
`weightKg` must be a finite, positive number. Extra fields are rejected, so
request data cannot set block metadata such as `hash`, `nonce`, or
`previousHash`. Invalid transactions and malformed JSON return HTTP `400` and
do not change the queue.

### `POST /mine`

Mines all transactions currently pending and returns the new block with HTTP
`201`. The block's `previousHash` is the preceding block's hash, and included
transactions are removed from the queue after mining succeeds. Mining with an
empty queue returns HTTP `400` with:

```json
{
  "error": "Cannot mine a block without pending transactions."
}
```

Mining is rejected with HTTP `409` if the current chain is invalid. Unexpected
server errors return HTTP `500`.

## Blockchain and Proof-of-Work

Each block contains `index`, `timestamp`, `transactions`, `previousHash`,
`nonce`, and `hash`. The genesis block is created when a `Blockchain` instance
is constructed; its index is `0`, its `previousHash` is `"0"`, and it is mined
like any other block.

`calculateHash` serializes the supported block fields and transaction fields in
a fixed order, then hashes the serialized content with Node's built-in
`crypto.createHash('sha256')`. Mining repeatedly increments the nonce in a
`while` loop until the hash starts with the configured number of zeroes.
Integrity validation recomputes each hash, checks its proof, verifies indices,
and checks every `previousHash` link. It also reports malformed or replaced
blocks as an invalid chain.

Transactions are validated and copied into the pending queue. Only their four
supported fields are retained. Mining takes a snapshot of queued transaction
objects and removes only those included after the new block has been mined.

## Project structure

```text
.
├── package.json
├── package-lock.json
├── vitest.config.js
├── src/
│   ├── app.js
│   ├── server.js
│   └── blockchain/
│       ├── Block.js
│       ├── Blockchain.js
│       ├── Transaction.js
│       └── crypto.js
└── tests/
    ├── unit/
    │   ├── Block.test.js
    │   ├── Blockchain.test.js
    │   ├── Transaction.test.js
    │   └── crypto.test.js
    └── integration/
        └── api.test.js
```

`src/app.js` exports `createApp` separately from `src/server.js`, allowing
Supertest to exercise isolated application and blockchain instances without
opening a permanent listening server.

## TDD commit history

The test commit is followed by its implementation commit in each pair below.
The hashes are actual local commits in this repository. This branch has not
yet been pushed, so the GitHub commit links will resolve after the commits are
pushed to the repository.

1. **SHA-256 hashing**
   - Test first: [8181de8 — canonical hash tests](https://github.com/Kalleanka123456/Banckend_1/commit/8181de8a7f1c72ce55c4623e734325bfc61cb366)
   - Implementation next: [0f60167 — canonical SHA-256 hashing](https://github.com/Kalleanka123456/Banckend_1/commit/0f60167be910b20489bb60d1db844cfeba4e2cae)
   - The test commit failed because the hash module did not exist. The implementation added deterministic serialization and SHA-256 hashing using Node's built-in crypto module.
2. **Block mining**
   - Test first: [a7f5e92 — Proof-of-Work tests](https://github.com/Kalleanka123456/Banckend_1/commit/a7f5e92b23aabd4f96e3cb7b6bfd601e4359d780)
   - Implementation next: [5894326 — block mining](https://github.com/Kalleanka123456/Banckend_1/commit/589432648707cbb1d275a07c8240da417d26dbab)
   - The test commit failed because the `Block` implementation did not exist. The implementation added nonce-based mining and hash verification.
3. **Transactions and blockchain**
   - Test first: [e982f6d — transaction and chain tests](https://github.com/Kalleanka123456/Banckend_1/commit/e982f6daa72294af351e253b0ff0f9be5385152d)
   - Implementation next: [4c46913 — transaction validation and blockchain](https://github.com/Kalleanka123456/Banckend_1/commit/4c46913852e914cbbdc2df88c6aa2818de60d2cb)
   - The test commit failed because transaction validation and chain management did not exist. The implementation added validated transactions, a mined genesis block, pending-queue handling, and chain-integrity checks.
4. **Express API**
   - Test first: [cd6651e — REST integration tests](https://github.com/Kalleanka123456/Banckend_1/commit/cd6651e1a8dd29e5a2864e59d5cb8841973a0702)
   - Implementation next: [48cd3bd — REST endpoints](https://github.com/Kalleanka123456/Banckend_1/commit/48cd3bd432ff2e185933f542e4e1d5314695df48)
   - The test commit failed because the Express app did not exist. The implementation added `GET /blockchain`, `POST /transactions`, `POST /mine`, and a separate server entry point.

## Limitations

- The chain and pending queue are in memory and are lost when the server stops.
- This educational API is a single-node service, not a peer-to-peer consensus
  network. Proof-of-Work alone does not provide distributed consensus.
- The API does not authenticate participants, digitally sign transfers, or
  independently verify Fair Trade certification.
- Mining runs synchronously in the Node.js process. Higher difficulty blocks
  the event loop for longer and is not suitable for high-throughput use.