const { calculateHash } = require('./crypto');

class Block {
  constructor({ index, timestamp = Date.now(), transactions = [], previousHash, nonce = 0 }) {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = nonce;
    this.hash = '';
  }

  mine(difficulty) {
    if (!Number.isInteger(difficulty) || difficulty < 0) {
      throw new RangeError('Difficulty must be a non-negative integer.');
    }

    const requiredPrefix = '0'.repeat(difficulty);
    this.hash = calculateHash(this);

    while (!this.hash.startsWith(requiredPrefix)) {
      this.nonce += 1;
      this.hash = calculateHash(this);
    }

    return this;
  }

  hasValidHash(difficulty) {
    if (!Number.isInteger(difficulty) || difficulty < 0) {
      return false;
    }

    return (
      this.hash === calculateHash(this) &&
      this.hash.startsWith('0'.repeat(difficulty))
    );
  }
}

module.exports = { Block };
