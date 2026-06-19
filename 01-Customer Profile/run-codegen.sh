#!/bin/bash

# Playwright Code Generator for Customer Profile
# This opens an interactive browser where you can inspect elements
# and Playwright will suggest locator code

echo "🚀 Starting Playwright Code Generator..."
echo ""
echo "Instructions:"
echo "  1. The browser will open to the login page"
echo "  2. Login with your credentials (ketwadee / password)"
echo "  3. Click/hover over elements to inspect them"
echo "  4. Playwright Inspector panel will show the locator code"
echo "  5. Copy the locators you want to save"
echo "  6. Press Ctrl+C to close when done"
echo ""

npx playwright codegen https://skyai-cloud-cc-stg.metthier.ai:65000/cc/contacts-list
