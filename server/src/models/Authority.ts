import mongoose, { Document, Schema } from 'mongoose';

export interface IAuthority extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  department: string;
  city: string;
  state: string;
  country: string;
  email: string;
  phone?: string;
  website?: string;
  categories: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AuthoritySchema = new Schema<IAuthority>(
  {
    name:       { type: String, required: true },
    department: { type: String, required: true },
    city:       { type: String, required: true },
    state:      { type: String, required: true },
    country:    { type: String, default: 'India' },
    email:      { type: String, required: true },
    phone:      { type: String },
    website:    { type: String },
    categories: [{ type: String }],
    isActive:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Authority = mongoose.model<IAuthority>('Authority', AuthoritySchema);
