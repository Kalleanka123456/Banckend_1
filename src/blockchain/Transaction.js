const REQUIRED_FIELDS = ['sender', 'recipient', 'batchId', 'weightKg'];

class TransactionValidationError extends TypeError {
  constructor(message) {
    super(message);
    this.name = 'TransactionValidationError';
  }
}

function validateTransaction(transaction) {
  if (
    transaction === null ||
    typeof transaction !== 'object' ||
    Array.isArray(transaction)
  ) {
    throw new TransactionValidationError('Transaction must be an object.');
  }

  const prototype = Object.getPrototypeOf(transaction);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TransactionValidationError('Transaction must be a plain object.');
  }

  const missingField = REQUIRED_FIELDS.find(
    (field) => !Object.hasOwn(transaction, field)
  );
  if (missingField) {
    throw new TransactionValidationError(
      `Transaction is missing required field: ${missingField}.`
    );
  }

  const unsupportedFields = Object.keys(transaction).filter(
    (field) => !REQUIRED_FIELDS.includes(field)
  );
  if (unsupportedFields.length > 0) {
    throw new TransactionValidationError(
      `Transaction contains unsupported fields: ${unsupportedFields.join(', ')}.`
    );
  }

  for (const field of ['sender', 'recipient', 'batchId']) {
    if (typeof transaction[field] !== 'string' || transaction[field].trim() === '') {
      throw new TransactionValidationError(
        `${field} must be a non-empty string.`
      );
    }
  }

  if (
    typeof transaction.weightKg !== 'number' ||
    !Number.isFinite(transaction.weightKg) ||
    transaction.weightKg <= 0
  ) {
    throw new TransactionValidationError(
      'weightKg must be a finite positive number.'
    );
  }

  return {
    sender: transaction.sender,
    recipient: transaction.recipient,
    batchId: transaction.batchId,
    weightKg: transaction.weightKg
  };
}

module.exports = { TransactionValidationError, validateTransaction };
