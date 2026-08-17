// Java
import com.warrenstrange.googleauth.HmacHashFunction;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;

public class HOTPExample {
    public static void main(String[] args) {
        GoogleAuthenticator gAuth = new GoogleAuthenticator();
        
        // Generate secret key
        final GoogleAuthenticatorKey key = gAuth.createCredentials();
        System.out.println("Secret key: " + key.getKey());

        // Counter (must be stored and incremented securely)
        int counter = 1;

        // Generate HOTP (HMAC-Based OTP)
        int otp = gAuth.getTotpPassword(key);
        System.out.println("Generated OTP (TOTP as fallback HOTP): " + otp);

        // Verification example
        boolean isValid = gAuth.authorize(key.getKey(), otp);
        System.out.println("OTP valid? " + isValid);
    }
}
