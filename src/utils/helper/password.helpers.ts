import bcrypt from "bcrypt";

/**
 * Hash password dengan bcrypt (salt 10 rounds)
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Bandingkan password plain dengan hash
 */
export const comparePassword = async (
  plain: string,
  hashed: string,
): Promise<boolean> => {
  return bcrypt.compare(plain, hashed);
};
