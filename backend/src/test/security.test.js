
const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const request = require("supertest");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_for_trustvault";

const { app } = require("../server");
const User = require("../models/User");
const Document = require("../models/Document");
const AuditLog = require("../models/AuditLog");

let owner;
let viewer;
let document;

const createToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET
  );
};

let ownerToken;
let viewerToken;

test("TrustVault security tests", async (t) => {
  assert.ok(
    process.env.MONGO_TEST_URI,
    "Add a separate MONGO_TEST_URI to your .env file before running tests."
  );

  await mongoose.connect(process.env.MONGO_TEST_URI);

  // This database must be dedicated to testing.
  await mongoose.connection.dropDatabase();

  owner = await User.create({
    name: "Test Owner",
    email: "owner@test.local",
    password: "test_password",
    role: "OWNER",
    isActive: true,
  });

  viewer = await User.create({
    name: "Test Viewer",
    email: "viewer@test.local",
    password: "test_password",
    role: "VIEWER",
    isActive: true,
  });

  ownerToken = createToken(owner);
  viewerToken = createToken(viewer);

  document = await Document.create({
    title: "Security Test Document",
    content: "Private test content",
    owner: owner._id,
    permissions: [],
  });

  await t.test("Unauthenticated users cannot read documents", async () => {
    const response = await request(app)
      .get(`/api/documents/${document._id}`);

    assert.equal(response.status, 401);
  });

  await t.test("Document owner can read their document", async () => {
    const response = await request(app)
      .get(`/api/documents/${document._id}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.title, "Security Test Document");
  });

  await t.test("Unshared users cannot read another user's document", async () => {
    const response = await request(app)
      .get(`/api/documents/${document._id}`)
      .set("Authorization", `Bearer ${viewerToken}`);

    assert.equal(response.status, 403);
  });

  await t.test("READ permission allows reading but not editing", async () => {
    document.permissions.push({
      user: viewer._id,
      access: "READ",
    });

    await document.save();

    const readResponse = await request(app)
      .get(`/api/documents/${document._id}`)
      .set("Authorization", `Bearer ${viewerToken}`);

    assert.equal(readResponse.status, 200);

    const editResponse = await request(app)
      .put(`/api/documents/${document._id}`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ title: "Unauthorized edit" });

    assert.equal(editResponse.status, 403);
  });

  await t.test("Revoked permission immediately blocks reading", async () => {
    document.permissions = [];
    await document.save();

    const response = await request(app)
      .get(`/api/documents/${document._id}`)
      .set("Authorization", `Bearer ${viewerToken}`);

    assert.equal(response.status, 403);
  });

  await t.test("Denied access creates hashed audit records", async () => {
    const logs = await AuditLog.find({
      document: document._id,
      action: "ACCESS_DENIED",
    });

    assert.ok(logs.length >= 2, "Expected denied-access audit records");

    for (const log of logs) {
      assert.ok(log.hash, "Audit record must have a hash");
      assert.ok(log.previousHash, "Audit record must have a previous hash");
    }
  });

  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
