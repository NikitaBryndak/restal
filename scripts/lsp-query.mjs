#!/usr/bin/env node
/**
 * One-shot TypeScript LSP queries for agent use (no editor required).
 * Spawns typescript-language-server, runs a single query, prints the result.
 *
 * Usage:
 *   node scripts/lsp-query.mjs diagnostics <file>
 *   node scripts/lsp-query.mjs hover      <file> <line> <col>
 *   node scripts/lsp-query.mjs definition <file> <line> <col>
 *   node scripts/lsp-query.mjs references <file> <line> <col>
 *
 * line/col are 1-based (as shown in editors / read tool output).
 */
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const [,, cmd, target, lineArg = "0", colArg = "0"] = process.argv;
if (!cmd || !target) {
    console.error("usage: lsp-query.mjs <diagnostics|hover|definition|references> <file> [line] [col]");
    process.exit(2);
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.isAbsolute(target) ? target : path.resolve(repoRoot, target);
if (!existsSync(file)) {
    console.error(`file not found: ${file}`);
    process.exit(2);
}

// Resolve the language server entry point from its package manifest (layout varies between versions).
const requireFromRoot = createRequire(path.join(repoRoot, "package.json"));
let bin;
try {
    const pkgDir = path.dirname(requireFromRoot.resolve("typescript-language-server/package.json"));
    const manifest = JSON.parse(readFileSync(path.join(pkgDir, "package.json"), "utf8"));
    const relBin = typeof manifest.bin === "string" ? manifest.bin : manifest.bin["typescript-language-server"];
    bin = path.join(pkgDir, relBin);
} catch {
    /* not installed */
}
if (!bin || !existsSync(bin)) {
    console.error("typescript-language-server is not installed — run: npm i -D typescript-language-server");
    process.exit(2);
}
const child = spawn(process.execPath, [bin, "--stdio"], {
    cwd: repoRoot,
    stdio: ["pipe", "pipe", "inherit"],
});

let buf = Buffer.alloc(0);
const pending = new Map(); // id -> resolve
const diagnosticsWaiters = []; // (uri, diags) => void

function send(msg) {
    const json = JSON.stringify(msg);
    child.stdin.write(`Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`);
}

function request(method, params, timeoutMs = 90_000) {
    const id = Math.floor(Math.random() * 1e9);
    return new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error(`timeout waiting for ${method}`)), timeoutMs);
        pending.set(id, (result) => {
            clearTimeout(t);
            resolve(result);
        });
        send({ jsonrpc: "2.0", id, method, params });
    });
}

child.stdout.on("data", (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    for (;;) {
        const headerEnd = buf.indexOf("\r\n\r\n");
        if (headerEnd === -1) return;
        const headers = buf.subarray(0, headerEnd).toString("utf8");
        const m = headers.match(/Content-Length: (\d+)/i);
        if (!m) {
            buf = buf.subarray(headerEnd + 4);
            continue;
        }
        const len = Number(m[1]);
        const start = headerEnd + 4;
        if (buf.length < start + len) return; // incomplete body, wait for more data
        const body = buf.subarray(start, start + len).toString("utf8");
        buf = buf.subarray(start + len);
        let msg;
        try {
            msg = JSON.parse(body);
        } catch {
            continue;
        }
        if (process.env.LSP_DEBUG) console.error(`<< ${msg.method ?? `response:${msg.id}`}`);
        if (msg.id !== undefined && pending.has(msg.id)) {
            pending.get(msg.id)(msg.result ?? msg.error);
            pending.delete(msg.id);
        } else if (msg.method === "textDocument/publishDiagnostics") {
            for (const w of diagnosticsWaiters.splice(0)) w(msg.params.uri, msg.params.diagnostics);
        }
    }
});

function rel(p) {
    return path.relative(repoRoot, p).split(path.sep).join("/");
}

function fmtLocation(loc) {
    const p = fileURLToPath(loc.uri);
    return `${rel(p)}:${loc.range.start.line + 1}:${loc.range.start.character + 1}`;
}

const uri = pathToFileURL(file).href;
const text = readFileSync(file, "utf8");

/** Wait for the first publishDiagnostics of a URI — evidence tsserver has analyzed it (project loaded). */
function waitForDiagnostics(targetUri, timeoutMs) {
    return new Promise((resolve) => {
        const t = setTimeout(() => resolve(null), timeoutMs);
        const onDiag = (u, d) => {
            let same = false;
            try {
                // Server normalizes Windows URIs (lowercase drive letter, %3A colon) — compare decoded paths.
                const a = path.resolve(fileURLToPath(u));
                const b = path.resolve(fileURLToPath(targetUri));
                same = process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b;
            } catch {}
            if (same) {
                clearTimeout(t);
                resolve(d);
            } else {
                diagnosticsWaiters.push(onDiag); // dispatcher splices all waiters per notification; re-register for other files' publishes
            }
        };
        diagnosticsWaiters.push(onDiag);
    });
}
try {
    await request("initialize", {
        processId: process.pid,
        rootUri: pathToFileURL(repoRoot).href,
        workspaceFolders: [{ uri: pathToFileURL(repoRoot).href, name: "restal" }],
        capabilities: {
            textDocument: {
                publishDiagnostics: {},
                hover: {},
                definition: {},
                references: {},
            },
            workspace: { workspaceFolders: true },
        },
    });
    send({ jsonrpc: "2.0", method: "initialized", params: {} });
    send({
        jsonrpc: "2.0",
        method: "textDocument/didOpen",
        params: { textDocument: { uri, languageId: file.endsWith(".tsx") ? "typescriptreact" : "typescript", version: 1, text } },
    });

    if (cmd === "diagnostics") {
        const diags = await waitForDiagnostics(uri, 60_000);
        if (diags === null) {
            console.error("no diagnostics received within timeout");
            process.exitCode = 1;
        } else if (diags.length === 0) {
            console.log(`${rel(file)}: no diagnostics`);
        } else {
            const sev = ["Error", "Warning", "Info", "Hint"]; // LSP severities are 1-based
            for (const d of diags) {
                console.log(
                    `${rel(file)}:${d.range.start.line + 1}:${d.range.start.character + 1} ${sev[d.severity - 1] ?? d.severity}: ` +
                        `${d.code ? `[TS${typeof d.code === "number" ? d.code : ""}] ` : ""}${d.message}`
                );
            }
        }
    } else {
        const line = Number(lineArg) - 1;
        const col = Number(colArg) - 1;
        const position = { line, character: col };
        // Readiness gate: wait until tsserver has analyzed the file (project loaded) before querying.
        await waitForDiagnostics(uri, 30_000);
        if (cmd === "hover") {
            const res = await request("textDocument/hover", { textDocument: { uri }, position });
            if (!res?.contents) console.log("(no hover info)");
            else {
                const c = res.contents;
                const s = typeof c === "string" ? c : (c.value ?? JSON.stringify(c));
                console.log(s);
            }
        } else if (cmd === "definition") {
            const res = await request("textDocument/definition", { textDocument: { uri }, position });
            if (!res) console.log("(no definition found)");
            else for (const loc of Array.isArray(res) ? res : [res]) console.log(fmtLocation(loc));
        } else if (cmd === "references") {
            const res = await request("textDocument/references", { textDocument: { uri }, position, context: { includeDeclaration: true } }, 120_000);
            if (!res) console.log("(no references found)");
            else if (!Array.isArray(res)) {
                console.error(`LSP error: ${res.message ?? JSON.stringify(res)}`);
                process.exitCode = 1;
            } else if (res.length === 0) console.log("(no references found)");
            else {
                for (const loc of res) console.log(fmtLocation(loc));
                console.log(`— ${res.length} reference(s)`);
            }
        } else {
            console.error(`unknown command: ${cmd}`);
            process.exit(2);
        }
    }
} catch (err) {
    console.error(err?.message ?? String(err));
    process.exitCode = 1;
} finally {
    child.kill();
}
