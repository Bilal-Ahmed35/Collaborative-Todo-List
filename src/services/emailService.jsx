// Email service integration for sending invitations
// This example uses EmailJS for client-side email sending
// For production, use a backend service like SendGrid, AWS SES, or Nodemailer

import emailjs from "@emailjs/browser";

// Initialize EmailJS (you'll need to set up your EmailJS account)
const EMAILJS_SERVICE_ID = "your_service_id";
const EMAILJS_TEMPLATE_ID = "your_template_id";
const EMAILJS_PUBLIC_KEY = "your_public_key";

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

export const sendInvitationEmail = async (invitationData) => {
  const {
    email,
    listName,
    invitedByName,
    role,
    listId,
    inviteUrl = `${window.location.origin}/accept-invite/${listId}`,
  } = invitationData;

  const templateParams = {
    to_email: email,
    to_name: email.split("@")[0], // Use email username as name
    from_name: invitedByName,
    list_name: listName,
    role: role,
    invite_url: inviteUrl,
    app_name: "Collab Todo",
  };

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log("Email sent successfully:", response);
    return { success: true, messageId: response.text };
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error("Failed to send invitation email");
  }
};

// Alternative: Firebase Functions approach (recommended for production)
export const sendInvitationEmailViaFunction = async (invitationData) => {
  try {
    const { httpsCallable } = await import("firebase/functions");
    const { functions } = await import("../Firebase/firebase");

    const sendEmail = httpsCallable(functions, "sendInvitationEmail");
    const result = await sendEmail(invitationData);

    return result.data;
  } catch (error) {
    console.error("Error sending email via Firebase Function:", error);
    throw error;
  }
};

// Email template for invitations (HTML format)
export const getInvitationEmailTemplate = (data) => {
  const { listName, invitedByName, role, inviteUrl, appName } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>You're invited to collaborate!</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1976d2; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .button { 
          display: inline-block; 
          background: #1976d2; 
          color: white; 
          padding: 12px 30px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0; 
        }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${appName}</h1>
          <h2>You're invited to collaborate!</h2>
        </div>
        
        <div class="content">
          <p>Hi there!</p>
          
          <p><strong>${invitedByName}</strong> has invited you to collaborate on the list "<strong>${listName}</strong>" with <strong>${role}</strong> access.</p>
          
          <p>As a <strong>${role}</strong>, you'll be able to:</p>
          ${
            role === "viewer"
              ? "<ul><li>View tasks and activity</li><li>Track progress</li></ul>"
              : role === "editor"
              ? "<ul><li>View tasks and activity</li><li>Create and edit tasks</li><li>Mark tasks as complete</li></ul>"
              : "<ul><li>Full control over the list</li><li>Manage members and permissions</li><li>Create, edit, and delete tasks</li></ul>"
          }
          
          <div style="text-align: center;">
            <a href="${inviteUrl}" class="button">Accept Invitation</a>
          </div>
          
          <p>If you don't have an account yet, you'll be prompted to sign up using this email address.</p>
          
          <p>Happy collaborating!</p>
          <p>The ${appName} Team</p>
        </div>
        
        <div class="footer">
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          <p>This invitation link will expire in 7 days.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
