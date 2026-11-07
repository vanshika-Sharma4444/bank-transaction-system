const mongoose = require("mongoose")

const transactionSchema = new mongoose.Schema({
    fromAccount:{//money deduct from which account
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",//reference to account model
        required:[true,"transaction must be associated with a from  account"],
        index:true
    },
    toAccount:{//money transfer to which account
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",//reference to account model
        required:[true,"transaction must be associated with a to account"],
        index:true
    },
    status:{
        type:String,
        enum:{
            values:["pending","success","failed","reversed"],
            message:"status can be either pending,complete,failed or reversed"

        },
        default : "pending"
    },
    amount:{
        type:Number,
        required:[true,"Amount is required for creating a transaction"],
        min:[0,"transaction amount cannot be negative"]
    },
idempotencyKey:{/* this property means same payment ko 2bar
     karne se rokti hai ,prevent from stuck hmesha client side par generate hoti hai*/
    type:String,
    required:[true,"Idempotency key is required for creating a transaction"],
    index:true,
    unique:true
}
},{
    timestamps:true
})
const  transactionModel = mongoose.model("transaction",transactionSchema)

module.exports=transactionModel