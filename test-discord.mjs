import fetch from 'node-fetch';

async function test() {
    const discordWebhookUrl = "https://discord.com/api/webhooks/1490934226533748778/B1VAw3QWwUPgpZEwPVPtA4bH3EHtlDep9X3Sx6W4GSmcyNvW6u0O4wGavzcLGVhdmCw4";
    const discordPayload = {
        embeds: [
            {
                title: "テスト通知",
                color: 5814783,
                fields: [
                    { name: "テスト", value: "テスト", inline: false }
                ]
            }
        ]
    };

    const res = await fetch(discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload)
    });
    
    console.log("Discord Status:", res.status);
    console.log("Discord Text:", await res.text());
}
test();
