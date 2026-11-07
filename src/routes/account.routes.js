const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const accountController = require("../controllers/account.controller");
const router = express.Router();

/**
 * -post/api/accounts
 * -create a new account
 * -protected route
 */

router.post(
  "/",
  authMiddleware,
  accountController.createAccountController
);
/**
 * -get/api/account
 * -get all accounts of the logged-in user
 * -protected route
 */
router.get(
  "/",
  authMiddleware,
  accountController.getUserAccountsController
);
/**
 * get/api/account/balance/:accountId
 * 
 */
router.get("/balance/:accountId",authMiddleware,accountController.getAccountBalanceController)



module.exports = router;