import { Request, Response } from "express";
import {
  getOwnerDashboardService,
  getAdminDashboardService,
} from "../service/dashboardService";
import { wrap } from "../utils/helper/wrap.helpers";

export const getOwnerDashboard = wrap(async (_req: Request, res: Response) => {
  const data = await getOwnerDashboardService();
  res.status(200).json({ success: true, data });
});

export const getAdminDashboard = wrap(async (_req: Request, res: Response) => {
  const data = await getAdminDashboardService();
  res.status(200).json({ success: true, data });
});
