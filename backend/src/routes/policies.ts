import { Router } from "express";
import { authenticate } from "../auth/authenticate.js";
import { companyPolicies } from "../config/policies.js";

export const policiesRouter = Router();

policiesRouter.use(authenticate);

policiesRouter.get("/", (_req, res) => {
  res.json(companyPolicies);
});
