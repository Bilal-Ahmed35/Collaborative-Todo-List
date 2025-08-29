// Email service integration for sending invitations
import emailjs from "@emailjs/browser";

// Get configuration from environment variables
const EMAILJS_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

// Check if EmailJS is configured
const isEmailJSConfigured =
  EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY;

// Initialize EmailJS only if configured
if (isEmailJSConfigured) {
  emailjs.init(EMAILJS_PUBLIC_KEY);
  console.log("✅ EmailJS initialized successfully");
} else {
  console.warn(
    "⚠️ EmailJS not configured. Email invitations will be disabled."
  );
  console.log("To enable email invitations, set these environment variables:");
  console.log("- REACT_APP_EMAILJS_SERVICE_ID");
  console.log("- REACT_APP_EMAILJS_TEMPLATE_ID");
  console.log("- REACT_APP_EMAILJS_PUBLIC_KEY");
}

export const sendInvitationEmail = async (invitationData) => {
  // Check if EmailJS is configured
  if (!isEmailJSConfigured) {
    throw new Error(
      "Email service is not configured. Please check your environment variables."
    );
  }

  const { email, listName, invitedByName, role, listId } = invitationData;

  // Create invitation URL
  const inviteUrl = `${
    window.location.origin
  }/?invite=${listId}&email=${encodeURIComponent(email)}`;

  const templateParams = {
    to_email: email,
    to_name: email.split("@")[0], // Use email username as name
    from_name: invitedByName,
    list_name: listName,
    role: role,
    invite_url: inviteUrl,
    app_name: "Collab Todo",
    message: `You've been invited to collaborate on "${listName}" as a ${role}.`,
  };

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log("✅ Email sent successfully:", response);
    return { success: true, messageId: response.text };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw new Error(
      `Failed to send invitation email: ${error.message || "Unknown error"}`
    );
  }
};

// Alternative: Simple browser-based sharing (fallback when email is not configured)
export const shareInvitationLink = async (invitationData) => {
  const { email, listName, listId } = invitationData;
  const inviteUrl = `${
    window.location.origin
  }/?invite=${listId}&email=${encodeURIComponent(email)}`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: `Invitation to ${listName}`,
        text: `You've been invited to collaborate on "${listName}" in Collab Todo`,
        url: inviteUrl,
      });
      return { success: true, method: "native-share" };
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(inviteUrl);
      return { success: true, method: "clipboard", url: inviteUrl };
    } else {
      return { success: true, method: "manual", url: inviteUrl };
    }
  } catch (error) {
    console.error("Error sharing invitation:", error);
    return { success: true, method: "manual", url: inviteUrl };
  }
};

// Check if email service is available
export const isEmailServiceAvailable = () => {
  return isEmailJSConfigured;
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
        .header { background: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background: #f9f9f9; }
        .button { 
          display: inline-block; 
          background: #1976d2; 
          color: white; 
          padding: 12px 30px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0; 
          font-weight: bold;
        }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .role-badge { background: #e3f2fd; padding: 4px 12px; border-radius: 20px; color: #1976d2; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${appName}</h1>
          <h2>🎉 You're invited to collaborate!</h2>
        </div>
        
        <div class="content">
          <p>Hi there!</p>
          
          <p><strong>${invitedByName}</strong> has invited you to collaborate on:</p>
          <h3>"${listName}"</h3>
          <p>You'll have <span class="role-badge">${role}</span> access.</p>
          
          <p><strong>What you can do as a ${role}:</strong></p>
          ${
            role === "viewer"
              ? "<ul><li>📋 View all tasks and their progress</li><li>📊 Track team activity</li><li>💬 See comments and updates</li></ul>"
              : role === "editor"
              ? "<ul><li>📋 View all tasks and activity</li><li>✏️ Create and edit tasks</li><li>✅ Mark tasks as complete</li><li>👥 Collaborate with team members</li></ul>"
              : "<ul><li>🎛️ Full control over the list</li><li>👥 Manage members and permissions</li><li>📝 Create, edit, and delete tasks</li><li>🗑️ Delete the list if needed</li></ul>"
          }
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" class="button">🚀 Accept Invitation</a>
          </div>
          
          <p><small>💡 <strong>New to ${appName}?</strong> No problem! You'll be prompted to sign up using this email address when you click the link above.</small></p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p>Happy collaborating! 🎉</p>
          <p><strong>The ${appName} Team</strong></p>
        </div>
        
        <div class="footer">
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          <p>Need help? Contact us at support@collabtodo.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
