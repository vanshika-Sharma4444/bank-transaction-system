const mongoose = require("mongoose");
const transactionModel = require("../models/transaction.model");

async function connectToDb() {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/banktransaction";

    try {
        await mongoose.connect(mongoUri);
        await transactionModel.collection.createIndex(
            { idempotencyKey: 1 },
            { unique: true, name: "idempotencyKey_1" }
        );

        const indexes = await transactionModel.collection.indexes();
        const idempotencyIndex = indexes.find(
            (index) => index.key?.idempotencyKey === 1
        );
        if (!idempotencyIndex?.unique) {
            throw new Error("The transaction idempotencyKey index is missing its unique constraint.");
        }

        console.log("server is connected to db and idempotency index is verified");
    } catch (error) {
        console.error(
            "Database startup failed. Verify MongoDB availability and resolve duplicate transaction idempotency keys before starting:",
            error.message
        );
        await mongoose.disconnect();
        throw error;
    }
}

module.exports = connectToDb;