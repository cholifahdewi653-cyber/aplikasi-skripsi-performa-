import { Request, Response } from "express";
import { AuthError } from "../error/error";
import { updateProfileSchema } from "../schema/profileSchema";
import { updateMyProfileService } from "../service/profileService";
import { wrap } from "../utils/helper/wrap.helpers";
import { validate } from "../utils/helper/validate.helpers";

// ─── UPDATE profile sendiri ───────────────────────────────────────────────────
export const updateMyProfile = wrap(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthError("Tidak terautentikasi");

  const file = req.file as Express.Multer.File | undefined;
  const parsed = validate(updateProfileSchema, req.body);

  const profile = await updateMyProfileService(
    req.user.id,
    req.user.role,
    file,
    parsed,
  );

  res.status(200).json({
    success: true,
    message: "Profil berhasil diupdate",
    data: profile,
  });
});
