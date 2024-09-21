import { Request, Response } from "express";
import QRCode from "qrcode";
import Url from "../models/url.model";
import { IUrl, IUrlResponse } from "../typescript/interfaces";
import mongoose from "mongoose";

interface creatUrlBody {
  id: string | undefined;
  longUrl: string;
}

const createUrl = async (
  req: Request<{}, {}, creatUrlBody>,
  res: Response
): Promise<string | void> => {
  const { longUrl, id } = req.body;
  console.log(id);

  try {
    let urlFound: IUrl | null = await Url.findOne({ longUrl });
    if (urlFound) {
      res.status(200).json(urlFound);
    } else {
      const qrCodeUrl = await new Promise<string>((resolve, reject) => {
        QRCode.toDataURL(longUrl, (err, url) => {
          if (err) return reject(err);
          resolve(url);
        });
      });

      let shortUrl: IUrl = await Url.create({
        longUrl,
        qrCodeUrl,
        owner: id && mongoose.isValidObjectId(id) ? id : null,
      });
      res.status(201).json(shortUrl);
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json(error.message);
    } else {
      res.status(500).json({ message: "Something went wrong" });
    }
    console.log(error);
  }
};

const getAllUrl = async (
  req: Request<{ id: string }>,
  res: Response<IUrlResponse[] | string | { message: string }, {}>
): Promise<void> => {
  const { id } = req.params;
  try {
    const urls: IUrl[] = await Url.find({ owner: id });
    res.status(200).json(urls);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json(error.message);
    } else {
      res.status(500).json({ message: "Something went wrong" });
    }
  }
};

const getUrl = async (
  req: Request<{ id: string }, {}, {}, {}, {}>,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const shortUrl: IUrl | null = await Url.findOne({ shortUrl: id });
    if (shortUrl) {
      await Url.findByIdAndUpdate(shortUrl._id, { $inc: { clicks: 1 } });
      res.redirect(shortUrl.longUrl);
    } else {
      res.status(404).json({ message: "Url not found" });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json(error.message);
    } else {
      res.status(500).json({ message: "Something went wrong" });
    }
  }
};

const deleteUrl = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const shortUrl: IUrl | null = await Url.findOne({ _id: id });

    if (shortUrl) {
      await Url.findByIdAndDelete(shortUrl._id);
      res.status(200).json({ message: "Url deleted successfully" });
    } else {
      res.status(404).json({ message: "Url not found" });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json(error.message);
    } else {
      res.status(500).json({ message: "Something went wrong" });
    }
  }
};

export { getAllUrl, createUrl, getUrl, deleteUrl };
