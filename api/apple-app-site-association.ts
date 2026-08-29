interface ResponseLike { setHeader: (name: string, value: string) => void; status: (code: number) => ResponseLike; json: (value: unknown) => void }

export default function handler(_request: unknown, response: ResponseLike) {
  const teamId = process.env.APPLE_TEAM_ID ?? "C4J27RWDAX";
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  response.status(200).json({
    applinks: {
      apps: [],
      details: [{ appID: `${teamId}.com.zwood925.happyme`, paths: ["/join", "/join?*"] }],
    },
  });
}
