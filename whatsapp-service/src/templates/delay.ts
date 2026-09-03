export interface DelayTemplateParams {
  routeName: string;
  minutes: number;
  reason: string;
  newEta: string;
}

export function delayTemplate({ routeName, minutes, reason, newEta }: DelayTemplateParams): string {
  return `⏰ Drop Safely — Delay Notice

The van on route ${routeName} is running approximately ${minutes} minutes late.
Reason: ${reason}
New estimated arrival: ${newEta}

گاڑی تقریباً ${minutes} منٹ لیٹ ہے۔`;
}
