# ─────────────────────────────────────────────────────────────────
#  CC Super App — QA Makefile
#  รันจาก root: CC Super App/
#  ต้องตั้ง LARK_APP_ID และ LARK_APP_SECRET (env / .env / inline)
#
#  จัดกลุ่มตาม skill:
#    [ /ask-po ]       oauth · dry · ask · poll
#    [ /design-tests ] tc-dry · tc-upload
#    [ generic ]       fdry · fask · ftc-dry · ftc-upload
#                      ← feature ใหม่ไม่ต้องแก้ Makefile
#
#  ── Ask-PO Loop ──────────────────────────────────────────────────
#  1. make oauth
#  2. make fdry  F=<folder> FEATURE="<name>"   (dry-run ดูก่อน)
#  3. make fask  F=<folder> FEATURE="<name>"   (ส่งจริง)
#  4. รอ PO กรอก Answer ใน Lark Base
#  5. make poll                                (ดึงคำตอบ)
#
#  ── Design-Tests Loop ────────────────────────────────────────────
#  1. make ftc-dry    F=<folder>   (dry-run ดูก่อน)
#  2. make ftc-upload F=<folder>   (upload จริง)
# ─────────────────────────────────────────────────────────────────

-include .env
export

NODE  := node

.DEFAULT_GOAL := help

# ─────────────────────────────────────────────────────────────────
.PHONY: help
help:
	@echo ""
	@echo "  CC Super App — QA Scripts"
	@echo "  ─────────────────────────────────────────────────────"
	@echo "  [ Lark OAuth ]  (prereq ครั้งแรกเท่านั้น)"
	@echo "  make oauth"
	@echo ""
	@echo "  [ /ask-po ]  Ask-PO Loop"
	@echo "  make dry  Q=<path/po-questions.json> FEATURE=<name>   dry-run ดูก่อน"
	@echo "  make ask  Q=<path/po-questions.json> FEATURE=<name>   ส่งจริง (--confirm)"
	@echo "  make poll                                              poll คำตอบ PO"
	@echo ""
	@echo "  [ /design-tests ]  Upload Test Cases -> Lark Base"
	@echo "  make tc-dry    TC=<path/*-testcases.xlsx>             dry-run ดูก่อน"
	@echo "  make tc-upload TC=<path/*-testcases.xlsx>             upload จริง (--confirm)"
	@echo ""
	@echo "  [ generic — feature ใหม่ไม่ต้องแก้ Makefile ]"
	@echo "  make fdry      F=<folder> FEATURE=<name>              /ask-po dry-run"
	@echo "  make fask      F=<folder> FEATURE=<name>              /ask-po ส่งจริง"
	@echo "  make ftc-dry   F=<folder>                             /design-tests dry-run"
	@echo "  make ftc-upload F=<folder>                            /design-tests upload จริง"
	@echo "    → หา po-questions.json และ *-testcases.xlsx ในโฟลเดอร์เอง"
	@echo ""
	@echo "  ── Ask-PO Loop ──────────────────────────────────────"
	@echo "  1. make oauth"
	@echo "  2. make fdry  F=<folder> FEATURE=\"<name>\"   (review)"
	@echo "  3. make fask  F=<folder> FEATURE=\"<name>\"   (ส่งจริง)"
	@echo "  4. รอ PO กรอก Answer ใน Lark Base"
	@echo "  5. make poll                                (ดึงคำตอบ)"
	@echo ""
	@echo "  ── Design-Tests Loop ────────────────────────────────"
	@echo "  1. make ftc-dry    F=<folder>   (review)"
	@echo "  2. make ftc-upload F=<folder>   (upload จริง)"
	@echo ""

# ═════════════════════════════════════════════════════════════════
#  Lark OAuth
# ═════════════════════════════════════════════════════════════════
.PHONY: oauth
oauth:
	@echo ">>> Lark OAuth"
	LARK_APP_ID=$(LARK_APP_ID) LARK_APP_SECRET=$(LARK_APP_SECRET) \
	$(NODE) scripts/lark-oauth.mjs

# ═════════════════════════════════════════════════════════════════
#  /ask-po
# ═════════════════════════════════════════════════════════════════
.PHONY: dry
dry:
	@echo ">>> Dry-run: $(Q) [feature: $(FEATURE)]"
	LARK_APP_ID=$(LARK_APP_ID) LARK_APP_SECRET=$(LARK_APP_SECRET) \
	PO_FEATURE="$(FEATURE)" \
	$(NODE) scripts/ask-po.mjs "$(Q)"

.PHONY: ask
ask:
	@echo ">>> Sending to Lark Base: $(Q) [feature: $(FEATURE)]"
	LARK_APP_ID=$(LARK_APP_ID) LARK_APP_SECRET=$(LARK_APP_SECRET) \
	PO_FEATURE="$(FEATURE)" \
	$(NODE) scripts/ask-po.mjs "$(Q)" --confirm

.PHONY: poll
poll:
	@echo ">>> Polling PO answers..."
	LARK_APP_ID=$(LARK_APP_ID) LARK_APP_SECRET=$(LARK_APP_SECRET) \
	$(NODE) scripts/poll-po.mjs

# ═════════════════════════════════════════════════════════════════
#  /design-tests
# ═════════════════════════════════════════════════════════════════
.PHONY: tc-dry
tc-dry:
	@echo ">>> Dry-run upload: $(TC)"
	LARK_APP_ID=$(LARK_APP_ID) LARK_APP_SECRET=$(LARK_APP_SECRET) \
	$(NODE) scripts/upload-tc.mjs "$(TC)"

.PHONY: tc-upload
tc-upload:
	@echo ">>> Uploading: $(TC)"
	LARK_APP_ID=$(LARK_APP_ID) LARK_APP_SECRET=$(LARK_APP_SECRET) \
	$(NODE) scripts/upload-tc.mjs "$(TC)" --confirm

# ═════════════════════════════════════════════════════════════════
#  generic — ชี้โฟลเดอร์ F= (feature ใหม่ไม่ต้องแก้ Makefile)
# ═════════════════════════════════════════════════════════════════
_check_feature:
	@[ "$(origin FEATURE)" = "command line" ] || \
	  { echo 'ใส่ FEATURE="<ชื่อ feature>" ด้วย'; exit 1; }

_check_folder:
	@[ -n "$(F)" ] || { echo "ใส่ F=<โฟลเดอร์ feature>"; exit 1; }

.PHONY: fdry
fdry: _check_folder _check_feature
	@files=$$(find "$(F)" -name "po-questions.json" 2>/dev/null); \
	 count=$$(echo "$$files" | grep -c . 2>/dev/null || echo 0); \
	 [ -n "$$files" ] || { echo "ไม่พบ po-questions.json ใต้ $(F)"; exit 1; }; \
	 [ "$$count" -eq 1 ] || { echo "พบหลายไฟล์ — ระบุ F= ให้แคบลง:"; echo "$$files"; exit 1; }; \
	 echo ">>> Dry-run: $$files [feature: $(FEATURE)]"; \
	 LARK_APP_ID=$(LARK_APP_ID) LARK_APP_SECRET=$(LARK_APP_SECRET) \
	 PO_FEATURE="$(FEATURE)" $(NODE) scripts/ask-po.mjs "$$files"

.PHONY: fask
fask: _check_folder _check_feature
	@files=$$(find "$(F)" -name "po-questions.json" 2>/dev/null); \
	 count=$$(echo "$$files" | grep -c . 2>/dev/null || echo 0); \
	 [ -n "$$files" ] || { echo "ไม่พบ po-questions.json ใต้ $(F)"; exit 1; }; \
	 [ "$$count" -eq 1 ] || { echo "พบหลายไฟล์ — ระบุ F= ให้แคบลง:"; echo "$$files"; exit 1; }; \
	 echo ">>> Sending to Lark Base: $$files [feature: $(FEATURE)]"; \
	 LARK_APP_ID=$(LARK_APP_ID) LARK_APP_SECRET=$(LARK_APP_SECRET) \
	 PO_FEATURE="$(FEATURE)" $(NODE) scripts/ask-po.mjs "$$files" --confirm

.PHONY: ftc-dry
ftc-dry: _check_folder
	@files=$$(find "$(F)" -name "*-testcases.xlsx" 2>/dev/null); \
	 count=$$(echo "$$files" | grep -c . 2>/dev/null || echo 0); \
	 [ -n "$$files" ] || { echo "ไม่พบ *-testcases.xlsx ใต้ $(F)"; exit 1; }; \
	 [ "$$count" -eq 1 ] || { echo "พบหลายไฟล์ — ระบุ F= ให้แคบลง:"; echo "$$files"; exit 1; }; \
	 echo ">>> Dry-run upload: $$files"; \
	 LARK_APP_ID=$(LARK_APP_ID) LARK_APP_SECRET=$(LARK_APP_SECRET) \
	 $(NODE) scripts/upload-tc.mjs "$$files"

.PHONY: ftc-upload
ftc-upload: _check_folder
	@files=$$(find "$(F)" -name "*-testcases.xlsx" 2>/dev/null); \
	 count=$$(echo "$$files" | grep -c . 2>/dev/null || echo 0); \
	 [ -n "$$files" ] || { echo "ไม่พบ *-testcases.xlsx ใต้ $(F)"; exit 1; }; \
	 [ "$$count" -eq 1 ] || { echo "พบหลายไฟล์ — ระบุ F= ให้แคบลง:"; echo "$$files"; exit 1; }; \
	 echo ">>> Uploading: $$files"; \
	 LARK_APP_ID=$(LARK_APP_ID) LARK_APP_SECRET=$(LARK_APP_SECRET) \
	 $(NODE) scripts/upload-tc.mjs "$$files" --confirm
