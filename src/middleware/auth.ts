import jwt, { JwtPayload, VerifyErrors } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import z from "zod";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET tidak ditemukan");

const roleSchema = z.enum(["ADMIN", "USER"]);
type Role = z.infer<typeof roleSchema>;

const tokenPayloadSchema = z.object({
  id: z.string(),
  role: roleSchema,
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export type TokenPayload = z.infer<typeof tokenPayloadSchema>;

// midleware
export const authMiddleware =
  (roles: Role[] = []) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      let token: string | undefined;

      //   jika dia admin
      if (roles.includes("ADMIN") && req.cookies?.tokenAdmin) {
        token = req.cookies.tokenAdmin;
      }

      //   jika dia user
      if (roles.includes("USER") && req.cookies?.tokenUser) {
        token = req.cookies.tokenUser;
      }

      if (!token)
        return res.status(401).json({ message: "Tidak terautentikasi" });

      jwt.verify(
        token,
        JWT_SECRET,
        { algorithms: ["HS256"] },
        (
          err: VerifyErrors | null,
          decoded: JwtPayload | string | undefined,
        ) => {
          if (err) {
            if (err instanceof jwt.TokenExpiredError) {
              return res
                .status(401)
                .json({ message: "Token sudah Kadaluarsa" });
            }
            return res.status(401).json({ message: "Token Tidak Valid" });
          }

          const parsed = tokenPayloadSchema.safeParse(decoded);

          if (!parsed.success) {
            return res
              .status(403)
              .json({ message: "Payload token Tidak Valid" });
          }

          req.user = parsed.data;
          next();
        },
      );
    } catch (error) {
      console.error(error);
      console.log("error =", error);
      res.status(500).json({ message: "Terjadi Kesalahan pada Server" });
    }
  };
