import * as dotenv from 'dotenv';
dotenv.config();

export const keys = {
    app: {
        name: 'Panda Techs API',
    },
    port: process.env.PORT || 8080,
    database: {
        url: process.env.MONGO_URI || 'mongodb://localhost:27017/panda-techs',
    },
    gemini: {
        key: process.env.GEMINI_KEY || 'test',
    },
};

export default keys;