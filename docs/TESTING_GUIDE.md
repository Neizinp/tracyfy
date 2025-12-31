# Tracyfy Manual Testing Guide

A rigorous manual testing checklist for QA testers to verify all functionality.

---

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Chrome/Edge browser (for browser mode)
- [ ] A test Git repository (empty folder or existing repo)

## Environment Setup

```bash
git clone https://github.com/Neizinp/tracyfy.git
cd tracyfy
npm install
```

---

## 1. Application Launch

### 1.1 Browser Mode

- [ ] Run `npm run dev`
- [ ] Open `http://localhost:5173` in Chrome/Edge
- [ ] Verify app loads without console errors
- [ ] Verify "Select Repository" prompt appears

### 1.2 Electron Mode

- [ ] Run `npm run electron:dev`
- [ ] Verify Electron window opens
- [ ] Verify app loads without critical errors (ignore VSync warnings)

---

## 2. Repository Selection

### 2.1 New Repository

- [ ] Click "Select Repository"
- [ ] Choose an empty folder
- [ ] Verify ".git" folder is created
- [ ] Verify ".tracyfy" folder is created
- [ ] Verify app navigates to Requirements page

### 2.2 Existing Repository

- [ ] Select folder with existing .git
- [ ] Verify existing artifacts load
- [ ] Verify counters continue from last ID

### 2.3 Demo Project

- [ ] Click "Load Demo Project" (if available)
- [ ] Verify demo requirements, use cases, test cases populate

---

## 3. Requirements Management

### 3.1 Create Requirement

- [ ] Click "Create New" → "New Requirement"
- [ ] Fill in: Title, Description, Requirement Text, Rationale
- [ ] Set Status (draft/approved/implemented/deprecated)
- [ ] Set Priority (low/medium/high/critical)
- [ ] Click Save
- [ ] Verify requirement appears in list with ID "REQ-001"
- [ ] Verify file exists: `requirements/REQ-001.md`

### 3.2 Edit Requirement

- [ ] Click on existing requirement
- [ ] Modify title and description
- [ ] Save changes
- [ ] Verify revision increments (01 → 02)
- [ ] Verify changes persist after page reload

### 3.3 Delete Requirement

- [ ] Click delete button on a requirement
- [ ] Verify moved to Trash (not permanently deleted)
- [ ] Verify `isDeleted: true` in file frontmatter

### 3.4 Restore from Trash

- [ ] Navigate to Trash view
- [ ] Click restore on deleted requirement
- [ ] Verify requirement reappears in main list

---

## 4. Use Cases Management

### 4.1 Create Use Case

- [ ] Navigate to Use Cases page
- [ ] Click "Create New"
- [ ] Fill in: Title, Actor, Preconditions
- [ ] Add Main Flow steps (numbered list)
- [ ] Add Alternative Flows
- [ ] Add Postconditions
- [ ] Save and verify ID "UC-001"

### 4.2 Link to Requirements

- [ ] Open use case
- [ ] Go to Relationships tab
- [ ] Link to existing requirement
- [ ] Verify link appears in both artifacts

---

## 5. Test Cases Management

### 5.1 Create Test Case

- [ ] Navigate to Test Cases page
- [ ] Create new test case
- [ ] Fill in: Title, Description, Steps, Expected Result
- [ ] Link to requirements being tested
- [ ] Save and verify ID "TC-001"

### 5.2 Update Test Status

- [ ] Change status: Draft → Passed
- [ ] Verify status indicator updates
- [ ] Change to Failed, verify indicator turns red
- [ ] Change to Blocked, verify indicator

---

## 6. Information/Notes

### 6.1 Create Information

- [ ] Navigate to Information page
- [ ] Create new note
- [ ] Select type: Meeting/Decision/Note/Other
- [ ] Enter markdown content
- [ ] Save and verify ID "INFO-001"

---

## 7. Risks Management

### 7.1 Create Risk

- [ ] Navigate to Risks page
- [ ] Create new risk
- [ ] Fill: Title, Description, Probability, Impact
- [ ] Add Mitigation strategy
- [ ] Set Category and Owner
- [ ] Save and verify ID "RISK-001"

---

## 8. Documents

### 8.1 Create Document

- [ ] Navigate to Documents page
- [ ] Create new document
- [ ] Add headings and structure
- [ ] Embed artifact references
- [ ] Save and verify ID "DOC-001"

---

## 9. Git Integration

### 9.1 Pending Changes

- [ ] Create/modify an artifact
- [ ] Verify "Pending Changes" panel shows change
- [ ] Verify status shows "New" or "Modified"

### 9.2 Commit Changes

- [ ] Enter commit message in Pending Changes
- [ ] Click "Commit"
- [ ] Verify change disappears from Pending Changes
- [ ] Reload page - verify change persists
- [ ] Run `git log` in repo - verify commit exists

### 9.3 Discard Changes

- [ ] Modify an artifact
- [ ] Click "Discard" in Pending Changes
- [ ] Verify artifact reverts to previous state

### 9.4 Remote Sync (if configured)

- [ ] Configure GitHub token in settings
- [ ] Add remote origin
- [ ] Make changes and commit
- [ ] Click "Push"
- [ ] Verify changes appear on GitHub

---

## 10. Baselines/Tags

### 10.1 Create Baseline

- [ ] Navigate to Baselines page
- [ ] Click "Create Baseline"
- [ ] Enter version (e.g., "v1.0") and description
- [ ] Click Create
- [ ] Verify baseline appears in list
- [ ] Run `git tag` - verify tag exists

### 10.2 View Baseline History

- [ ] Click on baseline to view details
- [ ] Verify artifact snapshot is displayed
- [ ] Verify commit message and timestamp

---

## 11. Traceability Matrix

### 11.1 View Matrix

- [ ] Navigate to Traceability page
- [ ] Verify requirements appear as rows
- [ ] Verify use cases/test cases as columns
- [ ] Click matrix cell to view link details

### 11.2 Create Link from Matrix

- [ ] Click empty cell
- [ ] Select link type
- [ ] Verify link created in both artifacts

---

## 12. Search & Filter

### 12.1 Basic Search

- [ ] Type in search box
- [ ] Verify results filter in real-time
- [ ] Verify search across title and description

### 12.2 Advanced Search

- [ ] Open Advanced Search modal
- [ ] Filter by status
- [ ] Filter by priority
- [ ] Filter by date range
- [ ] Verify results match filters

### 12.3 Save Filter

- [ ] Create complex filter
- [ ] Save as named filter
- [ ] Close and reopen - verify saved filter appears

---

## 13. Export

### 13.1 PDF Export

- [ ] Click Export → PDF
- [ ] Verify PDF generates
- [ ] Check: Cover page, Table of Contents, All artifacts
- [ ] Verify formatting is professional

### 13.2 Excel Export

- [ ] Click Export → Excel
- [ ] Open .xlsx file
- [ ] Verify sheets: Requirements, Use Cases, Test Cases, etc.
- [ ] Verify Traceability Matrix sheet

### 13.3 JSON Export

- [ ] Click Export → JSON
- [ ] Verify valid JSON file
- [ ] Verify all artifact data included

---

## 14. Import

### 14.1 JSON Import

- [ ] Export data as JSON
- [ ] Start fresh repository
- [ ] Import JSON file
- [ ] Verify all artifacts restored

---

## 15. User Management

### 15.1 Create User

- [ ] Open User Settings
- [ ] Create new user with name/email
- [ ] Switch to new user
- [ ] Create artifact - verify author field

---

## 16. Custom Attributes

### 16.1 Add Custom Attribute

- [ ] Go to Settings → Custom Attributes
- [ ] Add new attribute (text/number/select/date)
- [ ] Apply to requirement type
- [ ] Create requirement - verify custom field appears

---

## 17. Workflows

### 17.1 Create Workflow

- [ ] Navigate to Workflows page
- [ ] Create approval workflow
- [ ] Assign to user
- [ ] Process through approval stages

---

## 18. UI/UX Verification

### 18.1 Responsive Design

- [ ] Resize browser window
- [ ] Verify sidebar collapses appropriately
- [ ] Verify tables scroll horizontally

### 18.2 Keyboard Navigation

- [ ] Tab through form fields
- [ ] Use Enter to submit forms
- [ ] Use Escape to close modals

### 18.3 Dark Theme

- [ ] Verify consistent dark theme
- [ ] Check contrast is readable
- [ ] Verify no white flashes on load

---

## 19. Error Handling

### 19.1 Invalid Input

- [ ] Try saving requirement without title
- [ ] Verify validation error message

### 19.2 Network Errors (if remote)

- [ ] Disconnect network
- [ ] Try to push
- [ ] Verify graceful error message

### 19.3 File System Errors

- [ ] Make repository read-only
- [ ] Try to save
- [ ] Verify error handling

---

## 20. Performance

### 20.1 Large Dataset

- [ ] Load 100+ requirements
- [ ] Verify list renders smoothly (virtualization)
- [ ] Verify search responds quickly (<500ms)

### 20.2 Memory

- [ ] Use browser DevTools Memory panel
- [ ] Navigate between pages repeatedly
- [ ] Verify no significant memory leaks

---

## Test Sign-Off

| Category        | Passed | Failed | Notes |
| --------------- | ------ | ------ | ----- |
| Launch          |        |        |       |
| Requirements    |        |        |       |
| Use Cases       |        |        |       |
| Test Cases      |        |        |       |
| Git Integration |        |        |       |
| Baselines       |        |        |       |
| Traceability    |        |        |       |
| Export/Import   |        |        |       |
| UI/UX           |        |        |       |

**Tester:** **\*\*\*\***\_**\*\*\*\*** **Date:** **\*\*\*\***\_**\*\*\*\***
