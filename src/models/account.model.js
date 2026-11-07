const mongoose = require("mongoose");
const ledgerModel = require("./ledger.model");
const transactionModel = require("./transaction.model");

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [true, "Account must be associated with a user"],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: ["ACTIVE", "FROZEN", "CLOSED"],
            message: "status can be either ACTIVE, FROZEN or CLOSED"
        },
        default: "ACTIVE"
    },
    currency: {
        type: String,
        required: [true, "currency is required for creating an account"],
        default: "INR"
    },
    // Incremented in each transfer transaction to serialize spending from this account.
    balanceVersion: {
        type: Number,
        default: 0,
        select: false
    }
}, {
    timestamps: true
});

accountSchema.index({ user: 1, status: 1 }, { unique: true });
// A user cannot have two accounts with the same status.

accountSchema.methods.getBalanceInMinorUnits = async function ({ session } = {}) {
    let aggregation = ledgerModel.aggregate([
        { $match: { account: this._id } },
        {
            $lookup: {
                from: transactionModel.collection.name,
                localField: "transaction",
                foreignField: "_id",
                as: "transaction"
            }
        },
        { $unwind: "$transaction" },
        { $match: { "transaction.status": "success" } },
        {
            $group: {
                _id: null,
                balance: {
                    $sum: {
                        $multiply: [
                            { $cond: [{ $eq: ["$type", "CREDIT"] }, 1, -1] },
                            { $round: [{ $multiply: ["$amount", 100] }, 0] }
                        ]
                    }
                }
            }
        },
        { $project: { _id: 0, balance: 1 } }
    ]);

    if (session) {
        aggregation = aggregation.session(session);
    }

    const [result] = await aggregation;
    return result?.balance || 0;
};

accountSchema.methods.getbalance = async function (options) {
    return (await this.getBalanceInMinorUnits(options)) / 100;
};

const accountModel = mongoose.model("account", accountSchema);

module.exports = accountModel;