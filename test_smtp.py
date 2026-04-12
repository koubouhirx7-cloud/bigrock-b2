import smtplib
from email.mime.text import MIMEText

host = 'sv16190.xserver.jp'
port = 465
user = 'info@bigrock-bike.jp'
password = ':a.60M-gunfG'

msg = MIMEText('This is a test from Python via Xserver.', 'plain', 'utf-8')
msg['Subject'] = '【BIGROCK B2B】Python SMTP Test'
msg['From'] = user
msg['To'] = 'koubou.hi.rx7@gmail.com'

print(f"Connecting to {host}:{port} with user {user}...")

try:
    with smtplib.SMTP_SSL(host, port) as server:
        server.set_debuglevel(1)
        print("Logging in...")
        server.login(user, password)
        print("Sending email...")
        server.send_message(msg)
    print("Success! Email sent.")
except Exception as e:
    print(f"Error occurred: {e}")
