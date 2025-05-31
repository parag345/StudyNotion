const mongoose = require("mongoose");

const sectionSchmea = new mongoose.Schema({
    sectionName:{
        type:String,
    },
    subSection:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"SubSection",
        required:true
    }]
})

module.exports = mongoose.model("Section",sectionSchmea);