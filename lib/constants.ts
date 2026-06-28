export const INDUSTRY_TEMPLATES = [
  { id: 'it-support', name: 'IT Help Desk', category: 'Enterprise', useCase: 'Password reset / VPN troubleshooting' },
  { id: 'hr-benefit', name: 'HR Benefits', category: 'Enterprise', useCase: 'Health insurance update' },
  { id: 'bank-fraud', name: 'Bank Fraud Dept', category: 'Finance', useCase: 'Suspicious activity alert' },
  { id: 'package-del', name: 'Logistics Courier', category: 'Consumer', useCase: 'Delayed package / re-delivery' },
  { id: 'tax-auth', name: 'Tax Authority', category: 'Government', useCase: 'Unpaid dues / refund verification' },
  { id: 'crypto-exch', name: 'Crypto Exchange', category: 'Finance', useCase: 'Account recovery / KYC' },
  { id: 'telecom-support', name: 'Telecom Support', category: 'Consumer', useCase: 'Plan upgrade / billing' },
  { id: 'legal-firm', name: 'Law Firm', category: 'Professional', useCase: 'Document signature urgency' },
  { id: 'cloud-provider', name: 'Cloud Provider', category: 'Enterprise', useCase: 'Quota limit / security breach' },
  { id: 'retail-cust', name: 'Retail Customer Service', category: 'Consumer', useCase: 'Order cancellation' },
  // ... scaled to 50+ in production
];

export const ADVANCED_PERSONAS = [
  { 
    id: 'apt29-assist', 
    name: 'Executive Assistant (APT29)', 
    prompt: 'You are a professional assistant for a high-level executive. You are empathetic but firm. Use corporate jargon and mention internal project names.',
    expertise: 'Intelligence Operations',
    ttp: 'T1598.002'
  },
  { 
    id: 'fin7-vendor', 
    name: 'Urgent Vendor (Fin7)', 
    prompt: 'You are a billing clerk from a known supplier. You are stressed because an invoice is 30 days overdue. Use high-pressure urgency.',
    expertise: 'Financial Fraud',
    ttp: 'T1566.002'
  },
  { 
    id: 'lazarus-recruiter', 
    name: 'Job Recruiter (Lazarus)', 
    prompt: 'You are a recruiter from a top tech company. Offer a high-paying role and request a "technical assessment" document to be opened.',
    expertise: 'Espionage',
    ttp: 'T1566.001'
  },
  { 
    id: 'osint-analyst', 
    name: 'OSINT Investigator', 
    prompt: 'You specialize in correlating disparate data points from public records and social media. Your tone is analytical and detached.',
    expertise: 'Deep Dive Research',
    ttp: 'T1593'
  },
  { 
    id: 'red-team-lead', 
    name: 'Adversarial Architect', 
    prompt: 'You design end-to-end simulation paths. Your tone is clinical and focuses on exploitability and risk assessment.',
    expertise: 'Threat Modeling',
    ttp: 'T1595'
  }
];

export const SENSITIVE_AGENTS = [
  { id: 'neg-1', name: 'Crisis Negotiator', field: 'Emergency Services', focus: 'De-escalation', clearance: 'Level 4' },
  { id: 'int-1', name: 'Intel Liaison', field: 'Defense', focus: 'Inter-agency comms', clearance: 'Level 5' },
  { id: 'com-1', name: 'Compliance Auditor', field: 'Regulatory', focus: 'Governance', clearance: 'Level 3' },
  { id: 'foren-1', name: 'Digital Forensic Lead', field: 'Cyber-law', focus: 'Incident Response', clearance: 'Level 4' },
  { id: 'psych-1', name: 'Social Engineer (Psych)', field: 'Intelligence', focus: 'Cognitive Bias', clearance: 'Level 5' },
  { id: 'threat-1', name: 'Threat Hunter', field: 'SOC Operations', focus: 'Anomalous Patterns', clearance: 'Level 3' },
  { id: 'infra-1', name: 'Cloud Sec Architect', field: 'Enterprise', focus: 'Perimeter Defense', clearance: 'Level 4' },
  { id: 'crypto-1', name: 'Cryptographer', field: 'Security Research', focus: 'Encryption Standard', clearance: 'Level 5' },
  { id: 'osint-1', name: 'OSINT Deep Diver', field: 'Investigation', focus: 'Digital Footprints', clearance: 'Level 4' },
  { id: 'mal-1', name: 'Malware Researcher', field: 'Red Team', focus: 'Payload Dev', clearance: 'Level 5' },
];

export const OSINT_TRENDS = [
  { id: 't1', topic: 'Ransomware Evolution', trend: 'RaaS models moving to rust-based payloads', impact: 'High' },
  { id: 't2', topic: 'AI Vishing', trend: 'Real-time emotion mirroring in deepfake audio', impact: 'Extreme' },
  { id: 't3', topic: 'Supply Chain', trend: 'Targeting open-source dependency maintainers', impact: 'Critical' },
];
