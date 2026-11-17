import { z } from "zod";
import { InfraiDns } from "./infrai_dns.ts";

export const CourseCutover = z.object({
  domain: z.string().min(3),
  courseHost: z.string().min(1),
  deliveryTarget: z.string().min(1),
  learnerDeadline: z.string().datetime(),
  educatorReportHost: z.string().min(1)
});
export type CourseCutoverInput = z.infer<typeof CourseCutover>;

export async function prepareCourseCutover(input: unknown, dns: InfraiDns) {
  const course = CourseCutover.parse(input);
  // dns.domain.add supplies the zone_id required by the following writes.
  const zone = await dns.addDomain(course.domain);
  await dns.upsertRecord({ zone_id: zone.zone_id, record_type: "CNAME", name: course.courseHost, content: course.deliveryTarget, ttl: 300 });
  await dns.upsertRecord({ zone_id: zone.zone_id, record_type: "TXT", name: `_deadline.${course.courseHost}`, content: course.learnerDeadline, ttl: 300 });
  await dns.upsertRecord({ zone_id: zone.zone_id, record_type: "CNAME", name: course.educatorReportHost, content: course.deliveryTarget, ttl: 300 });
  return { zone_id: zone.zone_id, courseHost: course.courseHost, learnerDeadline: course.learnerDeadline, educatorReportHost: course.educatorReportHost, rollback: `remove the three records from zone ${zone.zone_id} before DNS cutover` };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY before running the cutover example");
  const result = await prepareCourseCutover({ domain: "academy.example", courseHost: "courses", deliveryTarget: "delivery.example", learnerDeadline: "2026-12-31T23:59:00.000Z", educatorReportHost: "reports" }, new InfraiDns(key));
  console.log(JSON.stringify(result, null, 2));
}
