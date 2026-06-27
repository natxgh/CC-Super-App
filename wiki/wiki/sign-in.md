# Sign-In (SI)

Feature: Authentication หน้า Login ของ CC Super App
Source spec: `SR_Sign_In_Feature_CC_Super_App.pdf` v1.0 (2026-06-07)

## Fields
- **Username** (required) — ไม่มี field แยก, Username = Email
- **Password** (required)
- **Organization** (required) — free-text หรือ dropdown ⚠️ TBC (HA3)
- **Remember Me** checkbox
- **Eye icon** — toggle show/hide password
- **Forgot Password?** — เปิด Modal "Reset Password"

## Business Rules
| Rule | Detail |
|------|--------|
| Auth success | → navigate ไปหน้า "Work Order Summary" |
| Auth fail | → behavior TBC (HA1) |
| Organization | Tenant isolation — org ผิด = auth ไม่ผ่าน |
| Remember Me | ปิด/เปิดแอปครั้งถัดไป → ข้ามหน้า login อัตโนมัติ |
| Validation | ช่องว่าง → แสดง error ใต้ field (`"X is required"`) โดยไม่ยิง API |

## Test Data (Real Example)
- Org: `BMA` · Username: `somchai.jai` · Password: `Bma@2026xz`

## Test Scenarios
| ID | Name | Type |
|----|------|------|
| SI_TS01 | Login สำเร็จด้วย Username/Password | ✅ Success |
| SI_TS02 | Login + Remember me คงสถานะ | ✅ Success |
| SI_TS03 | Password eye toggle | 🔁 UI |
| SI_TS04 | Forgot Password modal | 🔁 UI |
| SI_TA01 | Login ไม่สำเร็จ — รหัสผิด | ❌ Alt |
| SI_TA02 | Login ไม่สำเร็จ — username ไม่มี | ❌ Alt |
| SI_TA03 | Login ไม่สำเร็จ — org ผิด tenant | ❌ Alt |
| SI_TA04 | ว่าง 3 ช่อง → 3 error messages | ❌ Alt |

## Hidden Assumptions (ยังไม่ถาม PO)
- HA1: wording เมื่อ auth ไม่สำเร็จ = **TBC**
- HA2: lockout หลังกรอกผิดหลายครั้ง = **TBC**
- HA3: Organization field เป็น free-text หรือ dropdown
- HA7: Registration footer routing = **TBC**

## Related Pages
- [CC Super App Overview](cc-super-app-overview.md)
