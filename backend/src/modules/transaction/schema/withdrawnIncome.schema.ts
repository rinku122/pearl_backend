import mongoose, { Schema } from 'mongoose';

class WithdrawIncomeSchema extends Schema {
    public withdrawnIncomeSchema: any;

    constructor() {
        super()
        this.schema();
    }

    private schema() {
        this.withdrawnIncomeSchema = new Schema({
            amount: { type: String },
            reinvestCount: { type: String },
            user: { type: String, required: true },
            userId: { type: String, required: true },
            timestamp: { type: String },
        }, { timestamps: false, strict: false });
    }
}

const WithdrawnIncome = new WithdrawIncomeSchema();
export default mongoose.model('WithdrawnIncome', WithdrawnIncome.withdrawnIncomeSchema);