export interface PickupTemplateParams {
  studentName: string;
  time: string;
  routeName: string;
}

export function pickupTemplate({ studentName, time, routeName }: PickupTemplateParams): string {
  return `✅ Drop Safely — Picked Up

${studentName} has been picked up by the driver.
Time: ${time}
Route: ${routeName}

${studentName} کو ڈرائیور نے پک اپ کر لیا ہے۔`;
}
