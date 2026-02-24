import nodemailer from "nodemailer";
import { NOTIFICATION_RECIPIENTS } from "@/config/constants";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

interface ContactRequestEmail {
    source: string;
    firstName: string;
    lastName: string;
    phone: string;
    message: string;
    managerName: string;
}

const SOURCE_LABELS: Record<string, string> = {
    contact: "Сторінка контактів",
    manager: "Сторінка менеджерів",
    tour: "Сторінка туру",
};

export async function sendContactRequestNotification(data: ContactRequestEmail) {
    const sourceLabel = SOURCE_LABELS[data.source] || data.source;
    const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ") || "Не вказано";

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">
        📩 Нова заявка на зв'язок
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; color: #555; width: 140px;">Джерело:</td>
          <td style="padding: 8px 12px;">${sourceLabel}</td>
        </tr>
        <tr style="background: #f9fafb;">
          <td style="padding: 8px 12px; font-weight: bold; color: #555;">Ім'я:</td>
          <td style="padding: 8px 12px;">${fullName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; color: #555;">Телефон:</td>
          <td style="padding: 8px 12px;"><a href="tel:${data.phone}">${data.phone}</a></td>
        </tr>
        ${data.managerName ? `
        <tr style="background: #f9fafb;">
          <td style="padding: 8px 12px; font-weight: bold; color: #555;">Менеджер:</td>
          <td style="padding: 8px 12px;">${data.managerName}</td>
        </tr>
        ` : ""}
        ${data.message ? `
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; color: #555; vertical-align: top;">Повідомлення:</td>
          <td style="padding: 8px 12px;">${data.message}</td>
        </tr>
        ` : ""}
      </table>
      <p style="color: #888; font-size: 12px; margin-top: 24px;">
        Цей лист надіслано автоматично з сайту restal.in.ua
      </p>
    </div>
  `;

    await transporter.sendMail({
        from: `"Restal" <${process.env.GMAIL_USER}>`,
        to: NOTIFICATION_RECIPIENTS.join(", "),
        subject: `Нова заявка на зв'язок — ${fullName} (${sourceLabel})`,
        html,
    });
}
