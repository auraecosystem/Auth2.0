// Language: C#
using System;
using System.Security.Cryptography;
using System.Text;

public class HOTPGenerator
{
    // Generate an HOTP code given a secret key and counter
    public static string GenerateHOTP(string secret, long counter, int digits = 6)
    {
        // Decode secret key from base32
        byte[] key = Base32Decode(secret);
        
        // Convert counter to big-endian byte array
        byte[] counterBytes = BitConverter.GetBytes(counter);
        if (BitConverter.IsLittleEndian)
            Array.Reverse(counterBytes);

        // Compute HMAC-SHA1
        using (HMACSHA1 hmac = new HMACSHA1(key))
        {
            byte[] hash = hmac.ComputeHash(counterBytes);

            // Dynamic Truncation
            int offset = hash[hash.Length - 1] & 0x0F;
            int binaryCode = ((hash[offset] & 0x7F) << 24)
                            | ((hash[offset + 1] & 0xFF) << 16)
                            | ((hash[offset + 2] & 0xFF) << 8)
                            | (hash[offset + 3] & 0xFF);

            // Generate the OTP
            int otp = binaryCode % (int)Math.Pow(10, digits);
            return otp.ToString(new string('0', digits));
        }
    }

    // Helper function to decode Base32 encoded strings
    private static byte[] Base32Decode(string input)
    {
        const string alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        input = input.TrimEnd('=').ToUpperInvariant();

        byte[] bytes = new byte[input.Length * 5 / 8];
        int bitBuffer = 0, bitsLeft = 0, byteIndex = 0;

        foreach (char c in input)
        {
            int val = alphabet.IndexOf(c);
            if (val < 0) throw new ArgumentException("Invalid base32 character.");

            bitBuffer = (bitBuffer << 5) | val;
            bitsLeft += 5;

            if (bitsLeft >= 8)
            {
                bytes[byteIndex++] = (byte)((bitBuffer >> (bitsLeft - 8)) & 0xFF);
                bitsLeft -= 8;
            }
        }
        return bytes;
    }

    // Example Usage
    public static void Main()
    {
        string secretKey = "JBSWY3DPEHPK3PXP"; // base32-encoded secret
        long counter = 1; // counter value (HOTP counter)
        
        string otp = GenerateHOTP(secretKey, counter, 6);
        Console.WriteLine($"HOTP for counter {counter}: {otp}");
    }
}
