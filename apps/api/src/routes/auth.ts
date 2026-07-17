import { Keypair } from "@solana/web3.js";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { users, authChallenges } from "@nexus/db";
import { db, isDbConnected, JWT_SECRET, ENCRYPTION_SECRET } from "../db";
import { encrypt } from "../crypto";
import { jsonRes } from "../utils/response";

export async function handleAuthChallenge(url: URL) {
  const publicKey = url.searchParams.get("publicKey");
  if (!publicKey) return jsonRes({ error: "Missing publicKey" }, 400);

  const nonce = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

  if (isDbConnected) {
    await db
      .insert(authChallenges)
      .values({ publicKey, nonce, expiresAt })
      .onConflictDoUpdate({
        target: authChallenges.publicKey,
        set: { nonce, expiresAt },
      });
  }
  return jsonRes({ nonce });
}

export async function handleAuthVerify(req: Request) {
  const { publicKey, signature, nonce } = await req.json();
  if (!publicKey || !signature || !nonce) return jsonRes({ error: "Missing required fields" }, 400);

  if (isDbConnected) {
    const rows = await db.select().from(authChallenges).where(eq(authChallenges.publicKey, publicKey));
    if (rows.length === 0 || rows[0].nonce !== nonce || new Date() > rows[0].expiresAt) {
      return jsonRes({ error: "Invalid or expired nonce" }, 401);
    }
  }

  const messageText = `Welcome to Nexus!\n\nSign this message to authenticate.\nNonce: ${nonce}`;
  const messageBytes = new TextEncoder().encode(messageText);
  const publicKeyBytes = bs58.decode(publicKey);
  const signatureBytes = Buffer.from(signature, "hex");

  const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  if (!isValid) return jsonRes({ error: "Invalid signature" }, 401);

  if (!isDbConnected) {
    const mockToken = jwt.sign({ 
      sub: "mock-id", 
      app_metadata: { provider: "solana", wallet: publicKey },
      user_metadata: { wallet: publicKey }
    }, JWT_SECRET, { expiresIn: "1h" });
    return jsonRes({ access_token: mockToken, user: { id: "mock-id", wallet: publicKey } });
  }

  let userRows = await db.select().from(users).where(eq(users.wallet, publicKey));
  let dbUser = userRows[0];

  if (!dbUser) {
    const depositKeypair = Keypair.generate();
    const depositAddress = depositKeypair.publicKey.toString();
    const encryptedPrivateKey = encrypt(Buffer.from(depositKeypair.secretKey).toString("hex"), ENCRYPTION_SECRET);
    
    const [inserted] = await db.insert(users).values({
      wallet: publicKey,
      balanceUsd: 100000,
      depositAddress,
      depositPrivateKeyEncrypted: encryptedPrivateKey,
    }).returning();
    dbUser = inserted;
  }

  const token = jwt.sign({
    sub: dbUser.id,
    aud: "authenticated",
    role: "authenticated",
    app_metadata: { provider: "solana", wallet: publicKey },
    user_metadata: { wallet: publicKey },
  }, JWT_SECRET, { expiresIn: "24h" });

  return jsonRes({ access_token: token, user: { id: dbUser.id, wallet: publicKey } });
}

export async function handleAuthDemo() {
  const demoWallet = "DemoUserWalletAddress11111111111111111111";
  
  if (!isDbConnected) {
    const mockToken = jwt.sign({ 
      sub: "mock-demo-id", 
      app_metadata: { provider: "solana", wallet: demoWallet },
      user_metadata: { wallet: demoWallet }
    }, JWT_SECRET, { expiresIn: "24h" });
    return jsonRes({ access_token: mockToken, user: { id: "mock-demo-id", wallet: demoWallet } });
  }

  let userRows = await db.select().from(users).where(eq(users.wallet, demoWallet));
  let dbUser = userRows[0];

  if (!dbUser) {
    const depositKeypair = Keypair.generate();
    const depositAddress = depositKeypair.publicKey.toString();
    const encryptedPrivateKey = encrypt(Buffer.from(depositKeypair.secretKey).toString("hex"), ENCRYPTION_SECRET);
    
    const [inserted] = await db.insert(users).values({
      wallet: demoWallet,
      balanceUsd: 10000000, // $100,000.00 USD
      depositAddress,
      depositPrivateKeyEncrypted: encryptedPrivateKey,
    }).returning();
    dbUser = inserted;
  } else {
    await db.update(users).set({ balanceUsd: 10000000 }).where(eq(users.wallet, demoWallet));
    dbUser.balanceUsd = 10000000;
  }

  const token = jwt.sign({
    sub: dbUser.id,
    aud: "authenticated",
    role: "authenticated",
    app_metadata: { provider: "solana", wallet: demoWallet },
    user_metadata: { wallet: demoWallet },
  }, JWT_SECRET, { expiresIn: "24h" });

  return jsonRes({ access_token: token, user: { id: dbUser.id, wallet: demoWallet } });
}
