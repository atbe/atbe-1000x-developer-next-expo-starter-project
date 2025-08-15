import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { useAuthStore } from "../../stores/auth-store";
import type { AppRouter } from "@starterp/http-server";
import getExpoHostUri from "../../utils/debug/expoHostUri";

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      // url: "https://starter-project-api-production.abeahmed2.workers.dev/trpc",
      url: `http://${getExpoHostUri()}:3042/trpc`,
      headers() {
        const token = useAuthStore.getState().token;
        return {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
      },
    }),
  ],
});
