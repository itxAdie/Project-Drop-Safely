export interface RouteActivatedTemplateParams {
  routeName: string;
  driverName: string;
  pickupTime: string;
  studentName: string;
}

export function routeActivatedTemplate({
  routeName,
  driverName,
  pickupTime,
  studentName,
}: RouteActivatedTemplateParams): string {
  return `🚌 Drop Safely — Route Activated

Great news! The route "${routeName}" is now active.
Driver: ${driverName}
Pickup time: ${pickupTime}

${studentName} will be picked up on this route.

آپ کا راستہ "${routeName}" فعال ہو گیا ہے!
ڈرائیور: ${driverName}
پک اپ وقت: ${pickupTime}`;
}
