import mongoose, { Schema, Document } from 'mongoose';

export interface IFood extends Document {
  barcode: string;
  productName: string;
  ingredients: string[];
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  eCodes: string[];
  allergens: string[];
  isGeneric: boolean;
  // Sağlık puanı hesaplaması için (doğal öğün girdilerinde dolduruluyor)
  category?: string;
  quality?: number; // 0.0 - 1.0
  analysisResult: {
    isSafe: boolean;
    riskLevel: string;
    aiComment: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const foodSchema: Schema = new Schema(
  {
    barcode: { type: String, required: true, unique: true, index: true },
    productName: { type: String, required: true },
    ingredients: { type: [String], default: [] },
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbohydrates: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    eCodes: { type: [String], default: [] },
    allergens: { type: [String], default: [] },
    isGeneric: { type: Boolean, default: false },
    category: { type: String },
    quality: { type: Number, min: 0, max: 1 },
    analysisResult: {
      isSafe: { type: Boolean, default: true },
      riskLevel: { type: String, default: 'Low' },
      aiComment: { type: String, default: '' }
    }
  },
  {
    timestamps: true,
  }
);

export const Food = mongoose.model<IFood>('Food', foodSchema);
