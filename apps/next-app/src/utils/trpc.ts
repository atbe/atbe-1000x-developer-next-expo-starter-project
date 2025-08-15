import type { AppRouter } from '@starterp/http-server';
import { httpLink, loggerLink, TRPCLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';
import { observable } from '@trpc/server/observable';

import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { NextPageContext } from 'next';
import { getTRPCAuthHeaders } from './trpc-auth';
// ℹ️ Type-only import:
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export

function getBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_TRPC_SERVER_URL;

  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_TRPC_SERVER_URL is not set');
  }

  if (typeof window !== 'undefined') {
    // Client-side: return the API URL
    return apiUrl;
  }

  // Server-side: return the API URL
  return apiUrl;
}

/**
 * Extend `NextPageContext` with meta data that can be picked up by `responseMeta()` when server-side rendering
 */
export interface SSRContext extends NextPageContext {
  /**
   * Set HTTP Status code
   * @example
   * const utils = trpc.useUtils();
   * if (utils.ssrContext) {
   *   utils.ssrContext.status = 404;
   * }
   */
  status?: number;
}

/**
 * A set of strongly-typed React hooks from your `AppRouter` type signature with `createReactQueryHooks`.
 * @see https://trpc.io/docs/v11/react#3-create-trpc-hooks
 */
export const trpc = createTRPCNext<AppRouter, SSRContext>({
  config({ ctx }) {
    /**
     * If you want to use SSR, you need to use the server's full URL
     * @see https://trpc.io/docs/v11/ssr
     */
    return {
      /**
       * @see https://trpc.io/docs/v11/client/links
       */
      links: [
        // adds pretty logs to your console in development and logs errors in production
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        // Error link to catch and log 403 errors
        (() => {
          const errorLink: TRPCLink<AppRouter> = () => {
            return ({ next, op }) => {
              return observable((observer) => {
                const unsubscribe = next(op).subscribe({
                  next(value) {
                    observer.next(value);
                  },
                  error(err) {
                    if (
                      err?.data?.httpStatus === 403 ||
                      err?.data?.httpStatus === 401
                    ) {
                      console.error('[tRPC 403/401 Error]', {
                        path: op.path,
                        type: op.type,
                        input: op.input,
                        error: err.message,
                        data: err.data,
                      });

                      const redirectTo = window.location.pathname;
                      const redirectToLogin = `${getBaseUrl()}/login?redirectTo=${redirectTo}`;
                      if (typeof window !== 'undefined') {
                        localStorage.clear();
                        sessionStorage.clear();
                        window.location.href = redirectToLogin;
                      }
                    }
                    observer.error(err);
                  },
                  complete() {
                    observer.complete();
                  },
                });
                return unsubscribe;
              });
            };
          };
          return errorLink;
        })(),
        httpLink({
          url: `${getBaseUrl()}/trpc`,
          /**
           * Set custom request headers on every request from tRPC
           * @see https://trpc.io/docs/v11/ssr
           */
          headers() {
            // Get auth headers
            const authHeaders =
              typeof window !== 'undefined' ? getTRPCAuthHeaders() : {};

            if (!ctx?.req?.headers) {
              return authHeaders;
            }
            // To use SSR properly, you need to forward the client's headers to the server
            // This is so you can pass through things like cookies when we're server-side rendering

            const {
              // If you're using Node 18 before 18.15.0, omit the "connection" header
              connection: _connection,
              ...headers
            } = ctx.req.headers;
            return {
              ...headers,
              ...authHeaders,
            };
          },
          /**
           * @see https://trpc.io/docs/v11/data-transformers
           */
          // transformer,
        }),
      ],
      /**
       * @see https://tanstack.com/query/v5/docs/reference/QueryClient
       */
      // queryClientConfig: { defaultOptions: { queries: { staleTime: 60 } } },
    };
  },
  /**
   * @see https://trpc.io/docs/v11/ssr
   */
  ssr: false,
  /**
   * @see https://trpc.io/docs/v11/data-transformers
   */
});

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;
