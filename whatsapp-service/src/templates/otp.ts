export interface OtpTemplateParams {
  code: string;
}

export function otpTemplate({ code }: OtpTemplateParams): string {
  return `🔐 Drop Safely Verification Code

Your OTP code is: ${code}

This code expires in 5 minutes. Do not share it with anyone.

یہ کوڈ 5 منٹ میں ختم ہو جائے گا۔ کسی کو نہ بتائیں۔`;
}
