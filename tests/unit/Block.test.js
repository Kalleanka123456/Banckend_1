const { Block } = require('../../src/blockchain/Block');
const { calculateHash } = require('../../src/blockchain/crypto');

const createBlock = () =>
  new Block({
    index: 1,
    timestamp: 1710000000000,
    transactions: [
      {
        sender: 'Farm A',
        recipient: 'Roastery B',
        batchId: 'FT-2026-001',
        weightKg: 250
      }
    ],
    previousHash: 'abc123'
  });

describe('Block', () => {
  it('mines a hash with the required proof-of-work prefix', () => {
    const block = createBlock();
    block.mine(2);

    expect(block.hash).toMatch(/^00/);
  });

  it('increments the nonce when the initial hash does not meet difficulty', () => {
    const block = createBlock();
    expect(calculateHash({ ...block, nonce: 0 })).not.toMatch(/^0/);

    block.mine(1);

    expect(block.nonce).toBeGreaterThan(0);
  });

  it('stores a hash that matches the block contents', () => {
    const block = createBlock();
    block.mine(1);

    expect(block.hash).toBe(calculateHash(block));
    expect(block.hasValidHash(1)).toBe(true);
  });

  it('detects changes to block contents after mining', () => {
    const block = createBlock();
    block.mine(1);
    block.transactions[0].weightKg = 999;

    expect(block.hasValidHash(1)).toBe(false);
  });
});
