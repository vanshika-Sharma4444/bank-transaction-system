const mongoose = require('mongoose');

 const ledgerSchema = new mongoose.Schema({
    account:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"ledger must be associated with an account"],
        index:true,
        immutable:true//because once ledger is created it should not be changed
    },
    amount:{
        type:Number,
        required:[true,"amount is required for creating a ledger"],
        immutable:true//because once ledger is created it should not be changed
    },

 transaction:{  
    //who 's transaction id 
    type:mongoose.Schema.Types.ObjectId,
    ref:"transaction",
    required:[true,"ledger must be associated with a transaction"],
    index:true,
    immutable:true//because once ledger is created it should not be changed
 },
 type:{//credit or debit what happen 
    type:String,
    enum:{
        values:["CREDIT","DEBIT"],
        message:"type can be either credit or debit",

    },
    required:[true,"ledger type is required"],
    immutable:true
 }
  })

  function preventLedgerModification(){
    throw new Error("ledger entries are immutable and cannot be modified or deleted")
  }
/*the pre middleware to prevent modification of ledger entries  */
ledgerSchema.pre("findOneAndUpdate",preventLedgerModification);
ledgerSchema.pre("updateOne",preventLedgerModification);
ledgerSchema.pre("deleteOne",preventLedgerModification);
ledgerSchema.pre("findOneAndDelete",preventLedgerModification);
ledgerSchema.pre("remove",preventLedgerModification);
ledgerSchema.pre("updateMany",preventLedgerModification);
ledgerSchema.pre("findOneAndReplace",preventLedgerModification);

const ledgerModel = mongoose.model('ledger',ledgerSchema);

module.exports = ledgerModel;