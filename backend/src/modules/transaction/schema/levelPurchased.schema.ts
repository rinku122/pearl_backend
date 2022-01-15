import mongoose, { Schema } from 'mongoose';

class LevelPurchasedSchema extends Schema {
    public objSchema: any;

    constructor() {
        super()
        this.schema();
    }
    private schema() {
        this.objSchema = new Schema({
            userAddress: { type: String },
            level: { type: String },
            cycleCount: { type: String },
            selfIspurchased: { type: Boolean },
            block: { type: Number},
            transactionHash: { type: String },
            timestamp: { type: Number },
          }, { timestamps: false, strict: false });

        this.objSchema.index({ referrerAddress: 1, slot: 1 });
    }
}

const LevelPurchased = new LevelPurchasedSchema();
export default mongoose.model('LevelPurchased', LevelPurchased.objSchema);