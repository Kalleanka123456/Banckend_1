const { createHash } = require('node:crypto');
const { calculateHash } = require('../../src/blockchain/crypto');

const block = {
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
  previousHash: 'abc123',
  nonce: 0
};

describe('calculateHash', () => {
  it('returns a 64-character hexadecimal SHA-256 hash', () => {
    expect(calculateHash(block)).toMatch(/^[a-f0-9]{64}$/);
  });

  it('matches the SHA-256 hash of the canonical block serialization', () => {
    const serializedBlock = JSON.stringify({
      index: block.index,
      timestamp: block.timestamp,
      transactions: block.transactions,
      previousHash: block.previousHash,
      nonce: block.nonce
    });
    const expectedHash = createHash('sha256')
      .update(serializedBlock)
      .digest('hex');

    expect(calculateHash(block)).toBe(expectedHash);
  });

  it('returns the same hash for the same block content', () => {
    expect(calculateHash(block)).toBe(calculateHash(block));
  });

  it('returns a different hash when block content changes', () => {
    expect(calculateHash(block)).not.toBe(
      calculateHash({ ...block, previousHash: 'different' })
    );
  });

  it('includes the nonce in the hash input', () => {
    expect(calculateHash(block)).not.toBe(
      calculateHash({ ...block, nonce: block.nonce + 1 })
    );
  });

  it('uses consistent serialization regardless of property insertion order', () => {
    const reorderedBlock = {
      nonce: block.nonce,
      previousHash: block.previousHash,
      transactions: block.transactions,
      timestamp: block.timestamp,
      index: block.index
    };

    expect(calculateHash(reorderedBlock)).toBe(calculateHash(block));
  });

  it('uses consistent serialization for transaction property order', () => {
    const reorderedTransactionBlock = {
      ...block,
      transactions: [
        {
          weightKg: 250,
          batchId: 'FT-2026-001',
          recipient: 'Roastery B',
          sender: 'Farm A'
        }
      ]
    };

    expect(calculateHash(reorderedTransactionBlock)).toBe(calculateHash(block));
  });
});
