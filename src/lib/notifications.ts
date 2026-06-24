import { prisma } from "@/lib/prisma";

export async function createNotification(params: {
  userId: string;
  title: string;
  message?: string;
  type?: string;
  link?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type || "INFO",
      link: params.link,
    },
  });
}

export async function notifyUser(params: {
  userId: string;
  title: string;
  message?: string;
  type?: string;
  link?: string;
  email?: { to: string; subject: string; html: string };
}) {
  await createNotification({
    userId: params.userId,
    title: params.title,
    message: params.message,
    type: params.type,
    link: params.link,
  });

  if (params.email) {
    try {
      const { sendEmail } = await import("@/lib/email");
      await sendEmail(params.email);
    } catch {
      console.warn("Failed to send email notification");
    }
  }
}
