import mongoose, { Schema } from 'mongoose';

class NewUserPlacedSchema extends Schema {
    public objSchema: any;

    constructor() {
        super()
        this.schema();
    }

    private schema() {
        this.objSchema = new Schema({
            userAddress: { type: String },
            referrerAddress: { type: String },
            level: { type: String },
            place: { type: String },
            userId:{type: String},
            currentLevelBuyed:{type: String},
            slot:{type: String},
            cycleCount:{type: String},
            parent: { type: String },
            timestamp: { type: String },
        }, { timestamps: false, strict: false });

        this.objSchema.index({ timestamp: 1, referrerAddress: 1, userAddress: 1, parent: 1, level: 1, place: 1 });
    }
}

const NewUserPlaced = new NewUserPlacedSchema();
export default mongoose.model('NewUserPlaced', NewUserPlaced.objSchema);