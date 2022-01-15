import mongoose from 'mongoose';

class MongoHelper {
    // public client: redis.RedisClient;
    // public clientInternal: any;
    private host: any = process.env.MONGO_HOSTNAME;
    private port: string = process.env.MONGO_PORT!;
    private db: string = process.env.MONGO_DATABASE!;
    private userName: string = process.env.MONGO_USERNAME!;
    private pwd: string = process.env.MONGO_PASSWORD!;

    constructor() {
        // this.connectMongoDB();
    }

    public async connectMongoDB() {
        this.host = process.env.MONGO_HOSTNAME;
        this.port = process.env.MONGO_PORT!;
        this.userName = process.env.MONGO_USERNAME!;
        this.pwd = process.env.MONGO_PASSWORD!;
        this.db = process.env.MONGO_DATABASE!;

        let connectionString = `mongodb://${this.host}:${this.port}/${this.db}?authSource=admin`;
        if (this.userName !== '') {
            connectionString = `mongodb://${this.userName}:${this.pwd}@${this.host}:${this.port}/${this.db}?authSource=admin`
        }
        mongoose.connect(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false,
        }).then(() => {
            console.log('mongoDB: Connected Successfully.!!');
        }).catch((err) => {
            console.log(err);
            console.log('mongoDb: Failed To Connect.!!');
        });

        mongoose.set('debug', false);
    }
}

export default new MongoHelper();
