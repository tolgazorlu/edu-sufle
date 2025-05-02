import express, {Application} from 'express';
import morgan from 'morgan';
require('dotenv').config();

// * EXPRESS APP
const app: Application = express();

// * DATABASE CONNECTION
const connectToDB = require('./config/database');
connectToDB();

// * MIDDLEWARES
const cors = require('cors');
app.use(
    cors({
        origin: ['http://localhost:3000'],
        credentials: true,
    })
);


// * PARSE URL ENCODED AND JSON BODY
app.use(express.urlencoded({extended: true}));
app.use(express.json());

// * MORGAN MIDDLEWARE
app.use(morgan('dev'));

// * ROUTES
// const userRoute = require('./routes/user.routes');
// app.use('/v1/user', userRoute);

// const taskRoute = require('./routes/task.routes');
// app.use('/v1/task', taskRoute);

// const pathRoute = require('./routes/path.routes');
// app.use('/v1/path', pathRoute);

// const mindmapRoute = require('./routes/mindmap.routes');
// app.use('/v1/mindmap', mindmapRoute);

// * PORT
const port: number = 8080;

// * SERVER LISTEN
app.listen(port, () => {
    console.log(`Port is running on ${port}`);
});
