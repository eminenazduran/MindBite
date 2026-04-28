import mongoose, { Schema, Document } from 'mongoose';

export type Gender = 'female' | 'male' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type NutritionGoal = 'lose' | 'maintain' | 'gain' | 'healthy';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  allergies: string[];
  // Beslenme profili (kayıt sırasında alınır)
  age?: number;
  gender?: Gender;
  height?: number; // cm
  weight?: number; // kg
  activityLevel?: ActivityLevel;
  goal?: NutritionGoal;
  // Türev değerler (sunucuda hesaplanır)
  bmi?: number;
  bmr?: number;
  tdee?: number;
  calorieGoal?: number;
  proteinGoal?: number; // g
  carbGoal?: number;    // g
  fatGoal?: number;     // g
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    allergies: { type: [String], default: [] },
    age: { type: Number, min: 10, max: 100 },
    gender: { type: String, enum: ['female', 'male', 'other'] },
    height: { type: Number, min: 100, max: 250 },
    weight: { type: Number, min: 25, max: 300 },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
      default: 'light'
    },
    goal: {
      type: String,
      enum: ['lose', 'maintain', 'gain', 'healthy'],
      default: 'healthy'
    },
    bmi: { type: Number },
    bmr: { type: Number },
    tdee: { type: Number },
    calorieGoal: { type: Number, default: 2000 },
    proteinGoal: { type: Number },
    carbGoal: { type: Number },
    fatGoal: { type: Number },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', userSchema);
