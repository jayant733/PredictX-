import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { createLogger } from "../utils/logger.js";

const log = createLogger("cache");

/**
 * File-backed JSON cache. One file per key under a root dir.
 * Used for:
 *  - market-data caching (avoid re-fetching the same quote) → token/API saving
 *  - research-result caching (same news query) → token saving
 *  - short-lived agent history snapshots
 *
 * Each entry stores { value, expiresAt }. TTL in seconds; 0 = never expires.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number; // epoch ms; 0 = never
  cachedAt: number;
}

export class FileCache {
  private readonly dir: string;

  constructor(rootDir: string) {
    this.dir = resolve(rootDir);
    mkdirSync(this.dir, { recursive: true });
    log.debug("cache dir ready", { dir: this.dir });
  }

  private path(key: string): string {
    // Keep keys filesystem-safe; namespace subdirs with "__"
    const safe = key.replace(/[^a-z0-9._-]/gi, "_");
    return resolve(this.dir, `${safe}.json`);
  }

  /** Read a key. Returns undefined if missing or expired. */
  get<T>(key: string): T | undefined {
    const p = this.path(key);
    if (!existsSync(p)) return undefined;
    try {
      const entry = JSON.parse(readFileSync(p, "utf-8")) as CacheEntry<T>;
      if (entry.expiresAt !== 0 && Date.now() > entry.expiresAt) {
        log.debug("cache miss (expired)", { key });
        return undefined;
      }
      return entry.value;
    } catch (err) {
      log.warn("cache read failed — treating as miss", { key, err: String(err) });
      return undefined;
    }
  }

  /** Write a key with an optional TTL (seconds). ttl=0 means no expiry. */
  set<T>(key: string, value: T, ttlSeconds = 0): void {
    const entry: CacheEntry<T> = {
      value,
      expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0,
      cachedAt: Date.now(),
    };
    writeFileSync(this.path(key), JSON.stringify(entry, null, 2));
    log.debug("cache set", { key, ttlSeconds });
  }

  /** Remove a single key. */
  delete(key: string): void {
    const p = this.path(key);
    if (existsSync(p)) rmSync(p);
  }

  /** True if key exists and is not expired. */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }
}
