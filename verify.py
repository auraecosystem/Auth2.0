# Python
import pyotp

# Secret key (usually base32 encoded)
secret = pyotp.random_base32()
print("Secret key:", secret)

# Create an HOTP object
hotp = pyotp.HOTP(secret)

# Counter value (increments after each successful OTP usage)
counter = 1

# Generate HOTP
otp = hotp.at(counter)
print("Generated OTP:", otp)

# Verify OTP
is_valid = hotp.verify(otp, counter)
print("OTP valid?", is_valid)

# Increment counter after usage
counter += 1
