const { createHash } = require('node:crypto');

function calculateHash(block) {
  const serializedBlock = JSON.stringify({
    index: block.index,
    timestamp: block.timestamp,
    transactions: block.transactions.map((transaction) => ({
      sender: transaction.sender,
      recipient: transaction.recipient,
      batchId: transaction.batchId,
      weightKg: transaction.weightKg
    })),
    previousHash: block.previousHash,
    nonce: block.nonce
  });

  return createHash('sha256').update(serializedBlock).digest('hex');
}

module.exports = { calculateHash };
