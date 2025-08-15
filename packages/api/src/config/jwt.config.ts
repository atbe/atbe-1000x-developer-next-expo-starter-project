export const jwtConfig = {
  secret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
  expiresIn: "7d", // Token expires in 7 days
  issuer: "starterp",
  audience: "starterp-api",
} as const;
