import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { app } from "../app";
import jwt from "jsonwebtoken";

declare global {
    namespace NodeJS {
        interface Global {
            signin(): [string];
        }
    }
}

let mongo: any;

beforeAll(async () => {
    process.env.JWT_KEY = "asdfadawef";

    mongo = await MongoMemoryServer.create();
    const mongoUri = await mongo.getUri();

    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

beforeEach(async () => {
    const collections = await mongoose.connection.db.collections();

    for (let collection of collections) {
        await collection.deleteMany({});
    }
});

afterAll(async () => {
    await mongo.stop();
    await mongoose.connection.close();
});

global.signin = () => {
    // Build a JWT payload. {id, email}
    const payload = {
        id: new mongoose.Types.ObjectId().toHexString(),
        email: "test@test.com",
    };

    // Create a JWT
    const token = jwt.sign(payload, process.env.JWT_KEY!);

    // Build session Object {jwt: MY_JWT}
    const session = { jwt: token };

    // Turn that session into json
    const sessionJSON = JSON.stringify(session);

    // Take JSON and encode it as base64
    const base64 = Buffer.from(sessionJSON).toString("base64");

    // return a string that the cookie with encoded data
    return [`express:sess=${base64}`];
};
