const { Blockchain } = require('../../src/blockchain/Blockchain');

const validTransaction = {
  sender: 'Farm A',
  recipient: 'Roastery B',
  batchId: 'FT-2026-001',
  weightKg: 250
};

describe('Blockchain', () => {
  it('creates a valid genesis block linked to the beginning of the chain', () => {
    const blockchain = new Blockchain();
    const [genesisBlock] = blockchain.chain;

    expect(genesisBlock.index).toBe(0);
    expect(genesisBlock.previousHash).toBe('0');
    expect(genesisBlock.transactions).toEqual([]);
    expect(genesisBlock.hasValidHash(blockchain.difficulty)).toBe(true);
    expect(blockchain.isChainValid()).toBe(true);
  });

  it('uses difficulty 1 in the test environment', () => {
    expect(new Blockchain().difficulty).toBe(1);
  });

  it('accepts valid transactions into the pending queue', () => {
    const blockchain = new Blockchain();

    expect(blockchain.addTransaction(validTransaction)).toEqual(validTransaction);
    expect(blockchain.pendingTransactions).toEqual([validTransaction]);
  });

  it('does not enqueue invalid transactions', () => {
    const blockchain = new Blockchain();

    expect(() =>
      blockchain.addTransaction({ ...validTransaction, weightKg: 0 })
    ).toThrow();
    expect(blockchain.pendingTransactions).toEqual([]);
  });

  it('mines and links a block, then removes its included transactions', () => {
    const blockchain = new Blockchain();
    blockchain.addTransaction(validTransaction);

    const minedBlock = blockchain.minePendingTransactions();

    expect(minedBlock.index).toBe(1);
    expect(minedBlock.previousHash).toBe(blockchain.chain[0].hash);
    expect(minedBlock.transactions).toEqual([validTransaction]);
    expect(blockchain.pendingTransactions).toEqual([]);
    expect(blockchain.isChainValid()).toBe(true);
  });

  it('links multiple blocks to their immediate predecessors', () => {
    const blockchain = new Blockchain();
    blockchain.addTransaction(validTransaction);
    const firstBlock = blockchain.minePendingTransactions();
    blockchain.addTransaction({ ...validTransaction, batchId: 'FT-2026-002' });
    const secondBlock = blockchain.minePendingTransactions();

    expect(secondBlock.index).toBe(2);
    expect(secondBlock.previousHash).toBe(firstBlock.hash);
    expect(blockchain.isChainValid()).toBe(true);
  });

  it('detects changes to historical blocks', () => {
    const blockchain = new Blockchain();
    blockchain.addTransaction(validTransaction);
    blockchain.minePendingTransactions();
    blockchain.chain[1].transactions[0].weightKg = 1;

    expect(blockchain.isChainValid()).toBe(false);
  });

  it('rejects mining when the pending queue is empty', () => {
    const blockchain = new Blockchain();

    expect(() => blockchain.minePendingTransactions()).toThrow(
      'Cannot mine a block without pending transactions.'
    );
  });

  it('supports an explicitly configured difficulty', () => {
    expect(new Blockchain({ difficulty: 2 }).difficulty).toBe(2);
  });
});
