import { NextResponse } from "next/server";
import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  return new Resend(key);
}

export async function POST(req: Request) {
  try {
    const { email, projectName, projectId } = await req.json();

    if (!email || !projectName || !projectId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gyra.ng";
    const projectLink = `${baseUrl}/project/${projectId}`;

    const { data, error } = await getResend().emails.send({
      from: "Gyra Projects <projects@updates.gyra.ng>", 
      to: [email],
      subject: `You've been invited to collaborate on ${projectName}`,
      html: `
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
<title>Project Invitation</title>
<style>
html,body{margin:0!important;padding:0!important;width:100%!important;background:#e7edf3;}
table,td{border-collapse:collapse!important;mso-table-lspace:0pt!important;mso-table-rspace:0pt!important;}
img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;}
a{text-decoration:none;}
@media only screen and (max-width:640px){
  .shell{width:100%!important;max-width:100%!important;}
  .pad{padding-left:22px!important;padding-right:22px!important;}
  .title{font-size:32px!important;line-height:1.08!important;}
}
</style>
</head>
<body style="margin:0;padding:0;background:#e7edf3;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">A formal invitation to collaborate on a Gyra project.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#e7edf3" style="width:100%;background:#e7edf3;">
<tr><td align="center" style="padding:40px 10px;">
<table role="presentation" class="shell" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a0a0f" style="width:600px;max-width:600px;background:#0a0a0f;border:1px solid #27272a;border-radius:16px;overflow:hidden;">

  <!-- Header -->
  <tr><td class="pad" style="padding:32px 40px;border-bottom:1px solid #27272a;">
    <table role="presentation" width="100%"><tr>
      <td valign="middle"><table role="presentation"><tr>
        <td valign="middle">
          <!-- Logo Image -->
          <img src="https://gyra.ng/gyra-logo.png" alt="Gyra" width="32" height="32" style="display:block;border-radius:8px;">
        </td>
        <td valign="middle" style="padding-left:12px;font-family:Arial,sans-serif;font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">Gyra
        </td>
      </tr></table></td>
      <td align="right" valign="middle" style="font-family:Arial,sans-serif;font-size:10px;font-weight:bold;letter-spacing:1.5px;color:#5ce4fa;text-transform:uppercase;">
        Project Invitation
      </td>
    </tr></table>
  </td></tr>

  <!-- Body Content -->
  <tr><td class="pad" style="padding:48px 40px 40px;">
    <div style="font-family:Arial,sans-serif;font-size:11px;font-weight:bold;letter-spacing:2px;color:#5ce4fa;margin-bottom:16px;text-transform:uppercase;">
      You've been invited
    </div>
    
    <h1 class="title" style="margin:0 0 20px 0;font-family:Arial,sans-serif;font-size:38px;line-height:1.1;letter-spacing:-1.2px;font-weight:800;color:#ffffff;">
      A new workspace<br>is waiting for you.
    </h1>

    <p style="margin:0 0 24px 0;font-family:Arial,sans-serif;font-size:15px;line-height:26px;color:#a1a1aa;">
      Hello, you have been granted access to a private project on Gyra. Click the button below to open the workspace, review the attached files, and start chatting with the AI.
    </p>

    <!-- Project Card -->
    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px;margin-bottom:32px;">
      <p style="margin:0 0 8px 0;font-family:Arial,sans-serif;font-size:11px;font-weight:bold;letter-spacing:1px;color:#71717a;text-transform:uppercase;">Project Name</p>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:20px;font-weight:bold;color:#ffffff;">${projectName}</p>
    </div>

    <!-- CTA Button -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
      <tr>
        <td align="center" bgcolor="#ffffff" style="border-radius:100px;">
          <a href="${projectLink}" style="display:inline-block;padding:16px 32px;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;color:#0a0a0f;text-decoration:none;">
            Open Project Workspace &rarr;
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;line-height:20px;color:#71717a;">
      If you were not expecting this invitation, you can safely ignore this email.
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td align="center" class="pad" style="padding:32px 40px;background:#09090b;border-top:1px solid #18181b;">
    <div style="font-family:Arial,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;margin-bottom:6px;">Gyra</div>
    <div style="font-family:Arial,sans-serif;font-size:11px;color:#71717a;margin-bottom:16px;">Intelligence, Simplified.</div>
    <div style="font-family:Arial,sans-serif;font-size:11px;color:#52525b;">
      © ${new Date().getFullYear()} Genvia AI Company. All rights reserved.
    </div>
  </td></tr>

</table>
</td></tr></table>
</body>
</html>
      `,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}