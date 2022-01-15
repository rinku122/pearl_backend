import mongoose, { Schema } from 'mongoose';

class UserIncomeSchema extends Schema {
    public userIncomeSchema: any;

    constructor() {
        super()
        this.schema();
    }
    private schema() {
        this.userIncomeSchema = new Schema({
            userAddress: { type: String },
            referrerAddress: { type: String },
            level: { type: String },
            income: {type: String},
            block: { type: Number},
            transactionHash: { type: String },
            timestamp: { type: Number },
            fingerprint: { type: String }, 
        }, { timestamps: false, strict: false });
    }
}

const UserIncome = new UserIncomeSchema();
export default mongoose.model('UserIncome', UserIncome.userIncomeSchema);
