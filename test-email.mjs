import nodemailer from 'nodemailer';

const SMTP_HOST = "sv16190.xserver.jp";
const SMTP_PORT = 465;
const SMTP_USER = "info@bigrock-bike.jp";
const SMTP_PASS = ":a.60M-gunfG";

async function run() {
    console.log("Sending test email via Xserver SMTP...");
    
    try {
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_PORT === 465,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS
            }
        });

        const info = await transporter.sendMail({
            from: `BIGROCK B2B <${SMTP_USER}>`,
            to: "koubou.hi.rx7@gmail.com",
            subject: "【BIGROCK B2B】 Xserver SMTPテスト送信",
            text: "Xserver経由でのテストメールが正常に届きました！設定は完了です。"
        });

        console.log("✅ Success! The email was sent successfully.");
        console.log("Message ID:", info.messageId);
    } catch (e) {
        console.error("❌ Failed to send email via SMTP:");
        console.error(e);
    }
}

run();
