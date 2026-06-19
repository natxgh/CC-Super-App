# Requirements — Linkage Customer Profile with Case (Explored from STG)

> Feature explored live on STG: `https://skyai-cloud-cc-stg.metthier.ai:65000/cms/case/creation`
> App version: **v0.26.3**
> Explored: 2026-06-14 by QA (Claude) via browser
> Scope (per request): **Linkage Customer Profile with Case**
> 1. Linkage Customer Phone in Case with Customer Profile
> 2. Add New Customer Profile From Add Case Page

---

## 1. Context / Where the feature lives

On the **Case Creation** page (`/cms/case/creation`), the right-hand panel **"Information" tab** holds a
**Customer Information** card. When no customer is linked it shows empty placeholders (`-`) for:
- Avatar + Name
- Date of Birth
- Email
- Phone Number
- Customer Grade

Two action buttons sit below the card:
- **🔍 Linked Existing** — search & link an existing customer profile
- **➕ Add Customer** — create a new customer profile inline

The case form itself (left side) has fields: Types* , Contact Method* , IoT Device, IoT Alert Date,
Case Details* , Service Center* , **Phone Number**, Event Area, Attach File.
> The **Phone Number** field on the case form is the link point between Case and Customer Profile.

---

## 2. Feature A — Linkage Customer Phone in Case with Customer Profile

### 2.1 "Linked Existing" search modal
Clicking **Linked Existing** opens a modal with:
- Search input — placeholder **"Search Name, Mobile Number, Email."**
- **Search** button
- **Type** filter (customer grade/type dropdown)
- Result table columns: **CUSTOMER** (avatar + name), **CONTACT** (email + phone),
  **PRODUCT** (count), **SERVICE** (count), **TYPE** (grade: Gold / Platinum / Bronze / N/A),
  **ACTIVE** (Active badge), and a **Select** button per row.
- Pagination footer: "Showing X–Y of Z entries", "Show [10] entries", Previous / page / Next.

On open, the modal loads the **full customer list** (default, unfiltered).

### 2.2 Selecting a customer (the linkage)
Clicking **Select** on a row:
- Closes the modal.
- Populates the **Customer Information** card on the right (avatar, name, DOB, email, phone, grade).
- **Auto-fills the case form's "Phone Number" field** with the customer's phone (e.g. `085-002-0000`).
- Reveals a **"View Full Profile"** button (deep-link to the full CRM customer profile).
- Reveals an embedded **Customer 360** mini-view with tabs:
  **Profile | History | Note | Appointment | product | Service**
  - **Profile** → Contact Channels list (e.g. Phone Number `085-002-0000` tagged **Primary** + verified ✓,
    Line, Email — each with verified status icon).
  - **History** → Case History of that customer ("No results found" when none).
  - **Note** → customer notes.
  - **Appointment** → **+ Add** button, **Upcoming** count card, **Confirm** count card.
  - **product** → products owned by the customer.
  - **Service** → services owned by the customer.

This is the **Linkage**: a Case is associated with a Customer Profile, the Customer's phone flows into
the Case's Phone Number field, and the agent gets a Customer-360 summary in-context while creating the case.

### 2.3 Observed defects / risks (Feature A)
| # | Severity | Observation |
|---|----------|-------------|
| A-1 | **High** | **Search is broken.** Searching the Linked Existing box returns **"No results found"** for *every* query tried: phone with dashes `085-002-0000`, phone without dashes `0850020000`, name lowercase `ana`, name proper-case `Bulan` — even though those exact records are visible in the default list. Only **Clear Filters** / reopen restores the list. Search by Name / Mobile Number / Email (as the placeholder promises) does not work. |
| A-2 | **Medium** | **Clear Filters does not re-fetch.** After a failed search, clicking **Clear Filters** empties the input but the table stays on "No results found" — the list is only restored by closing & reopening the modal. |
| A-3 | **High (data integrity)** | **List row vs linked profile mismatch.** The top row displayed **"ana Yukinae / ana@gmail.com / Gold"** with phone `085-002-0000`. After **Select**, the linked Customer Information showed a *different* identity: **"Vilailuk Maksuk / vilailuk@gmail.com / Platinum"** — only the **phone matched**. Suggests either duplicate phone numbers across profiles, or the row display name/email is decoupled from the record that actually gets linked. Needs PO/dev confirmation. |
| A-4 | **Low/Medium** | **Perpetual loading.** Reopening the Linked Existing modal a 2nd/3rd time left the page stuck in a loading state (could not interact for >30s). Possibly a hanging fetch on the list endpoint. |

---

## 3. Feature B — Add New Customer Profile From Add Case Page

### 3.1 "Add Customer" modal
Clicking **Add Customer** opens an **Add Customer** modal with a collapsible **Personal Details** section
containing only **4 fields**:
- **Email*** (required)
- **Phone*** (required)
- First Name (optional)
- Last Name (optional)

Footer: **Save** button.

> This is a *minimal quick-create*, far smaller than the full CRM Customer Profile in the BRD
> (which lists Title, Citizen ID, DOB, Gender, Addresses, Preferences, Custom Fields, etc.).

### 3.2 Validation observed
- **Save with all fields empty** → generic red **"Error"** toast (top-right). No inline field-level messages.
- **Save with invalid email** (`notanemail`) + valid phone → same generic **"Error"** toast. Email format
  is rejected, but feedback is only the generic toast, not a specific "invalid email" message.
- Required markers (`*`) are on Email and Phone only.

### 3.3 Observed defects / risks (Feature B)
| # | Severity | Observation |
|---|----------|-------------|
| B-1 | **Medium (UX)** | No **inline / field-level validation**. Empty-required and invalid-email both surface only a generic "Error" toast with no indication of *which* field or *why*. |
| B-2 | Open question | After a successful Save, is the new customer **auto-linked** to the case (panel populated + phone filled), or must the agent then find it via Linked Existing? Not verified (avoided creating junk data on STG). |
| B-3 | Open question | **Duplicate handling** — does Add Customer block/ warn when the phone or email already exists? (Relevant given A-3 duplicate-phone observation.) Not verified. |

---

## 4. Comparison vs BRD + Grooming

### 4.1 vs BRD (`BRD-Contact Center Super Apps_v0.3.pdf`)
- BRD §3.1.1 CMS — Case Metadata lists **"Linked Customers"** and Customer & Contact View lists
  **"Customer Case History View"**, **"CRM Integration"** → matches Feature A (link customer, embedded
  Case History tab, View Full Profile).
- BRD §3.1.2 CRM — Customer Profile defines a **rich Personal Details** set (Username, Display Name, Title,
  First/Middle/Last Name, Email, Photo, Citizen ID, DOB, Blood Type, Gender, Registered/Current Address),
  Preferences, Custom Fields, Customer Products & Services (Products Owned / Services Owned / Case History),
  Customer Appointment.
  - The embedded **Customer 360** mini-view (Profile/History/Note/Appointment/product/Service) aligns with
    "Customer Products & Services" + "Case History" + "Customer Appointment".
  - **Gap:** the **Add Customer quick-create** only captures Email/Phone/First/Last — a deliberate subset.
    Confirm with PO whether quick-create is intended to be this minimal (rest filled later in full profile).

### 4.2 vs Grooming (`grooming-requirements.md`)
- §5.1 Case Creation: *"ช่องทางการติดต่อ (เบอร์โทร → Auto-link Customer Profile)"* and
  *"ผูก Case กับ Customer Profile ผ่านเบอร์โทร … ถ้าหาไม่เจอ → ขึ้นว่าไม่มี ให้เลือก Link หรือ Create Profile ใหม่"*
  → exactly Feature A (link via phone) + Feature B (create new profile). **Linkage = P1 Customer Profile core.**
- §1.1 Customer 360 View (Profile + Products + Services + Case History + Appointment) → matches the embedded
  mini-view tabs.
- Grooming notes search is expected to work by **Name / Mobile / Email** — defect **A-1** contradicts this.

---

## 5. Open Questions for PO (see `po-question.json`)
Captured separately for the Ask-PO flow.
