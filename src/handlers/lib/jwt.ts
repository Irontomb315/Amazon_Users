import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface TokenPayload{
    userId: string;
    email: string;
    role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
export const generateRefreshToken = (payload: TokenPayload): string => jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
export const verifyAccessToken = (token: string): TokenPayload => jwt.verify(token, JWT_SECRET) as TokenPayload;
export const verifyRefreshToken = (token: string): TokenPayload => jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;