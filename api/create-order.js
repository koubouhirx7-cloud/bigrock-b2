export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // The secret API Key is read from Vercel's backend environment variables, NEVER from the browser
    const apiKey = process.env.VITE_MICROCMS_API_KEY || process.env.MICROCMS_API_KEY;
    const serviceDomain = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;

    if (!apiKey || !serviceDomain) {
        return res.status(500).json({ error: 'Server configuration error (Missing MicroCMS Credentials)' });
    }

    try {
        const response = await fetch(`https://${serviceDomain}.microcms.io/api/v1/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-MICROCMS-API-KEY': apiKey
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`MicroCMS responded with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        // --- 発注通知 (Discord Webhook) ---
        // 下書きの場合は通知をスキップして終了
        if (req.body.status === '下書き') {
            return res.status(200).json(data);
        }

        const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
        if (discordWebhookUrl) {
            try {
                // req.body の情報を使ってDiscord用メッセージを組み立てる
                const { orderId, companyName, customerEmail, totalAmount, items, shippingOption } = req.body;
                let parsedItems = [];
                try {
                    parsedItems = JSON.parse(items || '[]');
                } catch(e) { }

                let itemsText = parsedItems.map(item => `・**${item.productName || item.name}**\n　└ 仕様: ${item.variant || '-'} / 数量: **${item.quantity}**`).join('\n\n');
                if (!itemsText) itemsText = "アイテム詳細なし";
                // Discordの制約(フィールド長1024文字)への対策
                if (itemsText.length > 1000) itemsText = itemsText.substring(0, 950) + '\n... (他多数)';

                const discordPayload = {
                    embeds: [
                        {
                            title: "🛎️ 新規の発注を受け付けました！",
                            color: 5814783, // blurple色
                            fields: [
                                {
                                    name: "🏷️ 注文ID",
                                    value: `\`${orderId || '不明'}\``,
                                    inline: true
                                },
                                {
                                    name: "💰 合計金額 (税込)",
                                    value: `**¥${Number(totalAmount || 0).toLocaleString()}**`,
                                    inline: true
                                },
                                {
                                    name: "🏢 顧客情報",
                                    value: `**会社名:** ${companyName || 'ゲスト'}\n**メール:** ${customerEmail || '未登録'}`,
                                    inline: false
                                },
                                {
                                    name: "🚚 発送オプション",
                                    value: `**${shippingOption || '指定なし'}**`,
                                    inline: false
                                },
                                {
                                    name: "📦 発注アイテム",
                                    value: itemsText,
                                    inline: false
                                }
                            ]
                        }
                    ]
                };

                // Discordへ非同期で送信 (レスポンス待ちはしない、エラーをキャッチして注文自体は失敗させない)
                fetch(discordWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(discordPayload)
                }).catch(err => console.error("Discord webhook failed", err));

            } catch (notifyError) {
                console.error("Failed to process Discord notification", notifyError);
            }
        }
        // ---------------------------------

        return res.status(200).json(data);
    } catch (error) {
        console.error('API Proxy Error:', error);
        return res.status(500).json({ error: 'Failed to create order', details: error.message });
    }
}
