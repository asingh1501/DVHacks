import { PrismaClient } from "@prisma/client";
import * as CryptoJS from "crypto-js";

const prisma = new PrismaClient();

function generateHash(text: string): string {
  return CryptoJS.SHA256(text).toString();
}

const sampleDocuments = [
  // 1. Disputed Invoice (High priority, AP team, missing PO number)
  {
    fileName: "invoice-acme-corp-2024.pdf",
    fileType: "pdf",
    originalText: `INVOICE

Invoice Number: INV-2024-0315
Date: March 1, 2024
Due Date: March 15, 2024

From:
Acme Corp
123 Business Ave
San Francisco, CA 94105
billing@acmecorp.com
(415) 555-0123

Bill To:
Client Services Inc
456 Corporate Blvd
New York, NY 10001

Description                     Quantity    Rate        Amount
Consulting Services - Q1           50 hrs    $90.00    $4,500.00
Project Management                 10 hrs    $90.00      $900.00
                                                       ----------
                                           Subtotal:   $5,400.00
                                           Tax (0%):       $0.00
                                           TOTAL:      $5,400.00

Payment Terms: Net 15
Payment Method: Wire Transfer or Check

Note: This invoice amount exceeds the contracted rate. Please review.`,
    docType: "invoice",
    summary: "Invoice from Acme Corp for consulting services totaling $5,400. Payment due by March 15, 2024. Amount exceeds contracted rate - requires verification.",
    entities: {
      people: [],
      organizations: ["Acme Corp", "Client Services Inc"],
      dates: ["March 1, 2024", "March 15, 2024"],
      amounts: ["$5,400.00", "$4,500.00", "$900.00", "$90.00"],
      ids: ["INV-2024-0315"],
      locations: ["123 Business Ave, San Francisco, CA 94105", "456 Corporate Blvd, New York, NY 10001"],
      emails: ["billing@acmecorp.com"],
      phones: ["(415) 555-0123"],
    },
    ownerTeam: "AP",
    priority: "high",
    confidence: 0.92,
    aiRationale: "Classified as invoice based on presence of invoice number, billing details, and line items. Assigned to AP with high priority due to amount discrepancy note.",
    missingFields: ["Purchase Order Number", "Contract Reference"],
    riskFlags: [
      { flag: "amount_discrepancy", severity: "warning", description: "Invoice notes that amount exceeds contracted rate" },
      { flag: "missing_po", severity: "warning", description: "No purchase order reference provided" },
    ],
    complianceIssues: null,
    checklist: [
      { id: "1", task: "Verify vendor information against records", completed: false },
      { id: "2", task: "Match invoice to purchase order", completed: false },
      { id: "3", task: "Verify contracted rate vs invoiced rate", completed: false },
      { id: "4", task: "Request clarification on amount discrepancy", completed: false },
      { id: "5", task: "Submit for approval after verification", completed: false },
    ],
    draftEmail: {
      to: ["billing@acmecorp.com"],
      cc: ["procurement@clientservices.com"],
      subject: "RE: Invoice INV-2024-0315 - Clarification Needed",
      body: `Dear Acme Corp Billing Team,

We have received invoice INV-2024-0315 for $5,400.00. Before processing, we need clarification on the following:

1. The invoice notes that the amount exceeds the contracted rate. Please provide documentation supporting the rate adjustment.
2. We do not have a purchase order reference for this invoice. Please provide the PO number or contract reference.

Please respond at your earliest convenience to avoid payment delays.

Best regards`,
      tone: "professional",
    },
    suggestedActions: [
      { type: "checklist", title: "Verify Invoice", priority: "high", stepsOrBody: ["Verify rates", "Match to PO", "Get approval"] },
    ],
    tags: ["invoice", "high-priority", "needs-verification", "acme-corp"],
    status: "new",
  },

  // 2. NDA Contract Excerpt (Legal team, missing signatures)
  {
    fileName: "nda-techpartner-draft.docx",
    fileType: "docx",
    originalText: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of __________ (the "Effective Date")

BETWEEN:

TechPartner Solutions LLC ("Disclosing Party")
Address: 789 Innovation Drive, Austin, TX 78701
Contact: legal@techpartner.com

AND:

____________________ ("Receiving Party")
Address: ____________________

WHEREAS, the Disclosing Party possesses certain confidential and proprietary information relating to software development methodologies and trade secrets;

WHEREAS, the Receiving Party desires to receive and the Disclosing Party desires to disclose such information for the purpose of evaluating a potential business relationship;

NOW, THEREFORE, the parties agree as follows:

1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" means any data or information, oral or written, disclosed by the Disclosing Party that is designated as confidential.

2. OBLIGATIONS
The Receiving Party agrees to:
a) Hold the Confidential Information in strict confidence
b) Not disclose the Confidential Information to any third parties
c) Use the Confidential Information solely for the Purpose

3. TERM
This Agreement shall remain in effect for a period of three (3) years from the Effective Date.

4. GOVERNING LAW
This Agreement shall be governed by the laws of the State of Texas.

IN WITNESS WHEREOF, the parties have executed this Agreement.

Disclosing Party: _________________________  Date: __________
Receiving Party: _________________________  Date: __________`,
    docType: "contract",
    summary: "Draft Non-Disclosure Agreement with TechPartner Solutions LLC. Document is incomplete with missing receiving party information and signatures.",
    entities: {
      people: [],
      organizations: ["TechPartner Solutions LLC"],
      dates: [],
      amounts: [],
      ids: [],
      locations: ["789 Innovation Drive, Austin, TX 78701"],
      emails: ["legal@techpartner.com"],
      phones: [],
    },
    ownerTeam: "Legal",
    priority: "medium",
    confidence: 0.88,
    aiRationale: "Classified as contract based on legal agreement structure, whereas clauses, and signature blocks. Assigned to Legal team for review.",
    missingFields: ["Effective Date", "Receiving Party Name", "Receiving Party Address", "Signatures"],
    riskFlags: [
      { flag: "unsigned_document", severity: "warning", description: "Document appears to be unsigned draft" },
      { flag: "incomplete_party_info", severity: "warning", description: "Receiving party information is blank" },
    ],
    complianceIssues: null,
    checklist: [
      { id: "1", task: "Review NDA terms and conditions", completed: false },
      { id: "2", task: "Verify confidentiality scope is appropriate", completed: false },
      { id: "3", task: "Complete receiving party information", completed: false },
      { id: "4", task: "Get legal approval", completed: false },
      { id: "5", task: "Obtain authorized signatures", completed: false },
    ],
    draftEmail: {
      to: ["legal@techpartner.com"],
      cc: [],
      subject: "RE: NDA Draft Review - TechPartner Solutions",
      body: `Dear TechPartner Legal Team,

We have received the draft NDA and are currently reviewing it. We will complete our receiving party information and return the executed copy.

Please confirm the following:
1. Is the 3-year term negotiable?
2. Are there any standard amendments you typically accept?

We aim to have this completed within 5 business days.

Best regards`,
      tone: "formal",
    },
    suggestedActions: [],
    tags: ["nda", "contract", "draft", "legal-review"],
    status: "pending_review",
  },

  // 3. Software Engineer Resume (HR team, urgent priority)
  {
    fileName: "resume-jane-doe-swe.pdf",
    fileType: "pdf",
    originalText: `JANE DOE
Senior Software Engineer

Contact: jane.doe@email.com | (555) 123-4567 | San Francisco, CA
LinkedIn: linkedin.com/in/janedoe | GitHub: github.com/janedoe

SUMMARY
Experienced software engineer with 8+ years of expertise in full-stack development, cloud architecture, and team leadership. Passionate about building scalable systems and mentoring junior developers.

EXPERIENCE

Senior Software Engineer | TechGiant Inc. | Jan 2021 - Present
- Led development of microservices architecture serving 10M+ daily users
- Reduced API response time by 40% through optimization and caching strategies
- Mentored team of 5 junior developers, conducted code reviews
- Technologies: Python, Go, Kubernetes, AWS, PostgreSQL

Software Engineer | StartupXYZ | Jun 2018 - Dec 2020
- Built real-time data processing pipeline handling 1M events/hour
- Implemented CI/CD pipelines reducing deployment time by 60%
- Technologies: Node.js, TypeScript, React, MongoDB, Docker

Junior Developer | WebAgency Co. | Aug 2016 - May 2018
- Developed responsive web applications for enterprise clients
- Technologies: JavaScript, React, HTML/CSS, MySQL

EDUCATION
B.S. Computer Science | Stanford University | 2016
GPA: 3.8/4.0

SKILLS
Languages: Python, Go, TypeScript, JavaScript, SQL
Frameworks: React, Node.js, FastAPI, Django
Cloud: AWS, GCP, Kubernetes, Docker
Databases: PostgreSQL, MongoDB, Redis

CERTIFICATIONS
- AWS Solutions Architect - Professional
- Google Cloud Professional Cloud Architect`,
    docType: "resume",
    summary: "Senior Software Engineer resume for Jane Doe with 8+ years experience. Strong background in full-stack development, cloud architecture, and team leadership. Currently at TechGiant Inc.",
    entities: {
      people: ["Jane Doe"],
      organizations: ["TechGiant Inc.", "StartupXYZ", "WebAgency Co.", "Stanford University"],
      dates: ["Jan 2021", "Jun 2018", "Dec 2020", "Aug 2016", "May 2018", "2016"],
      amounts: [],
      ids: [],
      locations: ["San Francisco, CA"],
      emails: ["jane.doe@email.com"],
      phones: ["(555) 123-4567"],
    },
    ownerTeam: "HR",
    priority: "urgent",
    confidence: 0.95,
    aiRationale: "Classified as resume based on personal information, work experience, education, and skills sections. Assigned to HR with urgent priority due to strong candidate qualifications.",
    missingFields: [],
    riskFlags: [],
    complianceIssues: null,
    checklist: [
      { id: "1", task: "Review qualifications against job requirements", completed: true },
      { id: "2", task: "Verify years of experience", completed: true },
      { id: "3", task: "Schedule initial phone screening", completed: false },
      { id: "4", task: "Send interview invitation", completed: false },
      { id: "5", task: "Update applicant tracking system", completed: false },
    ],
    draftEmail: {
      to: ["jane.doe@email.com"],
      cc: ["recruiting@company.com"],
      subject: "Interview Invitation - Senior Software Engineer Position",
      body: `Dear Jane,

Thank you for applying to the Senior Software Engineer position at our company. After reviewing your impressive background, we would like to invite you for an interview.

Your experience with microservices architecture and team leadership aligns well with what we're looking for.

Please let us know your availability for a 30-minute phone screening this week.

Best regards,
HR Team`,
      tone: "professional",
    },
    suggestedActions: [],
    tags: ["resume", "candidate", "senior-engineer", "urgent"],
    status: "in_progress",
  },

  // 4. IT Incident Report (IT team, critical security flag)
  {
    fileName: "incident-report-sec-001.txt",
    fileType: "txt",
    originalText: `SECURITY INCIDENT REPORT

Incident ID: SEC-2024-001
Date Reported: March 10, 2024
Reported By: John Smith, Security Analyst
Severity: Critical

INCIDENT SUMMARY:
Unauthorized access attempt detected on production database server DB-PROD-01 at 02:47 AM EST on March 10, 2024. Multiple failed login attempts from IP address 192.168.100.55 targeting the admin account.

AFFECTED SYSTEMS:
- DB-PROD-01 (Production Database Server)
- API-PROD-02 (API Gateway)

TIMELINE:
02:45 AM - First failed login attempt detected
02:47 AM - Alert triggered after 5th failed attempt
02:48 AM - Account temporarily locked
02:52 AM - Security team notified
03:15 AM - IP address blocked at firewall level

IMMEDIATE ACTIONS TAKEN:
1. Admin account temporarily disabled
2. Suspicious IP address blocked
3. All sessions terminated on affected server
4. Enhanced logging enabled

INVESTIGATION STATUS:
Preliminary analysis suggests attempted brute force attack. IP address traces to VPN exit node. Further investigation required to determine if any data was accessed.

ROOT CAUSE:
Under investigation. Potentially weak password policy exploitation attempt.

RECOMMENDATIONS:
1. Implement multi-factor authentication for all admin accounts
2. Review and strengthen password policies
3. Deploy IP-based rate limiting
4. Conduct security awareness training

Contact: security@company.com
Emergency Line: (555) 911-0000`,
    docType: "incident_report",
    summary: "Critical security incident: Unauthorized access attempt on production database server. Multiple failed login attempts detected and blocked. Investigation ongoing.",
    entities: {
      people: ["John Smith"],
      organizations: [],
      dates: ["March 10, 2024"],
      amounts: [],
      ids: ["SEC-2024-001", "DB-PROD-01", "API-PROD-02"],
      locations: [],
      emails: ["security@company.com"],
      phones: ["(555) 911-0000"],
    },
    ownerTeam: "IT",
    priority: "urgent",
    confidence: 0.94,
    aiRationale: "Classified as incident report based on incident ID, severity level, timeline, and remediation sections. Assigned to IT with urgent priority due to critical security nature.",
    missingFields: ["Root Cause Analysis", "Data Breach Assessment"],
    riskFlags: [
      { flag: "security_breach_attempt", severity: "critical", description: "Unauthorized access attempt on production system" },
      { flag: "admin_account_targeted", severity: "critical", description: "Admin account was the target of attack" },
      { flag: "investigation_ongoing", severity: "warning", description: "Root cause not yet determined" },
    ],
    complianceIssues: [
      { issue: "Potential data breach notification requirement", regulation: "GDPR/CCPA", recommendation: "Assess if any PII was potentially accessed and prepare notification if required" },
    ],
    checklist: [
      { id: "1", task: "Complete root cause analysis", completed: false },
      { id: "2", task: "Verify no data was exfiltrated", completed: false },
      { id: "3", task: "Implement MFA for admin accounts", completed: false },
      { id: "4", task: "Review firewall rules", completed: false },
      { id: "5", task: "Schedule security awareness training", completed: false },
      { id: "6", task: "Prepare incident report for management", completed: false },
    ],
    draftEmail: {
      to: ["ciso@company.com", "cto@company.com"],
      cc: ["security@company.com"],
      subject: "URGENT: Security Incident SEC-2024-001 - Executive Briefing",
      body: `Team,

This is to notify you of a critical security incident detected on March 10, 2024.

Key Points:
- Unauthorized access attempt on production database
- Attack was blocked and contained
- No confirmed data breach at this time
- Investigation ongoing

Immediate Actions Taken:
- Suspicious account disabled
- IP blocked at firewall
- Enhanced monitoring enabled

Recommended Next Steps:
- Implement MFA across all admin accounts
- Security policy review

A full incident report will follow within 24 hours.

John Smith
Security Analyst`,
      tone: "urgent",
    },
    suggestedActions: [],
    tags: ["security", "incident", "critical", "investigation"],
    status: "in_progress",
  },

  // 5. Sales Meeting Notes (Sales team, follow-up actions)
  {
    fileName: "meeting-notes-enterprise-deal.txt",
    fileType: "txt",
    originalText: `MEETING NOTES

Date: March 8, 2024
Time: 2:00 PM - 3:30 PM
Location: Conference Room B / Zoom

Attendees:
- Sarah Johnson (Account Executive)
- Mike Chen (Solutions Architect)
- Emily Davis (VP Sales)
- Client: Robert Williams (CTO, Enterprise Corp)
- Client: Lisa Brown (Director of IT, Enterprise Corp)

Meeting Type: Enterprise Sales Discovery Call

AGENDA:
1. Introduction and company overview
2. Client pain points discussion
3. Solution presentation
4. Pricing discussion
5. Next steps

DISCUSSION SUMMARY:

Client Background:
Enterprise Corp is a Fortune 500 manufacturing company looking to modernize their document management system. Current annual IT budget: $15M. Looking to deploy solution across 5,000 employees.

Pain Points Identified:
- Current system is outdated (10+ years old)
- Manual document processing takes 2-3 days
- Compliance tracking is difficult
- Integration with SAP required

Solution Fit:
- Our platform can reduce processing time to under 1 hour
- Built-in compliance tracking for SOX requirements
- SAP integration available via standard connector

Pricing Discussion:
- Quoted enterprise tier at $150,000/year
- Client requested volume discount for multi-year commitment
- Potential deal value: $400,000 (3-year contract)

Client Concerns:
- Implementation timeline (need Q2 deployment)
- Data migration complexity
- Training requirements for staff

ACTION ITEMS:
1. [Sarah] Send detailed proposal by March 12
2. [Mike] Prepare technical architecture document
3. [Emily] Approve 15% discount for 3-year term
4. [Mike] Schedule technical deep-dive with IT team
5. [Sarah] Follow up call scheduled for March 15

Next Meeting: March 15, 2024 at 10:00 AM`,
    docType: "meeting_notes",
    summary: "Enterprise sales discovery call with Enterprise Corp. Potential $400K deal for document management system. Strong fit identified, pending proposal and technical review.",
    entities: {
      people: ["Sarah Johnson", "Mike Chen", "Emily Davis", "Robert Williams", "Lisa Brown"],
      organizations: ["Enterprise Corp"],
      dates: ["March 8, 2024", "March 12", "March 15, 2024"],
      amounts: ["$15M", "$150,000/year", "$400,000"],
      ids: [],
      locations: ["Conference Room B"],
      emails: [],
      phones: [],
    },
    ownerTeam: "Sales",
    priority: "high",
    confidence: 0.91,
    aiRationale: "Classified as meeting notes based on attendee list, agenda, and action items structure. Assigned to Sales with high priority due to significant deal value.",
    missingFields: [],
    riskFlags: [
      { flag: "timeline_risk", severity: "warning", description: "Client requires Q2 deployment - tight timeline" },
    ],
    complianceIssues: null,
    checklist: [
      { id: "1", task: "Send detailed proposal by March 12", completed: false, assignee: "Sarah Johnson" },
      { id: "2", task: "Prepare technical architecture document", completed: false, assignee: "Mike Chen" },
      { id: "3", task: "Approve 15% discount for 3-year term", completed: false, assignee: "Emily Davis" },
      { id: "4", task: "Schedule technical deep-dive with IT team", completed: false, assignee: "Mike Chen" },
      { id: "5", task: "Follow up call on March 15", completed: false, assignee: "Sarah Johnson" },
    ],
    draftEmail: {
      to: ["robert.williams@enterprisecorp.com", "lisa.brown@enterprisecorp.com"],
      cc: ["sarah.johnson@company.com", "mike.chen@company.com"],
      subject: "Thank You - Enterprise Corp Discovery Call Follow-up",
      body: `Dear Robert and Lisa,

Thank you for taking the time to meet with us today to discuss your document management modernization initiative.

Based on our conversation, I'm confident that our platform can address your key challenges:
- Reduce document processing from 2-3 days to under 1 hour
- Provide built-in SOX compliance tracking
- Seamlessly integrate with your SAP environment

Next Steps:
1. We will send a detailed proposal by March 12
2. Mike will prepare a technical architecture document for your IT team review
3. We have scheduled a follow-up call for March 15 at 10:00 AM

Please don't hesitate to reach out if you have any questions before then.

Best regards,
Sarah Johnson
Account Executive`,
      tone: "professional",
    },
    suggestedActions: [],
    tags: ["meeting", "enterprise", "sales", "q2-target"],
    status: "in_progress",
  },

  // 6. Privacy Policy Update (Legal team, GDPR compliance issue)
  {
    fileName: "privacy-policy-update-v2.docx",
    fileType: "docx",
    originalText: `PRIVACY POLICY - DRAFT v2.0
Last Updated: [TO BE ADDED]
Effective Date: [TO BE ADDED]

1. INTRODUCTION

This Privacy Policy describes how Company XYZ ("we," "us," or "our") collects, uses, and shares information about you when you use our websites, mobile applications, and other online products and services (collectively, the "Services").

2. INFORMATION WE COLLECT

We collect information you provide directly to us, such as:
- Name and contact information
- Payment information
- Communications with us

We automatically collect certain information, including:
- Device information
- Log information
- Location information
- Cookies and similar technologies

3. USE OF INFORMATION

We use the information we collect to:
- Provide and maintain our Services
- Process transactions
- Send promotional communications
- Analyze usage patterns

4. SHARING OF INFORMATION

We may share your information with:
- Service providers
- Business partners
- Law enforcement when required

5. DATA RETENTION

We retain personal information for as long as necessary to fulfill the purposes outlined in this policy.

6. YOUR RIGHTS

You have the right to:
- Access your personal information
- Request deletion of your data
- Opt out of marketing communications

7. INTERNATIONAL TRANSFERS

We may transfer your information to countries outside your residence.

8. CONTACT US

For questions about this policy, contact: privacy@companyxyz.com

---
REVIEW NOTES:
- Need to add specific data retention periods
- GDPR Article 13 requirements may not be fully met
- Missing cookie consent mechanism description
- No DPO contact information`,
    docType: "policy",
    summary: "Draft privacy policy update for Company XYZ. Document has compliance gaps including missing GDPR requirements, data retention periods, and DPO contact information.",
    entities: {
      people: [],
      organizations: ["Company XYZ"],
      dates: [],
      amounts: [],
      ids: [],
      locations: [],
      emails: ["privacy@companyxyz.com"],
      phones: [],
    },
    ownerTeam: "Legal",
    priority: "high",
    confidence: 0.89,
    aiRationale: "Classified as policy document based on legal policy structure and privacy-related content. Assigned to Legal with high priority due to compliance gaps.",
    missingFields: ["Effective Date", "Data Retention Periods", "DPO Contact", "Cookie Consent Details", "Legal Basis for Processing"],
    riskFlags: [
      { flag: "gdpr_gaps", severity: "critical", description: "GDPR Article 13 requirements may not be fully met" },
      { flag: "missing_dpo", severity: "warning", description: "No Data Protection Officer contact information" },
      { flag: "incomplete_retention", severity: "warning", description: "No specific data retention periods defined" },
    ],
    complianceIssues: [
      { issue: "Incomplete legal basis for processing", regulation: "GDPR Article 6", recommendation: "Add explicit legal basis for each processing activity" },
      { issue: "Missing data subject rights details", regulation: "GDPR Article 13-14", recommendation: "Expand rights section with GDPR-specific rights (portability, restriction, automated decision-making)" },
      { issue: "International transfer mechanism not specified", regulation: "GDPR Chapter V", recommendation: "Specify transfer mechanism (SCCs, adequacy decisions, etc.)" },
    ],
    checklist: [
      { id: "1", task: "Add specific data retention periods", completed: false },
      { id: "2", task: "Include all GDPR Article 13 required information", completed: false },
      { id: "3", task: "Add DPO contact details", completed: false },
      { id: "4", task: "Document cookie consent mechanism", completed: false },
      { id: "5", task: "Specify international transfer safeguards", completed: false },
      { id: "6", task: "Get legal review and approval", completed: false },
    ],
    draftEmail: {
      to: ["dpo@companyxyz.com"],
      cc: ["legal@companyxyz.com"],
      subject: "Privacy Policy Update - Compliance Review Required",
      body: `Dear Data Protection Officer,

We have completed a draft update to our Privacy Policy (v2.0). Before publishing, we need your review to ensure full compliance with GDPR and other applicable regulations.

Key areas requiring attention:
1. GDPR Article 13 completeness
2. Data retention period specification
3. International transfer mechanisms
4. Cookie consent documentation

Please review and provide feedback by [DATE].

Best regards`,
      tone: "formal",
    },
    suggestedActions: [],
    tags: ["policy", "privacy", "gdpr", "compliance", "draft"],
    status: "pending_review",
  },

  // 7. Purchase Order (Procurement, pending approval)
  {
    fileName: "po-office-supplies-march.pdf",
    fileType: "pdf",
    originalText: `PURCHASE ORDER

PO Number: PO-2024-0892
Date: March 5, 2024
Required By: March 20, 2024

SHIP TO:
Company Headquarters
100 Main Street
Boston, MA 02101

VENDOR:
Office Essentials Inc.
500 Supply Drive
Chicago, IL 60601
orders@officeessentials.com
(312) 555-0100

BILL TO:
Accounts Payable
Company Headquarters
100 Main Street
Boston, MA 02101

Item No.    Description                 Qty    Unit Price    Total
OS-001      Premium Copy Paper (case)    50     $45.00     $2,250.00
OS-002      Ballpoint Pens (box)         30      $8.00       $240.00
OS-003      Legal Pads (dozen)           20     $15.00       $300.00
OS-004      Desk Organizers              15     $25.00       $375.00
OS-005      Whiteboard Markers (set)     25     $12.00       $300.00
                                                           ----------
                                              Subtotal:    $3,465.00
                                              Shipping:      $150.00
                                              Tax (6.25%):   $216.56
                                              TOTAL:       $3,831.56

Payment Terms: Net 30
Shipping Method: Standard Ground

APPROVAL STATUS: PENDING

Requested By: Jennifer Martinez, Office Manager
Department: Operations
Budget Code: OPS-2024-SUPPLIES

Notes:
- Quarterly office supplies replenishment
- Previous PO reference: PO-2023-4521

Authorization Required: Orders over $3,000 require manager approval.`,
    docType: "purchase_order",
    summary: "Purchase order for quarterly office supplies from Office Essentials Inc. Total: $3,831.56. Pending approval - exceeds $3,000 threshold.",
    entities: {
      people: ["Jennifer Martinez"],
      organizations: ["Office Essentials Inc."],
      dates: ["March 5, 2024", "March 20, 2024"],
      amounts: ["$3,831.56", "$3,465.00", "$2,250.00", "$150.00", "$216.56"],
      ids: ["PO-2024-0892", "PO-2023-4521", "OPS-2024-SUPPLIES"],
      locations: ["100 Main Street, Boston, MA 02101", "500 Supply Drive, Chicago, IL 60601"],
      emails: ["orders@officeessentials.com"],
      phones: ["(312) 555-0100"],
    },
    ownerTeam: "Procurement",
    priority: "medium",
    confidence: 0.93,
    aiRationale: "Classified as purchase order based on PO number, line items, shipping details, and approval workflow. Assigned to Procurement.",
    missingFields: ["Manager Approval Signature"],
    riskFlags: [
      { flag: "approval_required", severity: "warning", description: "Order exceeds $3,000 and requires manager approval" },
    ],
    complianceIssues: null,
    checklist: [
      { id: "1", task: "Verify budget availability", completed: true },
      { id: "2", task: "Compare pricing to contracted rates", completed: false },
      { id: "3", task: "Obtain manager approval", completed: false },
      { id: "4", task: "Submit PO to vendor", completed: false },
      { id: "5", task: "Track delivery", completed: false },
    ],
    draftEmail: {
      to: ["manager@company.com"],
      cc: ["jennifer.martinez@company.com", "procurement@company.com"],
      subject: "Approval Required: PO-2024-0892 - Office Supplies ($3,831.56)",
      body: `Dear Manager,

A purchase order requiring your approval has been submitted:

PO Number: PO-2024-0892
Vendor: Office Essentials Inc.
Total Amount: $3,831.56
Required By: March 20, 2024
Requested By: Jennifer Martinez, Office Manager
Purpose: Quarterly office supplies replenishment

This order exceeds the $3,000 threshold requiring manager approval.

Please review and approve at your earliest convenience.

Best regards,
Procurement Team`,
      tone: "professional",
    },
    suggestedActions: [],
    tags: ["purchase-order", "office-supplies", "pending-approval"],
    status: "pending_review",
  },

  // 8. Customer Support Escalation (Support team, urgent)
  {
    fileName: "support-escalation-ticket-5847.txt",
    fileType: "txt",
    originalText: `SUPPORT ESCALATION

Ticket ID: SUP-5847
Priority: Urgent
Customer: Global Manufacturing Ltd.
Account Tier: Enterprise (Annual Contract: $250,000)
Escalation Level: L3 - Management

CUSTOMER CONTACT:
Name: David Chen
Title: VP of Operations
Email: david.chen@globalmanufacturing.com
Phone: (555) 789-0123

ORIGINAL ISSUE:
Date Opened: March 6, 2024
Category: System Outage
Description: Customer reporting complete system unavailability. All 500 users unable to access the platform. Business operations halted.

TIMELINE:
March 6, 09:00 AM - Customer reports issue
March 6, 09:15 AM - L1 support confirms outage
March 6, 10:00 AM - Escalated to L2
March 6, 11:30 AM - Root cause identified: Database connection pool exhausted
March 6, 12:00 PM - Temporary fix applied
March 6, 02:00 PM - Issue reoccurs, customer escalates to management
March 6, 02:30 PM - Escalated to L3

CURRENT STATUS:
System is intermittently available. Customer experiencing continued disruptions. Engineering team actively investigating.

CUSTOMER SENTIMENT:
Extremely frustrated. Has mentioned potential contract termination if issue not resolved by end of day. Requesting executive-level communication.

SLA STATUS:
Uptime SLA: 99.9% - Currently in breach
Response SLA: Met (15 min target, responded in 15 min)
Resolution SLA: 4 hours - BREACHED (currently at 5.5 hours)

IMPACT:
- 500 users affected
- Business operations halted
- Estimated customer loss: $50,000/hour

REQUESTED ACTIONS:
1. Immediate executive outreach to customer
2. Engineering priority escalation
3. Service credit calculation
4. Post-incident review scheduling`,
    docType: "incident_report",
    summary: "Critical support escalation for Enterprise customer Global Manufacturing Ltd. System outage affecting 500 users, SLA breached, potential contract at risk.",
    entities: {
      people: ["David Chen"],
      organizations: ["Global Manufacturing Ltd."],
      dates: ["March 6, 2024"],
      amounts: ["$250,000", "$50,000/hour"],
      ids: ["SUP-5847"],
      locations: [],
      emails: ["david.chen@globalmanufacturing.com"],
      phones: ["(555) 789-0123"],
    },
    ownerTeam: "Support",
    priority: "urgent",
    confidence: 0.96,
    aiRationale: "Classified as support incident based on ticket structure and escalation workflow. Assigned to Support with urgent priority due to SLA breach and contract risk.",
    missingFields: ["Root Cause Resolution", "Service Credit Amount"],
    riskFlags: [
      { flag: "sla_breach", severity: "critical", description: "Resolution SLA has been breached (5.5 hours vs 4 hour target)" },
      { flag: "contract_risk", severity: "critical", description: "Customer has mentioned potential contract termination" },
      { flag: "revenue_impact", severity: "critical", description: "Customer losing estimated $50,000/hour" },
    ],
    complianceIssues: null,
    checklist: [
      { id: "1", task: "Executive outreach to customer", completed: false },
      { id: "2", task: "Engineering priority escalation", completed: true },
      { id: "3", task: "Resolve root cause permanently", completed: false },
      { id: "4", task: "Calculate service credits", completed: false },
      { id: "5", task: "Schedule post-incident review", completed: false },
      { id: "6", task: "Send incident report to customer", completed: false },
    ],
    draftEmail: {
      to: ["david.chen@globalmanufacturing.com"],
      cc: ["ceo@company.com", "vp-engineering@company.com", "support-management@company.com"],
      subject: "URGENT: Global Manufacturing - Executive Update on System Outage",
      body: `Dear David,

I am personally reaching out regarding the system outage you have been experiencing today. First and foremost, I want to sincerely apologize for the disruption this has caused to your operations.

Current Status:
- Our engineering team has identified the root cause and is implementing a permanent fix
- We expect full resolution within the next 2 hours
- A dedicated engineer will remain on standby until we confirm stability

Immediate Actions:
1. We are providing a direct line to our VP of Engineering: (555) 000-0000
2. We will be issuing service credits for the SLA breach
3. We will conduct a full post-incident review and share findings

I understand the critical nature of your operations and the trust you have placed in us. We are committed to making this right.

I am available for a call at your convenience.

Sincerely,
[CEO Name]
Chief Executive Officer`,
      tone: "urgent",
    },
    suggestedActions: [],
    tags: ["escalation", "urgent", "enterprise", "sla-breach", "outage"],
    status: "in_progress",
  },

  // 9. Expense Report (Finance team, missing receipts)
  {
    fileName: "expense-report-q1-travel.pdf",
    fileType: "pdf",
    originalText: `EXPENSE REPORT

Report ID: EXP-2024-0156
Employee: Michael Thompson
Department: Sales
Period: Q1 2024 (January - March)
Submission Date: March 15, 2024

PURPOSE: Q1 Client Meetings and Conference Attendance

EXPENSE DETAILS:

Date        Category          Description                  Amount      Receipt
01/15       Airfare          Flight to NYC (Delta)        $485.00     Yes
01/15-17    Hotel            Marriott NYC (2 nights)      $598.00     Yes
01/16       Meals            Client dinner - ABC Corp     $215.00     Yes
01/17       Transportation   Uber to airport              $65.00      No*
02/08       Conference       SaaS Summit Registration     $899.00     Yes
02/08-10    Hotel            Hilton SF (2 nights)         $720.00     Yes
02/09       Meals            Team dinner                  $320.00     No*
03/05       Airfare          Flight to Chicago            $395.00     Yes
03/05-06    Hotel            Hyatt Chicago (1 night)      $289.00     Yes
03/06       Meals            Client lunch - XYZ Inc       $145.00     Yes
03/06       Transportation   Taxi to meeting              $35.00      No*

SUMMARY:
Total Expenses: $4,166.00
Receipts Attached: 7
Missing Receipts: 3

*Missing receipts noted above require written justification per company policy.

MANAGER APPROVAL: _________________ Date: _________

NOTES:
- All expenses are within per diem limits
- Client entertainment expenses pre-approved
- Missing receipt justifications:
  * 01/17 Uber: Receipt not provided by app
  * 02/09 Dinner: Personal card used, receipt lost
  * 03/06 Taxi: Cash payment, no receipt available

Employee Signature: Michael Thompson
Date: March 15, 2024`,
    docType: "other",
    summary: "Q1 2024 expense report for Michael Thompson (Sales). Total expenses: $4,166.00. Three receipts missing requiring justification before approval.",
    entities: {
      people: ["Michael Thompson"],
      organizations: ["ABC Corp", "XYZ Inc", "Delta", "Marriott", "Hilton", "Hyatt"],
      dates: ["01/15", "01/15-17", "01/16", "01/17", "02/08", "02/08-10", "02/09", "03/05", "03/05-06", "03/06", "March 15, 2024"],
      amounts: ["$4,166.00", "$485.00", "$598.00", "$215.00", "$65.00", "$899.00", "$720.00", "$320.00", "$395.00", "$289.00", "$145.00", "$35.00"],
      ids: ["EXP-2024-0156"],
      locations: ["NYC", "SF", "Chicago"],
      emails: [],
      phones: [],
    },
    ownerTeam: "Finance",
    priority: "medium",
    confidence: 0.87,
    aiRationale: "Classified as expense report based on expense line items, receipt tracking, and approval workflow. Assigned to Finance team.",
    missingFields: ["Manager Approval", "3 Receipt Attachments"],
    riskFlags: [
      { flag: "missing_receipts", severity: "warning", description: "3 receipts missing - justifications provided but need review" },
      { flag: "policy_compliance", severity: "info", description: "All expenses within per diem limits" },
    ],
    complianceIssues: null,
    checklist: [
      { id: "1", task: "Verify all expenses against policy limits", completed: true },
      { id: "2", task: "Review missing receipt justifications", completed: false },
      { id: "3", task: "Obtain manager approval", completed: false },
      { id: "4", task: "Process reimbursement", completed: false },
      { id: "5", task: "Update expense tracking system", completed: false },
    ],
    draftEmail: {
      to: ["michael.thompson@company.com"],
      cc: ["manager@company.com", "finance@company.com"],
      subject: "Expense Report EXP-2024-0156 - Missing Receipt Review",
      body: `Dear Michael,

We have received your Q1 2024 expense report (EXP-2024-0156) totaling $4,166.00.

Before we can process this report, we need to address the following:

Missing Receipts (3):
1. 01/17 Uber - $65.00: Please check if receipt is available in Uber app history
2. 02/09 Team dinner - $320.00: Please provide credit card statement as alternative documentation
3. 03/06 Taxi - $35.00: Written justification accepted for cash payments under $50

Your justifications have been noted. Please provide any additional documentation by March 20, 2024.

Thank you for your cooperation.

Best regards,
Finance Team`,
      tone: "professional",
    },
    suggestedActions: [],
    tags: ["expense-report", "travel", "missing-receipts", "q1-2024"],
    status: "pending_review",
  },

  // 10. Partnership Proposal (Sales/Legal, requires review)
  {
    fileName: "partnership-proposal-techventures.pdf",
    fileType: "pdf",
    originalText: `STRATEGIC PARTNERSHIP PROPOSAL

Prepared for: TechVentures Capital
Prepared by: Business Development Team
Date: March 12, 2024
Proposal Valid Until: April 12, 2024

EXECUTIVE SUMMARY

We are pleased to present this strategic partnership proposal to TechVentures Capital. This partnership aims to combine our innovative AI document processing technology with TechVentures' portfolio companies, creating mutual value and accelerating market adoption.

PARTNERSHIP OVERVIEW

Partnership Type: Strategic Technology Alliance
Term: 3 years with automatic renewal
Investment Required: None (Revenue sharing model)

PROPOSED COLLABORATION AREAS:

1. Technology Integration
- White-label solution for portfolio companies
- API access for custom integrations
- Dedicated technical support

2. Go-to-Market Partnership
- Joint marketing initiatives
- Co-branded solutions
- Cross-referral program

3. Revenue Model
- Revenue share: 20% of new customer revenue
- Minimum annual guarantee: $500,000
- Volume discounts for portfolio adoption

KEY BENEFITS FOR TECHVENTURES:

1. Portfolio Value Add
- Immediate access to enterprise AI technology
- Reduced time-to-market for portfolio companies
- Competitive differentiation

2. Financial Returns
- Revenue share on originated business
- Co-investment opportunities in future funding rounds
- Exit value enhancement for portfolio companies

3. Operational Efficiency
- Centralized vendor management
- Volume pricing benefits
- Standardized implementation playbook

IMPLEMENTATION TIMELINE:

Phase 1 (Month 1-2): Legal framework and technical integration
Phase 2 (Month 3-4): Pilot with 3 portfolio companies
Phase 3 (Month 5-6): Full rollout and marketing launch

NEXT STEPS:

1. Executive alignment meeting
2. Term sheet negotiation
3. Legal review and documentation
4. Board approval (if required)
5. Partnership launch

CONTACTS:

Partnership Lead: Amanda Foster
Email: amanda.foster@company.com
Phone: (555) 234-5678

We look forward to discussing this opportunity further.`,
    docType: "proposal",
    summary: "Strategic partnership proposal to TechVentures Capital for technology alliance. 3-year term with revenue sharing model. Minimum annual guarantee of $500,000.",
    entities: {
      people: ["Amanda Foster"],
      organizations: ["TechVentures Capital"],
      dates: ["March 12, 2024", "April 12, 2024"],
      amounts: ["$500,000"],
      ids: [],
      locations: [],
      emails: ["amanda.foster@company.com"],
      phones: ["(555) 234-5678"],
    },
    ownerTeam: "Sales",
    priority: "high",
    confidence: 0.90,
    aiRationale: "Classified as proposal based on executive summary, partnership terms, and implementation timeline. Assigned to Sales with high priority due to strategic nature and revenue potential.",
    missingFields: ["TechVentures Contact Information", "Detailed Financial Projections"],
    riskFlags: [
      { flag: "legal_review_needed", severity: "info", description: "Partnership agreement will require legal review" },
      { flag: "expiration_date", severity: "warning", description: "Proposal expires April 12, 2024" },
    ],
    complianceIssues: null,
    checklist: [
      { id: "1", task: "Schedule executive alignment meeting", completed: false },
      { id: "2", task: "Prepare detailed financial projections", completed: false },
      { id: "3", task: "Draft term sheet", completed: false },
      { id: "4", task: "Legal review of partnership terms", completed: false },
      { id: "5", task: "Internal approval process", completed: false },
      { id: "6", task: "Board presentation (if needed)", completed: false },
    ],
    draftEmail: {
      to: ["partners@techventures.com"],
      cc: ["amanda.foster@company.com", "legal@company.com"],
      subject: "Strategic Partnership Proposal - Follow-up",
      body: `Dear TechVentures Team,

Thank you for your interest in exploring a strategic partnership with our company. We have prepared a comprehensive proposal outlining how we can create mutual value through a technology alliance.

Key Highlights:
- White-label AI document processing for your portfolio companies
- Revenue sharing model with $500,000 annual minimum guarantee
- 3-year partnership term with automatic renewal

We believe this partnership can significantly enhance the operational capabilities of your portfolio while generating attractive returns.

I would welcome the opportunity to schedule an executive alignment meeting to discuss this proposal in detail. Please let me know your availability over the next two weeks.

The proposal is valid until April 12, 2024.

Best regards,
Amanda Foster
Partnership Lead`,
      tone: "professional",
    },
    suggestedActions: [],
    tags: ["proposal", "partnership", "strategic", "high-value"],
    status: "new",
  },
];

async function main() {
  console.log("Starting seed...");

  // Clear existing data
  await prisma.auditEvent.deleteMany();
  await prisma.caseNote.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.case.deleteMany();

  console.log("Cleared existing data");

  // Create cases
  for (const doc of sampleDocuments) {
    const documentHash = generateHash(doc.originalText);

    const createdCase = await prisma.case.create({
      data: {
        fileName: doc.fileName,
        fileType: doc.fileType,
        originalText: doc.originalText,
        documentHash,
        docType: doc.docType,
        summary: doc.summary,
        entities: JSON.stringify(doc.entities),
        ownerTeam: doc.ownerTeam,
        priority: doc.priority,
        confidence: doc.confidence,
        aiRationale: doc.aiRationale,
        missingFields: JSON.stringify(doc.missingFields),
        riskFlags: JSON.stringify(doc.riskFlags),
        complianceIssues: doc.complianceIssues ? JSON.stringify(doc.complianceIssues) : null,
        checklist: JSON.stringify(doc.checklist),
        draftEmail: JSON.stringify(doc.draftEmail),
        suggestedActions: JSON.stringify(doc.suggestedActions),
        tags: JSON.stringify(doc.tags),
        status: doc.status,
      },
    });

    // Create audit event for case creation
    await prisma.auditEvent.create({
      data: {
        caseId: createdCase.id,
        eventType: "created",
        actor: "system",
        description: "Case created from seed data",
        metadata: JSON.stringify({ fileName: doc.fileName }),
      },
    });

    // Add a sample note to some cases
    if (Math.random() > 0.5) {
      await prisma.caseNote.create({
        data: {
          caseId: createdCase.id,
          content: "Initial review completed. Assigned to team for processing.",
          author: "System",
          noteType: "general",
        },
      });

      await prisma.auditEvent.create({
        data: {
          caseId: createdCase.id,
          eventType: "note_added",
          actor: "system",
          description: "Note added during initial review",
        },
      });
    }

    console.log(`Created case: ${doc.fileName}`);
  }

  console.log("Seed completed successfully!");
  console.log(`Created ${sampleDocuments.length} sample cases`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
