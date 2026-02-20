import test from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../src/app.js";

test("token from login passes UserAuth and GET /auth/me returns 200", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  t.after(() => {
    server.close();
  });

  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const loginResponse = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "customer@example.com", password: "password123" }),
  });

  assert.equal(loginResponse.status, 200);
  const loginBody = await loginResponse.json();
  assert.ok(loginBody.accessToken, "Expected access token from /auth/login");

  const meFromLoginResponse = await fetch(`${baseUrl}/auth/me`, {
    headers: {
      Authorization: `Bearer ${loginBody.accessToken}`,
    },
  });

  assert.equal(meFromLoginResponse.status, 200);

  const refreshResponse = await fetch(`${baseUrl}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: loginBody.refreshToken }),
  });

  assert.equal(refreshResponse.status, 200);
  const refreshBody = await refreshResponse.json();
  assert.ok(refreshBody.accessToken, "Expected access token from /auth/refresh");

  const meFromRefreshResponse = await fetch(`${baseUrl}/auth/me`, {
    headers: {
      Authorization: `Bearer ${refreshBody.accessToken}`,
    },
  });

  assert.equal(meFromRefreshResponse.status, 200);
  const meBody = await meFromRefreshResponse.json();
  assert.equal(meBody.email, "customer@example.com");
  assert.equal(meBody.role, "customer");
});
