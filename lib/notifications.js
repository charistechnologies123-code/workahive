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
  REFERRAL_MILESTONE: "REFERRAL_MILESTONE",
};

export const notificationTemplates = {
  [notificationTypes.WELCOME]: (userName, role) => ({
    title: "Welcome to WorkaHive",
    message:
      role === "EMPLOYER"
        ? `Welcome to WorkaHive, ${userName}. Create your company profile so admin can verify it and unlock job posting.`
        : `Welcome to WorkaHive, ${userName}. Your account is ready for saving jobs and applications.`,
  }),
  [notificationTypes.COMPANY_CREATED]: (companyName) => ({
    title: "Company created",
    message: `Your company "${companyName}" has been created successfully. Please complete verification to start posting jobs.`,
  }),
  [notificationTypes.COMPANY_VERIFIED]: (companyName) => ({
    title: "Company verified",
    message: `Congratulations. Your company "${companyName}" has been verified and can now post jobs.`,
  }),
  [notificationTypes.NEW_APPLICATION]: (jobTitle) => ({
    title: "New application",
    message: `You have a new application for "${jobTitle}".`,
  }),
  [notificationTypes.TOKENS_CREDITED]: (tokens) => ({
    title: "Tokens received",
    message: `${tokens} tokens have been credited to your account.`,
  }),
  [notificationTypes.APPLICATION_SHORTLISTED]: (jobTitle) => ({
    title: "You were shortlisted",
    message: `Great news. You have been shortlisted for "${jobTitle}".`,
  }),
  [notificationTypes.APPLICATION_REJECTED]: (jobTitle) => ({
    title: "Application update",
    message: `Your application for "${jobTitle}" was not selected this time.`,
  }),
  [notificationTypes.COMPANY_AWAITING_VERIFICATION]: (companyName) => ({
    title: "Company awaiting approval",
    message: `${companyName} has been created and is waiting for approval.`,
  }),
  [notificationTypes.REFERRAL_MILESTONE]: (referrerName, count) => ({
    title: "Referral milestone reached",
    message: `${referrerName} has reached ${count} referrals and may be eligible for reward review.`,
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

    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data,
      },
    });
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
