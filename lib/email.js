import {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
} from "./emailTemplates.js";
import { transport, sender } from "./mailtrap.config.js";
import dotenv from "dotenv";

dotenv.config();

const API_URL =
  process.env.BASE_URL ||
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://www.goetheb1prep.com"
    : "http://localhost:3000");

export const sendVerificationEmail = async (
  email,
  verificationToken,
  id,
  name,
  language = "en"
) => {
  const recipient = [{ email }];

  try {
    // Set subject based on language
    const subject =
      language === "id"
        ? "Verifikasi email kamu - Goethe B1 Prep"
        : "Verify Your Email - Goethe B1 Prep";

    const response = await transport.sendMail({
      from: sender,
      to: recipient.map((r) => r.email).join(", "),
      subject: subject,
      html: VERIFICATION_EMAIL_TEMPLATE.replace("{API_URL}", API_URL)
        .replace("{name}", name || "User")
        .replace("{id}", id)
        .replace("{verificationToken}", verificationToken)
        .replace(
          "{LINK}",
          `${API_URL}/verify-email?token=${verificationToken}`
        ),
    });

    console.log("✅ Verification email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    throw new Error(`Error sending verification email: ${error.message}`);
  }
};

export const sendWelcomeEmail = async (email, name) => {
  const recipient = [{ email }];

  try {
    const response = await transport.sendMail({
      from: sender,
      to: recipient.map((r) => r.email).join(", "),
      subject: "Selamat datang di Goethe B1 Prep!",
      html: WELCOME_EMAIL_TEMPLATE.replace("{API_URL}", API_URL).replace(
        "{name}",
        name || "User"
      ),
    });

    console.log("✅ Welcome email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
    throw new Error(`Error sending welcome email: ${error.message}`);
  }
};

export const sendPasswordResetEmail = async (email, resetURL, name) => {
  const recipient = [{ email }];

  try {
    const response = await transport.sendMail({
      from: sender,
      to: recipient.map((r) => r.email).join(", "),
      subject: "Atur ulang kata sandi kamu - Goethe B1 Prep",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace(
        "{resetURL}",
        resetURL
      ).replace("{name}", name || "User"),
    });

    console.log("✅ Password reset email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
    throw new Error(`Error sending password reset email: ${error.message}`);
  }
};

export const sendResetSuccessEmail = async (email, name) => {
  const recipient = [{ email }];

  try {
    const response = await transport.sendMail({
      from: sender,
      to: recipient.map((r) => r.email).join(", "),
      subject: "Pengaturan ulang kata sandi berhasil! - Goethe B1 Prep",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE.replace(
        "{API_URL}",
        API_URL
      ).replace("{name}", name || "User"),
    });

    console.log("✅ Password reset success email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Error sending password reset success email:", error);
    throw new Error(
      `Error sending password reset success email: ${error.message}`
    );
  }
};

// Additional utility functions
// Removed sendConfirmationCodeEmail - using link-based verification only

// Test email function
export const sendTestEmail = async (email, name = "Test User") => {
  const recipient = [{ email }];

  try {
    const response = await transport.sendMail({
      from: sender,
      to: recipient.map((r) => r.email).join(", "),
      subject: "Test Email - Goethe B1 Prep",
      html: `
        <h2>Hello ${name}!</h2>
        <p>This is a test email from Goethe B1 Prep.</p>
        <p>If you received this email, the email service is working correctly.</p>
        <p>Best regards,<br>The Goethe B1 Prep Team</p>
      `,
    });

    console.log("✅ Test email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Error sending test email:", error);
    throw new Error(`Error sending test email: ${error.message}`);
  }
};
