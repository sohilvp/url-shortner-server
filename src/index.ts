import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as dotenv from "dotenv";
import { connectDB } from "./config/dbConnect";
import shortUrl from "./routes/shortUrl.routes";
import shortUser from "./routes/shortUser.routes";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));
app.use(
  cors({ origin: [process.env.FRONTEND_URL as string], credentials: true })
);

app.use("/", shortUrl);
app.use("/api", shortUser);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
