const request = require('supertest');
const { Blockchain } = require('../../src/blockchain/Blockchain');
const { createApp } = require('../../src/app');

const validTransaction = {
  sender: 'Farm A',
  recipient: 'Roastery B',
  batchId: 'FT-2026-001',
  weightKg: 250
};

describe('blockchain REST API', () => {
  let blockchain;
  let app;

  beforeEach(() => {
    blockchain = new Blockchain();
    app = createApp(blockchain);
  });

  describe('GET /blockchain', () => {
    it('returns the chain, counts, difficulty, and validity', async () => {
      const response = await request(app).get('/blockchain');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        chain: [expect.objectContaining({ index: 0, previousHash: '0' })],
        blockCount: 1,
        difficulty: 1,
        pendingTransactionCount: 0,
        isValid: true
      });
    });
  });

  describe('POST /transactions', () => {
    it('registers a valid transaction with HTTP 201', async () => {
      const response = await request(app)
        .post('/transactions')
        .send(validTransaction);

      expect(response.status).toBe(201);
      expect(response.body.transaction).toEqual(validTransaction);
      expect(blockchain.pendingTransactions).toEqual([validTransaction]);
    });

    it.each([
      ['missing fields', { sender: 'Farm A' }],
      ['invalid weight', { ...validTransaction, weightKg: 0 }],
      ['empty strings', { ...validTransaction, recipient: '   ' }],
      ['internal fields', { ...validTransaction, nonce: 12 }]
    ])('rejects %s without changing the queue', async (_scenario, body) => {
      const response = await request(app).post('/transactions').send(body);

      expect(response.status).toBe(400);
      expect(response.body.error).toEqual(expect.any(String));
      expect(blockchain.pendingTransactions).toEqual([]);
    });

    it('returns HTTP 400 for malformed JSON', async () => {
      const response = await request(app)
        .post('/transactions')
        .set('Content-Type', 'application/json')
        .send('{"sender":');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid JSON request body.');
    });
  });

  describe('POST /mine', () => {
    it('mines a block, returns it, links it, and clears included transactions', async () => {
      await request(app).post('/transactions').send(validTransaction);
      const response = await request(app).post('/mine');

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        index: 1,
        previousHash: blockchain.chain[0].hash,
        transactions: [validTransaction]
      });
      expect(blockchain.pendingTransactions).toEqual([]);
      expect(blockchain.isChainValid()).toBe(true);
    });

    it('returns HTTP 400 when there are no pending transactions', async () => {
      const response = await request(app).post('/mine');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        'Cannot mine a block without pending transactions.'
      );
    });
  });
});
