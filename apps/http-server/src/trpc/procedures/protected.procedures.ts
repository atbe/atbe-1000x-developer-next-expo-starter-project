import { publicProcedure } from "../base";
import { isAuthenticated } from "../middleware/auth.middleware";

// Protected procedure that requires authentication with cache metadata support
export const protectedProcedure = publicProcedure.use(isAuthenticated);
