import * as dotenv from 'dotenv';
dotenv.config();

export default {
    app: {
        name: 'Panda Techs API',
    },
    port: process.env.PORT || 8080,
    database: {
        url: process.env.MONGO_URI,
    },
    gemini: {
        key: process.env.GEMINI_KEY,
    },
};
