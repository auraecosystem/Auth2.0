# Python
import msal

client_id = "YOUR_CLIENT_ID"
authority = "https://login.microsoftonline.com/YOUR_TENANT_ID"
scope = ["https://graph.microsoft.com/.default"]

app = msal.PublicClientApplication(client_id, authority=authority)

# Interactive login
result = app.acquire_token_interactive(scopes=scope)
print("Access Token:", result.get("access_token"))
