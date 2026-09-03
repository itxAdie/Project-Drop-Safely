export interface DropoffTemplateParams {
  studentName: string;
  institute: string;
  time: string;
}

export function dropoffTemplate({ studentName, institute, time }: DropoffTemplateParams): string {
  return `🏫 Drop Safely — Dropped Off

${studentName} has been safely dropped off at ${institute}.
Time: ${time}

${studentName} محفوظ طریقے سے ${institute} پہنچ گئی ہیں۔`;
}
