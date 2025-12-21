import { serve } from "https://deno.land/std/http/server.ts";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // ✅ Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const { feedback, hadith, book, pageUrl, type } = await req.json();

    if (!feedback?.comments) {
      return new Response(
        JSON.stringify({ error: "Missing feedback" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const transporter = nodemailer.createTransport({
      host: Deno.env.get("ZOHO_SMTP_HOST"),
      port: Number(Deno.env.get("ZOHO_SMTP_PORT")),
      secure: true,
      auth: {
        user: Deno.env.get("ZOHO_SMTP_USER"),
        pass: Deno.env.get("ZOHO_SMTP_PASS"),
      },
    });

    const toEmail =
      type === "about"
        ? Deno.env.get("ABOUT_EMAIL")
        : Deno.env.get("FEEDBACK_EMAIL");

    const text = `
New Message From Shia Library

Name: ${feedback.name}
Email: ${feedback.email}

Book: ${book?.title ?? "N/A"}
Hadith: ${hadith?.hadith_number ?? "N/A"}
Page: ${pageUrl}

Message:
${feedback.comments}
`;

    await transporter.sendMail({
      from: `"Shia Library" <${Deno.env.get("ZOHO_SMTP_USER")}>`,
      to: toEmail,
      replyTo: feedback.email,
      subject: "New Website Feedback",
      text,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("SMTP ERROR:", err);
    return new Response(
      JSON.stringify({ error: "Email failed" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
