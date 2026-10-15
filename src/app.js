const express = require('express');
const { Blockchain } = require('./blockchain/Blockchain');
const { TransactionValidationError } = require('./blockchain/Transaction');

function createApp(blockchain = new Blockchain()) {
  const app = express();

  app.use(express.json({ limit: '16kb' }));

  app.get('/blockchain', (request, response) => {
    response.json({
      chain: blockchain.chain,
      blockCount: blockchain.chain.length,
      difficulty: blockchain.difficulty,
      pendingTransactionCount: blockchain.pendingTransactions.length,
      isValid: blockchain.isChainValid()
    });
  });

  app.post('/transactions', (request, response, next) => {
    try {
      const transaction = blockchain.addTransaction(request.body);
      return response.status(201).json({
        message: 'Transaction added to pending queue.',
        transaction,
        pendingTransactionCount: blockchain.pendingTransactions.length
      });
    } catch (error) {
      if (error instanceof TransactionValidationError) {
        return response.status(400).json({ error: error.message });
      }
      return next(error);
    }
  });

  app.post('/mine', (request, response, next) => {
    if (blockchain.pendingTransactions.length === 0) {
      return response.status(400).json({
        error: 'Cannot mine a block without pending transactions.'
      });
    }

    if (!blockchain.isChainValid()) {
      return response.status(409).json({
        error: 'Cannot mine onto an invalid blockchain.'
      });
    }

    try {
      const block = blockchain.minePendingTransactions();
      return response.status(201).json(block);
    } catch (error) {
      return next(error);
    }
  });

  app.use((error, request, response, next) => {
    if (response.headersSent) {
      return next(error);
    }

    if (error.type === 'entity.parse.failed') {
      return response.status(400).json({ error: 'Invalid JSON request body.' });
    }

    console.error(`Unhandled API error: ${error.message}`);
    return response.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}

module.exports = { createApp };
