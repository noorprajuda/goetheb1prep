// Email templates for Goethe B1 Prep
export const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification - Goethe B1 Prep</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }
        .owl-icon {
            width: 32px;
            height: 32px;
            margin-right: 8px;
            vertical-align: middle;
        }
        .header p {
            margin: 8px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #1f2937;
        }
        .message {
            font-size: 16px;
            margin-bottom: 30px;
            color: #4b5563;
            line-height: 1.7;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .verify-button {
            display: inline-block;
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
            transition: all 0.3s ease;
        }
        .verify-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
        }
        .warning {
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            color: #1d4ed8;
            padding: 16px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
        }
        .warning strong {
            display: block;
            margin-bottom: 4px;
        }
        .footer {
            background-color: #f9fafb;
            padding: 20px 30px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .footer p {
            margin: 0;
        }
        .link-fallback {
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            color: #1d4ed8;
            padding: 16px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>
                <img 
                    src="../public/images/loading/owl-transparent.svg" 
                    alt="Owl" 
                    class="owl-icon">
                Goethe B1 Prep
            </h1>
            <p>Email Verification</p>
        </div>
        
        <div class="content">
            <div class="greeting">Hello {name}!</div>
            
            <div class="message">
                Thank you for registering with Goethe B1 Prep. Please click the button below to verify your email address and activate your account.
            </div>
            
            <div class="button-container">
                <a href="{LINK}" class="verify-button">Verify Email Address</a>
            </div>
            
            <div class="warning">
                <strong>Important:</strong> This link will expire in 24 hours for security reasons.
            </div>
            
            <div class="message">
                If the button doesn't work, you can copy and paste this link into your browser:
            </div>
            
            <div class="link-fallback">{LINK}</div>
            
            <div class="message">
                If you did not request this verification, please ignore this email. Your account will not be activated without verification.
            </div>
        </div>
        
        <div class="footer">
            <p>&copy; {API_URL} Goethe B1 Prep. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

export const WELCOME_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome - Goethe B1 Prep</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .owl-icon {
            width: 32px;
            height: 32px;
            margin-right: 8px;
            vertical-align: middle;
        }
        .header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 12px 12px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .header p {
            margin: 8px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #1f2937;
        }
        .message {
            font-size: 16px;
            margin-bottom: 20px;
            color: #4b5563;
            line-height: 1.7;
        }
        .success-box {
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            color: #1d4ed8;
            padding: 16px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
            transition: all 0.3s ease;
            margin: 20px 0;
        }
        
        .footer {
            background-color: #f9fafb;
            padding: 20px 30px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>
                <img 
                    src="../public/images/loading/owl-transparent.svg" 
                    alt="Owl" 
                    class="owl-icon">
                Goethe B1 Prep
            </h1>
            <p>Welcome!</p>
        </div>
        
        <div class="content">
            <div class="greeting">Welcome {name}!</div>
            
            <div class="success-box">
                <strong>🎉 Congratulations!</strong> Your email has been successfully verified. You can now access all features of Goethe B1 Prep.
            </div>
            
            <div class="message">
                Start practicing your German speaking skills with our authentic B1 level tasks and get AI-powered feedback to improve your performance.
            </div>
            
            <div class="message">
                <strong>What you can do now:</strong>
                <ul>
                    <li>Take practice speaking tests</li>
                    <li>Get detailed feedback on your pronunciation and fluency</li>
                    <li>Track your progress over time</li>
                    <li>Access all B1 level topics and scenarios</li>
                </ul>
            </div>
            
            <div style="text-align: center;">
                <a href="{API_URL}" class="cta-button">Start Practicing Now</a>
            </div>
            
            <div class="message">
                If you have any questions or need help, feel free to contact our support team.
            </div>
        </div>
        
        <div class="footer">
            <p>&copy; {API_URL} Goethe B1 Prep. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

export const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - Goethe B1 Prep</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .owl-icon {
            width: 32px;
            height: 32px;
            margin-right: 8px;
            vertical-align: middle;
        }
        .header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 12px 12px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .header p {
            margin: 8px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #1f2937;
        }
        .message {
            font-size: 16px;
            margin-bottom: 20px;
            color: #4b5563;
            line-height: 1.7;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
            transition: all 0.3s ease;
            margin: 20px 0;

        }
        .warning {
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            color: #1d4ed8;
            padding: 16px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .footer {
            background-color: #f9fafb;
            padding: 20px 30px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
             <div class="header">
            <h1>
                <img 
                    src="../public/images/loading/owl-transparent.svg" 
                    alt="Owl" 
                    class="owl-icon">
                Goethe B1 Prep
            </h1>
            <p>Password Reset Request</p>
        </div>
        
        <div class="content">
            <div class="greeting">Hello {name}!</div>
            
            <div class="message">
                We received a request to reset your password for your Goethe B1 Prep account.
            </div>
            
            <div class="message">
                Click the button below to reset your password:
            </div>
            
            <div class="button-container">
                <a href="{resetURL}" class="reset-button">Reset Password</a>
            </div>
            
            <div class="warning">
                <strong>Important:</strong> This link will expire in 1 hour for security reasons.
            </div>
            
            <div class="message">
                If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
            </div>
            
            <div class="message">
                For security reasons, this link can only be used once.
            </div>
        </div>
        
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
`;

export const PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Success - Goethe B1 Prep</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .owl-icon {
            width: 32px;
            height: 32px;
            margin-right: 8px;
            vertical-align: middle;
        }
        .header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 12px 12px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .header p {
            margin: 8px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #1f2937;
        }
        .message {
            font-size: 16px;
            margin-bottom: 20px;
            color: #4b5563;
            line-height: 1.7;
        }
        .success-box {
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            color: #1d4ed8;
            padding: 16px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
            transition: all 0.3s ease;
            margin: 20px 0;
        }
        .footer {
            background-color: #f9fafb;
            padding: 20px 30px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>
                <img 
                    src="../public/images/loading/owl-transparent.svg" 
                    alt="Owl" 
                    class="owl-icon">
                Goethe B1 Prep
            </h1>
            <p>Welcome!</p>
        </div>
        
        <div class="content">
            <div class="greeting">Hello {name}!</div>
            
            <div class="success-box">
                <strong>✅ Success!</strong> Your password has been successfully reset.
            </div>
            
            <div class="message">
                You can now log in to your account with your new password.
            </div>
            
            <div style="text-align: center;">
                <a href="{API_URL}/login" class="cta-button">Log In Now</a>
            </div>
            
            <div class="message">
                If you didn't make this change, please contact our support team immediately.
            </div>
        </div>
        
        <div class="footer">
            <p>&copy; {API_URL} Goethe B1 Prep. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;
