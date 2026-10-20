import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import Database from "better-sqlite3";

const projectRoot = process.cwd();
const nextCli = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");

async function getAvailablePort() {
  const server = net.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address();
  assert.ok(address && typeof address !== "string");
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  return address.port;
}

async function waitForServer(server, url, getOutput) {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`El servidor terminó antes de estar listo.\n${getOutput()}`);
    }

    try {
      const response = await fetch(`${url}/api/health`, {
        signal: AbortSignal.timeout(1_000),
      });
      if (response.ok) return;
    } catch {
      // El servidor todavía se está iniciando.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`El servidor no estuvo listo a tiempo.\n${getOutput()}`);
}

async function stopServer(server) {
  if (!server || server.exitCode !== null) return;

  const exited = once(server, "exit");
  server.kill();
  await exited;
}

test("registro, inicio de sesión y permisos de administrador", async (t) => {
  const tempDirectory = await mkdtemp(
    path.join(os.tmpdir(), "jwt-auth-integration-")
  );
  const databasePath = path.join(tempDirectory, "app.db");
  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const email = `test-${randomBytes(8).toString("hex")}@example.com`;
  const password = "Prueba-segura-123";
  let output = "";
  let sessionCookie;
  let server;

  try {
    server = spawn(
      process.execPath,
      [nextCli, "start", "--hostname", "127.0.0.1", "--port", String(port)],
      {
        cwd: projectRoot,
        env: {
          ...process.env,
          AUTH_SECRET: randomBytes(32).toString("hex"),
          APP_URL: baseUrl,
          DATABASE_PATH: databasePath,
          NEXT_TELEMETRY_DISABLED: "1",
          NODE_ENV: "production",
        },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    const collectOutput = (chunk) => {
      output = `${output}${chunk}`.slice(-8_000);
    };
    server.stdout.setEncoding("utf8").on("data", collectOutput);
    server.stderr.setEncoding("utf8").on("data", collectOutput);

    await waitForServer(server, baseUrl, () => output);

    await t.test("registra una cuenta y rechaza emails duplicados", async () => {
      const registration = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Persona de prueba", email, password }),
      });

      assert.equal(registration.status, 201);
      const registrationData = await registration.json();
      assert.equal(registrationData.user.name, "Persona de prueba");
      assert.equal(registrationData.user.email, email);
      assert.equal(registrationData.user.role, "user");
      assert.equal("password_hash" in registrationData.user, false);

      const duplicate = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Otra persona", email, password }),
      });

      assert.equal(duplicate.status, 409);
    });

    await t.test("inicia sesión y entrega una cookie segura", async () => {
      const invalidLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "Incorrecta-123" }),
      });
      assert.equal(invalidLogin.status, 401);

      const login = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      assert.equal(login.status, 200);
      const loginData = await login.json();
      assert.equal(loginData.user.email, email);
      assert.equal(loginData.user.role, "user");

      const setCookie = login.headers.getSetCookie()[0];
      assert.ok(setCookie, "la respuesta debe crear una cookie de sesión");
      assert.match(setCookie, /HttpOnly/i);
      assert.match(setCookie, /SameSite=Lax/i);
      assert.match(setCookie, /Secure/i);
      sessionCookie = setCookie.split(";", 1)[0];
    });

    await t.test("protege el listado y permite el acceso a administradores", async () => {
      const anonymousResponse = await fetch(`${baseUrl}/api/users`);
      assert.equal(anonymousResponse.status, 401);

      const userResponse = await fetch(`${baseUrl}/api/users`, {
        headers: { Cookie: sessionCookie },
      });
      assert.equal(userResponse.status, 403);

      const database = new Database(databasePath);
      try {
        const promoted = database
          .prepare("UPDATE users SET role = 'admin' WHERE email = ?")
          .run(email);
        assert.equal(promoted.changes, 1);
      } finally {
        database.close();
      }

      const adminResponse = await fetch(`${baseUrl}/api/users`, {
        headers: { Cookie: sessionCookie },
      });
      assert.equal(adminResponse.status, 200);

      const adminData = await adminResponse.json();
      const user = adminData.users.find((entry) => entry.email === email);
      assert.equal(user.role, "admin");
      assert.equal("password_hash" in user, false);
    });
  } finally {
    await stopServer(server);
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
