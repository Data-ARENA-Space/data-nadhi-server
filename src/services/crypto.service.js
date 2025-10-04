const crypto = require('crypto');

const deriveKey = (secret) => {
  return crypto.createHash('sha256').update(secret).digest();
}

const encryptAesGcm = (plainText, secret) => {
  const key = deriveKey(secret);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

const decryptAesGcm = (b64, secret) => {
  const raw = Buffer.from(b64, 'base64');
  const iv = raw.slice(0, 12);
  const tag = raw.slice(12, 28);
  const ciphertext = raw.slice(28);
  const key = deriveKey(secret);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString('utf8');
}

const generateMessageId = (pipelineId, traceId) => {
  // Timestamp in milliseconds, base36 (comes first for ordering)
  const timestampEncoded = Date.now().toString(36);

  // Keep only alphabetical chars from pipelineId, lowercase
  const cleanPipeline = (pipelineId.match(/[a-zA-Z]+/g) || []).join("").toLowerCase();
  let pipelineEncoded = "";
  for (const ch of cleanPipeline) {
    const code = ch.charCodeAt(0) - 97; // 'a' => 0
    if (code >= 0 && code <= 25) pipelineEncoded += code.toString(36);
  }

  // Trace ID hashed to 32-bit number, base36
  const traceHash = crypto.createHash("md5").update(traceId).digest();
  const traceNum = traceHash.readUInt32BE(0);
  const traceEncoded = traceNum.toString(36);

  // UUID snippet for extra uniqueness
  const uuidSnippet = crypto.randomUUID().slice(0, 4);

  // Combine: timestamp first for lexicographic ordering
  return `${timestampEncoded}${pipelineEncoded}${traceEncoded}${uuidSnippet}`;
}

module.exports = { encryptAesGcm, decryptAesGcm, generateMessageId };
