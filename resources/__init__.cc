// Language: C#

using System;
using System.Security.Cryptography;
using System.Text;

class TOTP
{
    // Generate a HOTP code
    public static int GenerateHOTP(byte[] key, long counter, int digits = 6)
    {
        // Convert counter to byte array (big-endian)
        byte[] counterBytes = BitConverter.GetBytes(counter);
        if (BitConverter.IsLittleEndian)
            Array.Reverse(counterBytes);

        // HMAC-SHA1 of key and counter
        using (HMACSHA1 hmac = new HMACSHA1(key))
        {
            byte[] hash = hmac.ComputeHash(counterBytes);

            // Dynamic truncation
            int offset = hash[hash.Length - 1] & 0x0F;
            int binaryCode = ((hash[offset] & 0x7F) << 24) |
                             ((hash[offset + 1] & 0xFF) << 16) |
                             ((hash[offset + 2] & 0xFF) << 8) |
                             (hash[offset + 3] & 0xFF);

            // Get the OTP
            int otp = binaryCode % (int)Math.Pow(10, digits);
            return otp;
        }
    }

    // Generate a TOTP code based on time
    public static int GenerateTOTP(string base32Secret, int digits = 6, int timeStep = 30)
    {
        byte[] key = Base32Decode(base32Secret);
        long counter = DateTimeOffset.UtcNow.ToUnixTimeSeconds() / timeStep;
        return GenerateHOTP(key, counter, digits);
    }

    // Simple Base32 decoder
    public static byte[] Base32Decode(string base32)
    {
        const string alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        base32 = base32.TrimEnd('=').ToUpperInvariant();
        int arraySize = base32.Length * 5 / 8;
        byte[] bytes = new byte[arraySize];

        int bitBuffer = 0, bitsInBuffer = 0, byteIndex = 0;
        foreach (char c in base32)
        {
            int val = alphabet.IndexOf(c);
            if (val < 0) continue;

            bitBuffer = (bitBuffer << 5) | val;
            bitsInBuffer += 5;

            if (bitsInBuffer >= 8)
            {
                bytes[byteIndex++] = (byte)((bitBuffer >> (bitsInBuffer - 8)) & 0xFF);
                bitsInBuffer -= 8;
            }
        }

        return bytes;
    }

    static void Main()
    {
        string secret = "JBSWY3DPEHPK3PXP"; // Example Base32 secret
        int totp = GenerateTOTP(secret);
        Console.WriteLine($"TOTP: {totp:D6}");
    }
}
