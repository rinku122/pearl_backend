import mongoose, { Schema } from "mongoose";

const RegistartionSchema: Schema = new Schema({
    userId: { type: mongoose.Types.ObjectId, required: true },
    address: { type: String, required: true },
    level: { type: Number, required: true },
    status: { type: Boolean, required: true },
    updatedOn: { type: Date }
});


export default mongoose.model('Register', RegistartionSchema, 'Register');