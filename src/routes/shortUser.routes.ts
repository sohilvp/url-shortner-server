import { Router } from "express";
import {
  handleRefreshToken,
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/user.controllers";

const router: Router = Router();

router.route("/login").post(loginUser);
router.route("/register").post(registerUser);
router.route("/logout").get(logoutUser);
router.route("/refresh").get(handleRefreshToken);

export default router;
