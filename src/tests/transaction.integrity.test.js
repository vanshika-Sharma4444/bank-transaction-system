const { after, before, beforeEach, test } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const accountModel = require("../models/account.model");
const ledgerModel = require("../models/ledger.model");
const transactionModel = require("../models/transaction.model");
const {
  createInitialTransaction,
  createTransaction,
  
  getEligibleFundingAccounts,
  getUserTransactions
} = require("../controllers/transaction.controller");
const { getAccountBalanceController } = require("../controllers/account.controller");

let replicaSet;
let userIds;

function makeResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

async function makeAccount(userId) {
  return accountModel.create({ user: userId, currency: "INR", status: "ACTIVE" });
}

async function seedBalance(account, amount, status = "success") {
  const transaction = await transactionModel.create({
    fromAccount: account._id,
    toAccount: new mongoose.Types.ObjectId(),
    amount,
    idempotencyKey: new mongoose.Types.ObjectId().toString(),
    status
  });
  await ledgerModel.create({
    account: account._id,
    amount,
    transaction: transaction._id,
    type: "CREDIT"
  });
  return transaction;
}

async function invoke(handler, userId, body) {
  const response = makeResponse();
  await handler({ user: { _id: userId }, body }, response);
  return response;
}

async function invokeBalance(userId, accountId) {
  const response = makeResponse();
  await getAccountBalanceController(
    { user: { _id: userId }, params: { accountId } },
    response
  );
  return response;
}

before(async () => {
  replicaSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" }
  });
  await mongoose.connect(replicaSet.getUri("finora_integrity_test"));
  await Promise.all([
    accountModel.createIndexes(),
    transactionModel.createIndexes(),
    ledgerModel.createIndexes()
  ]);
  const indexes = await transactionModel.collection.indexes();
  assert.ok(indexes.some((index) =>
    index.key.idempotencyKey === 1 && index.unique === true
  ));
});

beforeEach(async () => {
  await Promise.all([
    accountModel.deleteMany({}),
    ledgerModel.deleteMany({}),
    transactionModel.deleteMany({})
  ]);
  userIds = Array.from({ length: 8 }, () => new mongoose.Types.ObjectId());
});

after(async () => {
  await mongoose.disconnect();
  if (replicaSet) {
    await replicaSet.stop();
  }
});

test("concurrent transfers cannot spend the same available balance twice", async () => {
  const source = await makeAccount(userIds[0]);
  const recipientOne = await makeAccount(userIds[1]);
  const recipientTwo = await makeAccount(userIds[2]);
  await seedBalance(source, 100);

  const results = await Promise.all([
    invoke(createTransaction, userIds[0], {
      fromAccount: String(source._id),
      toAccount: String(recipientOne._id),
      amount: "80.00",
      idempotencyKey: "concurrent-1"
    }),
    invoke(createTransaction, userIds[0], {
      fromAccount: String(source._id),
      toAccount: String(recipientTwo._id),
      amount: "80.00",
      idempotencyKey: "concurrent-2"
    })
  ]);

  assert.deepEqual(results.map((result) => result.statusCode).sort(), [201, 400]);
  assert.equal(await source.getbalance(), 20);
  assert.equal((await recipientOne.getbalance()) + (await recipientTwo.getbalance()), 80);
  assert.equal(await transactionModel.countDocuments({ status: "success" }), 2);
  assert.equal(await ledgerModel.countDocuments({}), 3);
});

test("insufficient funds leaves no transaction or ledger entries", async () => {
  const source = await makeAccount(userIds[0]);
  const recipient = await makeAccount(userIds[1]);
  await seedBalance(source, 5);

  const result = await invoke(createTransaction, userIds[0], {
    fromAccount: String(source._id),
    toAccount: String(recipient._id),
    amount: "5.01",
    idempotencyKey: "insufficient"
  });

  assert.equal(result.statusCode, 400);
  assert.match(result.body.message, /insufficient balance/i);
  assert.equal(await transactionModel.countDocuments({ idempotencyKey: "insufficient" }), 0);
  assert.equal(await ledgerModel.countDocuments({ account: recipient._id }), 0);
});

test("concurrent identical retries create one transaction and one ledger pair", async () => {
  const source = await makeAccount(userIds[0]);
  const recipient = await makeAccount(userIds[1]);
  await seedBalance(source, 50);
  const body = {
    fromAccount: String(source._id),
    toAccount: String(recipient._id),
    amount: "20.00",
    idempotencyKey: "identical-retry"
  };

  const results = await Promise.all([
    invoke(createTransaction, userIds[0], body),
    invoke(createTransaction, userIds[0], body)
  ]);

  assert.ok(results.every((result) => [200, 201].includes(result.statusCode)));
  assert.equal(await transactionModel.countDocuments({ idempotencyKey: body.idempotencyKey }), 1);
  assert.equal(await ledgerModel.countDocuments({ transaction: results[0].body.transaction._id }), 2);
  assert.equal(await source.getbalance(), 30);
  assert.equal(await recipient.getbalance(), 20);
});

test("reusing a key with different request parameters is rejected", async () => {
  const source = await makeAccount(userIds[0]);
  const recipientOne = await makeAccount(userIds[1]);
  const recipientTwo = await makeAccount(userIds[2]);
  await seedBalance(source, 100);
  const common = {
    fromAccount: String(source._id),
    amount: "10.00",
    idempotencyKey: "changed-payload"
  };

  const first = await invoke(createTransaction, userIds[0], {
    ...common,
    toAccount: String(recipientOne._id)
  });
  const changed = await invoke(createTransaction, userIds[0], {
    ...common,
    toAccount: String(recipientTwo._id)
  });

  assert.equal(first.statusCode, 201);
  assert.equal(changed.statusCode, 409);
  assert.equal(await transactionModel.countDocuments({ idempotencyKey: common.idempotencyKey }), 1);
});

test("failed, pending, and reversed ledger transactions do not affect available balance", async () => {
  const account = await makeAccount(userIds[0]);
  const successful = await seedBalance(account, 30, "success");
  await seedBalance(account, 200, "failed");
  await seedBalance(account, 300, "pending");
  await seedBalance(account, 400, "reversed");

  assert.equal(await account.getBalanceInMinorUnits(), 3000);
  assert.ok(successful);
});

test("initial funding cannot overdraw the system account", async () => {
  const systemAccount = await makeAccount(userIds[0]);
  const recipient = await makeAccount(userIds[1]);

  const result = await invoke(createInitialTransaction, userIds[0], {
    toAccount: String(recipient._id),
    amount: "0.01",
    idempotencyKey: "no-overdraft"
  });

  assert.equal(result.statusCode, 400);
  assert.match(result.body.message, /insufficient balance/i);
  assert.equal(await transactionModel.countDocuments({ idempotencyKey: "no-overdraft" }), 0);
  assert.equal(await ledgerModel.countDocuments({ account: systemAccount._id }), 0);
});

test("eligible funding accounts are active accounts owned by other users", async () => {
  const systemUserAccount = await makeAccount(userIds[0]);
  const eligibleAccount = await makeAccount(userIds[1]);
  const frozenAccount = await accountModel.create({
    user: userIds[2],
    currency: "INR",
    status: "FROZEN"
  });

  const response = makeResponse();
  await getEligibleFundingAccounts(
    { user: { _id: userIds[0] } },
    response
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(
    response.body.accounts.map((account) => String(account._id)),
    [String(eligibleAccount._id)]
  );
  assert.ok(!response.body.accounts.some((account) =>
    String(account._id) === String(systemUserAccount._id) ||
    String(account._id) === String(frozenAccount._id)
  ));
});

test("transaction history returns transfers for both participating account owners", async () => {
  const senderAccount = await makeAccount(userIds[0]);
  const recipientAccount = await makeAccount(userIds[1]);
  const unrelatedAccount = await makeAccount(userIds[2]);
  const transfer = await transactionModel.create({
    fromAccount: senderAccount._id,
    toAccount: recipientAccount._id,
    amount: 25,
    idempotencyKey: "history-transfer",
    status: "success"
  });

  const senderHistory = await invoke(getUserTransactions, userIds[0], {});
  const recipientHistory = await invoke(getUserTransactions, userIds[1], {});
  const unrelatedHistory = await invoke(getUserTransactions, userIds[2], {});

  assert.equal(senderHistory.statusCode, 200);
  assert.equal(recipientHistory.statusCode, 200);
  assert.equal(unrelatedHistory.statusCode, 200);
  assert.equal(String(senderHistory.body.transactions[0]._id), String(transfer._id));
  assert.equal(String(recipientHistory.body.transactions[0]._id), String(transfer._id));
  assert.equal(unrelatedHistory.body.transactions.length, 0);
});

test("initial funding debits the authenticated system account atomically", async () => {
  const systemAccount = await makeAccount(userIds[0]);
  const recipient = await makeAccount(userIds[1]);
  await seedBalance(systemAccount, 12);

  const result = await invoke(createInitialTransaction, userIds[0], {
    toAccount: String(recipient._id),
    amount: "10.25",
    idempotencyKey: "funding-with-balance"
  });

  assert.equal(result.statusCode, 201);
  assert.equal(result.body.transaction.status, "success");
  assert.equal(await systemAccount.getbalance(), 1.75);
  assert.equal(await recipient.getbalance(), 10.25);
  assert.equal(await ledgerModel.countDocuments({
    transaction: result.body.transaction._id
  }), 2);
});

test("separate authorized deposits of 500 and 1000 persist as a 1500 balance", async () => {
  const systemAccount = await makeAccount(userIds[0]);
  const recipient = await makeAccount(userIds[1]);
  await seedBalance(systemAccount, 2000);
  assert.equal(await recipient.getbalance(), 0);

  const firstDeposit = await invoke(createInitialTransaction, userIds[0], {
    toAccount: String(recipient._id),
    amount: "500.00",
    idempotencyKey: "deposit-five-hundred"
  });
  assert.equal(firstDeposit.statusCode, 201);
  assert.equal(firstDeposit.body.transaction.status, "success");
  assert.equal(await recipient.getbalance(), 500);

  const secondDeposit = await invoke(createInitialTransaction, userIds[0], {
    toAccount: String(recipient._id),
    amount: "1000.00",
    idempotencyKey: "deposit-one-thousand"
  });
  assert.equal(secondDeposit.statusCode, 201);
  assert.equal(secondDeposit.body.transaction.status, "success");
  assert.equal(await recipient.getbalance(), 1500);

  const repeatedDeposit = await invoke(createInitialTransaction, userIds[0], {
    toAccount: String(recipient._id),
    amount: "1000.00",
    idempotencyKey: "deposit-one-thousand"
  });
  assert.equal(repeatedDeposit.statusCode, 200);
  assert.equal(await recipient.getbalance(), 1500);

  const balance = await invokeBalance(userIds[1], String(recipient._id));
  assert.equal(balance.statusCode, 200);
  assert.equal(balance.body.balance, 1500);

  const history = await invoke(getUserTransactions, userIds[1], {});
  assert.equal(history.statusCode, 200);
  assert.equal(history.body.transactions.length, 2);
  assert.deepEqual(
    history.body.transactions.map((transaction) => transaction.amount).sort((a, b) => a - b),
    [500, 1000]
  );
  assert.ok(history.body.transactions.every((transaction) =>
    transaction.status === "success" && transaction.createdAt
  ));
});

test("funding, an incoming deposit, withdrawal transfer, and peer transfer persist exact balances", async () => {
  const systemAccount = await makeAccount(userIds[0]);
  const fundedAccount = await makeAccount(userIds[1]);
  const depositSource = await makeAccount(userIds[2]);
  const withdrawalDestination = await makeAccount(userIds[3]);
  const transferRecipient = await makeAccount(userIds[4]);
  await seedBalance(systemAccount, 10000);
  await seedBalance(depositSource, 1000);

  const initialFunding = await invoke(createInitialTransaction, userIds[0], {
    toAccount: String(fundedAccount._id),
    amount: "10000.00",
    idempotencyKey: "initial-10000"
  });
  assert.equal(initialFunding.statusCode, 201);
  assert.equal(await fundedAccount.getbalance(), 10000);

  const deposit = await invoke(createTransaction, userIds[2], {
    fromAccount: String(depositSource._id),
    toAccount: String(fundedAccount._id),
    amount: "1000.00",
    idempotencyKey: "deposit-1000"
  });
  assert.equal(deposit.statusCode, 201);
  assert.equal(await fundedAccount.getbalance(), 11000);

  const withdrawal = await invoke(createTransaction, userIds[1], {
    fromAccount: String(fundedAccount._id),
    toAccount: String(withdrawalDestination._id),
    amount: "500.00",
    idempotencyKey: "withdrawal-500"
  });
  assert.equal(withdrawal.statusCode, 201);
  assert.equal(await fundedAccount.getbalance(), 10500);

  const transfer = await invoke(createTransaction, userIds[1], {
    fromAccount: String(fundedAccount._id),
    toAccount: String(transferRecipient._id),
    amount: "2000.00",
    idempotencyKey: "transfer-2000"
  });
  assert.equal(transfer.statusCode, 201);
  assert.equal(await fundedAccount.getbalance(), 8500);
  assert.equal(await transferRecipient.getbalance(), 2000);
  assert.equal(await withdrawalDestination.getbalance(), 500);
  assert.equal(await transactionModel.countDocuments({
    status: "success",
    idempotencyKey: { $in: ["initial-10000", "deposit-1000", "withdrawal-500", "transfer-2000"] }
  }), 4);
});

test("a failed ledger write rolls back transaction and both ledger writes", async () => {
  const source = await makeAccount(userIds[0]);
  const recipient = await makeAccount(userIds[1]);
  await seedBalance(source, 25);
  const originalCreate = ledgerModel.create;
  ledgerModel.create = async function () {
    throw new Error("injected ledger failure");
  };

  try {
    const result = await invoke(createTransaction, userIds[0], {
      fromAccount: String(source._id),
      toAccount: String(recipient._id),
      amount: "10.00",
      idempotencyKey: "rollback"
    });
    assert.equal(result.statusCode, 500);
  } finally {
    ledgerModel.create = originalCreate;
  }

  assert.equal(await transactionModel.countDocuments({ idempotencyKey: "rollback" }), 0);
  assert.equal(await ledgerModel.countDocuments({ account: recipient._id }), 0);
  assert.equal(await source.getbalance(), 25);
});
