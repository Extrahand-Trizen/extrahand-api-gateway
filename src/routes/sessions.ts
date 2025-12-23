import { Router } from "express";
import { SessionController } from "../controllers/SessionController.js";

const router = Router();

router.post("/refresh", SessionController.refresh.bind(SessionController));
router.post("/logout", SessionController.logout.bind(SessionController));

export default router;
