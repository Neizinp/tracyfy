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
    scope: 'global' | 'project'; // 'global' = visible everywhere, 'project' = only in this project
  }[];
}

export const DEMO_PROJECT = {
  name: 'Demo Project',
  description:
    'A demonstration project showcasing requirements management with traceability across requirements, use cases, test cases, and information items.',
};

const now = Date.now();

export const DEMO_ARTIFACTS: DemoArtifacts = {
  requirements: [
    // Authentication & Security (0-3)
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
      title: 'Two-Factor Authentication',
      description: 'The system shall support optional two-factor authentication.',
      text: `Users can enable 2FA for additional security.

## Acceptance Criteria
- Support TOTP authenticator apps
- SMS backup option
- Recovery codes for account recovery
- Admin can enforce 2FA for all users`,
      rationale: 'Enhanced security for sensitive accounts and regulatory compliance.',
      status: 'draft',
      priority: 'medium',
      author: 'Security Team',
      verificationMethod: 'Security testing with various 2FA providers',
      comments: 'Phase 2 feature.',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Role-Based Access Control',
      description: 'The system shall implement role-based permissions.',
      text: `Access to features shall be controlled by user roles.

## Roles
- **Admin**: Full system access
- **Manager**: Team management, reporting
- **User**: Standard features
- **Viewer**: Read-only access`,
      rationale: 'Principle of least privilege for data security.',
      status: 'approved',
      priority: 'high',
      author: 'Demo User',
      verificationMethod: 'Permission matrix testing',
      comments: '',
      dateCreated: now,
      revision: '02',
    },
    {
      title: 'Session Management',
      description: 'The system shall securely manage user sessions.',
      text: `Sessions must be properly managed throughout their lifecycle.

## Requirements
- Secure session tokens
- Configurable session timeout
- Concurrent session limits
- Forced logout capability`,
      rationale: 'Proper session management prevents unauthorized access.',
      status: 'approved',
      priority: 'high',
      author: 'Security Team',
      verificationMethod: 'Session security audit',
      comments: '',
      dateCreated: now,
      revision: '01',
    },

    // Data Management (4-7)
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
      title: 'Data Import',
      description: 'Users shall be able to import data from external sources.',
      text: `The system must support importing data from CSV and JSON files.

## Acceptance Criteria
- File upload interface
- Data validation before import
- Conflict resolution options
- Import preview and confirmation`,
      rationale: 'Enables migration from other systems and bulk data entry.',
      status: 'draft',
      priority: 'medium',
      author: 'Demo User',
      verificationMethod: 'Import testing with various file formats',
      comments: '',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Data Backup',
      description: 'The system shall automatically backup user data.',
      text: `Automatic backups ensure data recovery capability.

## Requirements
- Daily incremental backups
- Weekly full backups
- 30-day retention period
- Point-in-time recovery`,
      rationale: 'Business continuity and disaster recovery.',
      status: 'approved',
      priority: 'high',
      author: 'Operations Team',
      verificationMethod: 'Backup and restore testing',
      comments: '',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Data Encryption',
      description: 'All sensitive data shall be encrypted at rest and in transit.',
      text: `Data protection through encryption.

## Requirements
- AES-256 encryption at rest
- TLS 1.3 for data in transit
- Key rotation every 90 days
- Encrypted backups`,
      rationale: 'Data protection compliance (GDPR, HIPAA).',
      status: 'approved',
      priority: 'high',
      author: 'Security Team',
      verificationMethod: 'Encryption compliance audit',
      comments: '',
      dateCreated: now,
      revision: '01',
    },

    // Performance & Scalability (8-10)
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
      title: 'Horizontal Scalability',
      description: 'The system shall support horizontal scaling.',
      text: `Application must scale horizontally to handle load.

## Requirements
- Stateless application design
- Load balancer support
- Auto-scaling triggers
- Distributed caching`,
      rationale: 'Cost-effective scaling for variable workloads.',
      status: 'approved',
      priority: 'high',
      author: 'Architect',
      verificationMethod: 'Multi-instance deployment testing',
      comments: '',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Caching Strategy',
      description: 'The system shall implement efficient caching.',
      text: `Caching improves performance and reduces load.

## Requirements
- Browser caching for static assets
- Server-side response caching
- Database query caching
- Cache invalidation strategy`,
      rationale: 'Performance optimization and cost reduction.',
      status: 'draft',
      priority: 'medium',
      author: 'Architect',
      verificationMethod: 'Cache hit ratio analysis',
      comments: '',
      dateCreated: now,
      revision: '01',
    },

    // Accessibility & UX (11-13)
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
    {
      title: 'Responsive Design',
      description: 'The UI shall be responsive across device sizes.',
      text: `Application must work on desktop, tablet, and mobile.

## Breakpoints
- Desktop: 1024px+
- Tablet: 768px - 1023px
- Mobile: < 768px`,
      rationale: 'Users expect seamless experience across devices.',
      status: 'approved',
      priority: 'high',
      author: 'UX Team',
      verificationMethod: 'Cross-device testing',
      comments: '',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Dark Mode Support',
      description: 'The application shall support dark mode.',
      text: `Users can switch between light and dark themes.

## Requirements
- System preference detection
- Manual toggle option
- Persistence of preference
- All components themed`,
      rationale: 'Reduces eye strain and improves accessibility.',
      status: 'implemented',
      priority: 'low',
      author: 'UX Team',
      verificationMethod: 'Visual testing in both modes',
      comments: '',
      dateCreated: now,
      revision: '01',
    },

    // Notifications & Communication (14-15)
    {
      title: 'Email Notifications',
      description: 'The system shall send email notifications for key events.',
      text: `Users receive email alerts for important activities.

## Events
- Account security changes
- Shared item notifications
- Weekly activity digest
- System announcements`,
      rationale: 'Keeps users informed without requiring app access.',
      status: 'approved',
      priority: 'medium',
      author: 'Product Team',
      verificationMethod: 'Email delivery testing',
      comments: '',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'In-App Notifications',
      description: 'The system shall display real-time in-app notifications.',
      text: `Users see notifications within the application.

## Requirements
- Notification center
- Unread count badge
- Mark as read/unread
- Notification preferences`,
      rationale: 'Immediate feedback for user actions and updates.',
      status: 'draft',
      priority: 'medium',
      author: 'Product Team',
      verificationMethod: 'Real-time notification testing',
      comments: '',
      dateCreated: now,
      revision: '01',
    },
  ],

  useCases: [
    // Authentication Use Cases (0-3)
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
    {
      title: 'Enable Two-Factor Auth',
      description: 'User enables 2FA for their account.',
      actor: 'Authenticated User',
      preconditions: 'User is logged in.',
      postconditions: '2FA is enabled for the account.',
      mainFlow: `1. User navigates to security settings
2. User clicks "Enable 2FA"
3. System displays QR code
4. User scans with authenticator app
5. User enters verification code
6. System confirms 2FA enabled
7. System displays recovery codes`,
      alternativeFlows: `**Invalid Code:**
1. System shows error
2. User retries with new code`,
      priority: 'medium',
      status: 'draft',
      revision: '01',
    },
    {
      title: 'User Registration',
      description: 'New user account creation.',
      actor: 'Guest User',
      preconditions: 'User does not have an existing account.',
      postconditions: 'Account created and verification email sent.',
      mainFlow: `1. User clicks "Sign Up"
2. User enters name, email, password
3. System validates input
4. System creates account
5. System sends verification email
6. User clicks verification link
7. Account activated`,
      alternativeFlows: `**Email Already Exists:**
1. System shows "email already registered"
2. Suggests password reset`,
      priority: 'high',
      status: 'approved',
      revision: '01',
    },

    // Data Management Use Cases (4-6)
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
      title: 'Import Data',
      description: 'Import data from external file.',
      actor: 'Authenticated User',
      preconditions: 'User is logged in with import permissions.',
      postconditions: 'Data is imported into the system.',
      mainFlow: `1. User clicks Import button
2. User selects file to upload
3. System validates file format
4. System shows preview of data
5. User confirms import
6. System imports data
7. System shows import summary`,
      alternativeFlows: `**Validation Errors:**
1. System highlights errors
2. User corrects or skips invalid rows`,
      priority: 'medium',
      status: 'draft',
      revision: '01',
    },
    {
      title: 'Bulk Delete Items',
      description: 'Delete multiple items at once.',
      actor: 'Authenticated User',
      preconditions: 'User has delete permissions.',
      postconditions: 'Selected items are deleted.',
      mainFlow: `1. User selects multiple items
2. User clicks "Delete Selected"
3. System shows confirmation dialog
4. User confirms deletion
5. System deletes items
6. System shows success message`,
      alternativeFlows: `**Protected Items:**
1. System skips protected items
2. Shows partial success message`,
      priority: 'low',
      status: 'draft',
      revision: '01',
    },

    // Admin Use Cases (7-8)
    {
      title: 'Manage User Roles',
      description: 'Admin assigns roles to users.',
      actor: 'Administrator',
      preconditions: 'Admin is logged in.',
      postconditions: 'User role is updated.',
      mainFlow: `1. Admin navigates to User Management
2. Admin searches for user
3. Admin clicks "Edit Role"
4. Admin selects new role
5. System updates permissions
6. User notified of change`,
      alternativeFlows: `**Own Account:**
1. System prevents self-demotion
2. Shows warning message`,
      priority: 'high',
      status: 'approved',
      revision: '01',
    },
    {
      title: 'View Audit Log',
      description: 'Admin reviews system activity.',
      actor: 'Administrator',
      preconditions: 'Admin is logged in.',
      postconditions: 'Audit log is displayed.',
      mainFlow: `1. Admin navigates to Audit Log
2. Admin filters by date/user/action
3. System displays matching entries
4. Admin can export log`,
      alternativeFlows: '',
      priority: 'medium',
      status: 'draft',
      revision: '01',
    },
  ],

  testCases: [
    // Authentication Tests (0-5)
    {
      title: 'Test Valid Login',
      description: 'Verify successful authentication with valid credentials.',
      requirementIds: [],
      status: 'passed',
      priority: 'high',
      author: 'QA Team',
      lastRun: now - 86400000,
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Test Invalid Login',
      description: 'Verify error message for invalid credentials.',
      requirementIds: [],
      status: 'passed',
      priority: 'high',
      author: 'QA Team',
      lastRun: now - 86400000,
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
      title: 'Test Session Timeout',
      description: 'Verify session expires after 30 minutes of inactivity.',
      requirementIds: [],
      status: 'passed',
      priority: 'high',
      author: 'QA Team',
      lastRun: now - 172800000,
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Test Password Reset Flow',
      description: 'Verify complete password reset process.',
      requirementIds: [],
      status: 'passed',
      priority: 'high',
      author: 'QA Team',
      lastRun: now - 86400000,
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Test 2FA Setup',
      description: 'Verify two-factor authentication can be enabled.',
      requirementIds: [],
      status: 'draft',
      priority: 'medium',
      author: 'QA Team',
      dateCreated: now,
      revision: '01',
    },

    // Data Management Tests (6-9)
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
      title: 'Test JSON Export',
      description: 'Verify JSON export generates valid file.',
      requirementIds: [],
      status: 'draft',
      priority: 'medium',
      author: 'QA Team',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Test PDF Export',
      description: 'Verify PDF export generates readable document.',
      requirementIds: [],
      status: 'draft',
      priority: 'medium',
      author: 'QA Team',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Test Data Import Validation',
      description: 'Verify import rejects invalid data formats.',
      requirementIds: [],
      status: 'draft',
      priority: 'medium',
      author: 'QA Team',
      dateCreated: now,
      revision: '01',
    },

    // Performance Tests (10-12)
    {
      title: 'Test API Response Time',
      description: 'Verify API responses meet 200ms SLA under load.',
      requirementIds: [],
      status: 'passed',
      priority: 'high',
      author: 'QA Team',
      lastRun: now - 172800000,
      dateCreated: now,
      revision: '02',
    },
    {
      title: 'Test Concurrent Users',
      description: 'Verify system handles 1000 concurrent users.',
      requirementIds: [],
      status: 'passed',
      priority: 'high',
      author: 'QA Team',
      lastRun: now - 604800000,
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Test Database Query Performance',
      description: 'Verify database queries complete within 100ms.',
      requirementIds: [],
      status: 'passed',
      priority: 'high',
      author: 'QA Team',
      lastRun: now - 259200000,
      dateCreated: now,
      revision: '01',
    },

    // Accessibility Tests (13-15)
    {
      title: 'Test Keyboard Navigation',
      description: 'Verify all features accessible via keyboard.',
      requirementIds: [],
      status: 'passed',
      priority: 'high',
      author: 'Accessibility Team',
      lastRun: now - 86400000,
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Test Screen Reader Compatibility',
      description: 'Verify screen reader announces all elements correctly.',
      requirementIds: [],
      status: 'passed',
      priority: 'high',
      author: 'Accessibility Team',
      lastRun: now - 86400000,
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Test Color Contrast',
      description: 'Verify color contrast meets WCAG 2.1 AA standards.',
      requirementIds: [],
      status: 'passed',
      priority: 'high',
      author: 'Accessibility Team',
      lastRun: now - 86400000,
      dateCreated: now,
      revision: '01',
    },

    // Security Tests (16-17)
    {
      title: 'Test SQL Injection Prevention',
      description: 'Verify inputs are sanitized against SQL injection.',
      requirementIds: [],
      status: 'passed',
      priority: 'high',
      author: 'Security Team',
      lastRun: now - 604800000,
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Test XSS Prevention',
      description: 'Verify outputs are escaped to prevent XSS attacks.',
      requirementIds: [],
      status: 'passed',
      priority: 'high',
      author: 'Security Team',
      lastRun: now - 604800000,
      dateCreated: now,
      revision: '01',
    },
  ],

  information: [
    // Architecture Decisions (0-2)
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
      title: 'Architecture Decision: Database Selection',
      content: `## Decision
PostgreSQL for primary data storage.

## Context
Need reliable, scalable relational database.

## Consequences
- **Pros**: ACID compliance, JSON support, mature ecosystem
- **Cons**: More complex than NoSQL for some use cases

## Alternatives Considered
- MongoDB (rejected: need strong consistency)
- MySQL (rejected: less feature-rich)`,
      type: 'decision' as const,
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Architecture Decision: API Design',
      content: `## Decision
RESTful API with OpenAPI specification.

## Context
Need well-documented, standard API design.

## Consequences
- **Pros**: Industry standard, tooling support, auto-generated docs
- **Cons**: Some complex operations awkward in REST

## Alternatives Considered
- GraphQL (rejected: team expertise, caching complexity)`,
      type: 'decision' as const,
      dateCreated: now,
      revision: '01',
    },

    // Meeting Notes (3-4)
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
      title: 'Security Review Meeting',
      content: `## Attendees
Security Team, Dev Lead, Product Owner

## Topics Discussed
1. Authentication flow review
2. Data encryption requirements
3. Penetration testing schedule

## Action Items
- [ ] Schedule pen test for week 4
- [ ] Document encryption key management
- [ ] Review session timeout settings`,
      type: 'meeting' as const,
      dateCreated: now,
      revision: '01',
    },

    // Technical Notes (5-7)
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
    {
      title: 'Deployment Checklist',
      content: `## Pre-Deployment
- [ ] All tests passing
- [ ] Security scan complete
- [ ] Database migrations tested
- [ ] Rollback plan documented

## Deployment
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Monitor error rates

## Post-Deployment
- [ ] Verify metrics
- [ ] Update documentation
- [ ] Notify stakeholders`,
      type: 'note' as const,
      dateCreated: now,
      revision: '02',
    },
    {
      title: 'Error Handling Guidelines',
      content: `## Principles
1. Fail gracefully with helpful messages
2. Log errors with context
3. Don't expose internal details to users

## Error Response Format
\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "User-friendly message",
    "details": []
  }
}
\`\`\`

## HTTP Status Codes
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error`,
      type: 'note' as const,
      dateCreated: now,
      revision: '01',
    },
  ],

  // Links between artifacts (indices refer to arrays above)
  // scope: 'global' = visible in all projects, 'project' = only in this project
  links: [
    // === GLOBAL LINKS (Important cross-cutting concerns) ===

    // Security requirements dependencies (global - applies everywhere)
    {
      sourceIndex: 0,
      sourceType: 'req',
      targetIndex: 3,
      targetType: 'req',
      type: 'depends_on',
      scope: 'global',
    }, // Auth -> Session
    {
      sourceIndex: 1,
      sourceType: 'req',
      targetIndex: 0,
      targetType: 'req',
      type: 'depends_on',
      scope: 'global',
    }, // 2FA -> Auth
    {
      sourceIndex: 2,
      sourceType: 'req',
      targetIndex: 0,
      targetType: 'req',
      type: 'depends_on',
      scope: 'global',
    }, // RBAC -> Auth
    {
      sourceIndex: 7,
      sourceType: 'req',
      targetIndex: 6,
      targetType: 'req',
      type: 'constrains',
      scope: 'global',
    }, // Encryption constrains Backup

    // Performance architecture (global)
    {
      sourceIndex: 9,
      sourceType: 'req',
      targetIndex: 8,
      targetType: 'req',
      type: 'refines',
      scope: 'global',
    }, // Scalability refines Perf SLA
    {
      sourceIndex: 10,
      sourceType: 'req',
      targetIndex: 8,
      targetType: 'req',
      type: 'refines',
      scope: 'global',
    }, // Caching refines Perf SLA

    // Accessibility as cross-cutting (global)
    {
      sourceIndex: 11,
      sourceType: 'req',
      targetIndex: 12,
      targetType: 'req',
      type: 'constrains',
      scope: 'global',
    }, // A11y constrains Responsive
    {
      sourceIndex: 11,
      sourceType: 'req',
      targetIndex: 13,
      targetType: 'req',
      type: 'constrains',
      scope: 'global',
    }, // A11y constrains Dark Mode

    // Architecture decisions link to requirements (global knowledge)
    {
      sourceIndex: 0,
      sourceType: 'info',
      targetIndex: 0,
      targetType: 'req',
      type: 'related_to',
      scope: 'global',
    }, // JWT -> Auth
    {
      sourceIndex: 0,
      sourceType: 'info',
      targetIndex: 3,
      targetType: 'req',
      type: 'related_to',
      scope: 'global',
    }, // JWT -> Session
    {
      sourceIndex: 1,
      sourceType: 'info',
      targetIndex: 6,
      targetType: 'req',
      type: 'related_to',
      scope: 'global',
    }, // DB -> Backup
    {
      sourceIndex: 2,
      sourceType: 'info',
      targetIndex: 8,
      targetType: 'req',
      type: 'related_to',
      scope: 'global',
    }, // API Design -> Perf

    // === PROJECT-SPECIFIC LINKS (This project's implementation) ===

    // Requirements -> Use Cases (project-specific implementations)
    {
      sourceIndex: 0,
      sourceType: 'req',
      targetIndex: 0,
      targetType: 'uc',
      type: 'satisfies',
      scope: 'project',
    }, // Auth -> Login Flow
    {
      sourceIndex: 0,
      sourceType: 'req',
      targetIndex: 1,
      targetType: 'uc',
      type: 'satisfies',
      scope: 'project',
    }, // Auth -> Password Reset
    {
      sourceIndex: 0,
      sourceType: 'req',
      targetIndex: 3,
      targetType: 'uc',
      type: 'satisfies',
      scope: 'project',
    }, // Auth -> Registration
    {
      sourceIndex: 1,
      sourceType: 'req',
      targetIndex: 2,
      targetType: 'uc',
      type: 'satisfies',
      scope: 'project',
    }, // 2FA -> Enable 2FA
    {
      sourceIndex: 2,
      sourceType: 'req',
      targetIndex: 7,
      targetType: 'uc',
      type: 'satisfies',
      scope: 'project',
    }, // RBAC -> Manage Roles
    {
      sourceIndex: 4,
      sourceType: 'req',
      targetIndex: 4,
      targetType: 'uc',
      type: 'satisfies',
      scope: 'project',
    }, // Export -> Export Report
    {
      sourceIndex: 5,
      sourceType: 'req',
      targetIndex: 5,
      targetType: 'uc',
      type: 'satisfies',
      scope: 'project',
    }, // Import -> Import Data

    // Test Cases -> Requirements (project verification)
    {
      sourceIndex: 0,
      sourceType: 'tc',
      targetIndex: 0,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // Valid Login -> Auth
    {
      sourceIndex: 1,
      sourceType: 'tc',
      targetIndex: 0,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // Invalid Login -> Auth
    {
      sourceIndex: 2,
      sourceType: 'tc',
      targetIndex: 0,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // Lockout -> Auth
    {
      sourceIndex: 3,
      sourceType: 'tc',
      targetIndex: 3,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // Session Timeout -> Session
    {
      sourceIndex: 4,
      sourceType: 'tc',
      targetIndex: 0,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // Password Reset -> Auth
    {
      sourceIndex: 5,
      sourceType: 'tc',
      targetIndex: 1,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // 2FA Setup -> 2FA
    {
      sourceIndex: 6,
      sourceType: 'tc',
      targetIndex: 4,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // CSV Export -> Export
    {
      sourceIndex: 7,
      sourceType: 'tc',
      targetIndex: 4,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // JSON Export -> Export
    {
      sourceIndex: 8,
      sourceType: 'tc',
      targetIndex: 4,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // PDF Export -> Export
    {
      sourceIndex: 9,
      sourceType: 'tc',
      targetIndex: 5,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // Import Validation -> Import
    {
      sourceIndex: 10,
      sourceType: 'tc',
      targetIndex: 8,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // API Response -> Perf SLA
    {
      sourceIndex: 11,
      sourceType: 'tc',
      targetIndex: 8,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // Concurrent Users -> Perf SLA
    {
      sourceIndex: 12,
      sourceType: 'tc',
      targetIndex: 8,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // DB Query -> Perf SLA
    {
      sourceIndex: 13,
      sourceType: 'tc',
      targetIndex: 11,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // Keyboard Nav -> A11y
    {
      sourceIndex: 14,
      sourceType: 'tc',
      targetIndex: 11,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // Screen Reader -> A11y
    {
      sourceIndex: 15,
      sourceType: 'tc',
      targetIndex: 11,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // Color Contrast -> A11y
    {
      sourceIndex: 16,
      sourceType: 'tc',
      targetIndex: 7,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // SQL Injection -> Encryption
    {
      sourceIndex: 17,
      sourceType: 'tc',
      targetIndex: 7,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // XSS -> Encryption

    // Test Cases -> Use Cases (project verification)
    {
      sourceIndex: 0,
      sourceType: 'tc',
      targetIndex: 0,
      targetType: 'uc',
      type: 'verifies',
      scope: 'project',
    }, // Valid Login -> Login Flow
    {
      sourceIndex: 4,
      sourceType: 'tc',
      targetIndex: 1,
      targetType: 'uc',
      type: 'verifies',
      scope: 'project',
    }, // Password Reset -> Reset UC
    {
      sourceIndex: 6,
      sourceType: 'tc',
      targetIndex: 4,
      targetType: 'uc',
      type: 'verifies',
      scope: 'project',
    }, // CSV Export -> Export Report

    // Meeting notes (project context)
    {
      sourceIndex: 3,
      sourceType: 'info',
      targetIndex: 0,
      targetType: 'uc',
      type: 'related_to',
      scope: 'project',
    }, // Sprint Planning -> Login
    {
      sourceIndex: 4,
      sourceType: 'info',
      targetIndex: 0,
      targetType: 'req',
      type: 'related_to',
      scope: 'project',
    }, // Security Review -> Auth
    {
      sourceIndex: 4,
      sourceType: 'info',
      targetIndex: 7,
      targetType: 'req',
      type: 'related_to',
      scope: 'project',
    }, // Security Review -> Encryption

    // Technical notes (project documentation)
    {
      sourceIndex: 5,
      sourceType: 'info',
      targetIndex: 8,
      targetType: 'req',
      type: 'related_to',
      scope: 'project',
    }, // API Versioning -> Perf
    {
      sourceIndex: 6,
      sourceType: 'info',
      targetIndex: 6,
      targetType: 'req',
      type: 'related_to',
      scope: 'project',
    }, // Deployment -> Backup
    {
      sourceIndex: 7,
      sourceType: 'info',
      targetIndex: 8,
      targetType: 'req',
      type: 'related_to',
      scope: 'project',
    }, // Error Handling -> Perf
  ],
};
