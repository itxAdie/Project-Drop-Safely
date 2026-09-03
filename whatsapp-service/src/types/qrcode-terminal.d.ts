declare module "qrcode-terminal" {
  const QRCodeTerminal: {
    generate(text: string, opts?: { small?: boolean }): void;
  };
  export default QRCodeTerminal;
}
