import mongoose, { Schema, Document } from 'mongoose';

export interface IScanHistory extends Document {
  userId: mongoose.Types.ObjectId;
  foodId: mongoose.Types.ObjectId;
  barcode: string;
  analysisResult: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    warnings: string[];
    safeToConsume: boolean;
  };
  servingSize: number;
  createdAt: Date;
  updatedAt: Date;
}

const scanHistorySchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    foodId: { type: Schema.Types.ObjectId, ref: 'Food', required: true },
    barcode: { type: String, required: true },
    analysisResult: {
      riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
      warnings: { type: [String], default: [] },
      safeToConsume: { type: Boolean, required: true },
    },
    servingSize: { type: Number, default: 100 }, // Gram cinsinden tüketilen miktar
  },
  {
    timestamps: true,
  }
);

export const ScanHistory = mongoose.model<IScanHistory>('ScanHistory', scanHistorySchema);
