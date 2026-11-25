import { NextResponse } from "next/server";
import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  return new Resend(key);
}

export async function POST(req: Request) {
  try {
    const { email, token } = await req.json();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gyra.ng";
    const confirmLink = `${baseUrl}/delete-account/confirm?token=${token}`;

    const { error } = await getResend().emails.send({
      from: "Gyra Security <security@updates.gyra.ng>",
      to: [email],
      subject: "Action Required: Confirm Account Deletion",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0514; color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid #581c87;">
          <div style="text-align: center; margin-bottom: 30px;">
             <h1 style="color: #a855f7; margin: 0;">Gyra</h1>
          </div>
          
          <h2 style="color: #ffffff; text-align: center; margin-bottom: 20px;">Account Deletion Request</h2>
          
          <p style="font-size: 15px; line-height: 1.6; color: #d4d4d8;">
            We received a request to permanently delete your Gyra account associated with <strong>${email}</strong>.
          </p>

          <div style="background-color: #1c112b; border: 1px solid #7e22ce; padding: 20px; border-radius: 12px; margin: 24px 0;">
            <p style="margin: 0; color: #fca5a5; font-weight: bold;">⚠️ Warning: This action is irreversible.</p>
            <p style="margin: 8px 0 0 0; color: #d4d4d8; font-size: 14px;">Clicking the button below will permanently wipe:</p>
            <ul style="color: #a1a1aa; font-size: 14px; margin-top: 8px; padding-left: 20px;">
              <li>All your chat histories and projects</li>
              <li>All your API keys and developer access</li>
              <li>Any remaining SuperGyra credits or subscriptions</li>
            </ul>
          </div>

          <p style="font-size: 15px; line-height: 1.6; color: #d4d4d8; text-align: center;">
            If you are sure, click the button below to finalize the process:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmLink}" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 15px;">
              Permanently Delete My Account
            </a>
          </div>

          <p style="font-size: 13px; line-height: 1.5; color: #71717a; margin-top: 40px; text-align: center;">
            If you did not request this, please ignore this email. Your account is safe.
          </p>
        </div>
      `,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}