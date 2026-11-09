import { NextResponse } from "next/server";
import { Resend } from "resend";
import net from "net";

// Minimal SMTP client (local, no-auth) so the test environment can run
// fully self-hosted via Mailpit. Falls back to Resend in production.
function sendViaSmtp(to: string, subject: string, html: string, from: string): Promise<{ id: string }> {
  const host = process.env.SMTP_HOST || "127.0.0.1";
  const port = Number(process.env.SMTP_PORT || 1025);

  return new Promise((resolve, reject) => {
    const socket = net.connect(port, host, () => {
      let buf = "";
      let state = "greeting";

      const send = (s: string) => socket.write(s);

      const body = [
        "Date: " + new Date().toUTCString(),
        "From: " + from,
        "To: " + to,
        "Subject: " + subject,
        "MIME-Version: 1.0",
        'Content-Type: text/html; charset="UTF-8"',
        "",
        html,
      ].join("\r\n");

      const onData = (chunk: Buffer) => {
        buf += chunk.toString("utf8");
        let idx: number;
        while ((idx = buf.indexOf("\r\n")) !== -1 || (idx = buf.indexOf("\n")) !== -1) {
          const sep = buf[idx + 1] === "\n" ? 2 : 1;
          const line = buf.slice(0, idx).replace(/\r$/, "");
          buf = buf.slice(idx + sep);
          const code = parseInt(line.slice(0, 3), 10);

          if (state === "greeting") {
            if (code === 220) { state = "ehlo"; send("EHLO gyra.local\r\n"); }
          } else if (state === "ehlo") {
            if (line.startsWith("250-")) continue; // more capability lines
            if (code === 250) {
              state = "mail";
              send(`MAIL FROM:<${from.split("<")[1]?.replace(/>/, "") || "no-reply@gyra.local"}>\r\n`);
            }
          } else if (state === "mail") {
            if (code === 250) { state = "rcpt"; send(`RCPT TO:<${to}>\r\n`); }
            else reject(new Error("MAIL FROM rejected: " + line));
          } else if (state === "rcpt") {
            if (code === 250) {
              state = "data";
              send("DATA\r\n");
            } else reject(new Error("RCPT TO rejected: " + line));
          } else if (state === "data") {
            if (code === 354) {
              state = "body";
              const stuffed = body.replace(/^(\.)/gm, "..").replace(/\n/g, "\r\n");
              send(stuffed + "\r\n.\r\n");
            } else reject(new Error("DATA rejected: " + line));
          } else if (state === "body") {
            if (code === 250) {
              socket.end();
              resolve({ id: "local-smtp-" + Date.now() });
            } else reject(new Error("Message rejected: " + line));
          }
        }
      };
      socket.on("data", onData);
      socket.on("error", reject);
      socket.setTimeout(15000, () => { socket.destroy(); reject(new Error("SMTP timeout")); });
    });
  });
}

export async function POST(req: Request) {
  try {
    const { email, projectName, projectId } = await req.json();

    if (!email || !projectName || !projectId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const projectLink = `${process.env.NEXT_PUBLIC_SITE_URL}/projects/${projectId}`;

    const from = process.env.SMTP_FROM || "Gyra Projects <no-reply@gyra.local>";
    const subject = `Project shared with you: "${projectName}"`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0f; color: #ffffff; padding: 40px; border-radius: 16px;">
          <h1 style="color: #ffffff;">Gyra</h1>
          <p style="font-size: 16px; line-height: 1.5; color: #d4d4d8;">
            A user has shared a project with you on Gyra. You may access the project via the details below:
          </p>
          <div style="background-color: #1c1c1e; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #a1a1aa;"><strong>Project Name:</strong> ${projectName}</p>
          </div>
          <p style="font-size: 16px; line-height: 1.5; color: #d4d4d8;">
            Click the following link to start using this project:
          </p>
          <a href="${projectLink}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin: 20px 0;">
            Open Project
          </a>
          <p style="font-size: 12px; color: #71717a;">&copy; 2026 Gyra &middot; Genvia AI Company</p>
        </div>
      `;

    // Self-hosted SMTP first (test env); Resend fallback (production).
    if (process.env.SMTP_HOST) {
      const data = await sendViaSmtp(email, subject, html, from);
      return NextResponse.json({ success: true, data });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 503 });
    }
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: [email],
      subject,
      html,
    });
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("send-invite failed:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
