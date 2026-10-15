const { validateTransaction } = require('../../src/blockchain/Transaction');

const validTransaction = {
  sender: 'Farm A',
  recipient: 'Roastery B',
  batchId: 'FT-2026-001',
  weightKg: 250
};

describe('validateTransaction', () => {
  it('accepts a valid transaction and returns only its supported fields', () => {
    expect(validateTransaction(validTransaction)).toEqual(validTransaction);
  });

  it.each(['sender', 'recipient', 'batchId', 'weightKg'])(
    'rejects a transaction missing %s',
    (field) => {
      const transaction = { ...validTransaction };
      delete transaction[field];

      expect(() => validateTransaction(transaction)).toThrow();
    }
  );

  it.each(['sender', 'recipient', 'batchId'])(
    'rejects blank %s values',
    (field) => {
      for (const value of ['', '   ', '\t\n', null, 42, {}]) {
        expect(() =>
          validateTransaction({ ...validTransaction, [field]: value })
        ).toThrow();
      }
    }
  );

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, '250'])(
    'rejects an invalid weight: %j',
    (weightKg) => {
      expect(() =>
        validateTransaction({ ...validTransaction, weightKg })
      ).toThrow();
    }
  );

  it('rejects unsupported fields that could overwrite block internals', () => {
    expect(() =>
      validateTransaction({
        ...validTransaction,
        hash: 'forged',
        nonce: 999,
        previousHash: 'forged'
      })
    ).toThrow();
  });

  it('does not accept null or array input', () => {
    expect(() => validateTransaction(null)).toThrow();
    expect(() => validateTransaction([])).toThrow();
  });
});
