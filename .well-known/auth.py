# Python
import pyotp
import time

# TOTP configuration from the URI
totp_uri = "otpauth://totp?secret=HTTPSLOGINLIVECOMOAUTH2AUTHORIZESRFA&algorithm=SHA1&digits=6&period=30"

# Create a TOTP object from the URI
totp = pyotp.parse_uri(totp_uri)

# Generate the current TOTP code (for demonstration, normally user inputs this code)
current_code = totp.now()
print(f"Current TOTP code: {current_code}")

# Function to verify a TOTP code
def verify_totp_code(user_code):
    # This checks the code against the current time window
    return totp.verify(user_code)

# Example usage: Verify the current code
is_valid = verify_totp_code(current_code)
print(f"Is the code valid? {is_valid}")

# Example: Verify user-provided code
user_input = input("Enter the TOTP code: ")
if verify_totp_code(user_input):
    print("Code is valid!")
else:
    print("Invalid code. Try again.")
