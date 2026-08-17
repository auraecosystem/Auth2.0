import com.yubico.webauthn.FinishAssertionOptions;
import com.yubico.webauthn.RelyingParty;
import com.yubico.webauthn.AssertionResult;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

public class PasskeyTokenExchangeService {

    private final RelyingParty relyingParty;
    private final HttpClient httpClient;

    public PasskeyTokenExchangeService(RelyingParty relyingParty) {
        this.relyingParty = relyingParty;
        this.httpClient = HttpClient.newHttpClient();
    }

    /**
     * Verifies the WebAuthn assertion (Passkey response) and exchanges 
     * it for an OAuth 2.0 Access Token via RFC 8693 Token Exchange.
     */
    public String authenticateAndExchangeToken(FinishAssertionOptions options) throws Exception {
        // 1. Verify WebAuthn / Passkey assertion server-side (yubico library)
        AssertionResult result = relyingParty.finishAssertion(options);

        if (!result.isSuccess()) {
            throw new SecurityException("WebAuthn assertion verification failed.");
        }

        String username = result.getUsername();

        // 2. Build modern OAuth 2.1 Token Exchange Request (Replaces WS-Trust RST)
        String requestBody = "grant_type=" + URLEncoder.encode("urn:ietf:params:oauth:grant-type:token-exchange", StandardCharsets.UTF_8)
            + "&subject_token=" + URLEncoder.encode(username, StandardCharsets.UTF_8)
            + "&subject_token_type=" + URLEncoder.encode("urn:ietf:params:oauth:token-type:access_token", StandardCharsets.UTF_8)
            + "&requested_token_type=" + URLEncoder.encode("urn:ietf:params:oauth:token-type:access_token", StandardCharsets.UTF_8)
            + "&audience=" + URLEncoder.encode("https://api.example.com", StandardCharsets.UTF_8);

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://auth.example.com/oauth2/v1/token"))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .build();

        // 3. Send request to Authorization Server and return the OAuth token response
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Token exchange failed with status: " + response.statusCode());
        }

        return response.body();
    }
}
