import { initDb, getDb } from "./database";
import { v4 as uuid } from "uuid";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const TENANT_DATA = [
  { name: "Acme Corporation", slug: "acme", plan: "enterprise" },
  { name: "Globex Industries", slug: "globex", plan: "enterprise" },
  { name: "Initech Solutions", slug: "initech", plan: "business" },
  { name: "Umbrella Corp", slug: "umbrella", plan: "enterprise" },
  { name: "Wayne Enterprises", slug: "wayne", plan: "enterprise" },
  { name: "Stark Industries", slug: "stark", plan: "enterprise" },
  { name: "Oscorp Labs", slug: "oscorp", plan: "business" },
  { name: "LexCorp Media", slug: "lexcorp", plan: "business" },
  { name: "Cyberdyne Systems", slug: "cyberdyne", plan: "enterprise" },
  { name: "Soylent Corp", slug: "soylent", plan: "business" },
  { name: "Massive Dynamic", slug: "massive-dynamic", plan: "enterprise" },
  { name: "Hooli Inc", slug: "hooli", plan: "enterprise" },
  { name: "Pied Piper", slug: "pied-piper", plan: "free" },
  { name: "Raviga Capital", slug: "raviga", plan: "business" },
  { name: "Aviato", slug: "aviato", plan: "free" },
  { name: "Bluth Company", slug: "bluth", plan: "free" },
  { name: "Dunder Mifflin", slug: "dunder-mifflin", plan: "business" },
  { name: "Sterling Cooper", slug: "sterling-cooper", plan: "business" },
  { name: "Prestige Worldwide", slug: "prestige", plan: "free" },
  { name: "TelAmeriCorp", slug: "telamericorp", plan: "free" },
  { name: "Vandelay Industries", slug: "vandelay", plan: "business" },
  { name: "Planet Express", slug: "planet-express", plan: "free" },
  { name: "MomCorp", slug: "momcorp", plan: "enterprise" },
  { name: "Weyland-Yutani", slug: "weyland", plan: "enterprise" },
  { name: "Tyrell Corporation", slug: "tyrell", plan: "enterprise" },
  { name: "Veidt Enterprises", slug: "veidt", plan: "business" },
  { name: "Nakatomi Trading", slug: "nakatomi", plan: "business" },
  { name: "Gekko & Co", slug: "gekko", plan: "business" },
  { name: "Wonka Industries", slug: "wonka", plan: "business" },
  { name: "Umbrella Academy", slug: "umbrella-academy", plan: "free" },
  { name: "Dharma Initiative", slug: "dharma", plan: "business" },
  { name: "Vought International", slug: "vought", plan: "enterprise" },
];

const DOC_CLASSIFICATIONS = ["public", "internal", "confidential", "restricted"];
const PROJECT_NAMES = [
  "Q1 Planning", "Product Roadmap", "Security Audit", "Infrastructure Migration",
  "Customer Portal", "API Documentation", "Compliance Review", "Brand Refresh",
  "Mobile App v2", "Data Pipeline", "Performance Optimization", "Incident Playbooks",
  "HR Handbook", "Sales Enablement", "Engineering Standards", "Cost Reduction",
];

const DOC_TITLES = [
  "Architecture Overview", "Meeting Notes", "Budget Proposal", "Risk Assessment",
  "Technical Specification", "User Research", "Sprint Retrospective", "Deployment Guide",
  "Onboarding Checklist", "Quarterly Report", "Vendor Evaluation", "Security Policy",
  "API Reference", "Database Schema", "Network Diagram", "Access Control Matrix",
  "Incident Response Plan", "Business Continuity", "Data Classification Guide",
  "Penetration Test Results", "Vulnerability Scan Report", "Compliance Checklist",
  "SOC2 Evidence", "GDPR Assessment", "Employee Directory", "Salary Bands",
  "Board Presentation", "Investor Update", "Customer List", "Revenue Forecast",
  "Source Code Review", "Dependency Audit", "Cloud Cost Analysis", "SLA Dashboard",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomContent(classification: string): string {
  const base = {
    public: "This document contains publicly available information about our products and services.",
    internal: "Internal use only. Contains operational details and team communications.",
    confidential: "CONFIDENTIAL: Contains sensitive business information. Do not distribute outside the organization.",
    restricted: "RESTRICTED: Contains highly sensitive data including PII, financial records, or security credentials. Access strictly limited.",
  };

  return `${base[classification] || base.internal}\n\nGenerated content for testing purposes. Document ID: ${uuid()}\nLast reviewed: ${new Date().toISOString()}`;
}

function seed() {
  initDb();
  const db = getDb();

  console.log("Seeding database...");

  // Clear existing data
  db.exec("DELETE FROM audit_log");
  db.exec("DELETE FROM api_keys");
  db.exec("DELETE FROM promo_codes");
  db.exec("DELETE FROM documents");
  db.exec("DELETE FROM projects");
  db.exec("DELETE FROM users");
  db.exec("DELETE FROM tenants");

  const tenantIds: Record<string, string> = {};
  const userIds: Record<string, string[]> = {};
  const projectIds: Record<string, string[]> = {};

  // Create tenants
  const insertTenant = db.prepare(
    "INSERT INTO tenants (id, name, slug, plan) VALUES (?, ?, ?, ?)"
  );
  for (const t of TENANT_DATA) {
    const id = uuid();
    insertTenant.run(id, t.name, t.slug, t.plan);
    tenantIds[t.slug] = id;
    userIds[t.slug] = [];
    projectIds[t.slug] = [];
  }
  console.log(`Created ${TENANT_DATA.length} tenants`);

  // Create users (2-8 per tenant)
  const insertUser = db.prepare(
    "INSERT INTO users (id, tenant_id, email, password_hash, role, display_name) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const roles = ["admin", "member", "member", "member", "viewer"];
  const firstNames = ["Alice", "Bob", "Carol", "Dave", "Eve", "Frank", "Grace", "Henry"];
  const lastNames = ["Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez"];

  for (const [slug, tenantId] of Object.entries(tenantIds)) {
    const numUsers = 2 + Math.floor(Math.random() * 7);
    const usedEmails = new Set<string>();
    for (let i = 0; i < numUsers; i++) {
      const id = uuid();
      let firstName: string, lastName: string, email: string;
      do {
        firstName = randomItem(firstNames);
        lastName = randomItem(lastNames);
        email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i > 0 ? i : ""}@${slug}.com`;
      } while (usedEmails.has(email));
      usedEmails.add(email);
      const role = i === 0 ? "admin" : randomItem(roles);
      insertUser.run(id, tenantId, email, hashPassword("password123"), role, `${firstName} ${lastName}`);
      userIds[slug].push(id);
    }
  }
  console.log("Created users for all tenants");

  // Create projects (2-6 per tenant)
  const insertProject = db.prepare(
    "INSERT INTO projects (id, tenant_id, name, description, is_private, created_by) VALUES (?, ?, ?, ?, ?, ?)"
  );

  for (const [slug, tenantId] of Object.entries(tenantIds)) {
    const numProjects = 2 + Math.floor(Math.random() * 5);
    const usedNames = new Set<string>();
    for (let i = 0; i < numProjects; i++) {
      let name = randomItem(PROJECT_NAMES);
      while (usedNames.has(name)) name = randomItem(PROJECT_NAMES);
      usedNames.add(name);

      const id = uuid();
      const isPrivate = Math.random() > 0.7 ? 1 : 0;
      insertProject.run(id, tenantId, name, `${name} for ${slug}`, isPrivate, randomItem(userIds[slug]));
      projectIds[slug].push(id);
    }
  }
  console.log("Created projects for all tenants");

  // Create documents (5-20 per project)
  const insertDoc = db.prepare(
    "INSERT INTO documents (id, project_id, tenant_id, title, content, classification, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  let totalDocs = 0;
  for (const [slug, tenantId] of Object.entries(tenantIds)) {
    for (const projectId of projectIds[slug]) {
      const numDocs = 5 + Math.floor(Math.random() * 16);
      const usedTitles = new Set<string>();
      for (let i = 0; i < numDocs; i++) {
        let title = randomItem(DOC_TITLES);
        while (usedTitles.has(title)) title = randomItem(DOC_TITLES);
        usedTitles.add(title);

        const classification = randomItem(DOC_CLASSIFICATIONS);
        const id = uuid();
        insertDoc.run(
          id, projectId, tenantId, title,
          randomContent(classification), classification,
          randomItem(userIds[slug])
        );
        totalDocs++;
      }
    }
  }
  console.log(`Created ${totalDocs} documents`);

  // Create promo codes
  const insertPromo = db.prepare(
    "INSERT INTO promo_codes (id, code, discount_pct, max_uses) VALUES (?, ?, ?, ?)"
  );
  insertPromo.run(uuid(), "LAUNCH2026", 50, 1);
  insertPromo.run(uuid(), "ENTERPRISE25", 25, 100);
  insertPromo.run(uuid(), "WELCOME10", 10, 1000);
  console.log("Created promo codes");

  // Print summary
  console.log("\n=== Seed Summary ===");
  console.log(`Tenants: ${TENANT_DATA.length}`);
  console.log(`Documents: ${totalDocs}`);

  // Print some tenant credentials for testing
  console.log("\n=== Test Credentials ===");
  console.log("All users have password: password123");
  for (const slug of ["acme", "globex", "initech", "oscorp"]) {
    const users = db
      .prepare("SELECT email, role FROM users WHERE tenant_id = ? LIMIT 3")
      .all(tenantIds[slug]) as any[];
    console.log(`\n${slug}:`);
    for (const u of users) {
      console.log(`  ${u.email} (${u.role})`);
    }
  }

  console.log("\nPromo codes: LAUNCH2026 (50%, 1 use), ENTERPRISE25 (25%), WELCOME10 (10%)");
  console.log("\nSeed complete!");
}

seed();
