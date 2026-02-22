import { getCaptcha, login, sendSms } from ".";

const sessions = new Map<string, string>();

function randomId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function getCookieValue(req: Request, name: string): string | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const [k, ...rest] = pair.trim().split("=");
    if (k === name) {
      return rest.join("=");
    }
  }
  return null;
}

function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init?.headers ?? {}),
    },
  });
}

function getSessionCookie(req: Request): string | null {
  const sid = getCookieValue(req, "sufe_sid");
  if (!sid) return null;
  return sessions.get(sid) ?? null;
}

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      return new Response(Bun.file("example.html"), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === "/api/captcha" && req.method === "GET") {
      try {
        const { cookie, image } = await getCaptcha();
        const sid = randomId();
        sessions.set(sid, cookie);
        const bytes = new Uint8Array(image);
        return new Response(bytes.buffer, {
          headers: {
            "Content-Type": "image/png",
            "Set-Cookie": `sufe_sid=${sid}; Path=/; HttpOnly; SameSite=Lax`,
            "Cache-Control": "no-store",
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return json({ ok: false, error: message }, { status: 400 });
      }
    }

    if (url.pathname === "/api/sms" && req.method === "POST") {
      try {
        const cookie = getSessionCookie(req);
        if (!cookie) {
          return json(
            { ok: false, error: "Session not found, fetch captcha first." },
            { status: 400 }
          );
        }

        const body = (await req.json()) as {
          username?: string;
          vcode?: string;
        };
        if (!body.username || !body.vcode) {
          return json(
            { ok: false, error: "username and vcode are required." },
            { status: 400 }
          );
        }

        const result = await sendSms({
          username: body.username,
          vcode: body.vcode,
          cookie,
        });
        return json({ ok: true, result: result.body });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return json({ ok: false, error: message }, { status: 400 });
      }
    }

    if (url.pathname === "/api/login" && req.method === "POST") {
      try {
        const cookie = getSessionCookie(req);
        if (!cookie) {
          return json(
            { ok: false, error: "Session not found, fetch captcha first." },
            { status: 400 }
          );
        }

        const body = (await req.json()) as {
          username?: string;
          smsCode?: string;
        };
        if (!body.username || !body.smsCode) {
          return json(
            { ok: false, error: "username and smsCode are required." },
            { status: 400 }
          );
        }

        const result = await login({
          username: body.username,
          smsCode: body.smsCode,
          cookie,
        });
        return json({ ok: true, result: result.body });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return json({ ok: false, error: message }, { status: 400 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Demo server running at http://localhost:${server.port}`);
