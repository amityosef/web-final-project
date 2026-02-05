import express from "express";
import userController from "../controllers/userController";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

router.get("/me", authMiddleware, userController.getMyProfile.bind(userController));
router.get("/:userId", userController.getProfile.bind(userController));
router.put("/:userId", authMiddleware, userController.updateProfile.bind(userController));

export default router;
