import assert from "node:assert/strict";
import { CourseCutover } from "./course_cutover.ts";

const valid = { domain: "academy.example", courseHost: "courses", deliveryTarget: "delivery.example", learnerDeadline: "2026-12-31T23:59:00.000Z", educatorReportHost: "reports" };
assert.equal(CourseCutover.safeParse(valid).success, true);
assert.equal(CourseCutover.safeParse({ ...valid, learnerDeadline: "tomorrow" }).success, false);
console.log("course deadline boundary passes");
