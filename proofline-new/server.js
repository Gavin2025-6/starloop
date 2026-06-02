const http = require("http");
const fs = require("fs");
const path = require("path");
const {
  createAuditForProspect,
  executeAction,
  planActions,
  state,
} = require("./src/automation-engine");
const { getFounderBrief, getProspects, markProspectSent } = require("./src/prospects");

const root = __dirname;
const port = Number(process.env.PORT || 5190);
let actionQueue = planActions();
let audits = [];

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function sendJson(res, status, data) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data, null, 2));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Request body too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function serveFile(req, res) {
  const requestedPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const safePath = requestedPath === "/" ? "/index.html" : requestedPath;
  const filePath = path.normalize(path.join(root, safePath));

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "content-type": contentTypes[ext] || "application/octet-stream" });
    res.end(data);
  });
}

async function handleApi(req, res) {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      product: "Proofline",
      mode: process.env.PROOFLINE_AI_MODE || "rule-assisted-demo",
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/state") {
    sendJson(res, 200, {
      ...state,
      actions: actionQueue,
      audits,
      prospects: getProspects(),
      founderBrief: getFounderBrief(),
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/actions") {
    sendJson(res, 200, { actions: actionQueue });
    return;
  }

  const actionGetMatch = url.pathname.match(/^\/api\/actions\/([^/]+)$/);
  if (req.method === "GET" && actionGetMatch) {
    const action = actionQueue.find((item) => item.id === actionGetMatch[1]);
    if (!action) {
      sendJson(res, 404, { error: "Action not found." });
      return;
    }
    sendJson(res, 200, { action });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/prospects") {
    sendJson(res, 200, {
      prospects: getProspects(),
      brief: getFounderBrief(),
    });
    return;
  }

  const prospectSentMatch = url.pathname.match(/^\/api\/prospects\/([^/]+)\/sent$/);
  if (req.method === "POST" && prospectSentMatch) {
    const prospect = markProspectSent(prospectSentMatch[1]);
    if (!prospect) {
      sendJson(res, 404, { error: "Prospect not found." });
      return;
    }
    sendJson(res, 200, {
      prospect,
      brief: getFounderBrief(),
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/actions/plan") {
    actionQueue = planActions();
    sendJson(res, 200, { actions: actionQueue });
    return;
  }

  const actionApproveMatch = url.pathname.match(/^\/api\/actions\/([^/]+)\/approve$/);
  if (req.method === "POST" && actionApproveMatch) {
    const actionId = actionApproveMatch[1];
    actionQueue = actionQueue.map((action) =>
      action.id === actionId
        ? {
            ...action,
            status: "approved",
            audit: [
              ...action.audit,
              {
                at: new Date().toISOString(),
                event: "action.approved",
                note: "Approved by owner in demo mode.",
              },
            ],
          }
        : action,
    );
    sendJson(res, 200, { action: actionQueue.find((action) => action.id === actionId) });
    return;
  }

  const actionExecuteMatch = url.pathname.match(/^\/api\/actions\/([^/]+)\/execute$/);
  if (req.method === "POST" && actionExecuteMatch) {
    const actionId = actionExecuteMatch[1];
    const current = actionQueue.find((action) => action.id === actionId);
    const result = executeAction(current);
    if (result.action) {
      actionQueue = actionQueue.map((action) => (action.id === actionId ? result.action : action));
    }
    sendJson(res, result.ok ? 200 : 409, result);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/audits") {
    const body = await readBody(req);
    const audit = createAuditForProspect({
      businessName: body.businessName || body.business || "Local business",
      industry: body.industry || "Cleaning",
      city: body.city || body.market || "Toronto",
    });
    audits = [audit, ...audits].slice(0, 50);
    sendJson(res, 201, { audit });
    return;
  }

  sendJson(res, 404, { error: "API route not found." });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res).catch((error) => {
      sendJson(res, 500, { error: error.message });
    });
    return;
  }

  serveFile(req, res);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Set PORT=5191 npm start to use another port.`);
    process.exit(1);
  }

  if (error.code === "EPERM") {
    console.error(`This environment is not allowed to open 127.0.0.1:${port}. The app files still work as static pages.`);
    process.exit(1);
  }

  throw error;
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Proofline running at http://127.0.0.1:${port}`);
});
