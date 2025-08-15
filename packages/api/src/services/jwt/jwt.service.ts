import type { JwtConfig, JWTPayload, UserRole } from "@starterp/models";
import type { Logger } from "@starterp/tooling";
import { inject, injectable } from "inversify";
import { jwtVerify } from "jose";
import { TYPES } from "../../di/types";
import { getLogger } from "../../utils/getLogger";

@injectable()
export class JWTService {
  private readonly logger: Logger;
  private readonly secret: Uint8Array;

  constructor(@inject(TYPES.JWT_CONFIG) private readonly jwtConfig: JwtConfig) {
    this.logger = getLogger("JWTService");
    this.secret = new TextEncoder().encode(this.jwtConfig.secret);
    this.logger.info("JWTService initialized");
  }

  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const { payload } = await jwtVerify(token, this.secret);

      this.logger.debug("JWT token verified", { userId: payload.sub });

      // Ensure the payload has the expected shape
      if (
        !payload.sub ||
        typeof payload.sub !== "string" ||
        !payload.email ||
        typeof payload.email !== "string"
      ) {
        throw new Error("Invalid JWT payload structure");
      }

      // Handle roles - check for GoTrue custom claims namespace
      let roles: UserRole[] = [];

      // Check if roles are in the custom claims namespace (GoTrue format)
      const customClaims = payload["https://just-talk.io/jwt/claims"] as any;
      if (customClaims && Array.isArray(customClaims.roles)) {
        roles = customClaims.roles as UserRole[];
      }
      // Fallback to direct roles array
      else if (Array.isArray(payload.roles)) {
        roles = payload.roles as UserRole[];
      }
      // Fallback for backward compatibility - single role
      else if (payload.role && typeof payload.role === "string") {
        roles = [payload.role as UserRole];
      }

      return {
        id: payload.sub,
        sub: payload.sub,
        email: payload.email as string,
        firstName: payload.firstName as string | null | undefined,
        lastName: payload.lastName as string | null | undefined,
        roles,
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch (error) {
      this.logger.error("Error verifying JWT token", { error });
      throw new Error("Invalid or expired JWT token");
    }
  }
}
