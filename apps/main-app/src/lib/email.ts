import nodemailer from "nodemailer";
import { db } from "../drizzle/db";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface SendEmailOptions {
  userId?: string;
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ userId, to, subject, html }: SendEmailOptions) {
  const emailId = nanoid();
  
  // Create pending entry in DB
  await db.insert(schema.emails).values({
    id: emailId,
    userId,
    email: to,
    subject,
    body: html,
    status: "queued",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  try {
    const info = await transporter.sendMail({
      from: `"Flow402" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent: %s", info.messageId);

    // Update DB entry as sent
    await db.update(schema.emails)
      .set({
        status: "sent",
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.emails.id, emailId));

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email:", error);

    // Update DB entry as failed
    await db.update(schema.emails)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : String(error),
        updatedAt: new Date(),
      })
      .where(eq(schema.emails.id, emailId));

    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendWelcomeEmail(user: { id: string; email: string; name: string | null }) {
  const subject = "Welcome to Flow402!";
  const name = user.name || "there";
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #000; text-decoration: none; }
          .content { margin-bottom: 30px; }
          .footer { font-size: 12px; color: #999; text-align: center; }
          .button { display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Flow402</div>
          </div>
          <div class="content">
            <h2>Welcome to the future of APIs, ${name}!</h2>
            <p>We're thrilled to have you join Flow402. Our platform is designed to make it effortless for developers like you to discover, test, and integrate high-performance APIs with native Web3 payments.</p>
            <p>Here's what you can do right now:</p>
            <ul>
              <li><strong>Explore the Marketplace</strong>: Discover a wide range of specialized API endpoints.</li>
              <li><strong>Try it Out</strong>: Use our built-in testing tools to verify API responses before integrating.</li>
              <li><strong>List your own API</strong>: Join our community of providers and start earning in USDC.</li>
            </ul>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard" class="button">Go to Dashboard</a>
            <p>If you have any questions, our documentation is always available at <a href="https://docs.flow402.com">docs.flow402.com</a>.</p>
            <p>Happy coding!<br>The Flow402 Team</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Flow402 Protocol. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    userId: user.id,
    to: user.email,
    subject,
    html,
  });
}
