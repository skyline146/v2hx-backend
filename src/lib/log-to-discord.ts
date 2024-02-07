export const logToDiscord = async (description: string, color = 10181046) => {
  await fetch(
    "https://discord.com/api/webhooks/1179755759676956763/YMUpXMhaSasEWEwoab7kzTbtH_c9kSXKI30pl1L8zOJQzuQfcU6YMN-HItHl-LmObniF",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            description,
            color,
          },
        ],
      }),
    }
  );
};
