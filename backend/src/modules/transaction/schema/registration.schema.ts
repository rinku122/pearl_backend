import mongoose, { Schema } from 'mongoose';

class RegistrationSchema extends Schema {
    public objSchema: any;

    constructor() {
        super()
        this.schema();
    }

    private schema() {
        this.objSchema = new Schema({
            userAddress: { type: String },
            referrer: { type: String },
            userId: { type: String },
            referrerId: { type: String },
            investment: { type: String },
            block: { type: Number },
            transactionHash: { type: String },
            timestamp: { type: String },
            fingerprint: { type: String },
            level: { type: Number },
            status: { type: String },
            address: { type: String }
        }, { timestamps: true, strict: false });

        this.objSchema.index({ timestamp: -1, referrer: 1, user: 1, userid: 1 });
    }
}

const Registration = new RegistrationSchema();
export default mongoose.model('Registration', Registration.objSchema);