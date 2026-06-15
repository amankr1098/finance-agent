import { Router, type Response } from "express";
import { requireAuth, type AuthedRequest } from "../auth/middleware.js";
import { getUserPublic } from "../db/users.js";

const router: Router = Router();

router.get("/me", requireAuth, async (req: AuthedRequest, res: Response) => {
  const uid = req.user!.uid;
  const user = await getUserPublic(uid);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

export default router;
