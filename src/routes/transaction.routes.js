const { Router } = require('express');
const { authMiddleware, authSystemUserMiddleware } = require('../middleware/auth.middleware');
const transactionController = require('../controllers/transaction.controller');

const transactionRoutes = Router();

/**
 * GET /api/transaction/
 * Get user transaction history.
 */
transactionRoutes.get('/', authMiddleware, transactionController.getUserTransactions);

/**
 * POST /api/transaction/
 * Create a user-to-user transaction.
 */
transactionRoutes.post('/', authMiddleware, transactionController.createTransaction);

/**
 * GET /api/transaction/system/eligible-accounts
 * List active recipient accounts other than the system user's own.
 */
transactionRoutes.get(
  '/system/eligible-accounts',
  authSystemUserMiddleware,
  transactionController.getEligibleFundingAccounts
);

/**
 * POST /api/transaction/system/initial-funds
 * Create an initial-funds transaction as a system user.
 */
transactionRoutes.post('/system/initial-funds', authSystemUserMiddleware, transactionController.createInitialTransaction);


module.exports = transactionRoutes;