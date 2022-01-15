import mongoose, { Schema } from 'mongoose';

class TransactionSchema extends Schema {
    public mongooseObj: any = {};

    private eventsArr = [
        'Registration',
        'LevelPurchased',
        'NewUserPlaced',
        'UserIncome',
        'MissedIncome',
    ];

    constructor() {
        super();
        this.schema();
    }

    private schema() {
        this.eventsArr.map(async d => {
            const objSchema = new Schema({
                block: { type: Number },
                transactionHash: { type: String },
                islogUpdated: { type: Boolean, default: false, index: true },
                timestamp: { type: Number },
                fingerprint: { type: String },
            }, { timestamps: false, strict: false });
            objSchema.index({ timestamp: -1, block: -1 });
            this.mongooseObj[d] = mongoose.model(d, objSchema);
        });

    }
}

export default new TransactionSchema().mongooseObj;

