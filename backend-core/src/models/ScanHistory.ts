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
  // Tüketim onayı: false → sadece tarandı/analiz edildi (kaloriye sayılmaz)
  //               true  → kullanıcı "Tükettim" onayı verdi (kaloriye sayılır)
  consumed: boolean;
  consumedAt?: Date | null;
  // "Tüketmedim" işareti: kullanıcı bu ürünü yemediğini belirtti.
  // dismissedAt değerinden 24 saat sonra MongoDB TTL ile otomatik silinir.
  dismissed: boolean;
  dismissedAt?: Date | null;
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
    consumed: { type: Boolean, default: false, index: true },
    consumedAt: { type: Date, default: null },
    dismissed: { type: Boolean, default: false, index: true },
    dismissedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// TTL index: "Tüketmedim" işaretlenen kayıtlar 24 saat sonra otomatik silinir.
// dismissedAt null olan kayıtlar etkilenmez (MongoDB TTL'de partial filter).
scanHistorySchema.index(
  { dismissedAt: 1 },
  { expireAfterSeconds: 86400, partialFilterExpression: { dismissedAt: { $type: 'date' } } }
);

export const ScanHistory = mongoose.model<IScanHistory>('ScanHistory', scanHistorySchema);
