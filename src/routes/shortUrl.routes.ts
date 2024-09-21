import { Router } from "express";
import {
  getAllUrl,
  getUrl,
  deleteUrl,
  createUrl,
} from "../controllers/shortUrl.controllers";
import verifyJWT from "../middlewears/verifyJWT";
const router: Router = Router();

router.route("/shortUrls/:id").get(verifyJWT, getAllUrl);
router.route("/createUrl").post(createUrl);
router.route("/:id").get(getUrl);
router.route("/shortUrl/:id").delete(deleteUrl);

export default router;
