import prisma from "./prisma.js";

export const notificationTypes = {
  WELCOME: "WELCOME",
  COMPANY_CREATED: "COMPANY_CREATED",
  COMPANY_VERIFIED: "COMPANY_VERIFIED",
  NEW_APPLICATION: "NEW_APPLICATION",
  TOKENS_CREDITED: "TOKENS_CREDITED",
  APPLICATION_SHORTLISTED: "APPLICATION_SHORTLISTED",
  APPLICATION_REJECTED: "APPLICATION_REJECTED",
  COMPANY_AWAITING_VERIFICATION: "COMPANY_AWAITING_VERIFICATION",
};

export const notificationTemplates = {
  [notificationTypes.WELCOME]: (userName, role) => ({
    title: "👋 Welcome to WorkaHive!",
    message: role === "EMPLOYER" 
      ? `Welcome to WorkaHive, ${userName}! We're excited to have you on board. Need help setting up? Contact our support team or access our video guides. You need to create a company profile in order to get verified by admin.`
      : `Welcome to WorkaHive, ${userName}! We're excited to have you on board. Need help setting up? Contact our support team or access our video guides.`,
  }),
  
  [notificationTypes.COMPANY_CREATED]: (companyName) => ({
    title: "✅ Company Created",
    message: `Your company "${companyName}" has been created successfully. Please complete verification to start posting jobs.`,
  }),
  
  [notificationTypes.COMPANY_VERIFIED]: (companyName) => ({
    title: "🎉 Company Verified!",
    message: `Congratulations! Your company "${companyName}" has been verified. You can now start posting jobs and hiring top talent.`,
  }),
  
  [notificationTypes.NEW_APPLICATION]: (jobTitle) => ({
    title: "📝 New Application",
    message: `You have a new application for "${jobTitle}". Go to \"My Jobs\" to view their application.`,
  }),
  
  [notificationTypes.TOKENS_CREDITED]: (tokens) => ({
    title: "🪙 Tokens Received!",
    message: `${tokens} tokens have been credited to your account. You can now post more jobs!`,
  }),
  
  [notificationTypes.APPLICATION_SHORTLISTED]: (jobTitle) => ({
    title: "⭐ You've Been Shortlisted!",
    message: `Great news! You've been shortlisted for "${jobTitle}". The employer will be in touch soon.`,
  }),
  
  [notificationTypes.APPLICATION_REJECTED]: (jobTitle) => ({
    title: "📋 Application Update",
    message: `Your application for "${jobTitle}" wasn't selected this time. Keep applying – the right opportunity is out there!`,
  }),
  
  [notificationTypes.COMPANY_AWAITING_VERIFICATION]: (companyName) => ({
    title: "🔍 Company Awaiting Approval",
    message: `${companyName} has been created and is waiting for your approval.`,
  }),
};

export async function createNotification(userId, type, data = {}) {
  try {
    const template = notificationTemplates[type];
    if (!template) {
      console.error(`Unknown notification type: ${type}`);
      return null;
    }

    const { title, message } = template(...Object.values(data));

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data,
      },
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

export async function markAsRead(notificationId) {
  try {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return null;
  }
}

export async function markAllAsRead(userId) {
  try {
    return await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return null;
  }
}

export async function deleteNotification(notificationId) {
  try {
    return await prisma.notification.delete({
      where: { id: notificationId },
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return null;
  }
}
