import mongoose, { Schema } from 'mongoose';

class MissedIncomeSchema extends Schema {
    public missedIncomeSchema: any;

    constructor() {
        super()
        this.schema();
    }
    private schema() {
        this.missedIncomeSchema = new Schema({
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

const MissedIncome = new MissedIncomeSchema();
export default mongoose.model('MissedIncome', MissedIncome.missedIncomeSchema);
