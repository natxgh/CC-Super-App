#!/bin/bash

# This script uses Playwright Inspector to generate locator suggestions
# Usage: ./generate-locators.sh

BASE_URL="https://skyai-cloud-cc-stg.metthier.ai:65000/cc/contacts-list"

echo "🚀 Starting Playwright Inspector & Code Generator..."
echo ""
echo "Base URL: $BASE_URL"
echo ""
echo "Once the browser opens:"
echo "  1. Interact with the page to explore Customer Profile features"
echo "  2. Click on elements to inspect them"
echo "  3. The code generator will show Playwright locators in the browser console"
echo "  4. Copy the locators and save them to customer-profile-locators.md"
echo ""

npx playwright codegen "$BASE_URL" --browser=chromium
