import { Request, Response } from "express";
import User from "../models/user.model";
import { IUser } from "../typescript/interfaces";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const loginUser = async (
  req: Request<{}, {}, IUser, {}>,
  res: Response
): Promise<void> => {
  const cookies = req.cookies;
  const { email, password } = req.body;

  try {
    const user: IUser | null = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }
    const isPasswordValid: boolean = await bcrypt.compare(
      password,
      user.password
    );
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }
    const accesstoken: string = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "1m" }
    );
    const newRefreshToken: string = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );
    const {
      password: _,
      refreshToken,
      ...userWithoutPassword
    } = user.toObject();
    let newRefreshTokenArray = !cookies?.jwt
      ? user.refreshToken
      : user.refreshToken.filter((rt) => rt !== cookies.jwt);

    if (cookies?.jwt) {
      const refreshToken = cookies.jwt;
      const foundToken = await User.findOne({ refreshToken }).exec();

      if (!foundToken) {
        newRefreshTokenArray = [];
      }

      res.clearCookie("token", {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
    }

    user.refreshToken = [...newRefreshTokenArray, newRefreshToken];
    const result = await user.save();

    res
      .status(200)
      .cookie("token", newRefreshToken, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true,
      })
      .json({ user: userWithoutPassword, accessToken: accesstoken });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Something went wrong" });
    }
  }
};

const registerUser = async (
  req: Request<{}, {}, IUser, {}>,
  res: Response
): Promise<void> => {
  const { email, password } = req.body;
  try {
    const existingUser: IUser | null = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: "User already exists" });
      return;
    }
    const hashedPassword: string = await bcrypt.hash(password, 10);
    const newUser: IUser = new User({ email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Something went wrong" });
    }
  }
};

const logoutUser = async (req: Request, res: Response) => {
  const cookies = req.cookies;
  if (!cookies?.token) return res.sendStatus(204);
  const refreshToken = cookies.token;

  const foundUser = await User.findOne({ refreshToken }).exec();
  if (!foundUser) {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    return res.sendStatus(204);
  }

  foundUser.refreshToken = foundUser.refreshToken.filter(
    (rt) => rt !== refreshToken
  );
  const result = await foundUser.save();

  res.clearCookie("token", { httpOnly: true, sameSite: "none", secure: true });
  res.sendStatus(204);
};

const handleRefreshToken = async (req: Request, res: Response) => {
  const cookies = req.cookies;

  if (!cookies?.token) return res.sendStatus(401);
  const refreshToken = cookies.token;

  res.clearCookie("token", { httpOnly: true, sameSite: "none", secure: true });

  const foundUser = await User.findOne({ refreshToken }).exec();

  if (!foundUser) {
    jwt.verify(
      refreshToken,
      process.env.JWT_SECRET as string,
      async (err: any, decoded: any) => {
        if (err) return res.sendStatus(403);

        const hackedUser = await User.findOne({ _id: decoded._id }).exec();
        if (hackedUser) {
          hackedUser.refreshToken = [];
          await hackedUser.save();
        }
      }
    );
    return res.sendStatus(403);
  }

  const newRefreshTokenArray = foundUser.refreshToken.filter(
    (rt) => rt !== refreshToken
  );

  jwt.verify(
    refreshToken,
    process.env.JWT_SECRET as string,
    async (err: any, decoded: any) => {
      if (err) {
        foundUser.refreshToken = [...newRefreshTokenArray];
        await foundUser.save();
        return res.sendStatus(403);
      }

      if (foundUser._id.toString() !== decoded.userId)
        return res.sendStatus(403);

      const accessToken = jwt.sign(
        { userId: foundUser._id },
        process.env.JWT_SECRET as string,
        { expiresIn: "1m" }
      );

      const newRefreshToken = jwt.sign(
        { userId: foundUser._id },
        process.env.JWT_SECRET as string,
        { expiresIn: "1d" }
      );

      foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
      await foundUser.save();

      res.cookie("token", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.json({ accessToken });
    }
  );
};

export { loginUser, registerUser, logoutUser, handleRefreshToken };
