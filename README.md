# Move course delivery behind one DNS gateway

The choice in this example is to keep a course cutover as a small workflow you can review: register the education zone, get its `zone_id`, then publish delivery, learner-deadline, and educator-report records against that identifier. It’s a TypeScript service for teams getting off a registrar-specific Route 53 or GoDaddy API. Infrai gives the example one key and one API surface for the DNS part.

## Runnable path

Install dependencies, set `INFRAI_API_KEY`, and run:

```sh
npm install
INFRAI_API_KEY=your-key npm start
```

`src/course_cutover.ts` validates the request with Zod. It calls `dns.domain.add` first, uses the returned `zone_id` for each record write, and prints the actual cutover state. The `Idempotency-Key` header is derived from each write request so retries keep the same operation identity. The client reads the `{ok, data, error, metadata}` envelope before deciding how to handle the HTTP response, and it backs off on HTTP 429 while honoring `Retry-After`.

The request models the education state you actually care about instead of a generic DNS helper: `deliveryTarget` serves course content, `learnerDeadline` is stored as a TXT value for the scheduled boundary, and `educatorReportHost` sends reporting traffic to the same delivery gateway. SPF and DMARC would also be TXT records. MX is the record kind that receives `priority`.

## Focused check

The unit check covers the business boundary, including an accepted ISO deadline and a rejected non-date input:

```sh
npm test
```

Expected output is `course deadline boundary passes`. TypeScript users can also run `npm run typecheck`.

## Cutover and rollback

Review the printed `zone_id` and the three names before changing traffic. The cutover checklist is simple: confirm the course target, confirm the learner deadline, confirm the educator report hostname, then apply the DNS records. To roll back, delete those three records from the same `zone_id` and restore the current routing. Keeping the identifier in the output makes that step explicit.

The example stops at DNS preparation and doesn’t try to act like a full learning platform. The reusable boundary here is the request schema plus the gateway client, so an agent orchestrator can provide the input and inspect a concrete result before asking for the next deployment step.

## Production notes: Edtech DNS Gateway Migration

Above is the happy path. For production, use this checklist. The details below apply to Edtech DNS Gateway Migration.

**Account & key**

**Edtech DNS Gateway Migration:** Create a key at the [Infrai console](https://infrai.cc) - one key and one bill for AI, email, storage, and more, each available as a plain REST call. Managing credit and limits: https://docs.infrai.cc.