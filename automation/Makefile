# ============================================================
# CC Super App — Playwright automation Makefile
# รัน automation แบบ "ราย feature" (1 feature = 1 โฟลเดอร์ใต้ tests/)
#
# ใช้งานหลัก:
#   make test FEATURE=customer-profile          # รัน feature เดียว
#   make headed FEATURE=customer-profile        # รันแบบเห็นเบราว์เซอร์
#   make ui FEATURE=customer-profile            # เปิด Playwright UI mode
#   make list FEATURE=customer-profile          # ดูรายการเทสของ feature
#   make teardown FEATURE=customer-profile      # เคลียร์ junk data ของ feature
#   make report                                 # เปิด HTML report ล่าสุด
#   make test-all                               # รันทุก feature
#   make features                               # โชว์ feature ที่มีทั้งหมด
#
# ทางลัด (ไม่ต้องพิมพ์ FEATURE=): มี target ราย feature ให้อัตโนมัติ
#   make customer-profile                       # = make test FEATURE=customer-profile
# ============================================================

SHELL := /bin/bash
PW    := npx playwright test
TESTS_DIR := tests

# auto-discover: ทุกโฟลเดอร์ (เฉพาะ directory) ใต้ tests/ = 1 feature
FEATURES := $(shell find $(TESTS_DIR) -mindepth 1 -maxdepth 1 -type d -exec basename {} \; 2>/dev/null | sort)

# โฟลเดอร์ของ feature ที่เลือก (ใช้ตอนรัน)
FEATURE_DIR := $(TESTS_DIR)/$(FEATURE)

.DEFAULT_GOAL := help

# ---- guard: target ที่ต้องระบุ FEATURE ----
.PHONY: _require-feature
_require-feature:
	@if [ -z "$(FEATURE)" ]; then \
		echo "✗ ต้องระบุ FEATURE=<ชื่อ> เช่น: make test FEATURE=customer-profile"; \
		echo "  feature ที่มี: $(FEATURES)"; exit 1; \
	fi
	@if [ ! -d "$(FEATURE_DIR)" ]; then \
		echo "✗ ไม่พบ feature '$(FEATURE)' (ที่ $(FEATURE_DIR))"; \
		echo "  feature ที่มี: $(FEATURES)"; exit 1; \
	fi

# ---- รันเทสราย feature ----
.PHONY: test
test: _require-feature ## รัน feature เดียว (FEATURE=<ชื่อ>)
	$(PW) $(FEATURE_DIR)

.PHONY: headed
headed: _require-feature ## รัน feature แบบเห็นเบราว์เซอร์
	$(PW) $(FEATURE_DIR) --headed

.PHONY: ui
ui: _require-feature ## เปิด Playwright UI mode เฉพาะ feature
	$(PW) $(FEATURE_DIR) --ui

.PHONY: list
list: _require-feature ## ดูรายการเทสของ feature (ไม่รันจริง)
	$(PW) $(FEATURE_DIR) --list

.PHONY: capture
capture: _require-feature ## รันแล้วเก็บ evidence ต่อให้ครบแม้มีเคส fail
	-$(PW) $(FEATURE_DIR)
	@echo "run finished — ดู playwright-report/ + test-results/"

.PHONY: teardown
teardown: _require-feature ## เคลียร์ junk data ของ feature (เรียก global-teardown ของ feature นั้น)
	CP_TEARDOWN=1 npx ts-node $(FEATURE_DIR)/teardown/global-teardown.ts 2>/dev/null \
		|| CP_TEARDOWN=1 node $(FEATURE_DIR)/teardown/global-teardown.ts

# ---- รวมทุก feature ----
.PHONY: test-all
test-all: ## รันทุก feature ทั้ง repo
	$(PW)

.PHONY: report
report: ## เปิด HTML report ล่าสุด
	npx playwright show-report

# ---- meta ----
.PHONY: features
features: ## โชว์ feature ทั้งหมดที่ค้นเจอใต้ tests/
	@echo "features ที่มี:"; for f in $(FEATURES); do echo "  - $$f"; done

.PHONY: install
install: ## ติดตั้ง deps + เบราว์เซอร์ของ Playwright
	npm ci && npx playwright install chromium

# ---- ทางลัด: สร้าง target ราย feature อัตโนมัติ ----
# ทำให้พิมพ์ `make customer-profile` แทน `make test FEATURE=customer-profile` ได้
.PHONY: $(FEATURES)
$(FEATURES):
	@$(MAKE) --no-print-directory test FEATURE=$@

.PHONY: help
help: ## โชว์คำสั่งทั้งหมด
	@echo "CC Super App automation — คำสั่งที่ใช้ได้:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "feature ที่มี: $(FEATURES)"
