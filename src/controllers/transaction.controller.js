const emailService = require("../services/email.service")
const transactionModel = require("../models/transaction.model")
const accountModel = require("../models/account.model")
const ledgerModel = require("../models/ledger.model")
const mongoose = require("mongoose")

function parseAmountInMinorUnits(amount) {
  const amountText = typeof amount === "number"
    ? String(amount)
    : typeof amount === "string"
      ? amount.trim()
      : "";

  if (!/^\d+(?:\.\d{1,2})?$/.test(amountText)) {
    return null;
  }

  const [wholeUnits, fractionalUnits = ""] = amountText.split(".");
  const numericAmount = Number(amountText);
  const minorUnits = Number(`${wholeUnits}${fractionalUnits.padEnd(2, "0")}`);

  if (
    !Number.isFinite(numericAmount) ||
    numericAmount <= 0 ||
    !Number.isSafeInteger(minorUnits)
  ) {
    return null;
  }

  return minorUnits;
}

class TransferError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function isIdempotencyDuplicate(error) {
  return error?.code === 11000 &&
    (error?.keyPattern?.idempotencyKey || error?.keyValue?.idempotencyKey);
}

async function resolveIdempotentRetry({ idempotencyKey, fromAccountId, toAccountId, amount }) {
  const existing = await transactionModel.findOne({ idempotencyKey });
  if (!existing) {
    return null;
  }

  const isSameRequest =
    String(existing.fromAccount) === String(fromAccountId) &&
    String(existing.toAccount) === String(toAccountId) &&
    existing.amount === amount;

  if (!isSameRequest) {
    throw new TransferError(409, "This idempotency key was already used for a different transaction.");
  }

  if (existing.status === "success") {
    return {
      status: 200,
      body: { message: "transaction already processed", transaction: existing }
    };
  }

  if (existing.status === "pending") {
    return {
      status: 202,
      body: { message: "transaction is pending due to some issue, please try later", transaction: existing }
    };
  }

  throw new TransferError(409, `This transaction has status "${existing.status}" and cannot be retried with the same key.`);
}

async function executeLedgerTransfer({
  fromAccountId,
  toAccountId,
  sourceUserId,
  amountInMinorUnits,
  idempotencyKey
}) {
  const session = await mongoose.startSession();
  let transaction;
  let reused = false;

  try {
    await session.withTransaction(async () => {
      const sourceFilter = {
        _id: fromAccountId,
        status: "ACTIVE"
      };
      if (sourceUserId) {
        sourceFilter.user = sourceUserId;
      }

      const lockResult = await accountModel.updateOne(
        sourceFilter,
        { $inc: { balanceVersion: 1 } },
        { session }
      );

      if (lockResult.matchedCount !== 1) {
        throw new TransferError(400, "source account not found or is not active");
      }

      const existing = await transactionModel.findOne({ idempotencyKey }).session(session);
      if (existing) {
        const sameRequest =
          String(existing.fromAccount) === String(fromAccountId) &&
          String(existing.toAccount) === String(toAccountId) &&
          existing.amount === amountInMinorUnits / 100;
        if (!sameRequest) {
          throw new TransferError(409, "This idempotency key was already used for a different transaction.");
        }
        if (existing.status === "success") {
          transaction = existing;
          reused = true;
          return;
        }
        if (existing.status === "pending") {
          throw new TransferError(202, "This transaction is still pending. Retry with the same idempotency key.");
        }
        throw new TransferError(409, `This transaction has status "${existing.status}" and cannot be retried with the same key.`);
      }

      const sourceAccount = await accountModel.findById(fromAccountId).session(session);
      const availableMinorUnits = await sourceAccount.getBalanceInMinorUnits({ session });

      if (availableMinorUnits < amountInMinorUnits) {
        throw new TransferError(
          400,
          `insufficient balance. Current balance is ${availableMinorUnits / 100}. Requested amount is ${amountInMinorUnits / 100}`
        );
      }

      const recipient = await accountModel.findById(toAccountId).session(session);
      if (!recipient) {
        throw new TransferError(404, "recipient account was not found");
      }
      if (recipient.status !== "ACTIVE") {
        throw new TransferError(400, "recipient account must be active");
      }
      if (String(recipient._id) === String(sourceAccount._id)) {
        throw new TransferError(400, "source and recipient accounts must be different");
      }
      if (sourceUserId && String(recipient.user) === String(sourceUserId)) {
        throw new TransferError(400, "recipient account must belong to a different user");
      }

      [transaction] = await transactionModel.create([{
        fromAccount: sourceAccount._id,
        toAccount: recipient._id,
        amount: amountInMinorUnits / 100,
        idempotencyKey,
        status: "pending"
      }], { session });

      await ledgerModel.create([
        {
          account: sourceAccount._id,
          amount: amountInMinorUnits / 100,
          transaction: transaction._id,
          type: "DEBIT"
        },
        {
          account: recipient._id,
          amount: amountInMinorUnits / 100,
          transaction: transaction._id,
          type: "CREDIT"
        }
      ], { session });

      transaction.status = "success";
      await transaction.save({ session });
    });

    return { transaction, reused };
  } finally {
    await session.endSession();
  }
}

async function getEligibleFundingAccounts(req, res) {
  try {
    const accounts = await accountModel
      .find({
        user: { $ne: req.user._id },
        status: "ACTIVE"
      })
      .select("_id user currency status")
      .populate({ path: "user", select: "name" })
      .sort({ createdAt: 1 });

    const eligibleAccounts = await Promise.all(
      accounts.map(async (account) => ({
        _id: account._id,
        user: account.user
          ? { name: account.user.name }
          : null,
        currency: account.currency,
        status: account.status,
        balance: await account.getbalance()
      }))
    );

    return res.status(200).json({ accounts: eligibleAccounts });
  } catch (error) {
    console.error("GET ELIGIBLE FUNDING ACCOUNTS ERROR:", error);
    return res.status(500).json({
      message: "Failed to load eligible recipient accounts."
    });
  }
}

async function getUserTransactions(req, res) {
  try {
    const userAccounts = await accountModel.find({ user: req.user._id });
    const accountIds = userAccounts.map(a => a._id);

    const transactions = await transactionModel.find({
      $or: [
        { fromAccount: { $in: accountIds } },
        { toAccount: { $in: accountIds } }
      ]
    })
    .populate({
      path: "fromAccount",
      populate: { path: "user", select: "name email" }
    })
    .populate({
      path: "toAccount",
      populate: { path: "user", select: "name email" }
    })
    .sort({ createdAt: -1 });

    return res.status(200).json({
      transactions
    });
  } catch (error) {
    console.error("GET USER TRANSACTIONS ERROR:", error);
    return res.status(500).json({
      message: "failed to fetch transactions"
    });
  }
}

async function createTransaction(req, res) {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;
  try {
    if (!fromAccount || !toAccount || !idempotencyKey) {
      return res.status(400).json({
        message: "fromAccount, toAccount and idempotencyKey are required fields"
      });
    }
    if (
      !mongoose.Types.ObjectId.isValid(fromAccount) ||
      !mongoose.Types.ObjectId.isValid(toAccount) ||
      typeof idempotencyKey !== "string" ||
      !idempotencyKey.trim()
    ) {
      return res.status(400).json({ message: "account IDs and idempotencyKey must be valid" });
    }

    const amountInMinorUnits = parseAmountInMinorUnits(amount);
    if (amountInMinorUnits === null) {
      return res.status(400).json({
        message: "amount must be positive and have no more than two decimal places"
      });
    }

    const source = await accountModel.findOne({ _id: fromAccount, user: req.user._id });
    if (!source) {
      return res.status(400).json({
        message: "source account not found or does not belong to logged-in user"
      });
    }
    const recipient = await accountModel.findById(toAccount).populate("user");
    if (!recipient) {
      return res.status(404).json({ message: "recipient account was not found" });
    }
    if (String(source._id) === String(recipient._id)) {
      return res.status(400).json({ message: "source and recipient accounts must be different" });
    }

    const normalizedKey = idempotencyKey.trim();
    const retry = await resolveIdempotentRetry({
      idempotencyKey: normalizedKey,
      fromAccountId: source._id,
      toAccountId: recipient._id,
      amount: amountInMinorUnits / 100
    });
    if (retry) {
      return res.status(retry.status).json(retry.body);
    }

    const result = await executeLedgerTransfer({
      fromAccountId: source._id,
      toAccountId: recipient._id,
      sourceUserId: req.user._id,
      amountInMinorUnits,
      idempotencyKey: normalizedKey
    });

    const receiver = recipient.user && typeof recipient.user === "object" ? recipient.user : null;
    if (!result.reused && req.user.email && receiver?.email && emailService?.sendTransactionEmail) {
      try {
        await emailService.sendTransactionEmail(
          req.user.email,
          req.user.name,
          amountInMinorUnits / 100,
          receiver.name,
          receiver.email,
          result.transaction._id
        );
      } catch (error) {
        console.error("TRANSACTION EMAIL ERROR:", error.message);
      }
    }

    return res.status(result.reused ? 200 : 201).json({
      message: result.reused ? "transaction already processed" : "transaction completed successfully",
      transaction: result.transaction
    });
  } catch (error) {
    if (isIdempotencyDuplicate(error)) {
      try {
        const retry = await resolveIdempotentRetry({
          idempotencyKey: idempotencyKey.trim(),
          fromAccountId: fromAccount,
          toAccountId: toAccount,
          amount: parseAmountInMinorUnits(amount) / 100
        });
        if (retry) {
          return res.status(retry.status).json(retry.body);
        }
      } catch (retryError) {
        if (retryError instanceof TransferError) {
          return res.status(retryError.status).json({ message: retryError.message });
        }
        console.error("TRANSACTION IDEMPOTENCY ERROR:", retryError.message);
        return res.status(500).json({ message: "Unable to verify the transaction request." });
      }
    }
    if (error instanceof TransferError) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("TRANSACTION ERROR:", error.message);
    return res.status(500).json({
      message: "Transaction could not be completed. Please retry with the same idempotency key."
    });
  }
}

async function createInitialTransaction(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;
  try {
    if (
      typeof toAccount !== "string" ||
      !mongoose.Types.ObjectId.isValid(toAccount) ||
      typeof idempotencyKey !== "string" ||
      !idempotencyKey.trim()
    ) {
      return res.status(400).json({
        message: "toAccount must be a valid account ID and idempotencyKey is required"
      });
    }
    const amountInMinorUnits = parseAmountInMinorUnits(amount);
    if (amountInMinorUnits === null) {
      return res.status(400).json({
        message: "amount must be positive and have no more than two decimal places"
      });
    }

    const source = await accountModel.findOne({ user: req.user._id, status: "ACTIVE" });
    if (!source) {
      return res.status(400).json({ message: "active system funding account not found" });
    }
    const recipient = await accountModel.findById(toAccount);
    if (!recipient) {
      return res.status(404).json({ message: "recipient account was not found" });
    }
    if (String(recipient._id) === String(source._id)) {
      return res.status(400).json({ message: "system account and recipient account must be different" });
    }
    if (String(recipient.user) === String(req.user._id)) {
      return res.status(400).json({ message: "recipient account must belong to a different user" });
    }
    if (recipient.status !== "ACTIVE") {
      return res.status(400).json({ message: "recipient account must be active" });
    }

    const normalizedKey = idempotencyKey.trim();
    const retry = await resolveIdempotentRetry({
      idempotencyKey: normalizedKey,
      fromAccountId: source._id,
      toAccountId: recipient._id,
      amount: amountInMinorUnits / 100
    });
    if (retry) {
      return res.status(retry.status).json(retry.body);
    }

    const result = await executeLedgerTransfer({
      fromAccountId: source._id,
      toAccountId: recipient._id,
      sourceUserId: req.user._id,
      amountInMinorUnits,
      idempotencyKey: normalizedKey
    });
    return res.status(result.reused ? 200 : 201).json({
      message: result.reused ? "transaction already processed" : "initial transaction completed successfully",
      transaction: result.transaction
    });
  } catch (error) {
    if (isIdempotencyDuplicate(error)) {
      try {
        const source = await accountModel.findOne({ user: req.user._id, status: "ACTIVE" });
        const retry = await resolveIdempotentRetry({
          idempotencyKey: idempotencyKey.trim(),
          fromAccountId: source?._id,
          toAccountId: toAccount,
          amount: parseAmountInMinorUnits(amount) / 100
        });
        if (retry) {
          return res.status(retry.status).json(retry.body);
        }
      } catch (retryError) {
        if (retryError instanceof TransferError) {
          return res.status(retryError.status).json({ message: retryError.message });
        }
        console.error("INITIAL TRANSACTION IDEMPOTENCY ERROR:", retryError.message);
        return res.status(500).json({ message: "Unable to verify the funding request." });
      }
    }
    if (error instanceof TransferError) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("INITIAL TRANSACTION ERROR:", error.message);
    return res.status(500).json({
      message: "Funding could not be completed. Please retry with the same idempotency key."
    });
  }
}

module.exports = {
  createTransaction,
  createInitialTransaction,
  getEligibleFundingAccounts,
  getUserTransactions
}
