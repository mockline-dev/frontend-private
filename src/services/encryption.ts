import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SALT_LENGTH = 16;
const IV_LENGTH = 16;
const ITERATIONS = 10000;
const KEY_LENGTH = 32;

/**
 * Derive a key from the password using PBKDF2.
 * @param password - The encryption password.
 * @param salt - A unique salt.
 * @returns A derived encryption key.
 */
const deriveKey = (password: string, salt: Buffer): Buffer => {
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
};

/**
 * Encrypt a token securely using AES with salt and IV.
 * @param token - The plaintext token to encrypt.
 * @param password - The encryption password.
 * @returns An object containing the encrypted token, IV, and salt.
 */
export const encryptToken = (token: string, password: string): { encryptedData: string; iv: string; salt: string } => {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = deriveKey(password, salt);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        salt: salt.toString('hex')
    };
};

/**
 * Decrypt an encrypted token using AES with salt and IV.
 * @param encryptedData - The encrypted token.
 * @param password - The encryption password.
 * @param ivHex - The initialization vector in hex format.
 * @param saltHex - The salt in hex format.
 * @returns The decrypted plaintext token.
 */
export const decryptToken = (encryptedData: string, password: string, ivHex: string, saltHex: string): string => {
    const iv = Buffer.from(ivHex, 'hex');
    const salt = Buffer.from(saltHex, 'hex');
    const key = deriveKey(password, salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
};
