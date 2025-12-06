#!/bin/bash
# Manual test script for Electron IPC implementation
# This guides you through testing the functionality

set -e

echo "==================================="
echo "Electron IPC Test - Manual Validation"
echo "==================================="
echo ""

# Setup test directory
TEST_DIR="/tmp/reqtest-$(date +%s)"
echo "📁 Creating test directory: $TEST_DIR"
mkdir -p "$TEST_DIR"
echo "✓ Test directory created"
echo ""

echo "🧪 Test Steps:"
echo "=============="
echo ""
echo "1. The Electron app should be running on your screen"
echo "   If not, run: npm run dev:electron (in one terminal)"
echo "   Then: npm run electron:launch (in another terminal)"
echo ""
echo "2. In the Electron app:"
echo "   - Click 'Select Directory'"
echo "   - Navigate to and select: $TEST_DIR"
echo "   - Click 'Select Folder'"
echo ""
echo "3. When prompted about git initialization:"
echo "   - Click 'OK' to initialize the repository"
echo ""
echo "4. Create a test requirement:"
echo "   - Click 'New Requirement' button"
echo "   - Set ID: REQ-001"
echo "   - Set Title: Test Requirement"
echo "   - Set Status: draft"
echo "   - Set Priority: high"
echo "   - Click 'Save'"
echo ""
echo "5. Open Pending Changes panel (bottom left)"
echo "   - You should see: requirements/REQ-001.md as 'new'"
echo "   - Enter commit message: 'Add test requirement'"
echo "   - Click 'Commit'"
echo ""
echo "Press ENTER when you've completed the above steps..."
read

echo ""
echo "🔍 Verifying results..."
echo "======================="
echo ""

# Check if directory exists
if [ ! -d "$TEST_DIR" ]; then
    echo "❌ FAIL: Test directory was not selected"
    exit 1
fi
echo "✓ Test directory exists"

# Check if .git exists
if [ ! -d "$TEST_DIR/.git" ]; then
    echo "❌ FAIL: Git repository was not initialized"
    echo "  Expected: $TEST_DIR/.git"
    exit 1
fi
echo "✓ Git repository initialized"

# Check if requirements directory exists
if [ ! -d "$TEST_DIR/requirements" ]; then
    echo "❌ FAIL: Requirements directory was not created"
    exit 1
fi
echo "✓ Requirements directory exists"

# Check if REQ-001.md exists
if [ ! -f "$TEST_DIR/requirements/REQ-001.md" ]; then
    echo "❌ FAIL: Requirement file was not created on disk"
    echo "  Expected: $TEST_DIR/requirements/REQ-001.md"
    echo "  Files in requirements/:"
    ls -la "$TEST_DIR/requirements/" 2>/dev/null || echo "  (directory empty or not readable)"
    exit 1
fi
echo "✓ Requirement file exists on real disk"

# Check file content
if ! grep -q "REQ-001" "$TEST_DIR/requirements/REQ-001.md"; then
    echo "❌ FAIL: Requirement file has incorrect content"
    cat "$TEST_DIR/requirements/REQ-001.md"
    exit 1
fi
echo "✓ Requirement file has correct content"

# Check git status
cd "$TEST_DIR"
GIT_STATUS=$(git status --porcelain 2>&1)

if echo "$GIT_STATUS" | grep -q "requirements/REQ-001.md"; then
    echo "⚠️  WARNING: File is still showing as uncommitted"
    echo "  Git status output:"
    git status --porcelain
    echo ""
    echo "  This might mean the commit didn't work properly."
    echo "  The file exists on disk but wasn't committed to git."
    exit 1
fi
echo "✓ Git status is clean (file was committed)"

# Check git log
GIT_LOG=$(git log --oneline 2>&1)
if ! echo "$GIT_LOG" | grep -q "Add test requirement"; then
    echo "❌ FAIL: Commit not found in git log"
    echo "  Git log output:"
    git log --oneline
    exit 1
fi
echo "✓ Commit found in git log"

# Show the commit
echo ""
echo "📝 Commit details:"
git log -1 --stat

echo ""
echo "✅ ALL CHECKS PASSED!"
echo ""
echo "Summary:"
echo "  ✓ Directory selection worked (native dialog → real disk)"
echo "  ✓ Git initialization worked (via IPC)"
echo "  ✓ File creation worked (written to real disk via fs IPC)"
echo "  ✓ Git commit worked (via git IPC)"
echo "  ✓ Pending changes cleared after commit"
echo ""
echo "🎉 The Electron fs IPC implementation is fully functional!"
echo ""
echo "Test directory: $TEST_DIR"
echo "You can inspect it with: cd $TEST_DIR && ls -la"
