export const typeDefs = `#graphql
  type Tenant {
    id: ID!
    name: String!
    slug: String!
    plan: String!
    createdAt: String!
  }

  type User {
    id: ID!
    email: String!
    role: String!
    displayName: String!
    tenantId: ID!
    createdAt: String!
    projects: [Project!]!
  }

  type Project {
    id: ID!
    name: String!
    description: String
    isPrivate: Boolean!
    tenantId: ID!
    createdBy: User
    createdAt: String!
    documents: [Document!]!
    documentCount: Int!
  }

  type Document {
    id: ID!
    title: String!
    content: String
    classification: String!
    projectId: ID!
    tenantId: ID!
    createdBy: User
    createdAt: String!
    updatedAt: String!
    project: Project
  }

  type SearchResult {
    documents: [Document!]!
    totalCount: Int!
    page: Int!
    pageSize: Int!
  }

  type Query {
    me: User
    tenant: Tenant

    projects(includePrivate: Boolean): [Project!]!
    project(id: ID!): Project

    documents(projectId: ID, classification: String): [Document!]!
    document(id: ID!): Document

    searchDocuments(
      query: String!
      page: Int
      pageSize: Int
      sortBy: String
      sortOrder: String
    ): SearchResult!

    users: [User!]!
    user(id: ID!): User
  }

  type Mutation {
    createProject(name: String!, description: String, isPrivate: Boolean): Project!
    updateProject(id: ID!, name: String, description: String, isPrivate: Boolean): Project!

    createDocument(projectId: ID!, title: String!, content: String, classification: String): Document!
    updateDocument(id: ID!, title: String, content: String, classification: String): Document!

    exportDocuments(documentIds: [ID!]!): ExportResult!
  }

  type ExportResult {
    exportId: String!
    documentCount: Int!
    documents: [Document!]!
    generatedAt: String!
  }
`;
