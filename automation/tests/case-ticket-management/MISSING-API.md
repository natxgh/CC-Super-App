# Case and Ticket Management — API coverage & gaps (for Arrange/Teardown)

Endpoint: `https://cc-bff-qa.one-sky.ai/graphql` (same JWT as Customer/Appointment) · introspection open.

## ✅ Available (used by `fixtures/case-seed.ts`)
| Op | Path | Use |
|---|---|---|
| CreateCase | `Mutation.Case.CreateCase(CaseInsertInput!)` | Arrange a case — **see BUG below** |
| UpdateCase | `Mutation.Case.UpdateCase(CaseUpdateInput!)` | advance `statusId` (lifecycle) |
| DeleteCase | `Mutation.Case.DeleteCase(GetIdInput!{id})` | **Teardown** |
| GetListCase | `Query.Case.GetListCase(CaseListInput)` | find case id by `detail` (cleanup) |
| GetListCaseTypeWithSubTypes | `Query.CaseTypes.GetListCaseTypeWithSubTypes` | resolve CaseType → UUIDs (typeId, sTypeId, wfId, caseSla) |
| GetListCaseStatus | `Query.CaseStatus.GetListCaseStatus(ListDataInput)` | resolve status name → statusId code (S000…) |
| GetListDepCommStn | `Query.Department.GetListDepCommStn` | Service Center list (UI uses this on creation form) |

### Verified input field values (probe 2026-06-22)
```
caseTypeId  → typeId  (UUID from GetListCaseTypeWithSubTypes, NOT numeric id)
caseSTypeId → sTypeId (UUID from GetListCaseTypeWithSubTypes)
wfId        → wfId    (UUID from GetListCaseTypeWithSubTypes)
statusId    → statusId code: "S000"=Draft · "S001"=New Case · "S004"=Dispatched
              "S005"=Acknowledged · "S008"=Closed · "S015"=Case Cancelled
              "S016"=In Progress · "S017"=Done
caseVersion → "draft" for Save-As-Draft (UI sends this; for direct status creates, can omit)
source      → "01" (what UI sends for CC agent create)
caseSla     → from GetListCaseTypeWithSubTypes.caseSla (e.g. "97")
```

## 🐛 CRITICAL BUG — CreateCase broken on QA env (found 2026-06-22)

**Symptom**: Case creation fails via both UI and API.

| Scenario | Result |
|---|---|
| Without `versions` field (matches UI) | `status: "-1"` · DB `NOT NULL constraint` on `tix_cases.versions` |
| With `versions: "1"` | `status: "error"` · HTTP 500 (BFF server crash) |
| With `versions: "draft"` | `status: "error"` · HTTP 500 (BFF server crash) |

**Root cause**: The DB column `tix_cases.versions` has `NOT NULL` constraint with no `DEFAULT`. The BFF resolver does not set `versions` on insert, nor does the UI. When `versions` is explicitly provided in the request, the BFF crashes (unhandled exception in Go resolver).

**Impact on automation**: ALL tests that require seeded cases (TS-01 full lifecycle, TS-03 edit, TS-04 close) are blocked until the backend bug is fixed.

**Action for dev team**: 
1. Add `DEFAULT '1'` to `tix_cases.versions` column, OR
2. Fix BFF resolver to set `versions = '1'` on CreateCase insert

**Board/History empty**: Since CreateCase is broken, the Assignment Board and Case History both show 0 cases.

## ⚠️ GAPS (could not confirm a single API)
1. **Close-approval flow** (Request close approval → Approve → Completed). No dedicated mutation found. Likely driven by workflow node (`wfId`/`nodeId`) + `UpdateCase(statusId)`, or a `CaseHistory`/workflow op not yet identified.
2. **Status-transition guardrails** (skip/reverse prevention — LC2/TA-06) are server/workflow logic. Verify via UI once CreateCase bug is fixed.
3. **Attachment upload** for a case (AC5/TA-03) — `attachments: AttachmentInput` exists on CaseInsertInput, but the upload channel (presign? multipart?) wasn't probed.
4. **Real-time notification** (EN1/TS-04_TC-03) — websocket/push, not a REST/GraphQL arrange point.
5. **Service Center options** — `GetListDepCommStn` returns data via API but creation form shows "No Option." (may require case type filter or role-specific filtering).

## Teardown
`CASE_TEARDOWN=1` → `tests/case-ticket-management/teardown/global-teardown.ts` deletes every case id recorded in
`test-results/seeded-cases.json` (seeded **and** UI-created cases captured via `registerCreatedCase`/`purgeCasesByDetail`)
then deletes seeded customers (`seeded-emails.json`). Run: `CASE_TEARDOWN=1 npm test`.
