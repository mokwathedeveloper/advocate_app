# LegalPro Case Management System - Usage Examples v1.0.1

## Table of Contents

1. [Basic Case Operations](#basic-case-operations)
2. [Document Management](#document-management)
3. [Note Management](#note-management)
4. [Search and Filtering](#search-and-filtering)
5. [Workflow Management](#workflow-management)
6. [Assignment Management](#assignment-management)
7. [Activity Tracking](#activity-tracking)
8. [Bulk Operations](#bulk-operations)
9. [Real-world Scenarios](#real-world-scenarios)

## Basic Case Operations

### Creating a New Case

```javascript
// Example: Creating a corporate merger case
const newCase = await client.createCase({
  title: "ABC Corp Merger with XYZ Inc",
  description: "Due diligence and legal review for corporate merger between ABC Corp and XYZ Inc. Estimated value: $50M",
  caseType: "corporate",
  priority: "high",
  clientId: "client_abc_corp_id",
  advocateId: "advocate_corporate_specialist_id",
  courtDetails: {
    courtName: "Delaware Court of Chancery",
    judge: "Justice Williams"
  },
  billing: {
    billingType: "hourly",
    hourlyRate: 750,
    estimatedHours: 200
  },
  expectedCompletion: "2024-08-15T00:00:00Z",
  tags: ["merger", "corporate", "due-diligence", "high-value"],
  isUrgent: true
});

console.log(`Case created: ${newCase.data.caseNumber}`);
```

### Retrieving Case Information

```javascript
// Get detailed case information
const caseDetails = await client.getCase("case_id_here");

console.log("Case Information:");
console.log(`Title: ${caseDetails.data.case.title}`);
console.log(`Status: ${caseDetails.data.case.status}`);
console.log(`Progress: ${caseDetails.data.case.progress}%`);
console.log(`Documents: ${caseDetails.data.documents.length}`);
console.log(`Notes: ${caseDetails.data.notes.length}`);

// Check user permissions
const permissions = caseDetails.data.permissions;
if (permissions.canEdit) {
  console.log("User can edit this case");
}
```

### Updating Case Information

```javascript
// Update case priority and add notes
const updateResult = await client.updateCase("case_id_here", {
  priority: "urgent",
  notes: "Client requested expedited review due to regulatory deadline",
  statusChangeReason: "Regulatory compliance deadline moved up",
  tags: ["merger", "corporate", "urgent", "regulatory"]
});

console.log("Case updated successfully");
```

### Listing Cases with Filters

```javascript
// Get all open corporate cases assigned to current advocate
const cases = await client.getCases({
  status: "open",
  caseType: "corporate",
  priority: "high",
  page: 1,
  limit: 20,
  sortBy: "lastActivity",
  sortOrder: "desc"
});

console.log(`Found ${cases.total} cases`);
cases.data.forEach(case => {
  console.log(`${case.caseNumber}: ${case.title} (${case.status})`);
});
```

## Document Management

### Uploading Documents

```javascript
// Upload a contract document
const fs = require('fs');

const documentFile = fs.createReadStream('./contracts/merger_agreement.pdf');

const uploadResult = await client.uploadDocument("case_id_here", documentFile, {
  documentType: "contract",
  description: "Main merger agreement between ABC Corp and XYZ Inc",
  accessLevel: "confidential",
  category: "legal-documents",
  tags: "merger,contract,confidential"
});

console.log(`Document uploaded: ${uploadResult.data.originalName}`);
```

### Bulk Document Upload

```javascript
// Upload multiple documents at once
const documents = [
  {
    file: fs.createReadStream('./docs/due_diligence_report.pdf'),
    type: "report",
    description: "Due diligence report",
    accessLevel: "restricted"
  },
  {
    file: fs.createReadStream('./docs/financial_statements.xlsx'),
    type: "financial",
    description: "Q4 2023 Financial statements",
    accessLevel: "confidential"
  },
  {
    file: fs.createReadStream('./docs/board_resolution.pdf'),
    type: "resolution",
    description: "Board resolution approving merger",
    accessLevel: "restricted"
  }
];

const uploadResults = [];
for (const doc of documents) {
  try {
    const result = await client.uploadDocument("case_id_here", doc.file, {
      documentType: doc.type,
      description: doc.description,
      accessLevel: doc.accessLevel
    });
    uploadResults.push({ success: true, document: doc.description, id: result.data.id });
  } catch (error) {
    uploadResults.push({ success: false, document: doc.description, error: error.message });
  }
}

console.log("Upload Results:", uploadResults);
```

### Downloading Documents

```javascript
// Download a specific document
const documentId = "doc_id_here";
const savePath = "./downloads/merger_agreement.pdf";

await client.downloadDocument(documentId, savePath);
console.log(`Document downloaded to ${savePath}`);
```

### Managing Document Access

```javascript
// Update document access level
await client.updateDocument("doc_id_here", {
  accessLevel: "public",
  description: "Updated: Public version of merger agreement",
  tags: ["merger", "contract", "public", "final"]
});

// Get documents with specific access level
const confidentialDocs = await client.getCaseDocuments("case_id_here", {
  accessLevel: "confidential",
  documentType: "contract"
});

console.log(`Found ${confidentialDocs.count} confidential contracts`);
```

## Note Management

### Creating Different Types of Notes

```javascript
// Meeting notes
const meetingNote = await client.createNote("case_id_here", {
  title: "Client Meeting - Merger Timeline Discussion",
  content: `
    Meeting Date: January 21, 2024
    Attendees: John Advocate, Jane Client (CEO), Bob CFO

    Key Discussion Points:
    1. Regulatory approval timeline - expect 4-6 months
    2. Due diligence completion by March 15
    3. Board approval scheduled for February 28

    Action Items:
    - Prepare regulatory filing documents
    - Schedule follow-up with regulatory counsel
    - Review financial projections
  `,
  noteType: "meeting",
  priority: "high",
  tags: ["meeting", "timeline", "regulatory"],
  meetingDetails: {
    attendees: ["client_ceo_id", "client_cfo_id"],
    duration: 90,
    location: "Client Office - Conference Room A",
    meetingDate: "2024-01-21T14:00:00Z"
  },
  followUp: {
    required: true,
    dueDate: "2024-01-25T00:00:00Z",
    assignedTo: "advocate_id_here"
  }
});

// Legal research note
const researchNote = await client.createNote("case_id_here", {
  title: "Antitrust Considerations for Merger",
  content: `
    Research Summary: Antitrust implications for ABC-XYZ merger

    Key Findings:
    1. Market concentration analysis shows combined entity would have 35% market share
    2. Hart-Scott-Rodino filing required due to transaction size
    3. Potential second request likely given market position

    Recommendations:
    - Prepare comprehensive competitive analysis
    - Identify potential divestitures
    - Engage antitrust specialist counsel

    Relevant Cases:
    - Similar merger blocked in 2019 (Case XYZ v. DOJ)
    - Successful precedent with divestiture (ABC Corp 2020)
  `,
  noteType: "research",
  priority: "high",
  isConfidential: true,
  tags: ["antitrust", "research", "regulatory", "hsr"]
});
```

### Managing Note Follow-ups

```javascript
// Get pending follow-ups for current user
const pendingFollowUps = await client.getPendingFollowUps();

console.log(`You have ${pendingFollowUps.count} pending follow-ups:`);
pendingFollowUps.data.forEach(note => {
  console.log(`- ${note.title} (Due: ${note.followUp.dueDate})`);
});

// Complete a follow-up
await client.completeFollowUp("note_id_here", {
  notes: "Regulatory filing documents prepared and submitted to client for review"
});
```

### Pinning Important Notes

```javascript
// Pin an important note
await client.togglePinNote("note_id_here");

// Get pinned notes for a case
const pinnedNotes = await client.getCaseNotes("case_id_here", {
  isPinned: true
});

console.log("Pinned Notes:");
pinnedNotes.data.forEach(note => {
  console.log(`📌 ${note.title}`);
});
```

## Search and Filtering

### Advanced Case Search

```javascript
// Complex search with multiple filters
const searchResults = await client.searchCases("merger antitrust", {
  caseType: ["corporate", "regulatory"],
  status: ["open", "in_review"],
  priority: ["high", "urgent"],
  dateFrom: "2024-01-01T00:00:00Z",
  dateTo: "2024-12-31T23:59:59Z",
  tags: "merger,antitrust",
  courtName: "Delaware",
  sortBy: "lastActivity",
  sortOrder: "desc",
  page: 1,
  limit: 10
});

console.log(`Search found ${searchResults.pagination.total} cases`);
console.log("Applied filters:", searchResults.appliedFilters);

// Display results
searchResults.data.forEach(case => {
  console.log(`${case.caseNumber}: ${case.title}`);
  console.log(`  Status: ${case.status} | Priority: ${case.priority}`);
  console.log(`  Last Activity: ${case.lastActivity}`);
});
```

### Search Suggestions

```javascript
// Get search suggestions as user types
const suggestions = await client.getSearchSuggestions("corp");

console.log("Search Suggestions:");
console.log("Cases:", suggestions.data.suggestions.cases.map(c => c.title));
console.log("Clients:", suggestions.data.suggestions.clients.map(c => `${c.firstName} ${c.lastName}`));
console.log("Advocates:", suggestions.data.suggestions.advocates.map(a => `${a.firstName} ${a.lastName}`));
```

### Document and Note Search

```javascript
// Search within case documents
const documentResults = await client.searchCaseDocuments("case_id_here", "merger agreement");
console.log(`Found ${documentResults.length} documents matching "merger agreement"`);

// Search within case notes
const noteResults = await client.searchCaseNotes("case_id_here", "regulatory timeline");
console.log(`Found ${noteResults.length} notes mentioning "regulatory timeline"`);
```

## Workflow Management

### Managing Case Status

```javascript
// Check available status transitions
const transitions = await client.getAvailableTransitions("case_id_here");

console.log("Available status transitions:");
transitions.data.availableTransitions.forEach(transition => {
  console.log(`- ${transition.status}: ${transition.description}`);
  if (transition.requirements.requiresReason) {
    console.log("  ⚠️  Requires reason");
  }
  if (transition.requirements.requiresOutcome) {
    console.log("  ⚠️  Requires outcome");
  }
});

// Change case status
const statusChange = await client.changeStatus("case_id_here", {
  status: "in_review",
  reason: "All due diligence documents received and initial review completed",
  notes: "Ready for senior partner review before proceeding to regulatory filing"
});

console.log(`Status changed from ${statusChange.data.previousStatus} to ${statusChange.data.newStatus}`);
```

### Workflow Automation

```javascript
// Automated workflow for case closure
async function closeCaseWorkflow(caseId, outcome, finalNotes) {
  try {
    // 1. Add final case notes
    await client.createNote(caseId, {
      title: "Case Closure Summary",
      content: finalNotes,
      noteType: "summary",
      priority: "high",
      tags: ["closure", "summary", "final"]
    });

    // 2. Update case status to closed
    await client.changeStatus(caseId, {
      status: "closed",
      outcome: outcome,
      reason: "Case successfully completed"
    });

    // 3. Generate final report (if needed)
    const caseDetails = await client.getCase(caseId);
    console.log(`Case ${caseDetails.data.case.caseNumber} successfully closed`);

    return { success: true, message: "Case closed successfully" };
  } catch (error) {
    console.error("Case closure workflow failed:", error);
    return { success: false, error: error.message };
  }
}

// Usage
const result = await closeCaseWorkflow(
  "case_id_here",
  "Merger successfully completed with regulatory approval",
  "All regulatory requirements met. Merger closed on schedule with no material issues."
);
```

## Assignment Management

### Advocate Assignment

```javascript
// Get available advocates for assignment
const availableAdvocates = await client.getAvailableAdvocates({
  specialization: "Corporate Law",
  maxWorkload: "moderate"
});

console.log("Available Corporate Law advocates:");
availableAdvocates.data.forEach(advocate => {
  console.log(`${advocate.firstName} ${advocate.lastName} - Workload: ${advocate.workload.workloadLevel}`);
  console.log(`  Active cases: ${advocate.workload.activeCases}`);
  console.log(`  Urgent cases: ${advocate.workload.urgentCases}`);
});

// Assign primary advocate
await client.assignPrimaryAdvocate("case_id_here", {
  advocateId: "advocate_id_here",
  reason: "Specialization in corporate mergers and acquisitions"
});

// Add secondary advocate for support
await client.addSecondaryAdvocate("case_id_here", {
  advocateId: "secondary_advocate_id",
  reason: "Additional support for regulatory compliance",
  role: "Regulatory specialist"
});
```

### Auto-assignment

```javascript
// Automatically assign best available advocate
const autoAssignment = await client.autoAssignCase("case_id_here", {
  preferredSpecialization: "Corporate Law",
  maxWorkload: "moderate",
  prioritizeExperience: true
});

console.log(`Auto-assigned to: ${autoAssignment.data.advocate.firstName} ${autoAssignment.data.advocate.lastName}`);
console.log(`Selected from ${autoAssignment.data.selectedFrom} available advocates`);
console.log(`Advocate score: ${autoAssignment.data.advocateScore}`);
```

### Case Transfer

```javascript
// Transfer case between advocates
const transfer = await client.transferCase("case_id_here", {
  fromAdvocateId: "current_advocate_id",
  toAdvocateId: "new_advocate_id",
  reason: "Workload balancing and specialization alignment",
  notes: "Transferring to advocate with more experience in international mergers"
});

console.log(`Case transferred from ${transfer.data.fromAdvocate.firstName} to ${transfer.data.toAdvocate.firstName}`);
```

## Activity Tracking

### Monitoring Case Activities

```javascript
// Get recent case activities
const activities = await client.getCaseActivities("case_id_here", {
  types: "case_created,status_changed,document_uploaded,note_added",
  dateFrom: "2024-01-01T00:00:00Z",
  includeSystem: true,
  page: 1,
  limit: 20
});

console.log("Recent Case Activities:");
activities.data.forEach(activity => {
  console.log(`${activity.performedAt}: ${activity.action}`);
  console.log(`  ${activity.description}`);
  console.log(`  By: ${activity.performedBy.firstName} ${activity.performedBy.lastName}`);
});
```

### Activity Statistics

```javascript
// Get activity statistics for reporting
const stats = await client.getActivityStatistics({
  dateFrom: "2024-01-01T00:00:00Z",
  dateTo: "2024-01-31T23:59:59Z"
});

console.log("Activity Statistics for January 2024:");
console.log("By Type:");
stats.data.byType.forEach(stat => {
  console.log(`  ${stat._id}: ${stat.count} activities`);
});

console.log("By User:");
stats.data.byUser.forEach(stat => {
  console.log(`  ${stat.user.firstName} ${stat.user.lastName}: ${stat.count} activities`);
});
```

## Bulk Operations

### Bulk Case Updates

```javascript
// Update multiple cases at once
const caseIds = ["case_1", "case_2", "case_3"];
const bulkUpdateResults = [];

for (const caseId of caseIds) {
  try {
    const result = await client.updateCase(caseId, {
      tags: ["bulk-update", "q1-review"],
      notes: "Added Q1 review tag for quarterly assessment"
    });
    bulkUpdateResults.push({ caseId, success: true });
  } catch (error) {
    bulkUpdateResults.push({ caseId, success: false, error: error.message });
  }
}

console.log("Bulk update results:", bulkUpdateResults);
```

### Bulk Status Changes

```javascript
// Change status for multiple cases
const bulkStatusChange = await client.bulkStatusChange({
  caseIds: ["case_1", "case_2", "case_3"],
  newStatus: "in_review",
  reason: "Quarterly review process initiated"
});

console.log(`Successfully updated: ${bulkStatusChange.data.successful.length} cases`);
console.log(`Failed updates: ${bulkStatusChange.data.failed.length} cases`);
```

## Real-world Scenarios

### Scenario 1: New Client Onboarding

```javascript
async function onboardNewClient(clientData, initialCaseData) {
  try {
    // 1. Create the case
    const newCase = await client.createCase({
      title: initialCaseData.title,
      description: initialCaseData.description,
      caseType: initialCaseData.type,
      priority: "medium",
      clientId: clientData.id,
      expectedCompletion: initialCaseData.expectedCompletion
    });

    console.log(`Created case: ${newCase.data.caseNumber}`);

    // 2. Auto-assign appropriate advocate
    const assignment = await client.autoAssignCase(newCase.data.id, {
      preferredSpecialization: initialCaseData.specialization,
      maxWorkload: "moderate"
    });

    // 3. Create initial consultation note
    await client.createNote(newCase.data.id, {
      title: "Initial Client Consultation",
      content: `
        New client onboarding completed.

        Client: ${clientData.firstName} ${clientData.lastName}
        Company: ${clientData.company}
        Matter: ${initialCaseData.title}

        Next steps:
        1. Gather initial documentation
        2. Schedule detailed consultation
        3. Prepare engagement letter
      `,
      noteType: "consultation",
      followUp: {
        required: true,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        assignedTo: assignment.data.advocate.id
      }
    });

    // 4. Set case status to open
    await client.changeStatus(newCase.data.id, {
      status: "open",
      reason: "Client onboarding completed, case ready for active work"
    });

    return {
      success: true,
      caseNumber: newCase.data.caseNumber,
      assignedAdvocate: assignment.data.advocate
    };

  } catch (error) {
    console.error("Client onboarding failed:", error);
    return { success: false, error: error.message };
  }
}
```

### Scenario 2: Case Closure and Archival

```javascript
async function completeCaseClosure(caseId, closureData) {
  try {
    // 1. Verify all requirements are met
    const caseDetails = await client.getCase(caseId);
    const case_data = caseDetails.data.case;

    // Check if case can be closed
    const transitions = await client.getAvailableTransitions(caseId);
    const canClose = transitions.data.availableTransitions.some(t => t.status === "closed");

    if (!canClose) {
      throw new Error("Case cannot be closed in current status");
    }

    // 2. Create final summary note
    await client.createNote(caseId, {
      title: "Case Closure Summary",
      content: `
        Case Closure Summary for ${case_data.caseNumber}

        Final Outcome: ${closureData.outcome}

        Case Statistics:
        - Duration: ${Math.ceil((new Date() - new Date(case_data.dateCreated)) / (1000 * 60 * 60 * 24))} days
        - Documents: ${caseDetails.data.documents.length}
        - Notes: ${caseDetails.data.notes.length}

        Final Notes: ${closureData.finalNotes}

        Client Satisfaction: ${closureData.clientSatisfaction || 'Not rated'}
      `,
      noteType: "summary",
      priority: "high",
      tags: ["closure", "summary", "final"]
    });

    // 3. Close the case
    await client.changeStatus(caseId, {
      status: "closed",
      outcome: closureData.outcome,
      reason: "Case successfully completed"
    });

    // 4. Generate closure report
    const finalCaseDetails = await client.getCase(caseId);

    console.log(`Case ${case_data.caseNumber} successfully closed`);
    console.log(`Final status: ${finalCaseDetails.data.case.status}`);
    console.log(`Outcome: ${finalCaseDetails.data.case.outcome}`);

    return {
      success: true,
      caseNumber: case_data.caseNumber,
      closureDate: new Date().toISOString(),
      outcome: closureData.outcome
    };

  } catch (error) {
    console.error("Case closure failed:", error);
    return { success: false, error: error.message };
  }
}

// Usage
const closureResult = await completeCaseClosure("case_id_here", {
  outcome: "Merger successfully completed with all regulatory approvals obtained",
  finalNotes: "All deliverables completed on time. Client expressed high satisfaction with service quality.",
  clientSatisfaction: "Excellent"
});
```

### Scenario 3: Emergency Case Escalation

```javascript
async function escalateEmergencyCase(caseId, escalationReason) {
  try {
    // 1. Update case priority to urgent
    await client.updateCase(caseId, {
      priority: "urgent",
      isUrgent: true,
      notes: `ESCALATED: ${escalationReason}`
    });

    // 2. Add emergency note
    const emergencyNote = await client.createNote(caseId, {
      title: "🚨 EMERGENCY ESCALATION",
      content: `
        URGENT ESCALATION NOTICE

        Escalation Time: ${new Date().toISOString()}
        Reason: ${escalationReason}

        Immediate Actions Required:
        1. Senior partner review within 2 hours
        2. Client notification within 1 hour
        3. Resource reallocation if necessary

        This case now requires immediate attention and priority handling.
      `,
      noteType: "emergency",
      priority: "urgent",
      tags: ["emergency", "escalation", "urgent"],
      followUp: {
        required: true,
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
        assignedTo: "senior_partner_id"
      }
    });

    // 3. Pin the emergency note
    await client.togglePinNote(emergencyNote.data.id);

    // 4. Add senior advocate if not already assigned
    const caseDetails = await client.getCase(caseId);
    const hasSecondaryAdvocate = caseDetails.data.case.advocate.secondary &&
                                 caseDetails.data.case.advocate.secondary.length > 0;

    if (!hasSecondaryAdvocate) {
      await client.addSecondaryAdvocate(caseId, {
        advocateId: "senior_partner_id",
        reason: "Emergency escalation - senior oversight required",
        role: "Senior oversight"
      });
    }

    console.log(`Case ${caseId} successfully escalated`);
    return { success: true, escalationTime: new Date().toISOString() };

  } catch (error) {
    console.error("Emergency escalation failed:", error);
    return { success: false, error: error.message };
  }
}
```

---

These examples demonstrate practical usage patterns for the LegalPro Case Management System. Each example includes error handling and follows best practices for API integration. For more specific use cases or custom implementations, refer to the API documentation and integration guide.