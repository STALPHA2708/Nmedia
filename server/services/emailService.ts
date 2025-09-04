import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailConfig: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    };

    // Only initialize if SMTP credentials are provided
    if (emailConfig.auth.user && emailConfig.auth.pass) {
      try {
        this.transporter = nodemailer.createTransporter(emailConfig);
        this.isConfigured = true;
        console.log('✅ Email service configured successfully');
      } catch (error) {
        console.error('❌ Failed to configure email service:', error);
        this.isConfigured = false;
      }
    } else {
      console.warn('⚠️ Email service not configured - SMTP credentials missing');
      this.isConfigured = false;
    }
  }

  async sendEmail(message: EmailMessage): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.error('Email service not configured');
      return false;
    }

    try {
      const mailOptions = {
        from: `"Nomedia Production" <${process.env.SMTP_USER}>`,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        attachments: message.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${message.to}:`, result.messageId);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send email to ${message.to}:`, error);
      return false;
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string, tempPassword?: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue chez Nomedia Production</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .credentials { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #6366f1; margin: 20px 0; }
          .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎬 Bienvenue chez Nomedia Production</h1>
            <p>Votre compte a été créé avec succès</p>
          </div>
          <div class="content">
            <h2>Bonjour ${userName},</h2>
            <p>Nous sommes ravis de vous accueillir dans l'équipe de Nomedia Production ! Votre compte a été créé et vous pouvez maintenant accéder à notre plateforme de gestion.</p>
            
            <div class="credentials">
              <h3>🔐 Vos informations de connexion :</h3>
              <p><strong>Email :</strong> ${userEmail}</p>
              ${tempPassword ? `<p><strong>Mot de passe temporaire :</strong> <code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>` : ''}
              <p style="color: #dc2626; font-size: 14px;">
                ⚠️ <strong>Important :</strong> Nous vous recommandons de changer votre mot de passe lors de votre première connexion.
              </p>
            </div>

            <p>Vous pouvez maintenant :</p>
            <ul>
              <li>✅ Accéder aux projets et suivre leur progression</li>
              <li>✅ Gérer les équipes et les contrats</li>
              <li>✅ Consulter les factures et les finances</li>
              <li>✅ Collaborer avec votre équipe</li>
            </ul>

            <div style="text-align: center;">
              <a href="${process.env.APP_URL || 'http://localhost:8080'}/login" class="button">
                🚀 Se connecter maintenant
              </a>
            </div>

            <p>Si vous avez des questions, n'hésitez pas à contacter notre équipe support.</p>
            
            <p>Bonne journée !<br>
            L'équipe Nomedia Production</p>
          </div>
          <div class="footer">
            <p>© 2024 Nomedia Production. Tous droits réservés.</p>
            <p>Si vous n'êtes pas censé recevoir cet email, veuillez l'ignorer.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Bienvenue chez Nomedia Production !
      
      Bonjour ${userName},
      
      Votre compte a été créé avec succès.
      
      Informations de connexion :
      Email : ${userEmail}
      ${tempPassword ? `Mot de passe temporaire : ${tempPassword}` : ''}
      
      Connectez-vous : ${process.env.APP_URL || 'http://localhost:8080'}/login
      
      Nous vous recommandons de changer votre mot de passe lors de votre première connexion.
      
      L'équipe Nomedia Production
    `;

    return this.sendEmail({
      to: userEmail,
      subject: '🎬 Bienvenue chez Nomedia Production - Votre compte est prêt !',
      html,
      text,
    });
  }

  async sendInvoiceEmail(
    clientEmail: string,
    clientName: string,
    invoiceNumber: string,
    invoicePDF: Buffer,
    totalAmount: number
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Facture ${invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .invoice-info { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0; }
          .amount { font-size: 24px; color: #10b981; font-weight: bold; text-align: center; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Facture Nomedia Production</h1>
            <p>Facture ${invoiceNumber}</p>
          </div>
          <div class="content">
            <h2>Bonjour ${clientName},</h2>
            <p>Nous vous remercions pour votre confiance. Veuillez trouver ci-jointe votre facture pour les services de production audiovisuelle.</p>
            
            <div class="invoice-info">
              <h3>📋 Détails de la facture :</h3>
              <p><strong>Numéro :</strong> ${invoiceNumber}</p>
              <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
              <div class="amount">
                💰 Montant Total : ${new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(totalAmount)}
              </div>
            </div>

            <p><strong>📎 Pièce jointe :</strong> Votre facture est jointe à cet email au format PDF.</p>
            
            <p>Pour toute question concernant cette facture ou nos services, n'hésitez pas à nous contacter :</p>
            <ul>
              <li>📧 Email : contact@nomedia.ma</li>
              <li>📞 Téléphone : +212 5 22 XX XX XX</li>
              <li>🌐 Site web : www.nomedia.ma</li>
            </ul>

            <p>Nous vous remercions de votre collaboration et espérons continuer à travailler ensemble sur de futurs projets.</p>
            
            <p>Cordialement,<br>
            L'équipe Nomedia Production</p>
          </div>
          <div class="footer">
            <p>© 2024 Nomedia Production. Tous droits réservés.</p>
            <p>Société de production audiovisuelle - Casablanca, Maroc</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Facture Nomedia Production - ${invoiceNumber}
      
      Bonjour ${clientName},
      
      Veuillez trouver ci-jointe votre facture ${invoiceNumber}.
      Montant total : ${new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(totalAmount)}
      
      Pour toute question : contact@nomedia.ma
      
      Cordialement,
      L'équipe Nomedia Production
    `;

    return this.sendEmail({
      to: clientEmail,
      subject: `📄 Facture ${invoiceNumber} - Nomedia Production`,
      html,
      text,
      attachments: [
        {
          filename: `Facture_${invoiceNumber}.pdf`,
          content: invoicePDF,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  async sendPasswordResetEmail(userEmail: string, userName: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .warning { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Réinitialisation de mot de passe</h1>
            <p>Nomedia Production</p>
          </div>
          <div class="content">
            <h2>Bonjour ${userName},</h2>
            <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.</p>
            
            <div class="warning">
              ⚠️ <strong>Important :</strong> Ce lien est valide pendant 1 heure uniquement.
            </div>

            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>

            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">
                🔄 Réinitialiser mon mot de passe
              </a>
            </div>

            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px;">
              ${resetUrl}
            </p>

            <p><strong>Vous n'avez pas demandé cette réinitialisation ?</strong><br>
            Ignorez cet email. Votre mot de passe actuel reste inchangé.</p>
            
            <p>Pour votre sécurité, ne partagez jamais ce lien avec d'autres personnes.</p>
            
            <p>L'équipe Nomedia Production</p>
          </div>
          <div class="footer">
            <p>© 2024 Nomedia Production. Tous droits réservés.</p>
            <p>Si vous avez des questions, contactez-nous : support@nomedia.ma</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: '🔐 Réinitialisation de votre mot de passe - Nomedia Production',
      html,
    });
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email service connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Email service connection test failed:', error);
      return false;
    }
  }

  isReady(): boolean {
    return this.isConfigured;
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
