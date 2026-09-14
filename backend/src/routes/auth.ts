import bcrypt from "bcryptjs";
import { Router } from "express";
import { authenticate } from "../auth/authenticate.js";
import { signToken } from "../auth/jwt.js";
import { userRepository } from "../repository/user.repository.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await userRepository.findByEmailWithPassword(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: "Account is deactivated" });
      return;
    }

    const { passwordHash: _passwordHash, ...safeUser } = user;
    const token = signToken({ id: user.id, role: user.role });
    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", authenticate, async (req, res, next) => {
  try {
    const actor = req.user;
    if (!actor) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await userRepository.findById(actor.id);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: "Account is deactivated" });
      return;
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
});
