const { Block } = require('./Block');
const { validateTransaction } = require('./Transaction');

const MAX_DIFFICULTY = 6;

class Blockchain {
  constructor({ difficulty } = {}) {
    this.difficulty =
      difficulty ??
      (process.env.NODE_ENV === 'test'
        ? 1
        : Number(process.env.MINING_DIFFICULTY ?? 2));

    if (
      !Number.isInteger(this.difficulty) ||
      this.difficulty < 1 ||
      this.difficulty > MAX_DIFFICULTY
    ) {
      throw new RangeError(
        `Difficulty must be an integer between 1 and ${MAX_DIFFICULTY}.`
      );
    }

    this.pendingTransactions = [];
    this.chain = [this.createGenesisBlock()];
  }

  createGenesisBlock() {
    return new Block({
      index: 0,
      timestamp: 0,
      transactions: [],
      previousHash: '0'
    }).mine(this.difficulty);
  }

  addTransaction(transaction) {
    const validatedTransaction = validateTransaction(transaction);
    this.pendingTransactions.push(validatedTransaction);
    return { ...validatedTransaction };
  }

  minePendingTransactions() {
    if (this.pendingTransactions.length === 0) {
      throw new Error('Cannot mine a block without pending transactions.');
    }

    if (!this.isChainValid()) {
      throw new Error('Cannot mine onto an invalid blockchain.');
    }

    const queuedTransactions = this.pendingTransactions.slice();
    const transactionsToMine = queuedTransactions.map((transaction) => ({
      ...transaction
    }));
    const previousBlock = this.chain[this.chain.length - 1];
    const block = new Block({
      index: this.chain.length,
      timestamp: Date.now(),
      transactions: transactionsToMine,
      previousHash: previousBlock.hash
    }).mine(this.difficulty);

    this.chain.push(block);
    const includedTransactions = new Set(queuedTransactions);
    for (let index = this.pendingTransactions.length - 1; index >= 0; index -= 1) {
      if (includedTransactions.has(this.pendingTransactions[index])) {
        this.pendingTransactions.splice(index, 1);
      }
    }

    return block;
  }

  isChainValid() {
    if (!Array.isArray(this.chain) || this.chain.length === 0) {
      return false;
    }

    const genesisBlock = this.chain[0];
    if (
      !(genesisBlock instanceof Block) ||
      genesisBlock.index !== 0 ||
      genesisBlock.previousHash !== '0' ||
      !Array.isArray(genesisBlock.transactions) ||
      genesisBlock.transactions.length !== 0 ||
      !Block.prototype.hasValidHash.call(genesisBlock, this.difficulty)
    ) {
      return false;
    }

    for (let index = 1; index < this.chain.length; index += 1) {
      const currentBlock = this.chain[index];
      const previousBlock = this.chain[index - 1];

      if (
        !(currentBlock instanceof Block) ||
        currentBlock.index !== index ||
        currentBlock.previousHash !== previousBlock.hash ||
        !Block.prototype.hasValidHash.call(currentBlock, this.difficulty)
      ) {
        return false;
      }
    }

    return true;
  }
}

module.exports = { Blockchain };
