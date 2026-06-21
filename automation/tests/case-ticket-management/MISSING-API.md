# Case and Ticket Management — API coverage & gaps (for Arrange/Teardown)

Endpoint: `https://cc-bff-qa.one-sky.ai/graphql` (same JWT as Customer/Appointment) · introspection open.

## ✅ Available (used by `fixtures/case-seed.ts`)
| Op | Path | Use |
|---|---|---|
| CreateCase | `Mutation.Case.CreateCase(CaseInsertInput!)` | Arrange a case (set `statusId` to seed mid-lifecycle) |
| UpdateCase | `Mutation.Case.UpdateCase(CaseUpdateInput!)` | advance `statusId` (lifecycle) |
| DeleteCase | `Mutation.Case.DeleteCase(GetIdInput!{id})` | **Teardown** |
| GetListCase | `Query.Case.GetListCase(CaseListInput)` | find case id by `detail` (cleanup) |
| GetListCaseType | `Query.CaseTypes.GetListCaseType(ListDataInput)` | resolve CaseType name → `caseTypeId` |
| GetListCaseStatus | `Query.CaseStatus.GetListCaseStatus(ListDataInput)` | resolve status name → `statusId` |
| GetListCaseSubType | `Query.CaseSubTypes.GetListCaseSubType(...)` | resolve sub-type (HS3 filter) |

`CaseInsertInput` keys: caseTypeId, caseSTypeId, statusId, caseDetail, priority, customerId(Int), phoneNo, scheduleFlag/scheduleDate, wfId, nodeId, versions, formData, attachments, …

## ⚠️ GAPS (could not confirm a single API)
1. **Close-approval flow** (Request close approval → Approve → Completed). No dedicated mutation found. Likely driven by
   workflow node (`wfId`/`nodeId`) + `UpdateCase(statusId)`, or a `CaseHistory`/workflow op not yet identified.
   → For Arrange we can `CreateCase` directly at a target `statusId`; the *approval transition itself* still needs UI or a confirmed op.
2. **Status-transition guardrails** (skip/reverse prevention — LC2/TA-06) are server/workflow logic; no read API to assert allowed-next-status was found. Verify via UI.
3. **Attachment upload** for a case (AC5/TA-03) — `attachments: AttachmentInput` exists on CaseInsertInput, but the upload
   channel (presign? multipart?) wasn't probed. UI-only for now.
4. **Real-time notification** (EN1/TS-04_TC-03) — websocket/push, not a REST/GraphQL arrange point.

## Teardown
`CASE_TEARDOWN=1` → `tests/case-ticket-management/teardown/global-teardown.ts` deletes every case id recorded in
`test-results/seeded-cases.json` (seeded **and** UI-created cases captured via `registerCreatedCase`/`purgeCasesByDetail`)
then deletes seeded customers (`seeded-emails.json`). Run: `CASE_TEARDOWN=1 npm test`.
