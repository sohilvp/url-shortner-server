import mongoose, { Document, Schema, Model } from "mongoose";
import { nanoid } from "nanoid";
import { IUrl } from "../typescript/interfaces";

const urlSchema: Schema<IUrl> = new Schema(
  {
    longUrl: {
      type: String,
      required: true,
    },
    shortUrl: {
      type: String,
      required: true,
      default: () => nanoid().substring(0, 10),
    },
    qrCodeUrl: {
      type: String,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);
const Url: Model<IUrl> = mongoose.model<IUrl>("Url", urlSchema);

export default Url;
