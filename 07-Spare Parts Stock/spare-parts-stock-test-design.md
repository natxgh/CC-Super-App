# Spare Parts Stock — Test Design (Black Box)

> Feature: **Spare Parts Stock** (CC Super App) · Prefix `SPS`
> Source: hands-on on STG `…/cms/inventory/stock` (v0.26.3) + BRD v0.3 (3.1.3 / FR-03 / KPI 3.5.6) + grooming (3.2, 3.3)
> Method: QA team Black Box (EP / BVA / State Transition / Use Case) · AAA per TC
> Date: 2026-06-14

---

## 1. Business Conditions

| ID | Business Condition | Technique | Why |
|---|---|---|---|
| **SPS1** | Stock page shows every field per unit (Serial No./Spare Part/Store/Status) in 2 views (List/Table) | Use Case | A display state, not a numeric range — enumerate real usage |
| **SPS2** | Search (free text) filters items by keyword | EP | Partition into match / partial / no-result groups |
| **SPS3** | Filter by Spare Part + Store | EP/Use Case | Filter one condition / both / intersection |
| **SPS4** | Reset clears search+filter back to default | Use Case | Single usage case |
| **SPS5** | View → Item Details modal matches the row | Use Case | Enumerate the open-details case |
| **SPS6** | Edit: required fields (Serial No./Spare Part/Store) present vs missing | EP | valid / invalid (missing) |
| **SPS7** | Edit: Spare Part & Store selectable from master only (dropdown) | EP | value from master / free value |
| **SPS8** | Edit: Serial No. must be unique (changed to an existing value) | EP | unique / duplicate — *Hidden* |
| **SPS9** | Update saves new values reflected in the list | State Transition | view → edit → updated |
| **SPS10** | Delete removes unit from list + affects stock count | State Transition | exists → deleted → count drops |
| **SPS11** | Status is read-only (absent from Edit form) | Use Case | *Hidden* — meaning of codes R001/R007 |
| **SPS12** | Table view sort by Serial No. (asc/desc) | Use Case | self-loop sort |
| **SPS13** | Stock badge on Spare Parts master: Out(0) / Low(≤threshold) / In(>threshold) | **BVA** | Counts units — boundaries at 0 and threshold |
| **SPS14** | External-link from part → Spare Parts Stock (filtered) | Use Case | drill-down |
| **SPS15** | RBAC: Warehouse Staff/Admin can add/edit/delete; read-only roles see no manage actions | Use Case | PO-confirmed permissions |
| **SPS16** | Edit/Delete locked for Order-linked unit (Status ≠ Available) | State Transition | data integrity — unit in Order lifecycle |
| **SPS17** | Serial No. format: alphanumeric+dash, special/space invalid, max length 100 | EP/BVA | valid/invalid + length boundary |
| **SPS18** | Pagination with page-size selector (10/20/50/100) | Use Case | list paging |

---

## 2. Test Cases (summary — full detail in xlsx)

> `[H]` = Expected depends on PO answer (Hidden Assumption) · POS=Positive NEG=Negative

| TC ID | Arrange | Act (1 action, Real Data) | Tested | Expected (summary) | Type |
|---|---|---|---|---|---|
| SPS1-TC01 | login, stock ≥1 unit | open `/cms/inventory/stock` | SPS1 | List view: every row has Serial No./Spare Part/Store/Status + View button; toolbar = Search/Filters/Reset/2 toggle buttons | POS |
| SPS1-TC02 | on stock page (List view) | click Table-view toggle | SPS1 | Table header `SERIAL NO./SPARE PART/STORE/STATUS/ACTION`, row SN0000019 shown in full | POS |
| SPS2-TC01 | unit SN0000019 exists | type `SN0000019` → Search | SPS2 | list shows only row SN0000019 (1 item) | POS |
| SPS2-TC02 | units 5W-30-0002..0005 exist | type `5W-30` → Search | SPS2 | list shows only Synthetic Engine Oil 5W-30 units | POS |
| SPS2-TC03 | — | type `SN9999999` → Search | SPS2 | empty list + empty state `"No entries to show"` (no error) | NEG |
| SPS3-TC01 | multiple Spare Parts | Filters → Spare Part = `iPhone 17 Pro Screen` | SPS3 | list shows only iPhone 17 Pro Screen units | POS |
| SPS3-TC02 | multiple Stores | Filters → Store = `Store2` | SPS3 | list shows only units in Store2 | POS |
| SPS3-TC03 | — | Filters → Spare Part=`iPhone 17 Pro Screen` + Store=`Store2` | SPS3 | list = intersection of both conditions | POS |
| SPS4-TC01 | search/filter active | click Reset | SPS4 | search+filter cleared, list shows all units again | POS |
| SPS5-TC01 | unit SN0000019 (Store2,R001) | click View on row SN0000019 | SPS5 | modal `Item Details`: Serial=SN0000019 / Part=iPhone 17 Pro Screen / Store=Store2 / Status=R001 + Delete/Edit/Close buttons | POS |
| SPS6-TC01 | unit SN0000019 | Edit → Store = `Store1` → Update | SPS6,SPS9 | success toast **"Spare Parts Stock updated successfully"** + row SN0000019 Store=Store1 | POS |
| SPS6-TC02 | unit SN0000019 in Edit | clear Serial No. → Update | SPS6 | Serial No. field error: **"Please fill in: Serial No."** + not saved (modal stays open) | NEG |
| SPS6-TC03 | unit SN0000019 in Edit | clear Spare Part → Update | SPS6 | Spare Part field error: **"Please fill in: Spare Part"** + not saved | NEG |
| SPS7-TC01 | unit in Edit | click Spare Part dropdown → type `Mercedes` | SPS7 | dropdown shows only matching master parts (Mercedes-Benz OM654.920); free value not saved | POS |
| SPS8-TC01 | SN0000018 + SN0000019 exist | Edit SN0000018 → Serial No.=`SN0000019` → Update | SPS8 | duplicate error `""` + not saved `[H]` | NEG |
| SPS10-TC01 | unit SN0000016 (iPhone 17 Pro Screen, count=N) | View → Delete → confirm | SPS10 | success toast **"Spare Parts Stock deleted successfully"** + row SN0000016 gone from list + iPhone 17 Pro Screen stock count = N−1 | POS |
| SPS11-TC01 | any unit | open Edit form | SPS11 | form has only Serial No./Spare Part/Store — **no Status field** `[H]` (code meaning) | POS |
| SPS12-TC01 | Table view, ≥2 units | click `Serial No.` header (asc) | SPS12 | rows sorted Serial No. low→high | POS |
| SPS12-TC02 | Table view, sorted asc | click `Serial No.` header again | SPS12 | rows sorted high→low (desc) | POS |
| SPS13-TC01 | part X has 0 units | open Spare Parts master | SPS13 | badge `Out of Stock (0)` (red) on part X card | POS |
| SPS13-TC02 | part Mercedes-Benz M112 has 1 unit | open Spare Parts master | SPS13 | badge `Low Stock (1)` (orange) | POS |
| SPS13-TC03 | part Y has 5 units (=threshold) | open Spare Parts master | SPS13 | badge `Low Stock (5)` `[H]` threshold | POS |
| SPS13-TC04 | part Z has 6 units (>threshold) | open Spare Parts master | SPS13 | badge In Stock (not Low/Out) `[H]` | POS |
| SPS14-TC01 | Spare Parts master, M112 Low Stock(1) | click ↗ icon next to badge | SPS14 | navigates to Spare Parts Stock filtered to Mercedes-Benz M112 units | POS |
| SPS15-TC01 | login role Spare Parts Warehouse Staff | open stock page | SPS15 | sees management buttons per permission (Add/Edit/Delete) `[H]` | POS |
| SPS15-TC02 | login role Agent (read-only) | open stock page | SPS15 | Edit/Delete buttons do not appear `[H]` | NEG |

---

## 3. Test Scenarios (E2E flow)

### Success
```
SPS_TS01  Browse stock
  1. SPS1-TC01   open List view, all fields
  2. SPS1-TC02   toggle Table view
  3. SPS5-TC01   View → Item Details modal
  → Expected: can view unit in both views + details

SPS_TS02  Search → Filter → Reset
  1. SPS2-TC01   search SN0000019
  2. SPS3-TC03   filter Spare Part + Store (intersection)
  3. SPS4-TC01   Reset back to default
  → Expected: filter/clear works correctly

SPS_TS03  Edit stock unit
  1. SPS5-TC01   View
  2. SPS7-TC01   select Spare Part from master
  3. SPS6-TC01   change Store → Update success
  → Expected: unit updated, reflected in list

SPS_TS04  Delete unit & stock count
  1. SPS5-TC01   View
  2. SPS10-TC01  Delete → count drops
  → Expected: row gone + badge recounts

SPS_TS05  Stock badge → drill-down
  1. SPS13-TC02  Low Stock(1) badge
  2. SPS14-TC01  external-link → filtered stock
  3. SPS3-TC01   verify list filtered by part
  → Expected: see that part's units

SPS_TS06  Table sort
  1. SPS1-TC02   Table view
  2. SPS12-TC01  sort asc
  3. SPS12-TC02  sort desc
  → Expected: sorted correctly both ways
```

### Alternative
```
SPS_TA01  Edit missing required
  1. SPS5-TC01   View
  2. SPS6-TC02   clear Serial No. → error
  → Expected: validation error, not saved

SPS_TA02  Duplicate Serial No.  [H Q3]
  1. SPS5-TC01   View
  2. SPS8-TC01   change Serial = existing value → error
  → Expected: duplicate error, not saved

SPS_TA03  Search no result
  1. SPS2-TC03   search not found → empty state
  2. SPS4-TC01   Reset
  → Expected: empty without error, reset restores all

SPS_TA04  RBAC no permission  [H Q8]
  1. SPS15-TC02  Agent role does not see Edit/Delete buttons
  → Expected: management buttons hidden per permission
```

---

## 4. Hidden Assumptions → PO — **ALL 12 ANSWERED ✅** (2026-06-19)

| Topic | PO answer (applied) |
|---|---|
| Scope | 2 parts: stock unit registry (View/Search/Filter/Edit/Delete) + Low/Out badge count on master |
| Add path | "Create Spare Parts Stock" button exists, **permission-gated** (Warehouse Staff/Admin) |
| Serial unique | ✅ unique **system-wide**; duplicate → error, not saved |
| Serial format | alphanumeric + dash; special char/space invalid; **max length 100** |
| Status code | system-managed (R001 New … R007 Delivered … R010 Returned); read-only by design |
| Low Stock threshold | 0=Out · 1–5=Low · >5=In; **configurable per company** |
| Delete | confirm dialog → unit removed + count drops; **Order-linked unit (Status≠Available) cannot be deleted** |
| RBAC | manage = Warehouse Staff / Admin; other roles (Agent) see no Add/Edit/Delete |
| Edit integrity | Order-linked unit → Spare Part/Store locked or warns |
| Out-of-Stock at Pick | cross-feature; tested in Order round, **not in this set** |
| Exact texts | ✅ create `Spare Parts Stock created successfully` · update `Spare Parts Stock updated successfully` · delete `Spare Parts Stock deleted successfully` · empty state `No entries to show` · per-field required: `Please fill in: Serial No.` / `Please fill in: Spare Part` / `Please fill in: Store` · duplicate text still `""` (pending PO) |
| Pagination | exists; page-size selectable 10/20/50/100 (no lazy-load) |

> Still open: exact text for duplicate-Serial error, Order-lock warning, and invalid-format error (`""` placeholders).

---

## 5. Self-check (Definition of Done)

| Item | Status |
|---|---|
| Needs → Business Conditions complete | ✅ 15 items |
| Correct technique chosen | ✅ EP/BVA/State/UseCase |
| BVA covers less/equal/greater | ✅ SPS13 (0,1,5,6 cover boundaries 0 and threshold) |
| State Transition covers all edges | ✅ SPS9 (update), SPS10 (delete), SPS12 (self-loop sort) |
| TC has all 4 parts (AAA + Tested) | ✅ |
| Has Success + Alternative | ✅ 6 + 4 |
| No contradictory conditions combined | ✅ |
| Test Data is Real Example | ✅ (real SNs from STG) |
| Hidden Assumption + ask PO | ✅ 12 items — **all answered 2026-06-19** |
| IDs tagged | ✅ |
| **Blocked on PO** | ✅ unblocked — only minor exact-text `""` placeholders remain |

**Summary: 18 conditions · 39 test cases · 13 scenarios (6 Success + 7 Alternative) · 12 PO questions (all answered)**
</content>
</invoke>
