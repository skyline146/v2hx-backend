export const logToDiscord = async (description: string, color = 10181046) => {
  await fetch(
    process.env.DISCORD_WEBHOOK,
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
