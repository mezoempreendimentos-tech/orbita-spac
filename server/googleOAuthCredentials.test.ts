import { describe, expect, it } from "vitest";

const redirectUri = "https://orbitavisual-pte9ypdg.manus.space/api/integrations/google-drive/callback";

describe("credenciais OAuth do Google Drive", () => {
  it("é reconhecida pelo endpoint OAuth oficial sem expor o segredo", async () => {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    expect(clientId).toBeTruthy();
    expect(clientSecret).toBeTruthy();

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId ?? "",
        client_secret: clientSecret ?? "",
        code: "orbita-credential-validation",
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });
    const payload = await response.json() as { error?: string };

    expect(response.status).toBe(400);
    expect(payload.error).toBe("invalid_grant");
  }, 20_000);
});
