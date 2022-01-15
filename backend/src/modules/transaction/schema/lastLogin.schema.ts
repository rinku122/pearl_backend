import mongoose, { Schema } from 'mongoose';

class LastLoginSchema extends Schema {
    public objSchema: any;

    constructor() {
        super()
        this.schema();
    }

    private schema() {
        this.objSchema = new Schema({
            user: { type: String },
            status: { type: String, status:'active' },
        }, { timestamps: true, strict: false });

        this.objSchema.index({ user: 1});
    }
}

export default mongoose.model('LastLogin', (new LastLoginSchema()).objSchema);