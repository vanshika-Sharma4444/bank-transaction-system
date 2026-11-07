const mongoose = require("mongoose");


const tokenBlackListSchema = new mongoose.Schema({
    token:{
        type:String,
        required:[true,"token is required to blackList"],
        unique:[true,"token is already blackListed"]
    }
},{
    timestamps:true
//timestamp means date + time ka exact record hota hai — yani koi event exactly kab h

})
tokenBlackListSchema.index({createdAt:1},{
    expireAfterSeconds:60*60*24*3//3 days after token will expire

})
const tokenBlackListModel = mongoose.model("tokenBlackList",tokenBlackListSchema)

module.exports = tokenBlackListModel;
