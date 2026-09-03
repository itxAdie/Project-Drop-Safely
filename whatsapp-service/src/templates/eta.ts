export interface EtaTemplateParams {
  studentName: string;
  minutes: number;
}

export function etaTemplate({ studentName, minutes }: EtaTemplateParams): string {
  return `🚐 Drop Safely — Arriving Soon

The van will arrive at ${studentName}'s pickup point in approximately ${minutes} minutes.

گاڑی تقریباً ${minutes} منٹ میں پہنچ جائے گی۔`;
}
