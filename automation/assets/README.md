# Test Assets

วางไฟล์ที่เทสใช้ upload ไว้ที่นี่ (หรือชี้ path อื่นด้วย env `CP_ASSETS_DIR`)
เทสที่ต้องไฟล์เหล่านี้จะ **skip** อัตโนมัติถ้าไฟล์ไม่มี (ไม่ false-fail)

| ไฟล์ | ใช้ใน TC | เงื่อนไข |
|---|---|---|
| `profile_siriwimon.jpg` | TS-02_TC-02 | รูปโปรไฟล์ valid (JPG/PNG/JPEG ≤ 3MB) |
| `profile_wannapa1.jpg` | TS-03_TC-02 | รูปโปรไฟล์ใหม่สำหรับ update |
| `contract.pdf` | TA-11_TC-01 | ไฟล์ format ผิด (PDF) → คาดว่า error |
| `photo_hd.jpg` | TA-12_TC-01 | รูปขนาด > 3MB (≈4MB) → คาดว่า error |
