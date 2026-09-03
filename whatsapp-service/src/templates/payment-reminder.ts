export interface PaymentReminderTemplateParams {
  studentName: string;
  days: number;
  amount: number;
  dueDate: string;
}

export function paymentReminderTemplate({
  studentName,
  days,
  amount,
  dueDate,
}: PaymentReminderTemplateParams): string {
  return `💰 Drop Safely — Payment Reminder

Dear parent, the monthly transport fee for ${studentName} is due in ${days} days.
Amount: PKR ${amount.toLocaleString()}
Due date: ${dueDate}

Please transfer and upload the receipt in the app.

ماہانہ فیس ${days} دن میں واجب الادا ہے۔`;
}
