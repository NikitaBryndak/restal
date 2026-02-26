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

/* ================================================================== */
/*  Trip status change email                                           */
/* ================================================================== */

interface TripStatusEmail {
    to: string;
    userName: string;
    tripNumber: string;
    country: string;
    oldStatus: string;
    newStatus: string;
}

export async function sendTripStatusEmail(data: TripStatusEmail) {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0a0a0a 100%); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0 0 8px; font-size: 24px; color: #ffffff;">RestAL</h1>
        <p style="margin: 0; color: #93c5fd; font-size: 14px;">Оновлення вашої подорожі</p>
      </div>
      <div style="padding: 24px;">
        <p style="color: #e2e8f0; font-size: 16px; margin-bottom: 16px;">
          Вітаємо, ${data.userName}! 👋
        </p>
        <div style="background: #1a1a2e; border: 1px solid #2d2d44; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0 0 4px;">Подорож</p>
          <p style="color: #ffffff; font-size: 18px; font-weight: bold; margin: 0 0 12px;">
            ${data.tripNumber} — ${data.country}
          </p>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background: #374151; color: #9ca3af; padding: 4px 12px; border-radius: 20px; font-size: 13px; text-decoration: line-through;">
              ${data.oldStatus}
            </span>
            <span style="color: #60a5fa; font-size: 16px;">→</span>
            <span style="background: #1e40af; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">
              ${data.newStatus}
            </span>
          </div>
        </div>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          Статус вашої подорожі було автоматично оновлено. Ви можете переглянути деталі у
          <a href="https://restal.in.ua/dashboard/trips" style="color: #60a5fa; text-decoration: none;">вашому кабінеті</a>.
        </p>
      </div>
      <div style="padding: 16px 24px; border-top: 1px solid #1a1a2e; text-align: center;">
        <p style="color: #64748b; font-size: 12px; margin: 0;">
          Цей лист надіслано автоматично з сайту restal.in.ua
        </p>
      </div>
    </div>
  `;

    await transporter.sendMail({
        from: `"RestAL" <${process.env.GMAIL_USER}>`,
        to: data.to,
        subject: `Подорож ${data.tripNumber}: ${data.newStatus}`,
        html,
    });
}

/* ================================================================== */
/*  Trip reminder emails (payment deadline / departure)                */
/* ================================================================== */

interface TripReminderEmail {
    to: string;
    userName: string;
    tripNumber: string;
    country: string;
    reminderType: "payment" | "departure";
    // Payment fields
    deadline?: string;
    totalAmount?: number;
    paidAmount?: number;
    // Departure fields
    flightNumber?: string;
    departureTime?: string;
    departureDate?: string;
    hotel?: string;
}

export async function sendTripReminderEmail(data: TripReminderEmail) {
    const isPayment = data.reminderType === "payment";

    const paymentHtml = `
        <div style="background: #1a1a2e; border: 1px solid #f59e0b33; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="color: #f59e0b; font-size: 16px; font-weight: bold; margin: 0 0 12px;">
            ⚠️ Нагадування про оплату
          </p>
          <p style="color: #e2e8f0; font-size: 14px; margin: 0 0 8px;">
            Подорож <strong>${data.tripNumber}</strong> — ${data.country}
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Термін оплати:</td>
              <td style="padding: 6px 0; color: #f59e0b; font-size: 13px; font-weight: bold; text-align: right;">${data.deadline}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Загальна сума:</td>
              <td style="padding: 6px 0; color: #ffffff; font-size: 13px; text-align: right;">${(data.totalAmount || 0).toLocaleString('uk-UA')} грн</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Сплачено:</td>
              <td style="padding: 6px 0; color: #10b981; font-size: 13px; text-align: right;">${(data.paidAmount || 0).toLocaleString('uk-UA')} грн</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">До сплати:</td>
              <td style="padding: 6px 0; color: #ef4444; font-size: 13px; font-weight: bold; text-align: right;">${((data.totalAmount || 0) - (data.paidAmount || 0)).toLocaleString('uk-UA')} грн</td>
            </tr>
          </table>
        </div>
    `;

    const departureHtml = `
        <div style="background: #1a1a2e; border: 1px solid #10b98133; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="color: #10b981; font-size: 16px; font-weight: bold; margin: 0 0 12px;">
            ✈️ Завтра ваша подорож!
          </p>
          <p style="color: #e2e8f0; font-size: 14px; margin: 0 0 16px;">
            Подорож <strong>${data.tripNumber}</strong> — ${data.country}
          </p>
          <table style="width: 100%; border-collapse: collapse;">
            ${data.flightNumber ? `
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Рейс:</td>
              <td style="padding: 6px 0; color: #ffffff; font-size: 13px; text-align: right;">${data.flightNumber}</td>
            </tr>` : ''}
            ${data.departureTime ? `
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Час вильоту:</td>
              <td style="padding: 6px 0; color: #ffffff; font-size: 13px; text-align: right;">${data.departureTime}</td>
            </tr>` : ''}
            ${data.departureDate ? `
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Дата:</td>
              <td style="padding: 6px 0; color: #ffffff; font-size: 13px; text-align: right;">${data.departureDate}</td>
            </tr>` : ''}
            ${data.hotel ? `
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Готель:</td>
              <td style="padding: 6px 0; color: #ffffff; font-size: 13px; text-align: right;">${data.hotel}</td>
            </tr>` : ''}
          </table>
          <div style="background: #0f172a; border-radius: 8px; padding: 12px; margin-top: 16px;">
            <p style="color: #94a3b8; font-size: 13px; margin: 0; line-height: 1.6;">
              📋 <strong style="color: #e2e8f0;">Не забудьте:</strong> паспорт, квитки, страховий поліс, ваучер на готель.
              Все необхідне ви знайдете у розділі документів вашої подорожі.
            </p>
          </div>
        </div>
    `;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, ${isPayment ? '#5f3a1e' : '#1e5f3a'} 0%, #0a0a0a 100%); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0 0 8px; font-size: 24px; color: #ffffff;">RestAL</h1>
        <p style="margin: 0; color: ${isPayment ? '#fbbf24' : '#6ee7b7'}; font-size: 14px;">
          ${isPayment ? 'Нагадування про оплату' : 'Нагадування про відліт'}
        </p>
      </div>
      <div style="padding: 24px;">
        <p style="color: #e2e8f0; font-size: 16px; margin-bottom: 16px;">
          Вітаємо, ${data.userName}! 👋
        </p>
        ${isPayment ? paymentHtml : departureHtml}
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          Деталі подорожі доступні у
          <a href="https://restal.in.ua/dashboard/trips" style="color: #60a5fa; text-decoration: none;">вашому кабінеті</a>.
          Якщо маєте питання — зверніться до вашого менеджера.
        </p>
      </div>
      <div style="padding: 16px 24px; border-top: 1px solid #1a1a2e; text-align: center;">
        <p style="color: #64748b; font-size: 12px; margin: 0;">
          Цей лист надіслано автоматично з сайту restal.in.ua
        </p>
      </div>
    </div>
  `;

    await transporter.sendMail({
        from: `"RestAL" <${process.env.GMAIL_USER}>`,
        to: data.to,
        subject: isPayment
            ? `⚠️ Нагадування: оплата за подорож ${data.tripNumber} — ${data.deadline}`
            : `✈️ Завтра ваша подорож ${data.tripNumber} — ${data.country}!`,
        html,
    });
}

/* ================================================================== */
/*  Cashback credited email                                            */
/* ================================================================== */

interface CashbackCreditedEmail {
    to: string;
    userName: string;
    tripNumber: string;
    country: string;
    cashbackAmount: number;
    newBalance: number;
}

export async function sendCashbackCreditedEmail(data: CashbackCreditedEmail) {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #065f46 0%, #0a0a0a 100%); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0 0 8px; font-size: 24px; color: #ffffff;">RestAL</h1>
        <p style="margin: 0; color: #6ee7b7; font-size: 14px;">Кешбек нараховано!</p>
      </div>
      <div style="padding: 24px;">
        <p style="color: #e2e8f0; font-size: 16px; margin-bottom: 16px;">
          Вітаємо, ${data.userName}! 🎉
        </p>
        <div style="background: #1a1a2e; border: 1px solid #10b98133; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0 0 8px;">Кешбек за подорож ${data.tripNumber} (${data.country})</p>
          <p style="color: #10b981; font-size: 32px; font-weight: bold; margin: 0 0 12px;">
            +${data.cashbackAmount.toLocaleString('uk-UA')} грн
          </p>
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            Ваш баланс: <strong style="color: #ffffff;">${data.newBalance.toLocaleString('uk-UA')} грн</strong>
          </p>
        </div>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          Ви можете перетворити кешбек на промокод у
          <a href="https://restal.in.ua/cashback" style="color: #60a5fa; text-decoration: none;">розділі бонусів</a>.
        </p>
      </div>
      <div style="padding: 16px 24px; border-top: 1px solid #1a1a2e; text-align: center;">
        <p style="color: #64748b; font-size: 12px; margin: 0;">
          Цей лист надіслано автоматично з сайту restal.in.ua
        </p>
      </div>
    </div>
  `;

    await transporter.sendMail({
        from: `"RestAL" <${process.env.GMAIL_USER}>`,
        to: data.to,
        subject: `🎉 Кешбек +${data.cashbackAmount.toLocaleString('uk-UA')} грн за подорож ${data.tripNumber}`,
        html,
    });
}
