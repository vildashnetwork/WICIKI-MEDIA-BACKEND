import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";

dotenv.config();

const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

/**
 * Sends a professional email reminding a user to pay hosting fees.
 * @param {string} recipientEmail - The user's email address.
 * @param {string} recipientName - The user's name.
 */
const amount = "$17"
const companyName = "render"
const dueDate = "October 10, 2025: 11:59 PM UTC"
const invoiceId = "123456"
const paymentLink = "https://buy.stripe.com/test_14k9Dg3fH4gK0gU5kl"
const companyDomain = "render.com"
const sendPaymentReminderEmail = async (recipientEmail, recipientName) => {
    try {
        const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

        const sender = {
            email: "vildashnetwork02@gmail.com",
            name: "render.com Billing",
        };

        const subject = "⚠️ Important: Hosting Payment Due Before October 10, 2025";

        const htmlContent = `
   <!-- Luxury Payment Reminder — High-end, email-client friendly -->
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Payment Reminder</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body,table,td,a{ -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
table,td{ mso-table-lspace:0pt; mso-table-rspace:0pt; }
img{ -ms-interpolation-mode:bicubic; display:block; border:0; outline:none; text-decoration:none; }
body{ margin:0; padding:0; width:100%!important; background:#f4f6f8; font-family:Arial,Helvetica,sans-serif; -webkit-font-smoothing:antialiased; }

.email-wrapper{ width:100%; background:#f4f6f8; padding:32px 12px; }
.email-body{ max-width:680px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(12,20,32,0.08); border:1px solid rgba(12,20,32,0.04); }

.hero{ background:linear-gradient(135deg,#0f1724 0%,#1a73e8 55%,#7c3aed 100%); color:#fff; text-align:center; padding:28px; }
.brand{ font-weight:700; font-size:22px; letter-spacing:0.6px; }
.hero-sub{ color:rgba(255,255,255,0.9); font-size:13px; margin-top:6px; }

.content{ padding:30px; color:#263238; }
.greeting{ font-size:18px; color:#111827; margin-bottom:10px; }
.lead{ color:#475569; line-height:1.6; font-size:15px; margin-bottom:16px; }

.urgency{ background:linear-gradient(90deg,rgba(233,69,96,0.08),rgba(244,159,86,0.06)); padding:10px 14px; border-radius:8px; margin-bottom:18px; display:flex; align-items:center; justify-content:space-between; border:1px solid rgba(233,69,96,0.1); font-size:14px; }
.urgency strong{ color:#b91c1c; }

.amount-card{ display:flex; align-items:center; justify-content:space-between; background:linear-gradient(90deg,rgba(30,58,138,0.04),rgba(124,58,237,0.03)); border:1px solid rgba(14,19,42,0.05); padding:14px 16px; border-radius:10px; margin-bottom:18px; flex-wrap:wrap; }
.amount-left{ display:flex; gap:12px; align-items:center; }
.badge{ width:56px; height:56px; border-radius:10px; background:linear-gradient(135deg,#ffd166,#ff7a7a); display:flex; align-items:center; justify-content:center; font-weight:700; color:#111; box-shadow:0 6px 20px rgba(255,122,122,0.15); font-size:18px; }
.amount-details{ font-size:14px; color:#111827; }
.amount-figure{ font-size:20px; font-weight:700; color:#0b1220; }

.cta-wrap{ text-align:center; margin:24px 0 14px 0; }
.btn{ display:inline-block; border-radius:8px; padding:12px 28px; font-weight:700; text-decoration:none; background:linear-gradient(90deg,#0f6ff8,#7c3aed); color:#fff; box-shadow:0 8px 20px rgba(12,20,32,0.12); }

.footer{ background:#fbfdff; padding:18px; text-align:center; font-size:12px; color:#6b7280; border-top:1px solid rgba(12,20,32,0.03); }
.small{ font-size:12px; color:#94a3b8; }

@media only screen and (max-width:600px){
  .content{ padding:20px; }
  .amount-card{ flex-direction:column; align-items:flex-start; gap:10px; }
  .badge{ width:48px; height:48px; font-size:16px; }
  .brand{ font-size:20px; }
  .btn{ width:100%; box-sizing:border-box; text-align:center; }
}
</style>
</head>

<body>
<div class="email-wrapper">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr><td align="center">
      <table role="presentation" class="email-body" width="100%" cellspacing="0" cellpadding="0">
        <tr><td class="hero">
          <div class="brand">${companyName}</div>
          <div class="hero-sub">Important: hosting renewal reminder</div>
        </td></tr>

        <tr><td class="content">
          <div class="greeting">Hello <strong>${recipientName}</strong>,</div>
          <div class="lead">
            We're reaching out with an urgent reminder: your hosting subscription is about to expire.
            Please complete your payment by <strong>${dueDate}</strong> to prevent service interruption.
          </div>

          <div class="urgency">
            <div>⏰ <strong>Deadline:</strong> ${dueDate}</div>
            <div>Amount due: <strong>${amount}</strong></div>
          </div>

          <div class="amount-card">
            <div class="amount-left">
             <div class="badge">💳</div>
              <div>
                <div class="amount-details">Hosting Renewal / 1 year</div>
                <div class="amount-figure">${amount}</div>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:12px;color:#64748b;">Invoice #<strong>${invoiceId}</strong></div>
              <div style="font-size:12px;color:#94a3b8;">Auto-renew: Off</div>
            </div>
          </div>

          <div class="cta-wrap">
            <a class="btn" href="${paymentLink}" target="_blank">Pay ${amount} Now</a>
          </div>

          <p style="color:#475569;font-size:13px;line-height:1.6;">
            If payment has already been made, please disregard this message.
            Otherwise, note that failure to pay by <strong>${dueDate}</strong> may cause temporary suspension of your website.
          </p>

          <div style="height:18px;"></div>
          <p style="color:#6b7280;font-size:13px;">
            Need assistance? Contact our support team at
            <a href="mailto:support@${companyDomain}" style="color:#0f6ff8;text-decoration:none;">support@${companyDomain}</a>.
          </p>

          <hr style="border:none;border-top:1px solid rgba(12,20,32,0.06);margin:20px 0;">
          <p class="small">
            Thank you for choosing <strong>${companyName}</strong>.
            We appreciate your continued trust in our hosting services.
          </p>
        </td></tr>

        <tr><td class="footer">
          © ${new Date().getFullYear()} ${companyName}. All rights reserved.<br>
          <span class="small">
            For billing questions, email
            <a href="mailto:billing@${companyDomain}" style="color:#64748b;text-decoration:none;">billing@${companyDomain}</a>.
          </span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</div>
</body>
</html>

    `;

        const sendSmtpEmail = {
            sender,
            to: [{ email: recipientEmail, name: recipientName }],
            subject,
            htmlContent,
        };

        const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log("✅ Email sent successfully:", response);
    } catch (error) {
        console.error("❌ Error sending email:", error.message);
    }
};

sendPaymentReminderEmail("vildashnetwork@gmail.com", "vildashnetwork");
