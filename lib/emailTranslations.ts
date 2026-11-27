// Email translations for server-side use
export const emailTranslations = {
  id: {
    confirm_subject: 'Konfirmasi Akun Anda - Goethe B1 Prep',
    confirm_title: 'Konfirmasi Email',
    confirm_hello: 'Halo',
    confirm_thank_you: 'Terima kasih telah mendaftar di Goethe B1 Prep. Silakan klik tombol di bawah untuk memverifikasi alamat email Anda:',
    confirm_click_button: 'Klik tombol di bawah untuk memverifikasi email Anda:',
    confirm_button: 'Verifikasi Email',
    confirm_valid_time: 'Link ini berlaku untuk waktu terbatas. Jika Anda tidak meminta ini, silakan abaikan email ini.',
    confirm_best_regards: 'Salam hormat,',
    confirm_team: 'Tim Goethe B1 Prep',
    confirm_footer: 'Hak Cipta',
    confirm_all_rights: 'Goethe B1 Prep. Semua hak dilindungi.',
    
    welcome_subject: 'Selamat Datang di Goethe B1 Prep!',
    welcome_title: 'Selamat Datang!',
    welcome_verified: 'Email Anda telah berhasil diverifikasi. Anda sekarang dapat mengakses semua fitur Goethe B1 Prep.',
    welcome_start_practicing: 'Mulai berlatih keterampilan berbicara bahasa Jerman Anda dengan tugas-tugas B1 otentik dan dapatkan umpan balik berbasis AI.',
    
    reset_subject: 'Reset Kata Sandi Anda - Goethe B1 Prep',
    reset_title: 'Permintaan Reset Kata Sandi',
    reset_received: 'Kami menerima permintaan untuk mereset kata sandi untuk akun Goethe B1 Prep Anda.',
    reset_click_button: 'Klik tombol di bawah untuk mereset kata sandi Anda:',
    reset_button: 'Reset Kata Sandi',
    reset_important: 'Penting:',
    reset_expire: 'Link ini akan kedaluwarsa dalam 1 jam untuk alasan keamanan.',
    reset_ignore: 'Jika Anda tidak meminta reset kata sandi, silakan abaikan email ini. Kata sandi Anda akan tetap tidak berubah.',
    reset_security: 'Untuk alasan keamanan, link ini hanya dapat digunakan sekali.',
    reset_automated: 'Ini adalah pesan otomatis. Harap jangan membalas email ini.',
  },
  en: {
    confirm_subject: 'Confirm Your Account - Goethe B1 Prep',
    confirm_title: 'Email Confirmation',
    confirm_hello: 'Hello',
    confirm_thank_you: 'Thank you for registering with Goethe B1 Prep. Please click the button below to verify your email address:',
    confirm_click_button: 'Click the button below to verify your email:',
    confirm_button: 'Verify Email',
    confirm_valid_time: 'This link is valid for a limited time. If you did not request this, please ignore this email.',
    confirm_best_regards: 'Best regards,',
    confirm_team: 'The Goethe B1 Prep Team',
    confirm_footer: 'Copyright',
    confirm_all_rights: 'Goethe B1 Prep. All rights reserved.',
    
    welcome_subject: 'Welcome to Goethe B1 Prep!',
    welcome_title: 'Welcome!',
    welcome_verified: 'Your email has been successfully verified. You can now access all features of Goethe B1 Prep.',
    welcome_start_practicing: 'Start practicing your German speaking skills with our authentic B1 level tasks and get AI-powered feedback.',
    
    reset_subject: 'Reset Your Password - Goethe B1 Prep',
    reset_title: 'Password Reset Request',
    reset_received: 'We received a request to reset your password for your Goethe B1 Prep account.',
    reset_click_button: 'Click the button below to reset your password:',
    reset_button: 'Reset Password',
    reset_important: 'Important:',
    reset_expire: 'This link will expire in 1 hour for security reasons.',
    reset_ignore: 'If you didn\'t request a password reset, please ignore this email. Your password will remain unchanged.',
    reset_security: 'For security reasons, this link can only be used once.',
    reset_automated: 'This is an automated message. Please do not reply to this email.',
  }
};

export function getEmailTranslation(key: string, language: string = 'en'): string {
  const translations = emailTranslations[language as keyof typeof emailTranslations] || emailTranslations.en;
  return translations[key as keyof typeof translations] || key;
}
