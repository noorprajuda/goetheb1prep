import { MailtrapClient } from 'mailtrap';

// Mailtrap configuration
let client: MailtrapClient | null = null;

try {
  const mailtrapToken = process.env.MAILTRAP_API_TOKEN;
  
  // Only create client if Mailtrap credentials are properly configured
  if (mailtrapToken) {
    client = new MailtrapClient({
      token: mailtrapToken,
    });
    console.log('✅ Mailtrap client configured successfully');
  } else {
    console.log('⚠️ Mailtrap credentials not configured. Using console logging for password reset links.');
  }
} catch (error) {
  console.error('Failed to create Mailtrap client:', error);
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  // Send email verification link
  static async sendEmailVerificationLink(email: string, token: string, firstName?: string): Promise<boolean> {
    if (!client) {
      console.error('Mailtrap client not configured');
      return false;
    }

    try {
      const baseUrl = process.env.BASE_URL || 
                     process.env.APP_URL || 
                     process.env.NEXT_PUBLIC_APP_URL || 
                     (process.env.NODE_ENV === 'production' ? 'https://www.goetheb1prep.com' : 'http://localhost:3000');
      const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
      const subject = 'Verify Your Email - Goethe B1 Prep';
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #dc2626;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f8fafc;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background-color: #dc2626;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #6b7280;
              font-size: 14px;
            }
            .warning {
              background-color: #fef2f2;
              border: 1px solid #fecaca;
              color: #dc2626;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Goethe B1 Prep</h1>
            <p>Email Verification</p>
          </div>
          <div class="content">
            <h2>Hello${firstName ? ` ${firstName}` : ''}!</h2>
            <p>Thank you for registering with Goethe B1 Prep. Please click the button below to verify your email address:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <div class="warning">
              <strong>Important:</strong> This link will expire in 24 hours for security reasons.
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">${verificationUrl}</p>
            
            <p>If you did not request this verification, please ignore this email.</p>
            
            <p>Best regards,<br>The Goethe B1 Prep Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Goethe B1 Prep. All rights reserved.</p>
          </div>
        </body>
        </html>
      `;

      const text = `
        Hello${firstName ? ` ${firstName}` : ''}!
        
        Thank you for registering with Goethe B1 Prep. Please click the link below to verify your email address:
        
        ${verificationUrl}
        
        Important: This link will expire in 24 hours for security reasons.
        
        If you did not request this verification, please ignore this email.
        
        Best regards,
        The Goethe B1 Prep Team
      `;

      const response = await client.send({
        from: {
          email: process.env.MAILTRAP_FROM_EMAIL || 'noreply@demomailtrap.co',
          name: 'Goethe B1 Prep'
        },
        to: [
          {
            email: email,
            name: firstName || 'User'
          }
        ],
        subject: subject,
        text: text,
        html: html,
      });

      console.log('Email verification link sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Error sending email verification link:', error);
      return false;
    }
  }

  // Send confirmation code email (legacy method)
  static async sendConfirmationCode(email: string, confirmationCode: string, firstName?: string): Promise<boolean> {
    if (!client) {
      console.error('Mailtrap client not configured');
      return false;
    }

    try {
      const subject = 'Confirm Your Account - Goethe B1 Prep';
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Confirmation</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #dc2626;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f8fafc;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .code {
              background-color: #e9ecef;
              padding: 15px;
              text-align: center;
              border-radius: 6px;
              font-size: 24px;
              font-weight: bold;
              letter-spacing: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Goethe B1 Prep</h1>
            <p>Email Confirmation</p>
          </div>
          <div class="content">
            <h2>Hello${firstName ? ` ${firstName}` : ''}!</h2>
            <p>Thank you for registering with Goethe B1 Prep. Please use the following code to verify your email address:</p>
            
            <div class="code">${confirmationCode}</div>
            
            <p>This code is valid for a limited time. If you did not request this, please ignore this email.</p>
            
            <p>Best regards,<br>The Goethe B1 Prep Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Goethe B1 Prep. All rights reserved.</p>
          </div>
        </body>
        </html>
      `;

      const text = `
        Hello${firstName ? ` ${firstName}` : ''}!
        
        Thank you for registering with Goethe B1 Prep. Please use the following code to verify your email address:
        
        ${confirmationCode}
        
        This code is valid for a limited time. If you did not request this, please ignore this email.
        
        Best regards,
        The Goethe B1 Prep Team
      `;

      const response = await client.send({
        from: {
          email: process.env.MAILTRAP_FROM_EMAIL || 'noreply@demomailtrap.co',
          name: 'Goethe B1 Prep'
        },
        to: [
          {
            email: email,
            name: firstName || 'User'
          }
        ],
        subject: subject,
        text: text,
        html: html,
      });

      console.log('Confirmation email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      return false;
    }
  }

  // Send welcome email after confirmation
  static async sendWelcomeEmail(email: string, firstName?: string): Promise<boolean> {
    if (!client) {
      console.error('Mailtrap client not configured');
      return false;
    }

    try {
      const subject = 'Welcome to Goethe B1 Prep!';
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #dc2626;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f8fafc;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background-color: #dc2626;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Goethe B1 Prep</h1>
            <p>Welcome!</p>
          </div>
          <div class="content">
            <h2>Welcome${firstName ? ` ${firstName}` : ''}!</h2>
            <p>Your email has been successfully verified. You can now access all features of Goethe B1 Prep.</p>
            
            <p>Start practicing your German speaking skills with our authentic B1 level tasks and get AI-powered feedback.</p>
            
            <p>Best regards,<br>The Goethe B1 Prep Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Goethe B1 Prep. All rights reserved.</p>
          </div>
        </body>
        </html>
      `;

      const text = `
        Welcome${firstName ? ` ${firstName}` : ''}!
        
        Your email has been successfully verified. You can now access all features of Goethe B1 Prep.
        
        Start practicing your German speaking skills with our authentic B1 level tasks and get AI-powered feedback.
        
        Best regards,
        The Goethe B1 Prep Team
      `;

      const response = await client.send({
        from: {
          email: process.env.MAILTRAP_FROM_EMAIL || 'noreply@demomailtrap.co',
          name: 'Goethe B1 Prep'
        },
        to: [
          {
            email: email,
            name: firstName || 'User'
          }
        ],
        subject: subject,
        text: text,
        html: html,
      });

      console.log('Welcome email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  // Send password reset email
  static async sendPasswordResetEmail(email: string, resetToken: string, firstName?: string): Promise<boolean> {
    if (!client) {
      console.error('Mailtrap client not configured');
      return false;
    }

    try {
      const baseUrl = process.env.BASE_URL || 
                     process.env.APP_URL || 
                     process.env.NEXT_PUBLIC_APP_URL || 
                     (process.env.NODE_ENV === 'production' ? 'https://www.goetheb1prep.com' : 'http://localhost:3000');
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
      const subject = 'Reset Your Password - Goethe B1 Prep';
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #dc2626;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f8fafc;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background-color: #dc2626;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #6b7280;
              font-size: 14px;
            }
            .warning {
              background-color: #fef2f2;
              border: 1px solid #fecaca;
              color: #dc2626;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Goethe B1 Prep</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <h2>Hello${firstName ? ` ${firstName}` : ''}!</h2>
            <p>We received a request to reset your password for your Goethe B1 Prep account.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <a href="${resetUrl}" class="button">Reset Password</a>
            
            <div class="warning">
              <strong>Important:</strong> This link will expire in 1 hour for security reasons.
            </div>
            
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            
            <p>For security reasons, this link can only be used once.</p>
            
            <p>Best regards,<br>The Goethe B1 Prep Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </body>
        </html>
      `;

      const text = `
        Hello${firstName ? ` ${firstName}` : ''}!
        
        We received a request to reset your password for your Goethe B1 Prep account.
        
        Click the link below to reset your password:
        ${resetUrl}
        
        Important: This link will expire in 1 hour for security reasons.
        
        If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
        
        For security reasons, this link can only be used once.
        
        Best regards,
        The Goethe B1 Prep Team
      `;

      const response = await client.send({
        from: {
          email: process.env.MAILTRAP_FROM_EMAIL || 'noreply@demomailtrap.co',
          name: 'Goethe B1 Prep'
        },
        to: [
          {
            email: email,
            name: firstName || 'User'
          }
        ],
        subject: subject,
        text: text,
        html: html,
      });

      console.log('Password reset email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  // Test email configuration
  static async testConnection(): Promise<boolean> {
    if (!client) {
      console.error('Mailtrap client not configured');
      return false;
    }

    try {
      // Send a test email
      const response = await client.send({
        from: {
          email: process.env.MAILTRAP_FROM_EMAIL || 'noreply@demomailtrap.co',
          name: 'Goethe B1 Prep'
        },
        to: [
          {
            email: 'test@example.com',
            name: 'Test User'
          }
        ],
        subject: 'Test Email - Goethe B1 Prep',
        text: 'This is a test email to verify Mailtrap configuration.',
        html: '<p>This is a test email to verify Mailtrap configuration.</p>',
      });

      console.log('Test email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Mailtrap configuration error:', error);
      return false;
    }
  }
}