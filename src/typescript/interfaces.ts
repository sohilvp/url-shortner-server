import { Document, Schema } from "mongoose";

export interface IUrl extends Document {
  longUrl: string;
  shortUrl: string;
  qrCodeUrl: string;
  clicks: number;
  owner: Schema.Types.ObjectId | "";
}
export interface IUrlResponse {
  longUrl: string;
  shortUrl: string;
  clicks: number;
}

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  refreshToken: string[];
}

export interface ILoginResponse {
  user: {
    _id: string;
    email: string;
  };
}
