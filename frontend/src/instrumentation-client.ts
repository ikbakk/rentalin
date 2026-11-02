import * as Sentry from "@sentry/nextjs";
import { scrubErrorEvent } from "./lib/error-privacy.mjs";
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
if (dsn) Sentry.init({
  dsn, dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false, stackFrameVariables: false, frameContextLines: 0, databaseQueryData: false, queues: false, graphQL: { document: false, variables: false }, genAI: { inputs: false, outputs: false } }, tracesSampleRate: 0,
  beforeSend: event => scrubErrorEvent(event),
});
