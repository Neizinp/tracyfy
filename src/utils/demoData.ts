/**
 * Demo Data
 *
 * Sample data for creating a demo project with realistic artifacts.
 * Used to populate the app for testing and exploration.
 */

import type { Requirement, UseCase, TestCase, Information } from '../types';
import type { LinkType } from './linkTypes';

// Placeholder IDs will be replaced with real generated IDs
export interface DemoArtifacts {
  requirements: Omit<Requirement, 'id' | 'lastModified'>[];
  useCases: Omit<UseCase, 'id' | 'lastModified'>[];
  testCases: Omit<TestCase, 'id' | 'lastModified'>[];
  information: Omit<Information, 'id' | 'lastModified'>[];
  links: {
    sourceIndex: number;
    sourceType: 'req' | 'uc' | 'tc' | 'info';
    targetIndex: number;
    targetType: 'req' | 'uc' | 'tc' | 'info';
    type: LinkType;
  }[];
}

export const DEMO_PROJECT = {
  name: 'Sample Product - Release 1.0',
  description:
    'A demonstration project showcasing requirements management with traceability across requirements, use cases, test cases, and information items.',
};

const now = Date.now();

export const DEMO_ARTIFACTS: DemoArtifacts = {
  requirements: [
    {
      title: 'User Authentication',
      description: 'The system shall provide secure user authentication.',
      text: `Users must be able to authenticate using email and password credentials.

## Acceptance Criteria
- Login form with email and password fields
- Password must be at least 8 characters
- Account lockout after 5 failed attempts
- Session timeout after 30 minutes of inactivity`,
      rationale: 'Security is essential for protecting user data and system integrity.',
      status: 'approved',
      priority: 'high',
      author: 'Demo User',
      verificationMethod: 'Security audit and penetration testing',
      comments: 'Core requirement for MVP release.',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Data Export',
      description: 'Users shall be able to export their data in multiple formats.',
      text: `The system must support exporting data to CSV, JSON, and PDF formats.

## Acceptance Criteria
- Export button accessible from main dashboard
- Progress indicator for large exports
- Exported files include metadata and timestamps`,
      rationale: 'Data portability is required for regulatory compliance (GDPR).',
      status: 'draft',
      priority: 'medium',
      author: 'Demo User',
      verificationMethod: 'Export functionality testing with sample datasets',
      comments: 'Phase 2 feature - not critical for MVP.',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Performance SLA',
      description: 'The system shall meet performance service level agreements.',
      text: `All API responses must complete within 200ms for 95th percentile.

## Metrics
- Page load time < 2 seconds
- Database queries < 100ms average
- 99.9% uptime guarantee`,
      rationale: 'User experience directly correlates with application performance.',
      status: 'approved',
      priority: 'high',
      author: 'Demo User',
      verificationMethod: 'Load testing with 1000 concurrent users',
      comments: 'Performance baseline established.',
      dateCreated: now,
      revision: '02',
    },
    {
      title: 'Accessibility Compliance',
      description: 'The application shall comply with WCAG 2.1 AA standards.',
      text: `All user interfaces must be accessible to users with disabilities.

## Requirements
- Keyboard navigation for all features
- Screen reader compatibility
- Color contrast ratio of at least 4.5:1
- Focus indicators on interactive elements`,
      rationale: 'Legal requirement and inclusive design principle.',
      status: 'implemented',
      priority: 'high',
      author: 'Demo User',
      verificationMethod: 'Automated accessibility testing + manual screen reader testing',
      comments: 'Passed initial accessibility audit.',
      dateCreated: now,
      revision: '01',
    },
  ],

  useCases: [
    {
      title: 'User Login Flow',
      description: 'Standard user authentication workflow.',
      actor: 'Registered User',
      preconditions: 'User has a registered account with verified email.',
      postconditions: 'User is authenticated and redirected to dashboard.',
      mainFlow: `1. User navigates to login page
2. User enters email and password
3. System validates credentials
4. System creates session token
5. User is redirected to dashboard`,
      alternativeFlows: `**Invalid Credentials:**
1. System displays error message
2. Failed attempt counter increments
3. User can retry

**Account Locked:**
1. System displays lockout message
2. User must wait 15 minutes or reset password`,
      priority: 'high',
      status: 'approved',
      revision: '01',
    },
    {
      title: 'Export Report',
      description: 'Generate and download data export.',
      actor: 'Authenticated User',
      preconditions: 'User is logged in with data export permissions.',
      postconditions: "Export file is downloaded to user's device.",
      mainFlow: `1. User clicks Export button
2. User selects export format (CSV/JSON/PDF)
3. User selects date range (optional)
4. System generates export file
5. Browser downloads file`,
      alternativeFlows: `**Large Dataset:**
1. System shows progress indicator
2. Export runs in background
3. User notified when complete`,
      priority: 'medium',
      status: 'draft',
      revision: '01',
    },
    {
      title: 'Password Reset',
      description: 'Self-service password recovery flow.',
      actor: 'User',
      preconditions: 'User has forgotten their password.',
      postconditions: 'User has set a new password and can log in.',
      mainFlow: `1. User clicks "Forgot Password" link
2. User enters registered email
3. System sends reset link via email
4. User clicks link and enters new password
5. System updates password
6. User redirected to login`,
      alternativeFlows: `**Email Not Found:**
1. System shows generic "check your email" message (security)
2. No email sent`,
      priority: 'high',
      status: 'approved',
      revision: '01',
    },
  ],

  testCases: [
    {
      title: 'Test Valid Login',
      description: 'Verify successful authentication with valid credentials.',
      requirementIds: [], // Will be linked via Link entities
      status: 'passed',
      priority: 'high',
      author: 'QA Team',
      lastRun: now - 86400000, // Yesterday
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Test Account Lockout',
      description: 'Verify account locks after 5 failed login attempts.',
      requirementIds: [],
      status: 'passed',
      priority: 'high',
      author: 'QA Team',
      lastRun: now - 86400000,
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Test CSV Export',
      description: 'Verify CSV export generates valid file with correct data.',
      requirementIds: [],
      status: 'draft',
      priority: 'medium',
      author: 'QA Team',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Test API Response Time',
      description: 'Verify API responses meet 200ms SLA under load.',
      requirementIds: [],
      status: 'passed',
      priority: 'high',
      author: 'QA Team',
      lastRun: now - 172800000, // 2 days ago
      dateCreated: now,
      revision: '02',
    },
  ],

  information: [
    {
      title: 'Architecture Decision: JWT Tokens',
      content: `## Decision
We will use JWT (JSON Web Tokens) for session management.

## Context
Need stateless authentication for horizontal scaling.

## Consequences
- **Pros**: Stateless, scalable, contains user claims
- **Cons**: Cannot revoke individual tokens, larger payload

## Alternatives Considered
- Session cookies (rejected: requires session store)
- OAuth tokens (overkill for internal app)`,
      type: 'decision' as const,
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Sprint 1 Planning Notes',
      content: `## Sprint Goals
- Complete authentication module
- Set up CI/CD pipeline
- Establish testing framework

## Team Capacity
- 3 developers × 2 weeks = 6 person-weeks
- 20% buffer for bugs/support

## Risks
- Third-party auth provider integration may delay`,
      type: 'meeting' as const,
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'API Versioning Strategy',
      content: `## Overview
All APIs will use URL-based versioning: \`/api/v1/...\`

## Rules
1. Breaking changes require new version
2. Support previous version for 6 months minimum
3. Deprecation notices sent 3 months in advance

## Breaking Changes Include
- Removing fields
- Changing field types
- Modifying required parameters`,
      type: 'note' as const,
      dateCreated: now,
      revision: '01',
    },
  ],

  // Links between artifacts (indices refer to arrays above)
  // sourceType/targetType: 'req' | 'uc' | 'tc' | 'info'
  links: [
    // Requirements -> Use Cases
    { sourceIndex: 0, sourceType: 'req', targetIndex: 0, targetType: 'uc', type: 'satisfies' }, // Auth -> Login Flow
    { sourceIndex: 1, sourceType: 'req', targetIndex: 1, targetType: 'uc', type: 'satisfies' }, // Export -> Export Report
    { sourceIndex: 0, sourceType: 'req', targetIndex: 2, targetType: 'uc', type: 'related_to' }, // Auth -> Password Reset

    // Test Cases -> Requirements (verifies)
    { sourceIndex: 0, sourceType: 'tc', targetIndex: 0, targetType: 'req', type: 'verifies' }, // Test Login -> Auth
    { sourceIndex: 1, sourceType: 'tc', targetIndex: 0, targetType: 'req', type: 'verifies' }, // Test Lockout -> Auth
    { sourceIndex: 2, sourceType: 'tc', targetIndex: 1, targetType: 'req', type: 'verifies' }, // Test CSV -> Export
    { sourceIndex: 3, sourceType: 'tc', targetIndex: 2, targetType: 'req', type: 'verifies' }, // Test API Time -> Performance

    // Information -> Requirements
    { sourceIndex: 0, sourceType: 'info', targetIndex: 0, targetType: 'req', type: 'related_to' }, // JWT Decision -> Auth

    // Requirement dependencies
    { sourceIndex: 3, sourceType: 'req', targetIndex: 0, targetType: 'req', type: 'constrains' }, // A11y constrains Auth
  ],
};
