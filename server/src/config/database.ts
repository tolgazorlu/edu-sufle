import mongoose from 'mongoose';
import keys from './keys';

const connectToDB = async () => {
    try {
        await mongoose
            .connect(keys.database.url)
            .then(() => {
                console.log('Database Connected!');
            })
            .catch(error => {
                console.log(error);
            });
    } catch (error) {
        console.log(error);
        return null;
    }
};

module.exports = connectToDB;
