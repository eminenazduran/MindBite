import mongoose from 'mongoose';
import { User } from './models/User';
import dotenv from 'dotenv';
dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/akilli_gida_platformu');
        await User.deleteMany({});
        const user = new User({
            _id: new mongoose.Types.ObjectId('609c1faaff99a123b49eabcd'),
            name: 'Selin',
            email: 'selin@example.com',
            allergies: ['Gluten', 'Yer Fıstığı'],
            calorieGoal: 2100
        });
        await user.save();
        console.log('Done');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
seed();
