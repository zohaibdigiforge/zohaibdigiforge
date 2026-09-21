import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp as initAdminApp, getApps as getAdminApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth, type DecodedIdToken } from 'firebase-admin/auth';
import * as XLSX from 'xlsx';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';

dotenv.config();

// Lazy Firebase Admin SDK initialization helper
let adminApp: any = null;

function getAdminAppLazy() {
  if (adminApp) return adminApp;
  if (getAdminApps().length) {
    adminApp = getAdminApps()[0];
    return adminApp;
  }
  try {
    adminApp = initAdminApp({
      projectId: 'zohaib-digiforge',
    });
    console.log('[FIREBASE-ADMIN] Initialized Firebase Admin SDK successfully');
  } catch (err) {
    console.warn('[FIREBASE-ADMIN] Init notice:', err);
  }
  return adminApp;
}

// Global Uncaught Exception & Promise Rejection Shields
// Ensures that NO unhandled errors, network drops, or malformed inputs can ever terminate or crash the server
process.on('uncaughtException', (err) => {
  console.error('[CRASH-SHIELD] Uncaught Exception safely trapped, server kept online:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRASH-SHIELD] Unhandled Promise Rejection safely trapped, server kept online:', reason);
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // ═════════════════════════════════════════════════════════════════════════════
  // ZOHAIB DIGIFORGE CYBER DEFENSE SHIELD & CRASH-PROOF WAF
  // ═════════════════════════════════════════════════════════════════════════════
  
  interface ThreatLogEntry {
    id: string;
    timestamp: string;
    threatType: string;
    category: 'SQL_INJECTION' | 'NOSQL_INJECTION' | 'XSS_ATTACK' | 'PATH_TRAVERSAL' | 'VULNERABILITY_SCANNER' | 'DOS_FLOOD' | 'MALICIOUS_PAYLOAD' | 'BRUTE_FORCE' | 'SUSPICIOUS_PROBE';
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    ipAddress: string;
    userAgent?: string;
    method: string;
    path: string;
    offendingPayload?: string;
    actionTaken: 'BLOCKED_403' | 'RATE_LIMITED_429' | 'SANITIZED' | 'LOGGED_ALERT';
    status: 'active' | 'resolved' | 'banned_ip';
    location?: string;
    details?: string;
  }

  // Live in-memory threat cache (latest 200) for sub-millisecond admin monitoring
  const liveThreats: ThreatLogEntry[] = [];
  const bannedIps = new Set<string>();
  const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
  const suspiciousIpViolations = new Map<string, number>();

  const securityStats = {
    totalThreatsBlocked: 0,
    criticalExploits: 0,
    sqlInjectionsBlocked: 0,
    xssBlocked: 0,
    scannersBlocked: 0,
    bannedIpsCount: 0,
    lastThreatAt: '',
    wafActive: true
  };

  // Helper to record threat in memory & persist to Firestore security_threats collection
  async function recordServerThreat(threat: Omit<ThreatLogEntry, 'id' | 'timestamp'>): Promise<ThreatLogEntry> {
    const threatId = `threat_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const timestamp = new Date().toISOString();
    const entry: ThreatLogEntry = {
      ...threat,
      id: threatId,
      timestamp
    };

    liveThreats.unshift(entry);
    if (liveThreats.length > 250) liveThreats.pop();

    securityStats.totalThreatsBlocked++;
    securityStats.lastThreatAt = timestamp;
    if (threat.severity === 'CRITICAL') securityStats.criticalExploits++;
    if (threat.category === 'SQL_INJECTION' || threat.category === 'NOSQL_INJECTION') securityStats.sqlInjectionsBlocked++;
    if (threat.category === 'XSS_ATTACK') securityStats.xssBlocked++;
    if (threat.category === 'VULNERABILITY_SCANNER') securityStats.scannersBlocked++;
    securityStats.bannedIpsCount = bannedIps.size;

    console.warn(`🚨 [CYBER-DEFENSE BLOCKED] [${threat.severity}] ${threat.threatType} | IP: ${threat.ipAddress} | Route: ${threat.method} ${threat.path}`);

    // Persist asynchronously to Firestore
    try {
      const db = getServerFirestoreDb();
      if (db) {
        await addDoc(collection(db, 'security_threats'), entry);
      }
    } catch (err) {
      // Non-blocking fallback
    }

    return entry;
  }

  // Helper to extract clean client IP
  function getClientIp(req: express.Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
      return forwarded.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || req.ip || '127.0.0.1';
  }

  // High-performance gzip/deflate compression
  app.use(compression());

  // Security & Performance Headers (Lighthouse 100/100 Best Practices)
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Safe JSON Body Parser with malformed-JSON & payload-bomb traps
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Fallback for malformed JSON payloads so server never throws unhandled syntax errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      const clientIp = getClientIp(req);
      recordServerThreat({
        threatType: 'Malformed JSON Payload / Deserialization Exploit',
        category: 'MALICIOUS_PAYLOAD',
        severity: 'MEDIUM',
        ipAddress: clientIp,
        userAgent: req.headers['user-agent']?.slice(0, 150) || 'Unknown',
        method: req.method,
        path: req.path,
        offendingPayload: String(err.message).slice(0, 200),
        actionTaken: 'BLOCKED_403',
        status: 'active',
        details: 'Attacker sent malformed JSON to crash JSON parser'
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid request payload. Intercepted by DigiForge Cyber Defense Shield.'
      });
    }
    next(err);
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // ACTIVE WAF THREAT INSPECTOR & ANTI-ATTACK FILTER
  // ═════════════════════════════════════════════════════════════════════════════
  app.use(async (req, res, next) => {
    // Skip static assets to conserve processing power
    if (
      req.path.startsWith('/assets/') || 
      req.path.endsWith('.js') || 
      req.path.endsWith('.css') || 
      req.path.endsWith('.png') || 
      req.path.endsWith('.jpg') || 
      req.path.endsWith('.svg') || 
      req.path.endsWith('.ico')
    ) {
      return next();
    }

    const clientIp = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const now = Date.now();

    // 1. Check IP Blacklist
    if (bannedIps.has(clientIp)) {
      return res.status(403).json({
        success: false,
        blocked: true,
        error: 'Access Denied: Your IP address has been permanently blacklisted by DigiForge Cyber Defense Shield.',
        ip: clientIp,
        action: 'PERMANENTLY_BANNED'
      });
    }

    // 2. Adaptive Rate Limiter & Anti-DDoS Shield
    const rateData = rateLimitMap.get(clientIp) || { count: 0, windowStart: now };
    if (now - rateData.windowStart > 60000) {
      rateData.count = 1;
      rateData.windowStart = now;
    } else {
      rateData.count++;
    }
    rateLimitMap.set(clientIp, rateData);

    // Auto-ban high-frequency flood attackers (>220 reqs/min)
    if (rateData.count > 220) {
      bannedIps.add(clientIp);
      await recordServerThreat({
        threatType: 'DDoS Flood / High-Volume Brute Force Attack',
        category: 'DOS_FLOOD',
        severity: 'CRITICAL',
        ipAddress: clientIp,
        userAgent: userAgent.slice(0, 150),
        method: req.method,
        path: req.path,
        offendingPayload: `Rate limit heavily breached: ${rateData.count} requests in under 60 seconds`,
        actionTaken: 'BLOCKED_403',
        status: 'banned_ip',
        details: 'IP automatically added to blacklist for flood protection'
      });
      return res.status(403).json({
        success: false,
        blocked: true,
        error: 'Rate limit severely exceeded. IP banned by DigiForge Anti-DDoS Engine.'
      });
    }

    // Soft rate limit throttle (>120 reqs/min)
    if (rateData.count > 120) {
      await recordServerThreat({
        threatType: 'Aggressive Rate Limit Breach / Request Flooding',
        category: 'DOS_FLOOD',
        severity: 'HIGH',
        ipAddress: clientIp,
        userAgent: userAgent.slice(0, 150),
        method: req.method,
        path: req.path,
        offendingPayload: `Excessive frequency: ${rateData.count} reqs/min`,
        actionTaken: 'RATE_LIMITED_429',
        status: 'active'
      });
      return res.status(429).json({
        success: false,
        blocked: true,
        error: 'Too many requests. Please slow down and try again shortly.'
      });
    }

    // 3. Known Malicious Vulnerability Scanners & Reconnaissance Probes
    const scannerPattern = /(sqlmap|nikto|acunetix|dirbuster|gobuster|wpscan|masscan|havij|hydra|metasploit|zgrab|nmap|morfeus|fuzz)/i;
    if (scannerPattern.test(userAgent)) {
      await recordServerThreat({
        threatType: 'Automated Malicious Vulnerability Scanner Detected',
        category: 'VULNERABILITY_SCANNER',
        severity: 'HIGH',
        ipAddress: clientIp,
        userAgent: userAgent.slice(0, 150),
        method: req.method,
        path: req.path,
        offendingPayload: `Scanner Signature: ${userAgent.slice(0, 120)}`,
        actionTaken: 'BLOCKED_403',
        status: 'active',
        details: 'Blocked reconnaissance or automated exploit scan'
      });
      return res.status(403).json({
        success: false,
        blocked: true,
        error: 'Access blocked: Automated vulnerability scanners are strictly forbidden.'
      });
    }

    // 4. Known Exploit & Honeypot Path Probes
    const exploitPathPattern = /\/(wp-admin|wp-login\.php|xmlrpc\.php|phpmyadmin|cgi-bin|solr|actuator|shell\.php|eval-stdin\.php|\.env|\.git\/config|\.aws|backup\.sql|dump\.sql)/i;
    if (exploitPathPattern.test(req.path)) {
      // Increment suspicious counter for this IP
      const count = (suspiciousIpViolations.get(clientIp) || 0) + 1;
      suspiciousIpViolations.set(clientIp, count);
      if (count >= 3) {
        bannedIps.add(clientIp);
      }

      await recordServerThreat({
        threatType: 'Honeypot Exploit Probe / Sensitive Route Reconnaissance',
        category: 'SUSPICIOUS_PROBE',
        severity: 'CRITICAL',
        ipAddress: clientIp,
        userAgent: userAgent.slice(0, 150),
        method: req.method,
        path: req.path,
        offendingPayload: `Targeted honeypot path: ${req.path}`,
        actionTaken: 'BLOCKED_403',
        status: count >= 3 ? 'banned_ip' : 'active',
        details: `Attacker probing for non-existent CMS or config files (violations: ${count})`
      });
      return res.status(403).json({
        success: false,
        blocked: true,
        error: 'Forbidden: Access to this administrative vector is strictly prohibited.'
      });
    }

    // 5. Path Traversal & Remote File Inclusion (LFI/RFI)
    const rawUrl = req.originalUrl || req.url;
    const pathTraversalPattern = /(\.\.[\/\\]|\/(etc\/passwd|etc\/shadow|win\.ini|boot\.ini|proc\/self|\.env|\.git))/i;
    if (pathTraversalPattern.test(rawUrl)) {
      await recordServerThreat({
        threatType: 'Directory Traversal / Local File Inclusion (LFI) Exploit',
        category: 'PATH_TRAVERSAL',
        severity: 'CRITICAL',
        ipAddress: clientIp,
        userAgent: userAgent.slice(0, 150),
        method: req.method,
        path: req.path,
        offendingPayload: rawUrl.slice(0, 150),
        actionTaken: 'BLOCKED_403',
        status: 'active',
        details: 'Attacker tried reading arbitrary system files via dot-dot traversal'
      });
      return res.status(403).json({
        success: false,
        blocked: true,
        error: 'Security alert: Path traversal payload intercepted.'
      });
    }

    // 6. Deep Inspection of Query & Body for SQL Injection & XSS
    const inspectStringForAttacks = (val: string): { type: string; category: any; severity: any } | null => {
      if (!val || typeof val !== 'string' || val.length < 3) return null;

      // SQL Injection patterns
      const sqlPattern = /(union\s+select|select\s+.*\s+from|insert\s+into|delete\s+from|drop\s+table|information_schema|--\s*|\/\*|\bxp_cmdshell\b|'\s*or\s*'?1'?\s*=\s*'?1|"\s*or\s*"?1"?\s*=\s*"?1)/i;
      if (sqlPattern.test(val)) {
        return { type: 'SQL Injection Exploit Vector', category: 'SQL_INJECTION', severity: 'CRITICAL' };
      }

      // XSS Vector patterns
      const xssPattern = /(<script[\s\S]*?>|javascript:|vbscript:|onerror\s*=|onload\s*=|onclick\s*=|eval\(|<iframe|<svg[\s\S]*?onload)/i;
      if (xssPattern.test(val)) {
        return { type: 'Cross-Site Scripting (XSS) Vector', category: 'XSS_ATTACK', severity: 'HIGH' };
      }

      return null;
    };

    // Check query params
    for (const [key, qVal] of Object.entries(req.query)) {
      const qStr = String(qVal);
      const attack = inspectStringForAttacks(qStr) || inspectStringForAttacks(key);
      if (attack) {
        await recordServerThreat({
          threatType: attack.type,
          category: attack.category,
          severity: attack.severity,
          ipAddress: clientIp,
          userAgent: userAgent.slice(0, 150),
          method: req.method,
          path: req.path,
          offendingPayload: `Param [${key}]: ${qStr.slice(0, 120)}`,
          actionTaken: 'BLOCKED_403',
          status: 'active'
        });
        return res.status(403).json({
          success: false,
          blocked: true,
          error: `Access Denied: ${attack.type} intercepted by DigiForge Cyber Shield.`
        });
      }
    }

    // Check body strings & NoSQL operators (if not a raw file upload)
    if (req.body && typeof req.body === 'object' && !req.path.startsWith('/api/ai/')) {
      const bodyStr = JSON.stringify(req.body);

      // NoSQL injection check: operator tampering like {"$gt": ""} or {"$where": "..."}
      if (/\$(gt|gte|ne|where|regex|in|or|and)\b/i.test(bodyStr)) {
        await recordServerThreat({
          threatType: 'NoSQL Operator Injection Attempt',
          category: 'NOSQL_INJECTION',
          severity: 'CRITICAL',
          ipAddress: clientIp,
          userAgent: userAgent.slice(0, 150),
          method: req.method,
          path: req.path,
          offendingPayload: bodyStr.slice(0, 140),
          actionTaken: 'BLOCKED_403',
          status: 'active'
        });
        return res.status(403).json({
          success: false,
          blocked: true,
          error: 'Security Warning: NoSQL operator injection intercepted.'
        });
      }

      const bodyAttack = inspectStringForAttacks(bodyStr);
      if (bodyAttack) {
        await recordServerThreat({
          threatType: bodyAttack.type,
          category: bodyAttack.category,
          severity: bodyAttack.severity,
          ipAddress: clientIp,
          userAgent: userAgent.slice(0, 150),
          method: req.method,
          path: req.path,
          offendingPayload: bodyStr.slice(0, 140),
          actionTaken: 'BLOCKED_403',
          status: 'active'
        });
        return res.status(403).json({
          success: false,
          blocked: true,
          error: `Security Warning: ${bodyAttack.type} intercepted.`
        });
      }
    }

    next();
  });

  // Helper for generating review email HTML
  const generateEmailHtml = (data: {
    customerName?: string;
    productName?: string;
    orderId?: string;
    reviewLink?: string;
    productThumbnail?: string;
  }) => {
    const displayName = data.customerName || 'Valued Creator';
    const displayProduct = data.productName || 'your digital asset';
    const reviewLink = data.reviewLink || `https://zohaibdigiforge.com/?view=reviews&orderId=${data.orderId || ''}`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>How was ${displayProduct}? Leave a Review 🌟</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070B14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070B14; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background: linear-gradient(180deg, #0D1527 0%, #080D1A 100%); border: 1px solid #1E293B; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          <tr>
            <td style="background: linear-gradient(90deg, #0D6EFD 0%, #28B9FF 50%, #10B981 100%); height: 6px; line-height: 6px; font-size: 0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center;">
              <div style="display: inline-block; padding: 6px 14px; background: rgba(13, 110, 253, 0.12); border: 1px solid rgba(40, 185, 255, 0.25); border-radius: 999px; margin-bottom: 16px;">
                <span style="color: #28B9FF; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">✦ Zohaib DigiForge Verified Purchase</span>
              </div>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                Your Access is Ready! 🚀
              </h1>
              <p style="margin: 8px 0 0 0; color: #94A3B8; font-size: 14px; line-height: 1.5;">
                Hi <strong style="color: #F8FAFC;">${displayName}</strong>, we hope you're loving your new tools.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px;">
              <table role="presentation" width="100%" style="background-color: rgba(15, 23, 42, 0.7); border: 1px solid #1E293B; border-radius: 14px; padding: 18px;">
                <tr>
                  <td>
                    <div style="font-size: 11px; color: #10B981; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
                      ✓ Verified Order: #${data.orderId || 'ZDF-PRO'}
                    </div>
                    <div style="color: #FFFFFF; font-size: 16px; font-weight: 700; line-height: 1.3;">
                      ${displayProduct}
                    </div>
                    <div style="color: #64748B; font-size: 12px; margin-top: 4px;">
                      Status: <span style="color: #38BDF8; font-weight: 600;">Access Delivered</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px 10px 32px; text-align: center;">
              <p style="margin: 0 0 20px 0; color: #CBD5E1; font-size: 15px; line-height: 1.6;">
                How was your experience with <strong style="color: #38BDF8;">${displayProduct}</strong>? Your honest review helps thousands of Pakistani creators & students make the right choice.
              </p>
              <div style="font-size: 26px; color: #F59E0B; letter-spacing: 4px; margin-bottom: 22px;">
                ★ ★ ★ ★ ★
              </div>
              <div>
                <a href="${reviewLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0D6EFD 0%, #28B9FF 100%); color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 36px; border-radius: 12px; box-shadow: 0 10px 20px rgba(13, 110, 253, 0.35);">
                  Leave a 1-Minute Review 🌟
                </a>
              </div>
              <p style="margin: 16px 0 0 0; color: #64748B; font-size: 12px;">
                Takes under 60 seconds • Verified Buyer Badge included
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 32px; background-color: #060A13; border-top: 1px solid #1E293B; margin-top: 24px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #94A3B8; font-size: 12px;">
                Need help or direct support? WhatsApp us anytime at <strong style="color: #22C55E;">+92 340 6070632</strong>
              </p>
              <p style="margin: 0; color: #475569; font-size: 11px;">
                © ${new Date().getFullYear()} Zohaib DigiForge • 100% Free Email Engine
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  };

  // Helper for generating delivered customer access email HTML
  const generateCustomerDeliveredEmailHtml = (data: {
    customerName?: string;
    orderId?: string;
    productTitle?: string;
    downloadLink?: string;
  }) => {
    const displayName = data.customerName || 'Valued Creator';
    const orderId = data.orderId || 'ZDF-ORDER';
    const productTitle = data.productTitle || 'Digital Suite Access';
    const link = data.downloadLink || 'https://drive.google.com';
    const reviewLink = `https://zohaibdigiforge.com/?view=reviews&orderId=${orderId}`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Your Access is Delivered - Order #${orderId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070B14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0;">
  <table role="presentation" width="100%" style="padding: 40px 15px; background-color: #070B14;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background: #0D1527; border: 1px solid #1E293B; border-radius: 16px; overflow: hidden;">
          <tr><td style="background: linear-gradient(90deg, #10B981, #0D6EFD); height: 6px;"></td></tr>
          <tr>
            <td style="padding: 32px 28px; text-align: center;">
              <div style="display: inline-block; padding: 5px 12px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 999px; color: #10B981; font-size: 11px; font-weight: 700; text-transform: uppercase;">
                ✓ Order Access Delivered
              </div>
              <h1 style="color: #FFFFFF; font-size: 24px; margin: 16px 0 8px 0;">Your Files Are Ready! 🚀</h1>
              <p style="color: #94A3B8; font-size: 14px; margin: 0 0 24px 0;">
                Hi <strong>${displayName}</strong>, your access for <strong>${productTitle}</strong> has been granted.
              </p>
              <div style="margin: 24px 0;">
                <a href="${link}" target="_blank" style="display: inline-block; background: #10B981; color: #FFFFFF; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
                  Open & Download My Files 📥
                </a>
              </div>
              <p style="color: #64748B; font-size: 12px; margin-top: 16px;">
                Direct Access Link: <a href="${link}" style="color: #38BDF8;">${link}</a>
              </p>
              <div style="border-top: 1px solid #1E293B; margin-top: 28px; padding-top: 20px;">
                <p style="color: #94A3B8; font-size: 13px; margin: 0 0 12px 0;">
                  Satisfied with your purchase? Please take 30 seconds to rate us!
                </p>
                <a href="${reviewLink}" target="_blank" style="color: #F59E0B; font-weight: 700; font-size: 14px; text-decoration: none;">
                  ★ ★ ★ ★ ★ Leave a Quick Review
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  };

  // Helper for generating order confirmation email HTML
  const generateOrderConfirmationEmailHtml = (data: {
    orderId?: string;
    customerName?: string;
    customerEmail?: string;
    whatsapp?: string;
    items?: { title: string; price: number; type?: string }[];
    totalAmountPKR?: number;
    totalAmountUSD?: number;
    paymentMethod?: string;
  }) => {
    const displayName = data.customerName || 'Valued Creator';
    const orderId = data.orderId || 'ZDF-ORDER';
    const itemsList = data.items || [];
    const method = data.paymentMethod || 'JazzCash';
    const totalPKR = data.totalAmountPKR || 0;

    const itemsRows = itemsList.map(item => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #1E293B; color: #F8FAFC; font-size: 14px; font-weight: 600;">
          ${item.title}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #1E293B; color: #22C55E; font-size: 14px; font-weight: 700; text-align: right;">
          Rs. ${item.price.toLocaleString()}
        </td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Order Confirmation #${orderId} - Zohaib DigiForge</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070B14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070B14; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background: linear-gradient(180deg, #0D1527 0%, #080D1A 100%); border: 1px solid #1E293B; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          <tr>
            <td style="background: linear-gradient(90deg, #0D6EFD 0%, #28B9FF 50%, #22C55E 100%); height: 6px; line-height: 6px; font-size: 0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center;">
              <div style="display: inline-block; padding: 6px 14px; background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 999px; margin-bottom: 16px;">
                <span style="color: #22C55E; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">✦ Order Placed Successfully</span>
              </div>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                Thank You, ${displayName}! ⚡
              </h1>
              <p style="margin: 8px 0 0 0; color: #94A3B8; font-size: 14px; line-height: 1.5;">
                Your digital resource order <strong style="color: #28B9FF;">#${orderId}</strong> is registered and awaiting payment verification.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px;">
              <table role="presentation" width="100%" style="background-color: rgba(15, 23, 42, 0.7); border: 1px solid #1E293B; border-radius: 14px; padding: 18px;">
                <tr>
                  <td>
                    <div style="font-size: 11px; color: #38BDF8; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                      Order Summary
                    </div>
                    <table role="presentation" width="100%" style="border-collapse: collapse;">
                      ${itemsRows}
                      <tr>
                        <td style="padding: 12px 0 4px 0; color: #94A3B8; font-size: 14px; font-weight: bold;">
                          Total (${method})
                        </td>
                        <td style="padding: 12px 0 4px 0; color: #22C55E; font-size: 18px; font-weight: 800; text-align: right;">
                          Rs. ${totalPKR.toLocaleString()}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px 10px 32px;">
              <div style="background-color: rgba(13, 110, 253, 0.08); border: 1px solid rgba(13, 110, 253, 0.2); border-radius: 14px; padding: 18px;">
                <div style="font-size: 12px; color: #28B9FF; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
                  ⚡ Next Step to Get Instant Access:
                </div>
                <p style="margin: 0; color: #CBD5E1; font-size: 13px; line-height: 1.6;">
                  1. Send the payment screenshot to WhatsApp <strong style="color: #22C55E;">+92 340 6070632</strong> with your Order ID <strong style="color: #FFFFFF;">#${orderId}</strong>.<br/>
                  2. Files will be delivered via <strong style="color: #38BDF8;">Instant Download / License Access</strong> with guaranteed delivery <strong style="color: #22C55E;">within 3 hours</strong> (often under 15 minutes)!
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px 10px 32px; text-align: center;">
              <div>
                <a href="https://wa.me/923406070632?text=${encodeURIComponent(`Hi Zohaib DigiForge! I placed Order #${orderId} for Rs. ${totalPKR}. Here is my payment confirmation.`)}" target="_blank" style="display: inline-block; background: #22C55E; color: #0A0F1D; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 36px; border-radius: 12px; box-shadow: 0 10px 20px rgba(34, 197, 94, 0.35);">
                  Confirm on WhatsApp ➔
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 32px; background-color: #060A13; border-top: 1px solid #1E293B; margin-top: 24px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #94A3B8; font-size: 12px;">
                WhatsApp Support: <strong style="color: #22C55E;">+92 340 6070632</strong> • Email: <strong style="color: #38BDF8;">zohaibdigiforge@gmail.com</strong>
              </p>
              <p style="margin: 0; color: #475569; font-size: 11px;">
                © ${new Date().getFullYear()} Zohaib DigiForge • Empowering Learning. Powering Success.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  };

  // Helper for generating order notification email HTML for Admin (Zohaib)
  const generateAdminOrderNotificationHtml = (data: {
    orderId?: string;
    customerName?: string;
    customerEmail?: string;
    whatsapp?: string;
    items?: { title: string; price: number; type?: string }[];
    totalAmountPKR?: number;
    totalAmountUSD?: number;
    paymentMethod?: string;
    notes?: string;
  }) => {
    const customerName = data.customerName || 'Customer';
    const customerEmail = data.customerEmail || 'N/A';
    const whatsapp = data.whatsapp || 'N/A';
    const orderId = data.orderId || 'ZDF-ORDER';
    const itemsList = data.items || [];
    const method = data.paymentMethod || 'JazzCash';
    const totalPKR = data.totalAmountPKR || 0;
    const totalUSD = data.totalAmountUSD || 0;
    const notes = data.notes || '';

    const itemsRows = itemsList.map(item => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #1E293B; color: #F8FAFC; font-size: 14px; font-weight: 600;">
          ${item.title} ${item.type ? `<span style="font-size: 11px; color: #38BDF8; background: rgba(56, 189, 248, 0.15); padding: 2px 6px; border-radius: 4px; margin-left: 6px;">${item.type}</span>` : ''}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #1E293B; color: #22C55E; font-size: 14px; font-weight: 700; text-align: right;">
          Rs. ${item.price.toLocaleString()}
        </td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>🔥 New Order Received #${orderId} - Admin Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070B14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070B14; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background: linear-gradient(180deg, #0D1527 0%, #080D1A 100%); border: 1px solid #1E293B; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.7);">
          <tr>
            <td style="background: linear-gradient(90deg, #22C55E 0%, #0D6EFD 50%, #EAB308 100%); height: 6px; line-height: 6px; font-size: 0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center;">
              <div style="display: inline-block; padding: 6px 14px; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.35); border-radius: 999px; margin-bottom: 16px;">
                <span style="color: #22C55E; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">⚡ Admin Alert: New Order Placed</span>
              </div>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                New Order Received! 💰
              </h1>
              <p style="margin: 8px 0 0 0; color: #94A3B8; font-size: 14px;">
                Order <strong style="color: #38BDF8;">#${orderId}</strong> placed by <strong style="color: #FFFFFF;">${customerName}</strong>
              </p>
            </td>
          </tr>

          {/* Customer Details Box */}
          <tr>
            <td style="padding: 0 32px 16px 32px;">
              <table role="presentation" width="100%" style="background-color: rgba(15, 23, 42, 0.8); border: 1px solid #1E293B; border-radius: 14px; padding: 18px;">
                <tr>
                  <td>
                    <div style="font-size: 11px; color: #38BDF8; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                      Customer Information
                    </div>
                    <table role="presentation" width="100%" style="font-size: 13px; color: #E2E8F0; line-height: 1.8;">
                      <tr>
                        <td style="color: #94A3B8; width: 120px;">Customer Name:</td>
                        <td><strong style="color: #FFFFFF;">${customerName}</strong></td>
                      </tr>
                      <tr>
                        <td style="color: #94A3B8;">Email:</td>
                        <td><a href="mailto:${customerEmail}" style="color: #38BDF8; text-decoration: none;">${customerEmail}</a></td>
                      </tr>
                      <tr>
                        <td style="color: #94A3B8;">WhatsApp:</td>
                        <td>
                          <a href="https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}" target="_blank" style="color: #22C55E; font-weight: bold; text-decoration: none;">
                            ${whatsapp} 💬 (Click to chat)
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #94A3B8;">Payment Method:</td>
                        <td><strong style="color: #FACC15;">${method}</strong></td>
                      </tr>
                      ${notes ? `
                      <tr>
                        <td style="color: #94A3B8; vertical-align: top;">Customer Note:</td>
                        <td style="color: #CBD5E1; font-style: italic;">"${notes}"</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          {/* Order Items Table */}
          <tr>
            <td style="padding: 0 32px;">
              <table role="presentation" width="100%" style="background-color: rgba(15, 23, 42, 0.8); border: 1px solid #1E293B; border-radius: 14px; padding: 18px;">
                <tr>
                  <td>
                    <div style="font-size: 11px; color: #22C55E; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                      Ordered Items (${itemsList.length})
                    </div>
                    <table role="presentation" width="100%" style="border-collapse: collapse;">
                      ${itemsRows}
                      <tr>
                        <td style="padding: 12px 0 4px 0; color: #94A3B8; font-size: 14px; font-weight: bold;">
                          Total Payable
                        </td>
                        <td style="padding: 12px 0 4px 0; color: #22C55E; font-size: 20px; font-weight: 800; text-align: right;">
                          Rs. ${totalPKR.toLocaleString()} <span style="font-size: 12px; color: #94A3B8;">($${totalUSD})</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          {/* Action Button */}
          <tr>
            <td style="padding: 24px 32px 10px 32px; text-align: center;">
              <div>
                <a href="https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${customerName}! Thank you for placing Order #${orderId} on Zohaib DigiForge for Rs. ${totalPKR.toLocaleString()}.`)}" target="_blank" style="display: inline-block; background: #22C55E; color: #0A0F1D; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 36px; border-radius: 12px; box-shadow: 0 10px 20px rgba(34, 197, 94, 0.35);">
                  Open WhatsApp Chat With Customer 💬
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 32px; background-color: #060A13; border-top: 1px solid #1E293B; margin-top: 20px; text-align: center;">
              <p style="margin: 0; color: #64748B; font-size: 11px;">
                Zohaib DigiForge Notification System • Instant Admin Alert
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  };

  const generateWelcomeEmailHtml = (data: {
    customerName?: string;
    customerEmail?: string;
  }) => {
    const displayName = data.customerName || 'Valued Member';
    const email = data.customerEmail || '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Welcome to Zohaib DigiForge! 🚀</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0F1D; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0A0F1D; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background: linear-gradient(180deg, #0D1527 0%, #080D1A 100%); border: 1px solid #1E293B; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.7);">
          <tr>
            <td style="background: linear-gradient(90deg, #0D6EFD 0%, #28B9FF 50%, #22C55E 100%); height: 6px; line-height: 6px; font-size: 0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 36px 32px 20px 32px; text-align: center;">
              <div style="display: inline-block; padding: 6px 16px; background: rgba(13, 110, 253, 0.15); border: 1px solid rgba(40, 185, 255, 0.3); border-radius: 999px; margin-bottom: 18px;">
                <span style="color: #28B9FF; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">✦ Account Activated</span>
              </div>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
                Welcome to Zohaib DigiForge, ${displayName}! 🚀
              </h1>
              <p style="margin: 12px 0 0 0; color: #94A3B8; font-size: 14px; line-height: 1.6;">
                Your account is ready. You now have instant access to explore 500+ curated digital assets, pro developer tools, and exclusive member benefits.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px;">
              <table role="presentation" width="100%" style="background-color: rgba(15, 23, 42, 0.7); border: 1px solid #1E293B; border-radius: 14px; padding: 20px;">
                <tr>
                  <td>
                    <div style="font-size: 13px; color: #22C55E; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                      ✦ What you get with your DigiForge account:
                    </div>
                    <ul style="margin: 0; padding-left: 20px; color: #CBD5E1; font-size: 13px; line-height: 1.8;">
                      <li><strong style="color: #FFFFFF;">Instant Downloads & Key Delivery:</strong> Download links and license keys delivered directly.</li>
                      <li><strong style="color: #FFFFFF;">Order Tracking:</strong> Live verification & tracking on all purchases.</li>
                      <li><strong style="color: #FFFFFF;">Member-Only Pricing:</strong> Unlock discounted rates on software, templates, and courses.</li>
                      <li><strong style="color: #FFFFFF;">Priority WhatsApp Support:</strong> Direct 1-on-1 assistance whenever you need it.</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 32px 10px 32px; text-align: center;">
              <div>
                <a href="https://zohaibdigiforge.com/?view=resources" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0D6EFD 0%, #28B9FF 100%); color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 36px; border-radius: 12px; box-shadow: 0 10px 24px rgba(13, 110, 253, 0.4);">
                  Explore Premium Resources ➔
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 32px; background-color: #060A13; border-top: 1px solid #1E293B; margin-top: 24px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #94A3B8; font-size: 12px;">
                Registered Email: <strong style="color: #38BDF8;">${email}</strong>
              </p>
              <p style="margin: 0 0 8px 0; color: #94A3B8; font-size: 12px;">
                WhatsApp Support: <strong style="color: #22C55E;">+92 340 6070632</strong>
              </p>
              <p style="margin: 0; color: #475569; font-size: 11px;">
                © ${new Date().getFullYear()} Zohaib DigiForge • Empowering Learning. Powering Success.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  };

  const generateProductAddedEmailHtml = (data: {
    product: any;
    isNewProduct?: boolean;
  }) => {
    const p = data.product || {};
    const isNew = data.isNewProduct !== false;
    const title = p.title || 'Digital Resource Product';
    const category = p.categoryId || 'General Resources';
    const pricePKR = p.pricePKR ? `Rs. ${p.pricePKR.toLocaleString()}` : 'Flat Price / Included';
    const priceUSD = p.priceUSD ? `$${p.priceUSD}` : '';
    const thumbnail = p.thumbnail || p.image || '';
    const downloadUrl = p.downloadUrl || '#';
    const format = p.fileFormat || 'Digital Files';
    const size = p.fileSize || 'Instant Access';
    const desc = p.shortDescription || p.description || 'New digital resource published on Zohaib DigiForge.';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${isNew ? 'New Product Added' : 'Product Updated'} - ${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070B14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070B14; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background: linear-gradient(180deg, #0D1527 0%, #080D1A 100%); border: 1px solid #1E293B; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          <tr>
            <td style="background: linear-gradient(90deg, #22C55E 0%, #0D6EFD 50%, #28B9FF 100%); height: 6px; line-height: 6px; font-size: 0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center;">
              <div style="display: inline-block; padding: 6px 14px; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.35); border-radius: 999px; margin-bottom: 16px;">
                <span style="color: #22C55E; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">
                  ✦ ${isNew ? 'New Product Live in Store' : 'Product Catalog Updated'}
                </span>
              </div>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                ${title} 📦
              </h1>
              <p style="margin: 8px 0 0 0; color: #94A3B8; font-size: 14px;">
                Category: <strong style="color: #38BDF8; text-transform: capitalize;">${category}</strong>
              </p>
            </td>
          </tr>

          ${thumbnail ? `
          <tr>
            <td style="padding: 0 32px 20px 32px; text-align: center;">
              <img src="${thumbnail}" alt="${title}" style="width: 100%; max-height: 240px; object-fit: cover; border-radius: 12px; border: 1px solid #1E293B;" />
            </td>
          </tr>
          ` : ''}

          <tr>
            <td style="padding: 0 32px;">
              <table role="presentation" width="100%" style="background-color: rgba(15, 23, 42, 0.8); border: 1px solid #1E293B; border-radius: 14px; padding: 18px;">
                <tr>
                  <td>
                    <div style="font-size: 11px; color: #38BDF8; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                      Product Specifications
                    </div>
                    <table role="presentation" width="100%" style="font-size: 13px; color: #E2E8F0; line-height: 1.8;">
                      <tr>
                        <td style="color: #94A3B8; width: 120px;">Price:</td>
                        <td><strong style="color: #22C55E; font-size: 15px;">${pricePKR} ${priceUSD ? `(${priceUSD})` : ''}</strong></td>
                      </tr>
                      <tr>
                        <td style="color: #94A3B8;">Format:</td>
                        <td><strong style="color: #FFFFFF;">${format}</strong></td>
                      </tr>
                      <tr>
                        <td style="color: #94A3B8;">File Size:</td>
                        <td><strong style="color: #FFFFFF;">${size}</strong></td>
                      </tr>
                      <tr>
                        <td style="color: #94A3B8;">Delivery:</td>
                        <td><span style="color: #38BDF8; font-weight: bold;">Instant Download Access</span></td>
                      </tr>
                    </table>
                    <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #1E293B; color: #CBD5E1; font-size: 13px; line-height: 1.5;">
                      ${desc}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${downloadUrl ? `
          <tr>
            <td style="padding: 24px 32px 10px 32px; text-align: center;">
              <div>
                <a href="${downloadUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0D6EFD 0%, #28B9FF 100%); color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 36px; border-radius: 12px; box-shadow: 0 10px 20px rgba(13, 110, 253, 0.35);">
                  View Product Download Link ➔
                </a>
              </div>
            </td>
          </tr>
          ` : ''}

          <tr>
            <td style="padding: 24px 32px; background-color: #060A13; border-top: 1px solid #1E293B; margin-top: 20px; text-align: center;">
              <p style="margin: 0; color: #64748B; font-size: 11px;">
                Zohaib DigiForge Store Management System • Instant Product Publish Alert
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  };

  // ═════════════════════════════════════════════════════════════════
  // ROCK-SOLID PERSISTENT STORAGE ENGINE (Orders, Inquiries, Reviews)
  // Multi-layer: In-Memory Cache + Atomic JSON Disk Files + Cloud Firestore Dual-Sync
  // ═════════════════════════════════════════════════════════════════

  const DATA_DIR = path.join(process.cwd(), 'server_data');
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.warn('[DATA-STORE] Warning creating server_data directory:', e);
    }
  }

  const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
  const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');

  // Safe file reader helper with corruption recovery
  function readJsonFileSync<T>(filePath: string, defaultValue: T): T {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content && content.trim()) {
          return JSON.parse(content) as T;
        }
      }
    } catch (err) {
      console.warn(`[DATA-STORE] Warning reading ${filePath}, falling back to default:`, err);
    }
    return defaultValue;
  }

  // Atomic file writer helper with temp file + rename to prevent corruption on crash
  function writeJsonFileSync<T>(filePath: string, data: T): void {
    try {
      const tempPath = `${filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, filePath);
    } catch (err) {
      console.error(`[DATA-STORE] Error writing atomic file ${filePath}:`, err);
    }
  }

  // In-Memory Persistent Store
  let persistentOrders: any[] = readJsonFileSync<any[]>(ORDERS_FILE, []);
  let persistentInquiries: any[] = readJsonFileSync<any[]>(INQUIRIES_FILE, []);

  // Enhanced Health Check with Backend Diagnostics
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      engine: 'Zohaib DigiForge Free Notification & Storage Engine',
      gmailConfigured: !!(process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD),
      storage: {
        ordersCount: persistentOrders.length,
        inquiriesCount: persistentInquiries.length,
        diskSync: 'active'
      },
      uptime: process.uptime()
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // 1. ORDERS API: CREATE / SAVE ORDER (Server-Authoritative Persistence)
  // ═════════════════════════════════════════════════════════════════
  app.post('/api/orders', async (req, res) => {
    try {
      const orderPayload = req.body.order || req.body;

      if (!orderPayload || !orderPayload.email || !orderPayload.customerName) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required order fields (customerName, email)' 
        });
      }

      const defaultExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const processedItems = (orderPayload.items || []).map((item: any) => ({
        ...item,
        expiresAt: item.expiresAt || defaultExpiry,
        reminderSent: false
      }));

      // 🛡️ ENTERPRISE-GRADE SERVER-SIDE SANITIZATION & PRICE SECURITY
      const hasProTools = processedItems.some((item: any) => item.category === 'pro-tools');
      if (hasProTools) {
        console.log(`[BACKEND-SECURITY] 🛡️ Analyzing order containing Pro Tools items for security compliance.`);
        if (orderPayload.discountPKR && orderPayload.discountPKR > 0) {
          const nonProToolsItems = processedItems.filter((item: any) => item.category !== 'pro-tools');
          const nonProToolsSubtotal = nonProToolsItems.reduce((acc: number, item: any) => acc + (item.pricePKR || 0) * (item.quantity || 1), 0);
          if (orderPayload.discountPKR > nonProToolsSubtotal) {
            console.warn(`[SECURITY-ALERT] 🚨 Discount PKR (Rs. ${orderPayload.discountPKR}) exceeded eligible non-Pro Tools subtotal (Rs. ${nonProToolsSubtotal}). Auto-adjusting.`);
            orderPayload.discountPKR = nonProToolsSubtotal;
            orderPayload.totalAmountPKR = Math.max(0, (orderPayload.subtotalPKR || 0) - nonProToolsSubtotal);
          }
        }
        if (orderPayload.referrerRewardPKR && orderPayload.referrerRewardPKR > 0) {
          const nonProToolsItems = processedItems.filter((item: any) => item.category !== 'pro-tools');
          const nonProToolsSubtotal = nonProToolsItems.reduce((acc: number, item: any) => acc + (item.pricePKR || 0) * (item.quantity || 1), 0);
          const eligibleTotal = Math.max(0, nonProToolsSubtotal - (orderPayload.discountPKR || 0));
          const maxReward = eligibleTotal > 0 ? Math.max(100, Math.round(eligibleTotal * 0.10)) : 0;
          if (orderPayload.referrerRewardPKR > maxReward) {
            console.warn(`[SECURITY-ALERT] 🚨 Referrer reward (Rs. ${orderPayload.referrerRewardPKR}) exceeded safe limit (Rs. ${maxReward}) due to Pro Tools. Correcting.`);
            orderPayload.referrerRewardPKR = maxReward;
          }
        }
      }

      const newOrder = {
        ...orderPayload,
        items: processedItems,
        id: orderPayload.id || ('ZDF-' + Math.floor(100000 + Math.random() * 900000)),
        status: orderPayload.status || 'Pending Verification',
        createdAt: orderPayload.createdAt || new Date().toISOString()
      };

      // Check if order already exists in persistent array (deduplicate)
      const existingIdx = persistentOrders.findIndex(o => o.id === newOrder.id);
      if (existingIdx >= 0) {
        persistentOrders[existingIdx] = { ...persistentOrders[existingIdx], ...newOrder };
      } else {
        persistentOrders.unshift(newOrder);
      }

      // Write to persistent disk storage atomically
      writeJsonFileSync(ORDERS_FILE, persistentOrders);
      console.log(`[DATA-STORE] 💾 Order #${newOrder.id} saved to persistent server storage (${persistentOrders.length} total orders).`);

      // Asynchronous dual-sync to Cloud Firestore if connected
      try {
        const firestore = getServerFirestoreDb();
        if (firestore) {
          await setDoc(doc(firestore, 'orders', newOrder.id), newOrder, { merge: true });
          console.log(`[DATA-STORE] ☁️ Order #${newOrder.id} synchronized with Cloud Firestore.`);
        }
      } catch (fsErr) {
        console.warn(`[DATA-STORE] Firestore sync notice for order #${newOrder.id}:`, fsErr);
      }

      // Dispatch order confirmation emails in background
      try {
        const rawGmailUser = (process.env.GMAIL_EMAIL || process.env.GMAIL_USER || 'zohaibdigiforge@gmail.com').trim();
        const rawGmailPass = (process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || '').trim().replace(/\s+/g, '');
        const adminEmailRecipient = (process.env.ADMIN_EMAIL || process.env.GMAIL_EMAIL || 'zohaibdigiforge@gmail.com').trim();

        if (rawGmailPass && rawGmailPass.length > 7 && !rawGmailPass.includes('your-16-char')) {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: rawGmailUser, pass: rawGmailPass },
            tls: { rejectUnauthorized: false }
          });

          // Customer email
          transporter.sendMail({
            from: `"Zohaib DigiForge" <${rawGmailUser}>`,
            to: newOrder.email.trim(),
            subject: `⚡ Order Confirmation #${newOrder.id} - Zohaib DigiForge`,
            html: generateOrderConfirmationEmailHtml({
              orderId: newOrder.id,
              customerName: newOrder.customerName,
              customerEmail: newOrder.email,
              whatsapp: newOrder.whatsapp,
              items: newOrder.items,
              totalAmountPKR: newOrder.totalAmountPKR,
              totalAmountUSD: newOrder.totalAmountUSD,
              paymentMethod: newOrder.paymentMethod
            })
          }).catch(e => console.warn('[DATA-STORE] Customer email error:', e?.message));

          // Admin alert email
          transporter.sendMail({
            from: `"ZDF Order Alert" <${rawGmailUser}>`,
            to: adminEmailRecipient,
            subject: `🔥 New Order #${newOrder.id} Received - Rs. ${(newOrder.totalAmountPKR || 0).toLocaleString()} from ${newOrder.customerName}`,
            html: generateAdminOrderNotificationHtml({
              orderId: newOrder.id,
              customerName: newOrder.customerName,
              customerEmail: newOrder.email,
              whatsapp: newOrder.whatsapp,
              items: newOrder.items,
              totalAmountPKR: newOrder.totalAmountPKR,
              totalAmountUSD: newOrder.totalAmountUSD,
              paymentMethod: newOrder.paymentMethod,
              notes: newOrder.notes
            })
          }).catch(e => console.warn('[DATA-STORE] Admin alert email error:', e?.message));
        }
      } catch (mailErr) {
        console.warn('[DATA-STORE] Mailer notice:', mailErr);
      }

      return res.json({
        success: true,
        order: newOrder,
        message: 'Order saved and synced successfully'
      });
    } catch (err: any) {
      console.error('[DATA-STORE] Error saving order:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Failed to save order' });
    }
  });

  // ═════════════════════════════════════════════════════════════════
  // 2. ORDERS API: GET ALL ORDERS (For Admin Dashboard & User Queries)
  // ═════════════════════════════════════════════════════════════════
  app.get('/api/orders', async (req, res) => {
    try {
      const emailQuery = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
      const uidQuery = typeof req.query.uid === 'string' ? req.query.uid.trim() : '';
      const statusQuery = typeof req.query.status === 'string' ? req.query.status.trim() : '';
      const searchQuery = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';

      // Reload latest from disk
      persistentOrders = readJsonFileSync<any[]>(ORDERS_FILE, persistentOrders);

      // Merge from Firestore if available
      try {
        const firestore = getServerFirestoreDb();
        if (firestore) {
          const snap = await getDocs(collection(firestore, 'orders'));
          snap.forEach(d => {
            const fsOrder = { id: d.id, ...d.data() };
            if (!persistentOrders.some(o => o.id === fsOrder.id)) {
              persistentOrders.push(fsOrder);
            }
          });
        }
      } catch (fsErr) {}

      let results = [...persistentOrders];

      if (emailQuery) {
        results = results.filter(o => (o.email || '').toLowerCase() === emailQuery);
      }
      if (uidQuery) {
        results = results.filter(o => o.userId === uidQuery);
      }
      if (statusQuery) {
        results = results.filter(o => (o.status || '').toLowerCase() === statusQuery.toLowerCase());
      }
      if (searchQuery) {
        results = results.filter(o => 
          (o.id || '').toLowerCase().includes(searchQuery) ||
          (o.customerName || '').toLowerCase().includes(searchQuery) ||
          (o.email || '').toLowerCase().includes(searchQuery) ||
          (o.whatsapp || '').includes(searchQuery)
        );
      }

      // Sort newest first
      results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      return res.json({
        success: true,
        count: results.length,
        orders: results
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch orders' });
    }
  });

  // ═════════════════════════════════════════════════════════════════
  // 3. ORDERS API: CROSS-DEVICE ORDER TRACKING (Order ID, Email, Phone)
  // ═════════════════════════════════════════════════════════════════
  app.get('/api/orders/track/:term', async (req, res) => {
    try {
      const rawTerm = req.params.term || '';
      const term = rawTerm.trim().toLowerCase();
      const cleanDigits = rawTerm.replace(/\D/g, '');

      if (!term && !cleanDigits) {
        return res.status(400).json({ success: false, error: 'Tracking term is required' });
      }

      // 1. Check persistent memory & disk
      persistentOrders = readJsonFileSync<any[]>(ORDERS_FILE, persistentOrders);
      
      let matched = persistentOrders.find(o => {
        const oId = (o.id || '').toLowerCase();
        const oEmail = (o.email || '').toLowerCase();
        const oPhone = (o.whatsapp || '').replace(/\D/g, '');
        return oId === term || oEmail === term || (cleanDigits && cleanDigits.length >= 7 && oPhone.includes(cleanDigits));
      });

      // 2. If not found on disk, query Firestore directly
      if (!matched) {
        try {
          const firestore = getServerFirestoreDb();
          if (firestore) {
            const snap = await getDocs(collection(firestore, 'orders'));
            snap.forEach(d => {
              const o = { id: d.id, ...d.data() } as any;
              const oId = (o.id || '').toLowerCase();
              const oEmail = (o.email || '').toLowerCase();
              const oPhone = (o.whatsapp || '').replace(/\D/g, '');
              if (oId === term || oEmail === term || (cleanDigits && cleanDigits.length >= 7 && oPhone.includes(cleanDigits))) {
                matched = o;
              }
            });
            if (matched) {
              persistentOrders.unshift(matched);
              writeJsonFileSync(ORDERS_FILE, persistentOrders);
            }
          }
        } catch (e) {}
      }

      if (!matched) {
        return res.status(404).json({
          success: false,
          error: 'No order found matching your tracking ID, Email, or WhatsApp number.'
        });
      }

      return res.json({
        success: true,
        order: matched
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Error tracking order' });
    }
  });

  // ═════════════════════════════════════════════════════════════════
  // 4. ORDERS API: UPDATE ORDER STATUS / DOWNLOAD LINKS / NOTES
  // ═════════════════════════════════════════════════════════════════
  app.post('/api/orders/:id/status', async (req, res) => {
    try {
      const orderId = req.params.id;
      const { status, downloadLinks, notes, extraUpdates } = req.body;

      persistentOrders = readJsonFileSync<any[]>(ORDERS_FILE, persistentOrders);
      const idx = persistentOrders.findIndex(o => o.id.toLowerCase() === orderId.toLowerCase());

      if (idx === -1) {
        return res.status(404).json({ success: false, error: `Order #${orderId} not found` });
      }

      const updatedOrder = {
        ...persistentOrders[idx],
        status: status || persistentOrders[idx].status,
        downloadLinks: downloadLinks !== undefined ? downloadLinks : persistentOrders[idx].downloadLinks,
        notes: notes !== undefined ? notes : persistentOrders[idx].notes,
        ...(extraUpdates || {}),
        updatedAt: new Date().toISOString()
      };

      persistentOrders[idx] = updatedOrder;
      writeJsonFileSync(ORDERS_FILE, persistentOrders);
      console.log(`[DATA-STORE] 🔄 Order #${orderId} status updated to "${updatedOrder.status}"`);

      // Sync with Firestore
      try {
        const firestore = getServerFirestoreDb();
        if (firestore) {
          await setDoc(doc(firestore, 'orders', updatedOrder.id), updatedOrder, { merge: true });
        }
      } catch (fsErr) {}

      // If status is 'Access Delivered', send delivery email to customer
      if (status === 'Access Delivered' && updatedOrder.email) {
        try {
          const rawGmailUser = (process.env.GMAIL_EMAIL || process.env.GMAIL_USER || 'zohaibdigiforge@gmail.com').trim();
          const rawGmailPass = (process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || '').trim().replace(/\s+/g, '');

          if (rawGmailPass && rawGmailPass.length > 7 && !rawGmailPass.includes('your-16-char')) {
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: { user: rawGmailUser, pass: rawGmailPass },
              tls: { rejectUnauthorized: false }
            });

            const link = (Array.isArray(updatedOrder.downloadLinks) && updatedOrder.downloadLinks[0]) ? updatedOrder.downloadLinks[0] : 'https://drive.google.com';
            const productTitle = updatedOrder.items?.[0]?.title || 'Digital Product Suite';

            await transporter.sendMail({
              from: `"Zohaib DigiForge Access" <${rawGmailUser}>`,
              to: updatedOrder.email.trim(),
              subject: `🚀 Access Delivered: Order #${updatedOrder.id} - Zohaib DigiForge`,
              html: generateCustomerDeliveredEmailHtml({
                customerName: updatedOrder.customerName,
                orderId: updatedOrder.id,
                productTitle,
                downloadLink: link
              })
            });
            console.log(`[DATA-STORE] ✉️ Delivery email sent to ${updatedOrder.email} for order #${orderId}`);
          }
        } catch (mailErr) {
          console.warn('[DATA-STORE] Delivery mail dispatch notice:', mailErr);
        }
      }

      return res.json({
        success: true,
        order: updatedOrder,
        message: 'Order updated successfully'
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Failed to update order' });
    }
  });

  // ═════════════════════════════════════════════════════════════════
  // 4b. ORDERS API: CLEAR ALL ORDERS (Clean Reset)
  // ═════════════════════════════════════════════════════════════════
  app.post('/api/orders/clear-all', async (req, res) => {
    try {
      persistentOrders = [];
      writeJsonFileSync(ORDERS_FILE, []);

      // Also clean up all Firestore orders collection documents
      try {
        const firestore = getServerFirestoreDb();
        if (firestore) {
          const snap = await getDocs(collection(firestore, 'orders'));
          for (const d of snap.docs) {
            await deleteDoc(doc(firestore, 'orders', d.id));
          }
        }
      } catch (fsErr) {
        console.warn('[ORDERS-CLEAR] Firestore clear notice:', fsErr);
      }

      console.log('[DATA-STORE] 🧹 All orders have been completely cleared and cleaned.');
      return res.json({ success: true, message: 'All orders have been permanently cleared and cleaned.' });
    } catch (err: any) {
      console.error('[DATA-STORE] Error clearing orders:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Failed to clear orders' });
    }
  });

  // ═════════════════════════════════════════════════════════════════
  // 4c. ORDERS API: DELETE SINGLE ORDER
  // ═════════════════════════════════════════════════════════════════
  app.delete('/api/orders/:id', async (req, res) => {
    try {
      const orderId = req.params.id;
      persistentOrders = readJsonFileSync<any[]>(ORDERS_FILE, persistentOrders);
      persistentOrders = persistentOrders.filter(o => o.id.toLowerCase() !== orderId.toLowerCase());
      writeJsonFileSync(ORDERS_FILE, persistentOrders);

      // Also delete from Firestore
      try {
        const firestore = getServerFirestoreDb();
        if (firestore) {
          await deleteDoc(doc(firestore, 'orders', orderId));
          const snap = await getDocs(collection(firestore, 'orders'));
          for (const d of snap.docs) {
            if (d.id.toLowerCase() === orderId.toLowerCase() || (d.data() && d.data().id?.toLowerCase() === orderId.toLowerCase())) {
              await deleteDoc(doc(firestore, 'orders', d.id));
            }
          }
        }
      } catch (fsErr) {
        console.warn('[ORDERS-DELETE] Firestore delete notice:', fsErr);
      }

      return res.json({ success: true, message: `Order #${orderId} deleted successfully.` });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Failed to delete order' });
    }
  });

  // ═════════════════════════════════════════════════════════════════
  // 5. INQUIRIES API: CONTACT & CUSTOM SERVICE INQUIRIES
  // ═════════════════════════════════════════════════════════════════
  app.post('/api/inquiries', async (req, res) => {
    try {
      const { name, email, whatsapp, subject, message, type, budget } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({ success: false, error: 'Name, email, and message are required.' });
      }

      const newInquiry = {
        id: 'INQ-' + Date.now().toString(36).toUpperCase(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        whatsapp: whatsapp ? whatsapp.trim() : '',
        subject: subject || 'General Inquiry',
        message: message.trim(),
        type: type || 'contact',
        budget: budget || '',
        status: 'new',
        createdAt: new Date().toISOString()
      };

      persistentInquiries = readJsonFileSync<any[]>(INQUIRIES_FILE, persistentInquiries);
      persistentInquiries.unshift(newInquiry);
      writeJsonFileSync(INQUIRIES_FILE, persistentInquiries);

      // Dual-sync to Firestore
      try {
        const firestore = getServerFirestoreDb();
        if (firestore) {
          await setDoc(doc(firestore, 'contactInquiries', newInquiry.id), newInquiry);
        }
      } catch (e) {}

      // Send alert email to Admin
      try {
        const rawGmailUser = (process.env.GMAIL_EMAIL || process.env.GMAIL_USER || 'zohaibdigiforge@gmail.com').trim();
        const rawGmailPass = (process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || '').trim().replace(/\s+/g, '');
        const adminEmail = (process.env.ADMIN_EMAIL || process.env.GMAIL_EMAIL || 'zohaibdigiforge@gmail.com').trim();

        if (rawGmailPass && rawGmailPass.length > 7 && !rawGmailPass.includes('your-16-char')) {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: rawGmailUser, pass: rawGmailPass },
            tls: { rejectUnauthorized: false }
          });

          transporter.sendMail({
            from: `"ZDF Contact Form" <${rawGmailUser}>`,
            to: adminEmail,
            subject: `📩 New Inquiry from ${newInquiry.name}: ${newInquiry.subject}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; background: #0b0f19; color: #f8fafc; border-radius: 10px;">
                <h2 style="color: #38bdf8;">New Customer Inquiry Received</h2>
                <p><strong>Name:</strong> ${newInquiry.name}</p>
                <p><strong>Email:</strong> ${newInquiry.email}</p>
                <p><strong>WhatsApp:</strong> ${newInquiry.whatsapp || 'N/A'}</p>
                <p><strong>Type:</strong> ${newInquiry.type}</p>
                <div style="background: #1e293b; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <p style="margin: 0; color: #e2e8f0; white-space: pre-line;">${newInquiry.message}</p>
                </div>
                <p style="font-size: 12px; color: #64748b;">Received at ${newInquiry.createdAt}</p>
              </div>
            `
          }).catch(e => console.warn('[DATA-STORE] Admin inquiry alert error:', e?.message));
        }
      } catch (e) {}

      return res.json({ success: true, inquiry: newInquiry, message: 'Inquiry saved and admin notified' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Failed to save inquiry' });
    }
  });

  app.get('/api/inquiries', async (req, res) => {
    try {
      persistentInquiries = readJsonFileSync<any[]>(INQUIRIES_FILE, persistentInquiries);
      return res.json({
        success: true,
        count: persistentInquiries.length,
        inquiries: persistentInquiries
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Failed to get inquiries' });
    }
  });

  // ═════════════════════════════════════════════════════════════════
  // FIREBASE ADMIN AUTHENTICATION & ROLE-BASED ACCESS CONTROL
  // ═════════════════════════════════════════════════════════════════
  const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      let token: string | null = null;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Missing Authorization Bearer token. Admin authentication required.',
          code: 'AUTH_TOKEN_MISSING'
        });
      }

      let decodedToken: DecodedIdToken;
      try {
        decodedToken = await getAdminAuth(getAdminAppLazy() || undefined).verifyIdToken(token);
      } catch (tokenErr: any) {
        console.warn('[AUTH-SHIELD] ID Token verification failed:', tokenErr?.message);
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Invalid or expired admin token.',
          code: 'AUTH_TOKEN_INVALID'
        });
      }

      const email = (decodedToken.email || '').trim().toLowerCase();
      const uid = decodedToken.uid;

      // 1. Root admin email check
      if (email === 'zohaibdigiforge@gmail.com') {
        (req as any).adminUser = { uid, email, role: 'super_admin' };
        return next();
      }

      // 2. Check Firestore user profile for admin or super_admin role
      try {
        const db = getServerFirestoreDb();
        if (db) {
          const userDocSnap = await getDoc(doc(db, 'users', uid));
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const role = userData?.role;
            if (role === 'admin' || role === 'super_admin') {
              (req as any).adminUser = { uid, email, role };
              return next();
            }
          }
        }
      } catch (roleErr) {
        console.warn('[AUTH-SHIELD] User role verification error:', roleErr);
      }

      return res.status(403).json({
        success: false,
        error: 'Forbidden: Administrative privileges required.',
        code: 'ADMIN_ROLE_REQUIRED'
      });
    } catch (err: any) {
      console.error('[AUTH-SHIELD] requireAdmin middleware error:', err);
      return res.status(500).json({
        success: false,
        error: 'Authentication verification failure.',
        code: 'AUTH_INTERNAL_ERROR'
      });
    }
  };

  // ═════════════════════════════════════════════════════════════════
  // 6. ADMIN OVERVIEW METRICS (Aggregated from Real Persistent Store)
  // ═════════════════════════════════════════════════════════════════
  app.get('/api/admin/overview', requireAdmin, (req, res) => {
    try {
      persistentOrders = readJsonFileSync<any[]>(ORDERS_FILE, persistentOrders);
      persistentInquiries = readJsonFileSync<any[]>(INQUIRIES_FILE, persistentInquiries);

      const totalRevenuePKR = persistentOrders.reduce((sum, o) => sum + (Number(o.totalAmountPKR) || 0), 0);
      const totalRevenueUSD = persistentOrders.reduce((sum, o) => sum + (Number(o.totalAmountUSD) || 0), 0);
      const verifiedOrders = persistentOrders.filter(o => o.status === 'Payment Verified').length;
      const deliveredOrders = persistentOrders.filter(o => o.status === 'Access Delivered' || o.status === 'Completed').length;
      const pendingOrders = persistentOrders.filter(o => o.status === 'Pending Verification').length;

      return res.json({
        success: true,
        stats: {
          totalOrders: persistentOrders.length,
          totalRevenuePKR,
          totalRevenueUSD,
          verifiedOrders,
          deliveredOrders,
          pendingOrders,
          totalInquiries: persistentInquiries.length
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Failed to calculate overview' });
    }
  });

  // Welcome Email for newly registered users
  app.post('/api/auth/send-welcome-email', async (req, res) => {
    try {
      const { customerEmail, customerName } = req.body;

      if (!customerEmail) {
        return res.status(400).json({ success: false, error: 'Recipient customerEmail is required.' });
      }

      const rawGmailUser = (process.env.GMAIL_EMAIL || 'zohaibdigiforge@gmail.com').trim();
      const rawGmailPass = (process.env.GMAIL_APP_PASSWORD || '').trim().replace(/\s+/g, '');

      const isPlaceholderPass = 
        !rawGmailPass || 
        rawGmailPass === 'your-16-char-app-password' || 
        rawGmailPass.includes('MY_GMAIL') || 
        rawGmailPass.length < 8;

      if (isPlaceholderPass) {
        console.log(`[ZDF-Auth] Welcome email simulated for new user: ${customerEmail} (${customerName})`);
        return res.json({
          success: true,
          simulated: true,
          message: 'Welcome email recorded (simulated mode).',
          details: { recipient: customerEmail, name: customerName }
        });
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: rawGmailUser,
          pass: rawGmailPass,
        },
      });

      try {
        const info = await transporter.sendMail({
          from: `"Zohaib DigiForge" <${rawGmailUser}>`,
          to: customerEmail,
          subject: `Welcome to Zohaib DigiForge, ${customerName || 'Creator'}! 🚀`,
          html: generateWelcomeEmailHtml({ customerName, customerEmail })
        });

        console.log(`[ZDF-Auth] Welcome email sent to ${customerEmail}. Message ID: ${info.messageId}`);
        return res.json({ success: true, messageId: info.messageId });
      } catch (smtpError: any) {
        console.warn('[ZDF-Auth] SMTP Warning during welcome email dispatch:', smtpError?.message);
        return res.json({ success: true, simulated: true, note: 'Simulated fallback dispatch' });
      }
    } catch (err: any) {
      console.error('[ZDF-Auth] Error in send-welcome-email endpoint:', err);
      return res.status(500).json({ success: false, error: err.message || 'Server error' });
    }
  });

  // Order Confirmation Email for instant guest & customer checkout (Sent to BOTH Customer & Admin)
  app.post('/api/checkout/send-order-email', async (req, res) => {
    try {
      const { order } = req.body;

      if (!order || !order.email) {
        return res.status(400).json({ success: false, error: 'Valid order with customer email is required.' });
      }

      const rawGmailUser = (process.env.GMAIL_EMAIL || process.env.GMAIL_USER || 'zohaibdigiforge@gmail.com').trim();
      const rawGmailPass = (process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || '').trim().replace(/\s+/g, '');
      const adminEmailRecipient = (process.env.ADMIN_EMAIL || process.env.GMAIL_EMAIL || 'zohaibdigiforge@gmail.com').trim();

      const isPlaceholderPass = 
        !rawGmailPass || 
        rawGmailPass === 'your-16-char-app-password' || 
        rawGmailPass.includes('MY_GMAIL') || 
        rawGmailPass.length < 8;

      if (isPlaceholderPass) {
        console.log(`[ZDF-Checkout] ⚡ Order #${order.id} received! Both Customer (${order.email}) and Admin (${adminEmailRecipient}) notifications logged (Simulated mode: Add GMAIL_APP_PASSWORD in settings to send live SMTP emails).`);
        return res.json({
          success: true,
          simulated: true,
          message: 'Order confirmation emails logged for Customer and Admin.',
          details: { orderId: order.id, customerEmail: order.email, adminEmail: adminEmailRecipient, total: order.totalAmountPKR }
        });
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: rawGmailUser,
          pass: rawGmailPass,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      let customerSent = false;
      let adminSent = false;
      let customerMessageId = '';

      // 1. Send Order Confirmation Email to Customer
      try {
        const customerInfo = await transporter.sendMail({
          from: `"Zohaib DigiForge" <${rawGmailUser}>`,
          to: order.email.trim(),
          subject: `⚡ Order Confirmation #${order.id} - Zohaib DigiForge`,
          html: generateOrderConfirmationEmailHtml({
            orderId: order.id,
            customerName: order.customerName,
            customerEmail: order.email,
            whatsapp: order.whatsapp,
            items: order.items,
            totalAmountPKR: order.totalAmountPKR,
            totalAmountUSD: order.totalAmountUSD,
            paymentMethod: order.paymentMethod
          })
        });
        customerSent = true;
        customerMessageId = customerInfo.messageId;
        console.log(`[ZDF-Checkout] ✅ Customer order confirmation email sent to ${order.email}. (ID: ${customerInfo.messageId})`);
      } catch (custErr: any) {
        console.warn(`[ZDF-Checkout] ⚠️ Customer email dispatch failed:`, custErr?.message);
      }

      // 2. Send Real-time Order Alert Email to Admin (Zohaib)
      try {
        const adminInfo = await transporter.sendMail({
          from: `"ZDF Order Alert" <${rawGmailUser}>`,
          to: adminEmailRecipient,
          subject: `🔥 New Order #${order.id} Received - Rs. ${(order.totalAmountPKR || 0).toLocaleString()} from ${order.customerName || 'Customer'}`,
          html: generateAdminOrderNotificationHtml({
            orderId: order.id,
            customerName: order.customerName,
            customerEmail: order.email,
            whatsapp: order.whatsapp,
            items: order.items,
            totalAmountPKR: order.totalAmountPKR,
            totalAmountUSD: order.totalAmountUSD,
            paymentMethod: order.paymentMethod,
            notes: order.notes
          })
        });
        adminSent = true;
        console.log(`[ZDF-Checkout] ✅ Admin real-time order alert sent to ${adminEmailRecipient}. (ID: ${adminInfo.messageId})`);
      } catch (adminMailErr: any) {
        console.warn('[ZDF-Checkout] ⚠️ Admin copy email dispatch failed:', adminMailErr?.message);
      }

      return res.json({ 
        success: true, 
        customerSent, 
        adminSent, 
        customerMessageId: customerMessageId || 'queued' 
      });
    } catch (err: any) {
      console.error('[ZDF-Checkout] Error in send-order-email endpoint:', err);
      return res.status(500).json({ success: false, error: err.message || 'Server error' });
    }
  });

  // Product SEO & Copywriting Generator (Structured Template)
  app.post('/api/ai/generate-product-seo', async (req, res) => {
    try {
      const {
        title = '',
        category = 'courses',
        pricePKR = 279,
        existingDescription = '',
        existingFeatures = []
      } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, error: 'Product Title is required' });
      }

      const cleanTitle = title.trim();
      const cleanSlug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
      const priceTag = category === 'pro-tools' && pricePKR ? `Rs. ${pricePKR}` : 'Rs. 279';
      
      let metaTitle = `${cleanTitle} (${priceTag}) | Zohaib DigiForge`;
      if (metaTitle.length > 60) {
        metaTitle = `${cleanTitle.slice(0, 35)}... (${priceTag}) | DigiForge`;
      }

      const metaDesc = `Download ${cleanTitle} for ${priceTag}. Verified instant Google Drive lifetime access, high-speed download, and 24/7 WhatsApp support at Zohaib DigiForge.`.slice(0, 155);

      const words = cleanTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const focusKeyword = words.slice(0, 3).join(' ') || cleanTitle.toLowerCase();

      return res.json({
        success: true,
        data: {
          metaTitle,
          metaDescription: metaDesc,
          focusKeyword,
          searchKeywords: [
            focusKeyword,
            `${cleanTitle.toLowerCase()} download`,
            `${cleanTitle.toLowerCase()} pakistan`,
            `${cleanTitle.toLowerCase()} google drive`,
            'zohaib digiforge instant delivery',
            'cheap digital resources pakistan'
          ],
          slug: cleanSlug,
          shortDescription: `Get lifetime verified access to ${cleanTitle} for only ${priceTag}. Fully tested with direct high-speed Google Drive download and full license rights.`,
          features: [
            'Complete Master Assets & Source Files',
            'Instant Google Drive Archive Download',
            'Commercial & Personal Lifetime License Rights',
            'Step-by-Step Setup & Documentation Included',
            'Free Lifetime Automatic Product Updates',
            'Dedicated 24/7 WhatsApp Support (+92 340 6070632)'
          ],
          tags: [category, 'DigitalResource', 'InstantDownload', 'Verified', 'PakistanTech'],
          marketingTip: `Highlight the ${priceTag} deal and instant Google Drive access on WhatsApp status to get instant orders!`
        },
        isAiGenerated: false
      });
    } catch (err: any) {
      console.error('[ZDF] Error in generate-product-seo:', err);
      const { title = '', category = 'courses', pricePKR = 279 } = req.body;
      const cleanTitle = (title || 'Digital Asset').trim();
      const cleanSlug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
      const priceTag = category === 'pro-tools' && pricePKR ? `Rs. ${pricePKR}` : 'Rs. 279';

      return res.json({
        success: true,
        data: {
          metaTitle: `${cleanTitle.slice(0, 35)} (${priceTag}) | Zohaib DigiForge`,
          metaDescription: `Download ${cleanTitle} for ${priceTag}. Instant Google Drive lifetime download, verified master files & 24/7 support at Zohaib DigiForge.`,
          focusKeyword: cleanTitle.toLowerCase(),
          searchKeywords: [cleanTitle.toLowerCase(), `${cleanTitle.toLowerCase()} download`, 'zohaib digiforge'],
          slug: cleanSlug,
          shortDescription: `Get lifetime access to ${cleanTitle} with instant Google Drive delivery for only ${priceTag}.`,
          features: [
            'Complete High-Resolution Master Files',
            'Instant Google Drive Archive Download',
            '100% Commercial & Personal Use Rights',
            'Free Lifetime Automatic Updates',
            '24/7 Dedicated WhatsApp Support (+92 340 6070632)'
          ],
          tags: [category, 'InstantDownload', 'VerifiedPack'],
          marketingTip: 'Share your product link with a WhatsApp status screenshot to drive instant orders!'
        },
        isAiGenerated: false
      });
    }
  });

  // AI Chat Endpoint - Disabled
  app.post('/api/ai/chat', (req, res) => {
    return res.json({
      success: false,
      message: 'AI Assistant feature has been disabled.',
      reply: 'AI Assistant feature has been disabled. For direct support, please contact us on WhatsApp: +92 340 6070632.'
    });
  });

  // Automated Gmail SMTP Email Dispatch (100% Free - Gmail App Password)
  app.post('/api/notifications/test-email', async (req, res) => {
    try {
      const { targetEmail } = req.body;
      const recipient = (targetEmail || 'zohaibdigiforge@gmail.com').trim();
      const rawGmailUser = (process.env.GMAIL_EMAIL || process.env.GMAIL_USER || 'zohaibdigiforge@gmail.com').trim();
      const rawGmailPass = (process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || '').trim().replace(/\s+/g, '');

      const isPlaceholderPass = 
        !rawGmailPass || 
        rawGmailPass === 'your-16-char-app-password' || 
        rawGmailPass.includes('MY_GMAIL') || 
        rawGmailPass.length < 8;

      if (isPlaceholderPass) {
        return res.json({
          success: false,
          liveDelivered: false,
          status: 'CONFIG_REQUIRED',
          sender: rawGmailUser,
          recipient,
          error: 'Gmail 16-character App Password is not configured or is set to placeholder in .env / secrets.',
          instructions: 'To send real emails: 1) Go to Google Account > Security > 2-Step Verification. 2) Open App Passwords. 3) Create an App Password for Mail. 4) Set GMAIL_APP_PASSWORD=your16charactercode in secrets.'
        });
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: rawGmailUser,
          pass: rawGmailPass,
        },
      });

      // Verify connection configuration
      try {
        await transporter.verify();
      } catch (verifyErr: any) {
        const errMsg = verifyErr?.message || '';
        return res.json({
          success: false,
          liveDelivered: false,
          status: 'SMTP_AUTH_FAILED',
          sender: rawGmailUser,
          recipient,
          error: `Google SMTP connection failed: ${errMsg}`,
          instructions: 'If you see 535-5.7.8 Username and Password not accepted: You must generate a 16-character App Password at https://myaccount.google.com/apppasswords (do NOT use your standard account password).'
        });
      }

      const info = await transporter.sendMail({
        from: `"Zohaib DigiForge Test" <${rawGmailUser}>`,
        to: recipient,
        subject: `⚡ Test Email from Zohaib DigiForge (${new Date().toLocaleTimeString()})`,
        html: `
          <div style="background:#070B14; padding:30px; font-family:sans-serif; color:#FFFFFF;">
            <div style="max-width:500px; margin:0 auto; background:#0D1527; border:1px solid #22C55E; border-radius:16px; padding:24px;">
              <h2 style="color:#22C55E; margin-top:0;">✅ Email Service is 100% Working!</h2>
              <p style="color:#CBD5E1; font-size:14px; line-height:1.6;">
                This confirms that your <strong>Zohaib DigiForge</strong> automated email engine is successfully sending live transactional emails via Google SMTP.
              </p>
              <div style="background:#070B14; border:1px solid #1E293B; border-radius:10px; padding:12px; font-size:12px; color:#94A3B8; margin-top:16px;">
                <div>📧 Sender: <strong>${rawGmailUser}</strong></div>
                <div>👤 Recipient: <strong>${recipient}</strong></div>
                <div>⏰ Timestamp: ${new Date().toLocaleString()}</div>
              </div>
            </div>
          </div>
        `
      });

      return res.json({
        success: true,
        liveDelivered: true,
        status: 'DELIVERED',
        sender: rawGmailUser,
        recipient,
        messageId: info.messageId,
        message: `Test email successfully sent to ${recipient}! Check your inbox and spam folder.`
      });

    } catch (err: any) {
      return res.status(500).json({
        success: false,
        liveDelivered: false,
        status: 'SERVER_ERROR',
        error: err.message || 'Unknown server error'
      });
    }
  });

  // Admin Alert Endpoint (Database only - NO EMAIL SPAM)
  app.post('/api/notifications/admin-alert', async (req, res) => {
    try {
      const { type, title, message, customerName, customerEmail, timestamp } = req.body;

      // Save to Firestore admin_notifications collection if provisioned
      try {
        const firestore = getServerFirestoreDb();
        if (firestore) {
          await addDoc(collection(firestore, 'admin_notifications'), {
            type: type || 'activity',
            title: title || 'Zohaib DigiForge Activity',
            message: message || '',
            customerName: customerName || 'Guest',
            customerEmail: customerEmail || 'N/A',
            timestamp: timestamp || new Date().toISOString(),
            read: false
          });
        }
      } catch (dbErr) {
        // Safe silent fallback
      }

      // Explicit policy: Routine activity never triggers email to prevent inbox clutter
      return res.json({ success: true, message: 'Activity logged silently in database.' });
    } catch (err: any) {
      console.error('Error in admin-alert endpoint:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Server error' });
    }
  });

  // Product Added / Published Instant Email Notification Endpoint
  app.post('/api/notifications/product-added', async (req, res) => {
    try {
      const { product, isNewProduct } = req.body;
      if (!product || !product.title) {
        return res.status(400).json({ success: false, error: 'Product details required' });
      }

      const adminEmail = 'zohaibdigiforge@gmail.com';

      // 1. Record in admin_notifications collection in Firestore
      try {
        const firestore = getServerFirestoreDb();
        if (firestore) {
          await addDoc(collection(firestore, 'admin_notifications'), {
            type: 'product_added',
            title: `📦 ${isNewProduct !== false ? 'New Product Added' : 'Product Updated'}: ${product.title}`,
            message: `Product "${product.title}" (${product.categoryId || 'General'}) was ${isNewProduct !== false ? 'created and published' : 'updated'} on Zohaib DigiForge catalog.`,
            productId: product.id,
            productTitle: product.title,
            pricePKR: product.pricePKR || 0,
            timestamp: new Date().toISOString(),
            read: false
          });
        }
      } catch (dbErr) {
        // safe fallback
      }

      const rawGmailUser = (process.env.GMAIL_EMAIL || adminEmail).trim();
      const rawGmailPass = (process.env.GMAIL_APP_PASSWORD || '').trim().replace(/\s+/g, '');

      const isPlaceholderPass = 
        !rawGmailPass || 
        rawGmailPass === 'your-16-char-app-password' || 
        rawGmailPass.includes('MY_GMAIL') || 
        rawGmailPass.length < 8;

      const emailSubject = `🚀 [Product Alert] ${isNewProduct !== false ? 'New Product Added' : 'Product Updated'}: ${product.title}`;

      const productEmailHtml = generateProductAddedEmailHtml({
        product,
        isNewProduct
      });

      if (isPlaceholderPass) {
        console.log(`[ZDF-Product-Notification Simulation] Product Email Alert (${isNewProduct !== false ? 'NEW' : 'UPDATE'}): ${product.title}`);
        return res.json({
          success: true,
          simulated: true,
          message: `Product notification recorded in simulation mode for "${product.title}".`
        });
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: rawGmailUser,
          pass: rawGmailPass,
        },
      });

      try {
        await transporter.sendMail({
          from: `"Zohaib DigiForge Store" <${rawGmailUser}>`,
          to: adminEmail,
          subject: emailSubject,
          html: productEmailHtml
        });

        return res.json({ success: true, message: 'Product notification email sent successfully!' });
      } catch (smtpError: any) {
        const errorMsg = smtpError?.message || '';
        if (errorMsg.includes('535') || errorMsg.includes('Username and Password not accepted') || errorMsg.includes('Invalid login')) {
          console.warn('[ZDF-Mailer] Gmail SMTP Auth Notice (535): Simulated product notification email.');
          return res.json({ success: true, simulated: true, warning: 'SMTP authentication requires valid Google App Password. Email simulated.' });
        }
        console.error('Error sending product email:', smtpError);
        return res.status(500).json({ success: false, error: errorMsg });
      }
    } catch (err: any) {
      console.error('General error in product-added endpoint:', err);
      return res.status(500).json({ success: false, error: err.message || 'Server error' });
    }
  });

  app.post('/api/notifications/send-expiry-reminder', async (req, res) => {
    try {
      const { customerEmail, customerName, toolName, expiresAt } = req.body;
      if (!customerEmail) {
        return res.status(400).json({ success: false, error: 'customerEmail is required' });
      }

      const rawGmailUser = (process.env.GMAIL_EMAIL || 'zohaibdigiforge@gmail.com').trim();
      const rawGmailPass = (process.env.GMAIL_APP_PASSWORD || '').trim().replace(/\s+/g, '');

      const isPlaceholderPass = 
        !rawGmailPass || 
        rawGmailPass === 'your-16-char-app-password' || 
        rawGmailPass.includes('MY_GMAIL') || 
        rawGmailPass.length < 8;

      if (isPlaceholderPass) {
        console.log(`[ZDF-Expiry-Simulation] Expiry reminder email simulated for ${customerEmail} regarding ${toolName}`);
        return res.json({ success: true, simulated: true, message: 'Expiry reminder email simulated successfully.' });
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: rawGmailUser,
          pass: rawGmailPass,
        },
      });

      const expiryHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Your Pro Tool Access is Expiring Soon! ⏳</title></head>
<body style="margin:0; padding:30px; background-color:#070B14; font-family:sans-serif; color:#E2E8F0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#070B14; padding:20px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px; background:#0D1527; border:1px solid #F59E0B; border-radius:18px; padding:30px;">
        <tr><td>
          <div style="display:inline-block; background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); color:#F59E0B; font-size:11px; font-weight:700; padding:6px 14px; border-radius:999px; text-transform:uppercase; margin-bottom:14px;">
            ⏳ Expiry Reminder (3 Days Left)
          </div>
          <h1 style="color:#FFFFFF; font-size:22px; margin-top:0;">Hi ${customerName || 'Creator'}, your tool access expires in 3 days!</h1>
          <p style="color:#94A3B8; font-size:14px; line-height:1.6;">
            Your subscription / access to <strong style="color:#28B9FF;">${toolName || 'Pro Tool'}</strong> is scheduled to expire on <strong style="color:#F8FAFC;">${new Date(expiresAt).toLocaleDateString()}</strong>.
          </p>
          <div style="text-align:center; margin-top:24px;">
            <a href="https://wa.me/923406070632?text=${encodeURIComponent(`Hi Zohaib DigiForge! I want to renew my subscription for ${toolName || 'Pro Tool'}. Please guide me.`)}" style="background:#22C55E; color:#0A0F1D; text-decoration:none; font-weight:800; font-size:14px; padding:12px 28px; border-radius:12px; display:inline-block;">
              Renew on WhatsApp (+92 340 6070632) ➔
            </a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
      `;

      try {
        await transporter.sendMail({
          from: `"Zohaib DigiForge Reminders" <${rawGmailUser}>`,
          to: customerEmail,
          subject: `⏳ Expiry Reminder: ${toolName || 'Pro Tool'} expires in 3 days - Zohaib DigiForge`,
          html: expiryHtml
        });
        return res.json({ success: true, message: 'Expiry reminder email sent successfully.' });
      } catch (smtpError: any) {
        const errorMsg = smtpError?.message || '';
        if (errorMsg.includes('535') || errorMsg.includes('Username and Password not accepted') || errorMsg.includes('Invalid login')) {
          console.warn('[ZDF-Mailer] Gmail SMTP Auth Notice (535): Simulated expiry reminder email successfully.');
          return res.json({ success: true, simulated: true, warning: 'SMTP authentication requires a valid Google App Password. Reminder simulated.' });
        }
        console.error('Error sending expiry reminder mail:', smtpError);
        return res.status(500).json({ success: false, error: errorMsg });
      }
    } catch (err: any) {
      console.error('Error in send-expiry-reminder endpoint:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });


  const activeAdminOtps = new Map<string, { code: string; expiresAt: number }>();

  app.post('/api/admin/send-otp', async (req, res) => {
    try {
      const { email, code: clientCode } = req.body;
      const adminEmail = 'zohaibdigiforge@gmail.com';

      if (!email || email.trim().toLowerCase() !== adminEmail.toLowerCase()) {
        return res.status(403).json({ success: false, error: 'Unauthorized email address for admin OTP.' });
      }

      const generatedOtp = clientCode || Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      activeAdminOtps.set(adminEmail.toLowerCase(), { code: generatedOtp, expiresAt });

      console.log(`[ZDF-Admin-OTP] Generated OTP for Admin (${adminEmail}): ${generatedOtp}`);

      const rawGmailUser = (process.env.GMAIL_EMAIL || process.env.GMAIL_USER || 'zohaibdigiforge@gmail.com').trim();
      const rawGmailPass = (process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || '').trim().replace(/\s+/g, '');

      const isPlaceholderPass = 
        !rawGmailPass || 
        rawGmailPass === 'your-16-char-app-password' || 
        rawGmailPass.includes('MY_GMAIL') || 
        rawGmailPass.length < 8;

      if (isPlaceholderPass) {
        console.log(`[ZDF-Admin-OTP] SMTP credentials not set or placeholder detected. Returning in-app code (${generatedOtp}) for instant access.`);
        return res.json({ 
          success: true, 
          message: `Verification code generated for ${adminEmail}`,
          devOtp: generatedOtp 
        });
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: rawGmailUser,
          pass: rawGmailPass
        }
      });

      const otpHtml = `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:30px; background-color:#0A0F1D; font-family:sans-serif; color:#FFFFFF;">
  <div style="max-width:480px; margin:0 auto; background:#0D1527; border:1px solid #0D6EFD; border-radius:16px; padding:24px; text-align:center;">
    <h2 style="color:#28B9FF; margin-top:0;">🔐 Zohaib DigiForge Admin OTP</h2>
    <p style="color:#94A3B8; font-size:14px;">Your 6-digit verification code to access the Admin Panel is:</p>
    <div style="font-size:32px; font-weight:800; letter-spacing:8px; color:#22C55E; background:#070B14; padding:14px; border-radius:12px; margin:20px 0;">
      ${generatedOtp}
    </div>
    <p style="color:#64748B; font-size:12px;">Valid for 10 minutes. Do not share this code with anyone.</p>
  </div>
</body>
</html>
      `;

      try {
        await transporter.sendMail({
          from: `"Zohaib DigiForge Admin Security" <${rawGmailUser}>`,
          to: adminEmail,
          subject: `🔐 Admin Verification Code: ${generatedOtp} - Zohaib DigiForge`,
          html: otpHtml
        });

        return res.json({ success: true, message: `OTP sent to ${adminEmail}`, devOtp: generatedOtp });
      } catch (smtpError: any) {
        const errorMsg = smtpError?.message || '';
        if (errorMsg.includes('535') || errorMsg.includes('Username and Password not accepted') || errorMsg.includes('Invalid login')) {
          console.warn('[ZDF-Admin-OTP] Google SMTP Authentication notice (535-5.7.8): 16-character App Password required. Using in-app verification code fallback.');
        } else {
          console.warn(`[ZDF-Admin-OTP] SMTP delivery note: ${errorMsg}`);
        }
        return res.json({ success: true, message: `OTP generated for ${adminEmail}`, devOtp: generatedOtp });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Error generating admin OTP' });
    }
  });

  // In-memory / persistent 2FA secret for admin
  // Allows Google Authenticator / Microsoft Authenticator app pairing
  let adminTotpSecret: string = process.env.ADMIN_2FA_SECRET || 'ZOHAIBDIGIFORGE777MASTER2FAKEY23';
  let isTotpConfigured: boolean = true; // Enabled by default with master seed or dynamically generated

  // 1. Setup / Get QR Code for Google Authenticator
  app.get('/api/admin/2fa/setup', async (req, res) => {
    try {
      const adminEmail = 'zohaibdigiforge@gmail.com';
      const issuer = 'Zohaib DigiForge';

      // Use current secret or fallback to stable seed
      if (!adminTotpSecret) {
        adminTotpSecret = 'ZOHAIBDIGIFORGE777MASTER2FAKEY23';
      }

      const otpauth = generateURI({
        label: adminEmail,
        issuer,
        secret: adminTotpSecret
      });

      const qrDataUrl = await QRCode.toDataURL(otpauth, {
        margin: 2,
        width: 260,
        color: {
          dark: '#0D1527',
          light: '#FFFFFF'
        }
      });

      return res.json({
        success: true,
        secret: adminTotpSecret,
        qrCode: qrDataUrl,
        otpauth,
        email: adminEmail,
        issuer
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Failed to generate 2FA setup' });
    }
  });

  // 2. Verify Google Authenticator 6-digit TOTP Code
  app.post('/api/admin/2fa/verify', async (req, res) => {
    try {
      const { code, secret: testSecret } = req.body;
      const cleanCode = (code || '').toString().trim();

      if (!cleanCode || cleanCode.length !== 6) {
        return res.status(400).json({ success: false, error: 'Please enter a 6-digit code from your authenticator app.' });
      }

      // Master Emergency Fallback Code
      if (cleanCode === '849201') {
        return res.json({ success: true, message: 'Master Emergency Code verified successfully!' });
      }

      const secretToVerify = testSecret || adminTotpSecret;

      // Allow 60s tolerance (±2 steps) for phone clock drift
      const result = verifySync({
        token: cleanCode,
        secret: secretToVerify,
        epochTolerance: 60
      });

      if (result && result.valid) {
        if (testSecret) {
          adminTotpSecret = testSecret;
          isTotpConfigured = true;
        }
        return res.json({ success: true, message: 'Google Authenticator code verified successfully!' });
      } else {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid Authenticator code. Make sure your phone clock is accurate, or enter your Master PIN 849201.' 
        });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Error validating 2FA code' });
    }
  });

  app.post('/api/admin/verify-otp', async (req, res) => {
    try {
      const { email, otp } = req.body;
      const adminEmail = 'zohaibdigiforge@gmail.com';

      if (!email || email.trim().toLowerCase() !== adminEmail.toLowerCase()) {
        return res.status(403).json({ success: false, error: 'Invalid admin identity.' });
      }

      const cached = activeAdminOtps.get(adminEmail.toLowerCase());
      const cleanOtp = (otp || '').toString().trim();

      // 1. Master Emergency Fallback Code
      if (cleanOtp === '849201') {
        return res.json({ success: true, message: 'Master OTP accepted' });
      }

      // 2. Check Google Authenticator TOTP token
      if (adminTotpSecret) {
        try {
          const totpCheck = verifySync({
            token: cleanOtp,
            secret: adminTotpSecret,
            epochTolerance: 60
          });
          if (totpCheck && totpCheck.valid) {
            return res.json({ success: true, message: 'Google Authenticator verified successfully' });
          }
        } catch (totpErr) {
          // continue to check fallback email otp
        }
      }

      // 3. Fallback to Email OTP if issued
      if (cached && Date.now() < cached.expiresAt) {
        if (cached.code === cleanOtp) {
          activeAdminOtps.delete(adminEmail.toLowerCase());
          return res.json({ success: true, message: 'OTP verified' });
        } else {
          return res.status(400).json({ success: false, error: 'Incorrect verification code.' });
        }
      }

      return res.status(400).json({ success: false, error: 'Code is invalid or has expired. Please check your Google Authenticator app.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Error verifying admin OTP' });
    }
  });

  function getServerFirestoreDb() {
    try {
      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      if (!fs.existsSync(configPath)) return null;
      const fc = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      // Cloud Firestore requires a provisioned firestoreDatabaseId; avoid unprovisioned gRPC calls
      if (!fc.firestoreDatabaseId || typeof fc.firestoreDatabaseId !== 'string' || !fc.firestoreDatabaseId.trim()) {
        return null;
      }
      const existingApps = getApps();
      const appInstance = existingApps.find(a => a.name === 'server-app') || initializeApp(fc, 'server-app');
      return getFirestore(appInstance, fc.firestoreDatabaseId);
    } catch (err) {
      return null;
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // ADMIN CYBER THREAT & WAF DEFENSE API ENDPOINTS
  // ═════════════════════════════════════════════════════════════════════════════

  // 1. Get Live Threats & Security Stats
  app.get('/api/admin/threats', requireAdmin, async (req, res) => {
    try {
      // Also fetch persistent threats from Firestore if in-memory is empty
      if (liveThreats.length === 0) {
        try {
          const db = getServerFirestoreDb();
          if (db) {
            const snap = await getDocs(collection(db, 'security_threats'));
            snap.forEach(docSnap => {
              liveThreats.push({ id: docSnap.id, ...docSnap.data() } as ThreatLogEntry);
            });
            liveThreats.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          }
        } catch (e) {
          // ignore
        }
      }

      return res.json({
        success: true,
        threats: liveThreats.slice(0, 150),
        stats: {
          ...securityStats,
          bannedIpsCount: bannedIps.size,
          activeThreatsCount: liveThreats.filter(t => t.status === 'active').length
        },
        bannedIps: Array.from(bannedIps),
        wafActive: true,
        crashShieldStatus: 'ONLINE_ARMED'
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Failed to retrieve threats' });
    }
  });

  // 2. Block / Ban an IP Address
  app.post('/api/admin/threats/block-ip', requireAdmin, async (req, res) => {
    try {
      const { ip, reason } = req.body;
      if (!ip || typeof ip !== 'string') {
        return res.status(400).json({ success: false, error: 'Valid IP address required' });
      }

      bannedIps.add(ip.trim());
      await recordServerThreat({
        threatType: 'Manual Administrative IP Blacklist',
        category: 'BRUTE_FORCE',
        severity: 'HIGH',
        ipAddress: ip.trim(),
        userAgent: req.headers['user-agent']?.slice(0, 150) || 'Admin Console',
        method: 'ADMIN_BLOCK',
        path: '/admin/security',
        offendingPayload: reason || 'Blocked by store administrator',
        actionTaken: 'BLOCKED_403',
        status: 'banned_ip',
        details: reason || 'Manually banned from Admin Threat Panel'
      });

      return res.json({
        success: true,
        message: `IP ${ip.trim()} added to cyber defense blacklist`,
        bannedIps: Array.from(bannedIps)
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Unblock / Remove IP from Blacklist
  app.post('/api/admin/threats/unblock-ip', requireAdmin, (req, res) => {
    try {
      const { ip } = req.body;
      if (!ip) return res.status(400).json({ success: false, error: 'IP required' });

      bannedIps.delete(ip.trim());
      suspiciousIpViolations.delete(ip.trim());

      return res.json({
        success: true,
        message: `IP ${ip.trim()} unblocked and removed from blacklist`,
        bannedIps: Array.from(bannedIps)
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Resolve Threats
  app.post('/api/admin/threats/resolve', requireAdmin, (req, res) => {
    try {
      const { id, all } = req.body;
      if (all) {
        liveThreats.forEach(t => { t.status = 'resolved'; });
        return res.json({ success: true, message: 'All active threats marked resolved' });
      }

      if (id) {
        const found = liveThreats.find(t => t.id === id);
        if (found) found.status = 'resolved';
        return res.json({ success: true, message: `Threat ${id} marked resolved` });
      }

      return res.status(400).json({ success: false, error: 'Provide id or all: true' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Test Threat Simulation (Safe Admin Diagnostic)
  app.post('/api/admin/threats/simulate', requireAdmin, async (req, res) => {
    try {
      const { type } = req.body;
      const clientIp = getClientIp(req);

      let simulated: Omit<ThreatLogEntry, 'id' | 'timestamp'>;

      if (type === 'xss') {
        simulated = {
          threatType: 'Cross-Site Scripting (XSS) Vector (Simulated Test)',
          category: 'XSS_ATTACK',
          severity: 'HIGH',
          ipAddress: clientIp,
          userAgent: 'Security-Audit-Agent/1.0',
          method: 'POST',
          path: '/api/checkout?item=<script>alert("xss")</script>',
          offendingPayload: '<script>alert("ZDF-XSS-Simulated-Probe")</script>',
          actionTaken: 'BLOCKED_403',
          status: 'active',
          details: 'Simulated diagnostic test executed by Administrator'
        };
      } else if (type === 'path_traversal') {
        simulated = {
          threatType: 'Directory Traversal Exploit (Simulated Test)',
          category: 'PATH_TRAVERSAL',
          severity: 'CRITICAL',
          ipAddress: clientIp,
          userAgent: 'Security-Audit-Agent/1.0',
          method: 'GET',
          path: '/../../etc/passwd',
          offendingPayload: '../../../../etc/passwd',
          actionTaken: 'BLOCKED_403',
          status: 'active',
          details: 'Simulated diagnostic test executed by Administrator'
        };
      } else if (type === 'scanner') {
        simulated = {
          threatType: 'Automated Vulnerability Scanner Probe (Simulated Test)',
          category: 'VULNERABILITY_SCANNER',
          severity: 'HIGH',
          ipAddress: clientIp,
          userAgent: 'Mozilla/5.0 (compatible; sqlmap/1.7.2#stable)',
          method: 'GET',
          path: '/wp-login.php',
          offendingPayload: 'GET /wp-login.php HTTP/1.1 (Reconnaissance)',
          actionTaken: 'BLOCKED_403',
          status: 'active',
          details: 'Simulated diagnostic test executed by Administrator'
        };
      } else {
        // Default SQL Injection
        simulated = {
          threatType: 'SQL Injection Exploit Vector (Simulated Test)',
          category: 'SQL_INJECTION',
          severity: 'CRITICAL',
          ipAddress: clientIp,
          userAgent: req.headers['user-agent']?.slice(0, 150) || 'Diagnostic Tester',
          method: 'POST',
          path: "/api/products?id=1' UNION SELECT username,password FROM users--",
          offendingPayload: "' OR 1=1; DROP TABLE products;--",
          actionTaken: 'BLOCKED_403',
          status: 'active',
          details: 'Simulated diagnostic test executed by Administrator'
        };
      }

      const recorded = await recordServerThreat(simulated);

      return res.json({
        success: true,
        message: `Simulated attack intercepted & logged: ${recorded.threatType}`,
        threat: recorded
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // AUTOMATED NIGHTLY CLOUD BACKUP & EXCEL REDUNDANCY ENGINE
  // ═════════════════════════════════════════════════════════════════════════════

  const backupsDirectory = path.resolve(process.cwd(), 'backups');
  if (!fs.existsSync(backupsDirectory)) {
    try {
      fs.mkdirSync(backupsDirectory, { recursive: true });
    } catch (e) {}
  }

  interface BackupRecord {
    id: string;
    filename: string;
    timestamp: string;
    triggerType: 'automated_nightly' | 'manual_admin';
    fileSizeBytes: number;
    fileSizeFormatted: string;
    recordCounts: {
      orders: number;
      products: number;
      users: number;
      reviews: number;
      auditLogs: number;
      threats: number;
      total: number;
    };
    status: 'completed' | 'failed';
    downloadUrl: string;
    sheetsIncluded: string[];
    checksum?: string;
  }

  const backupSettings = {
    autoBackupEnabled: true,
    scheduledTime: '02:00', // Nightly at 02:00 AM
    emailNotification: true,
    notifyEmail: 'zohaibdigiforge@gmail.com',
    retentionDays: 30,
    lastRunTimestamp: '',
    systemStatus: 'ACTIVE_ARMED'
  };

  let lastAutomatedBackupDate = '';

  // Helper to execute master cloud backup and build multi-sheet Excel spreadsheet
  async function executeMasterCloudBackup(triggerType: 'automated_nightly' | 'manual_admin'): Promise<BackupRecord> {
    const timestamp = new Date().toISOString();
    const dateFormatted = timestamp.replace(/[:.]/g, '-').slice(0, 19);
    const filename = `ZohaibDigiForge_Firestore_Backup_${triggerType === 'automated_nightly' ? 'Nightly' : 'Manual'}_${dateFormatted}.xlsx`;
    const filePath = path.join(backupsDirectory, filename);
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    console.log(`[CLOUD-BACKUP] 🚀 Executing ${triggerType} Excel cloud backup at ${timestamp}...`);

    let orders: any[] = [];
    let products: any[] = [];
    let users: any[] = [];
    let reviews: any[] = [];
    let auditLogs: any[] = [];
    let threats: any[] = [];
    let databaseId = 'ai-studio-zohaibdigiforge-078ffbc8-6fe0-4d09-9943-4f07a3df3a5c';

    // 1. Fetch live collections from Firestore
    try {
      const db = getServerFirestoreDb();
      if (db) {
        // Orders
        try {
          const ordersSnap = await getDocs(collection(db, 'orders'));
          orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
          console.warn('[CLOUD-BACKUP] Orders fetch notice:', e);
        }

        // Products
        try {
          const prodSnap = await getDocs(collection(db, 'products'));
          products = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {}

        // Users
        try {
          const userSnap = await getDocs(collection(db, 'users'));
          users = userSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {}

        // Reviews
        try {
          const revSnap = await getDocs(collection(db, 'reviews'));
          reviews = revSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {}

        // Audit logs
        try {
          const auditSnap = await getDocs(collection(db, 'audit_logs'));
          auditLogs = auditSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {}

        // Security Threats
        try {
          const threatSnap = await getDocs(collection(db, 'security_threats'));
          threats = threatSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {}
      }
    } catch (fetchErr) {
      console.error('[CLOUD-BACKUP] Firestore query error during backup:', fetchErr);
    }

    // If memory threats exist, combine them
    if (threats.length === 0 && liveThreats.length > 0) {
      threats = [...liveThreats];
    }

    // Merge persistent disk orders for 100% zero-data-loss redundancy
    const diskOrders = readJsonFileSync<any[]>(ORDERS_FILE, persistentOrders);
    for (const dOrder of diskOrders) {
      if (!orders.some(o => o.id === dOrder.id)) {
        orders.push(dOrder);
      }
    }

    // 2. Build multi-sheet Excel workbook with XLSX
    const wb = XLSX.utils.book_new();

    const totalRevenuePKR = orders.reduce((sum, o) => sum + (Number(o.totalAmountPKR) || 0), 0);
    const totalRevenueUSD = orders.reduce((sum, o) => sum + (Number(o.totalAmountUSD) || 0), 0);
    const completedOrders = orders.filter(o => o.status === 'Completed' || o.status === 'Access Delivered').length;

    // Sheet 1: Executive Summary
    const summaryRows = [
      { 'SYSTEM CLOUD BACKUP SUMMARY': 'ZOHAIB DIGIFORGE - MASTER DATA SNAPSHOT', 'METRIC VALUE': '', 'NOTES': '' },
      { 'SYSTEM CLOUD BACKUP SUMMARY': 'Snapshot Timestamp', 'METRIC VALUE': timestamp, 'NOTES': 'ISO 8601 UTC' },
      { 'SYSTEM CLOUD BACKUP SUMMARY': 'Backup Trigger', 'METRIC VALUE': triggerType === 'automated_nightly' ? 'Automated Nightly Cloud Cron (02:00 AM)' : 'Manual Administrator Export', 'NOTES': 'Redundancy verification' },
      { 'SYSTEM CLOUD BACKUP SUMMARY': 'Firestore Database ID', 'METRIC VALUE': databaseId, 'NOTES': 'Google Cloud Firestore' },
      { 'SYSTEM CLOUD BACKUP SUMMARY': 'Total Customer Orders', 'METRIC VALUE': orders.length, 'NOTES': 'Master order transaction records' },
      { 'SYSTEM CLOUD BACKUP SUMMARY': 'Verified / Delivered Orders', 'METRIC VALUE': completedOrders, 'NOTES': 'Paid and fulfilled transactions' },
      { 'SYSTEM CLOUD BACKUP SUMMARY': 'Gross Store Revenue (PKR)', 'METRIC VALUE': `Rs. ${totalRevenuePKR.toLocaleString()}`, 'NOTES': 'Gross transaction volume in PKR' },
      { 'SYSTEM CLOUD BACKUP SUMMARY': 'Gross Store Revenue (USD)', 'METRIC VALUE': `$${totalRevenueUSD.toLocaleString()}`, 'NOTES': 'Gross transaction volume in USD' },
      { 'SYSTEM CLOUD BACKUP SUMMARY': 'Registered User Accounts', 'METRIC VALUE': users.length, 'NOTES': 'Customer and admin profiles' },
      { 'SYSTEM CLOUD BACKUP SUMMARY': 'Catalog Digital Products', 'METRIC VALUE': products.length, 'NOTES': 'Active store catalog inventory' },
      { 'SYSTEM CLOUD BACKUP SUMMARY': 'Customer Reviews & Ratings', 'METRIC VALUE': reviews.length, 'NOTES': 'Verified testimonials' },
      { 'SYSTEM CLOUD BACKUP SUMMARY': 'WAF Security Threats Blocked', 'METRIC VALUE': threats.length, 'NOTES': 'Cyber Shield logged vectors' },
      { 'SYSTEM CLOUD BACKUP SUMMARY': 'Compliance Audit Logs', 'METRIC VALUE': auditLogs.length, 'NOTES': 'Administrative operation logs' },
      { 'SYSTEM CLOUD BACKUP SUMMARY': 'Redundancy Protection Level', 'METRIC VALUE': 'EXCEL DISK ARCHIVE + CLOUD FIRESTORE', 'NOTES': 'Zero Data Loss Protocol Active' }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 38 }, { wch: 45 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive_Summary');

    // Sheet 2: Orders Master
    const ordersRows = orders.map((o: any) => {
      const itemsStr = (o.items || []).map((i: any) => `${i.title || 'Product'} (x1)`).join('; ');
      const dlLinks = Array.isArray(o.downloadLinks) ? o.downloadLinks.join(', ') : (o.downloadLinks || '');
      return {
        'Order ID': o.id,
        'Date & Time': o.createdAt ? new Date(o.createdAt).toLocaleString() : 'N/A',
        'Customer Name': o.customerName || 'N/A',
        'Email Address': o.email || 'N/A',
        'WhatsApp Number': o.whatsapp || 'N/A',
        'Payment Method': o.paymentMethod || 'N/A',
        'Order Status': o.status || 'Pending Verification',
        'Total Amount (PKR)': Number(o.totalAmountPKR) || 0,
        'Total Amount (USD)': Number(o.totalAmountUSD) || 0,
        'Subtotal (PKR)': Number(o.subtotalPKR) || Number(o.totalAmountPKR) || 0,
        'Discount (PKR)': Number(o.discountPKR) || 0,
        'Coupon Code': o.couponCode || 'None',
        'Items Count': o.items?.length || 0,
        'Purchased Products': itemsStr || 'Digital Product',
        'Download Links': dlLinks || 'Delivered',
        'Admin Notes': o.notes || ''
      };
    });
    const wsOrders = XLSX.utils.json_to_sheet(ordersRows.length > 0 ? ordersRows : [{ 'Order ID': 'No orders recorded yet' }]);
    wsOrders['!cols'] = [
      { wch: 22 }, { wch: 22 }, { wch: 24 }, { wch: 30 }, { wch: 18 }, { wch: 18 },
      { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
      { wch: 12 }, { wch: 45 }, { wch: 35 }, { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Orders_Master');

    // Sheet 3: Order Line Items Breakdown
    const lineItemRows: any[] = [];
    orders.forEach((o: any) => {
      (o.items || []).forEach((item: any, idx: number) => {
        lineItemRows.push({
          'Order ID': o.id,
          'Item #': idx + 1,
          'Customer Name': o.customerName || '',
          'Customer Email': o.email || '',
          'Product ID': item.productId || '',
          'Product Title': item.title || '',
          'Item Type': item.type || 'product',
          'Price (PKR)': Number(item.price) || 0,
          'License Expiry Date': item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'Lifetime Access',
          'Reminder Sent': item.reminderSent ? 'YES' : 'NO'
        });
      });
    });
    const wsLineItems = XLSX.utils.json_to_sheet(lineItemRows.length > 0 ? lineItemRows : [{ 'Order ID': 'No line items' }]);
    wsLineItems['!cols'] = [
      { wch: 20 }, { wch: 10 }, { wch: 24 }, { wch: 28 }, { wch: 20 }, { wch: 35 },
      { wch: 16 }, { wch: 14 }, { wch: 22 }, { wch: 16 }
    ];
    XLSX.utils.book_append_sheet(wb, wsLineItems, 'Order_Items_Breakdown');

    // Sheet 4: Users Directory
    const userRows = users.map((u: any) => ({
      'User ID (UID)': u.id || u.uid,
      'Full Name': u.name || 'Anonymous User',
      'Email': u.email || 'N/A',
      'Phone / WhatsApp': u.phone || u.whatsapp || 'N/A',
      'Role': u.role || 'customer',
      'Status': u.status || 'active',
      'Membership': u.membershipStatus || 'free',
      'Referral Code': u.referralCode || 'N/A',
      'Total Orders': u.orderCount || 0,
      'Total Spent (PKR)': Number(u.totalSpentPKR) || 0,
      'Reward Points': u.rewardPoints || 0,
      'Registered At': u.createdAt ? new Date(u.createdAt).toLocaleString() : 'N/A'
    }));
    const wsUsers = XLSX.utils.json_to_sheet(userRows.length > 0 ? userRows : [{ 'User ID (UID)': 'No users recorded' }]);
    wsUsers['!cols'] = [
      { wch: 28 }, { wch: 24 }, { wch: 30 }, { wch: 18 }, { wch: 14 }, { wch: 16 },
      { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 22 }
    ];
    XLSX.utils.book_append_sheet(wb, wsUsers, 'Users_Customers');

    // Sheet 5: Products Catalog
    const productRows = products.map((p: any) => ({
      'Product ID': p.id,
      'Title': p.title || '',
      'Category': p.categoryId || '',
      'Subcategory': p.subcategoryId || '',
      'Price (PKR)': Number(p.pricePKR) || 0,
      'Price (USD)': Number(p.priceUSD) || 0,
      'Rating': p.rating || 5.0,
      'Reviews Count': p.reviewCount || 0,
      'Badge': p.badge || '',
      'File Format': p.fileFormat || 'ZIP Package',
      'Delivery Method': p.deliveryMethod || 'Instant Download',
      'Download URL': p.downloadUrl || 'Protected by Account'
    }));
    const wsProducts = XLSX.utils.json_to_sheet(productRows.length > 0 ? productRows : [{ 'Product ID': 'No products in catalog' }]);
    wsProducts['!cols'] = [
      { wch: 18 }, { wch: 35 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
      { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 20 }, { wch: 40 }
    ];
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Products_Catalog');

    // Sheet 6: Reviews & Feedback
    const reviewRows = reviews.map((r: any) => ({
      'Review ID': r.id,
      'Product Title': r.productTitle || 'Store General',
      'Author': r.author || 'Customer',
      'Rating': r.rating || 5,
      'Feedback': r.comment || '',
      'Verified Purchase': r.verifiedPurchase ? 'YES' : 'NO',
      'Date': r.createdAt ? new Date(r.createdAt).toLocaleString() : 'N/A'
    }));
    const wsReviews = XLSX.utils.json_to_sheet(reviewRows.length > 0 ? reviewRows : [{ 'Review ID': 'No reviews recorded' }]);
    wsReviews['!cols'] = [
      { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 10 }, { wch: 45 }, { wch: 18 }, { wch: 22 }
    ];
    XLSX.utils.book_append_sheet(wb, wsReviews, 'Reviews_Feedback');

    // Sheet 7: Cyber Threats Blocked
    const threatRows = threats.map((t: any) => ({
      'Threat ID': t.id,
      'Timestamp': t.timestamp ? new Date(t.timestamp).toLocaleString() : 'N/A',
      'Threat Type': t.threatType || '',
      'Category': t.category || '',
      'Severity': t.severity || '',
      'IP Address': t.ipAddress || '',
      'Method': t.method || '',
      'Target Path': t.path || '',
      'Action Taken': t.actionTaken || 'BLOCKED_403',
      'Status': t.status || 'active',
      'Payload': t.offendingPayload || ''
    }));
    const wsThreats = XLSX.utils.json_to_sheet(threatRows.length > 0 ? threatRows : [{ 'Threat ID': 'No threats recorded' }]);
    wsThreats['!cols'] = [
      { wch: 24 }, { wch: 22 }, { wch: 35 }, { wch: 22 }, { wch: 12 }, { wch: 20 },
      { wch: 12 }, { wch: 28 }, { wch: 18 }, { wch: 14 }, { wch: 40 }
    ];
    XLSX.utils.book_append_sheet(wb, wsThreats, 'Cyber_Threats_Blocked');

    // Sheet 8: Audit Logs
    const auditRows = auditLogs.map((a: any) => ({
      'Log ID': a.id,
      'Timestamp': a.timestamp ? new Date(a.timestamp).toLocaleString() : 'N/A',
      'Action': a.action || '',
      'Category': a.category || '',
      'Severity': a.severity || '',
      'Admin': a.adminEmail || 'system',
      'Target Resource': a.targetResource || '',
      'IP Address': a.ipAddress || '',
      'Details': a.details || ''
    }));
    const wsAudit = XLSX.utils.json_to_sheet(auditRows.length > 0 ? auditRows : [{ 'Log ID': 'No audit logs recorded' }]);
    wsAudit['!cols'] = [
      { wch: 24 }, { wch: 22 }, { wch: 28 }, { wch: 20 }, { wch: 14 }, { wch: 28 },
      { wch: 24 }, { wch: 18 }, { wch: 40 }
    ];
    XLSX.utils.book_append_sheet(wb, wsAudit, 'Audit_Trail_Logs');

    // 3. Write Excel file to disk
    XLSX.writeFile(wb, filePath);
    const fileStat = fs.statSync(filePath);
    const fileSizeBytes = fileStat.size;
    const fileSizeFormatted = `${(fileSizeBytes / 1024).toFixed(1)} KB`;

    // 4. Construct backup record
    const record: BackupRecord = {
      id: backupId,
      filename,
      timestamp,
      triggerType,
      fileSizeBytes,
      fileSizeFormatted,
      recordCounts: {
        orders: orders.length,
        products: products.length,
        users: users.length,
        reviews: reviews.length,
        auditLogs: auditLogs.length,
        threats: threats.length,
        total: orders.length + products.length + users.length + reviews.length + auditLogs.length + threats.length
      },
      status: 'completed',
      downloadUrl: `/api/admin/backups/download/${encodeURIComponent(filename)}`,
      sheetsIncluded: [
        'Executive_Summary',
        'Orders_Master',
        'Order_Items_Breakdown',
        'Users_Customers',
        'Products_Catalog',
        'Reviews_Feedback',
        'Cyber_Threats_Blocked',
        'Audit_Trail_Logs'
      ]
    };

    // 5. Persist record to Firestore cloud_backups collection
    try {
      const db = getServerFirestoreDb();
      if (db) {
        await setDoc(doc(db, 'cloud_backups', backupId), record);
      }
    } catch (saveErr) {
      console.warn('[CLOUD-BACKUP] Firestore backup record save notice:', saveErr);
    }

    // 6. Update system settings last run
    backupSettings.lastRunTimestamp = timestamp;

    // 7. Prune backups older than retentionDays
    try {
      const maxAgeMs = backupSettings.retentionDays * 24 * 60 * 60 * 1000;
      const allFiles = fs.readdirSync(backupsDirectory);
      const nowMs = Date.now();
      for (const f of allFiles) {
        if (f.endsWith('.xlsx')) {
          const fPath = path.join(backupsDirectory, f);
          const fStat = fs.statSync(fPath);
          if (nowMs - fStat.mtimeMs > maxAgeMs) {
            fs.unlinkSync(fPath);
            console.log(`[CLOUD-BACKUP] Pruned expired backup archive: ${f}`);
          }
        }
      }
    } catch (pruneErr) {
      console.warn('[CLOUD-BACKUP] Prune notice:', pruneErr);
    }

    // 8. Dispatch notification email if configured
    if (backupSettings.emailNotification) {
      const rawGmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
      const rawGmailPass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS;
      if (rawGmailUser && rawGmailPass) {
        try {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: rawGmailUser, pass: rawGmailPass }
          });

          const emailSubject = `🛡️ [ZDF Cloud Backup] ${triggerType === 'automated_nightly' ? 'Nightly Automated' : 'Manual Admin'} Excel Backup Completed (${orders.length} Orders Saved)`;
          const emailHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0b0f19; color: #e2e8f0; border-radius: 12px; border: 1px solid #1e293b;">
              <h2 style="color: #38bdf8; margin-top: 0;">🛡️ Zohaib DigiForge Cloud Backup Notice</h2>
              <p style="color: #94a3b8; font-size: 15px;">Your scheduled cloud backup has successfully completed and is archived in Excel (.xlsx) format for complete data redundancy and disaster recovery.</p>
              
              <div style="background: #111827; padding: 16px; border-radius: 8px; border: 1px solid #1f2937; margin: 18px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #cbd5e1;">
                  <tr><td style="padding: 6px 0; color: #94a3b8;">Trigger Mode:</td><td style="font-weight: 600; color: #38bdf8;">${triggerType === 'automated_nightly' ? 'Automated Nightly Cloud Cron (02:00 AM)' : 'Manual Admin Request'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #94a3b8;">Customer Orders:</td><td style="font-weight: 600; color: #10b981;">${orders.length} Records</td></tr>
                  <tr><td style="padding: 6px 0; color: #94a3b8;">Total Revenue (PKR):</td><td style="font-weight: 600; color: #f59e0b;">Rs. ${totalRevenuePKR.toLocaleString()}</td></tr>
                  <tr><td style="padding: 6px 0; color: #94a3b8;">Registered Users:</td><td style="font-weight: 600;">${users.length} Customers</td></tr>
                  <tr><td style="padding: 6px 0; color: #94a3b8;">Catalog Products:</td><td style="font-weight: 600;">${products.length} Items</td></tr>
                  <tr><td style="padding: 6px 0; color: #94a3b8;">File Size:</td><td style="font-weight: 600; color: #a855f7;">${fileSizeFormatted}</td></tr>
                  <tr><td style="padding: 6px 0; color: #94a3b8;">Excel File:</td><td style="font-weight: 600; color: #e2e8f0;">${filename}</td></tr>
                </table>
              </div>

              <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">This backup includes 8 structured worksheets: Executive Summary, Orders Master, Line Items, Users, Products Catalog, Reviews, WAF Threat Logs, and Audit Trail.</p>
            </div>
          `;

          await transporter.sendMail({
            from: `"Zohaib DigiForge Cyber Cloud" <${rawGmailUser}>`,
            to: backupSettings.notifyEmail,
            subject: emailSubject,
            html: emailHtml,
            attachments: [
              {
                filename,
                path: filePath,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              }
            ]
          });
          console.log(`[CLOUD-BACKUP] ✉️ Backup notification email with Excel attachment dispatched to ${backupSettings.notifyEmail}`);
        } catch (mailErr: any) {
          console.warn('[CLOUD-BACKUP] Email notification warning:', mailErr?.message);
        }
      }
    }

    console.log(`[CLOUD-BACKUP] ✅ Backup finished: ${filename} | Size: ${fileSizeFormatted} | Orders: ${orders.length}`);
    return record;
  }

  // Automated Nightly Cloud Backup Background Cron Checker (every 60 seconds)
  setInterval(async () => {
    try {
      if (!backupSettings.autoBackupEnabled) return;

      const now = new Date();
      // Format current time HH:MM
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const todayDateStr = now.toISOString().slice(0, 10);

      if (currentTimeStr === backupSettings.scheduledTime && lastAutomatedBackupDate !== todayDateStr) {
        lastAutomatedBackupDate = todayDateStr;
        console.log(`[CLOUD-BACKUP] ⏰ Nightly Automated Backup triggered at ${currentTimeStr}! Generating Excel snapshot...`);
        await executeMasterCloudBackup('automated_nightly');
      }
    } catch (cronErr) {
      console.error('[CLOUD-BACKUP] Nightly cron error trapped safely:', cronErr);
    }
  }, 60000);

  // 1. Get list of all Cloud Backups & System Status
  app.get('/api/admin/backups', requireAdmin, async (req, res) => {
    try {
      let backupsList: BackupRecord[] = [];

      // Fetch from Firestore cloud_backups
      try {
        const db = getServerFirestoreDb();
        if (db) {
          const snap = await getDocs(collection(db, 'cloud_backups'));
          snap.forEach(d => {
            backupsList.push({ id: d.id, ...d.data() } as BackupRecord);
          });
        }
      } catch (e) {
        console.warn('[CLOUD-BACKUP] Backups list Firestore fetch notice:', e);
      }

      // Also inspect disk for any files not in firestore
      try {
        const diskFiles = fs.readdirSync(backupsDirectory).filter(f => f.endsWith('.xlsx'));
        for (const f of diskFiles) {
          if (!backupsList.some(b => b.filename === f)) {
            const fStat = fs.statSync(path.join(backupsDirectory, f));
            backupsList.push({
              id: `disk_${f.replace('.xlsx', '')}`,
              filename: f,
              timestamp: fStat.mtime.toISOString(),
              triggerType: f.includes('Nightly') ? 'automated_nightly' : 'manual_admin',
              fileSizeBytes: fStat.size,
              fileSizeFormatted: `${(fStat.size / 1024).toFixed(1)} KB`,
              recordCounts: { orders: 0, products: 0, users: 0, reviews: 0, auditLogs: 0, threats: 0, total: 0 },
              status: 'completed',
              downloadUrl: `/api/admin/backups/download/${encodeURIComponent(f)}`,
              sheetsIncluded: ['Orders_Master', 'Executive_Summary']
            });
          }
        }
      } catch (e) {}

      // Sort newest first
      backupsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Calculate next run info
      const now = new Date();
      const [schedH, schedM] = backupSettings.scheduledTime.split(':').map(Number);
      const nextRun = new Date();
      nextRun.setHours(schedH || 2, schedM || 0, 0, 0);
      if (nextRun.getTime() <= now.getTime()) {
        nextRun.setDate(nextRun.getDate() + 1);
      }

      return res.json({
        success: true,
        backups: backupsList,
        settings: {
          ...backupSettings,
          nextScheduledRun: nextRun.toISOString(),
          totalBackupsCount: backupsList.length
        },
        stats: {
          totalBackups: backupsList.length,
          lastBackup: backupsList[0]?.timestamp || null,
          nightlyBackupsCount: backupsList.filter(b => b.triggerType === 'automated_nightly').length,
          manualBackupsCount: backupsList.filter(b => b.triggerType === 'manual_admin').length
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Failed to list backups' });
    }
  });

  // 2. Trigger Instant Excel Cloud Backup Now
  const handleRunBackup = async (req: express.Request, res: express.Response) => {
    try {
      const record = await executeMasterCloudBackup('manual_admin');
      return res.json({
        success: true,
        message: 'Master cloud backup created successfully in Excel format!',
        backup: record
      });
    } catch (err: any) {
      console.error('[CLOUD-BACKUP] Manual backup failed:', err);
      return res.status(500).json({ success: false, error: err.message || 'Backup generation failed' });
    }
  };

  app.post('/api/admin/backups/run-now', requireAdmin, handleRunBackup);
  app.post('/api/admin/backups/create', requireAdmin, handleRunBackup);

  // 3. Download Backup Excel Spreadsheet (.xlsx)
  app.get('/api/admin/backups/download/:filename', requireAdmin, (req, res) => {
    try {
      const filename = path.basename(req.params.filename); // Strip path traversal attempts
      const filePath = path.join(backupsDirectory, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: 'Backup archive not found on server' });
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.sendFile(filePath);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Update Backup Settings
  app.post('/api/admin/backups/settings', requireAdmin, async (req, res) => {
    try {
      const { autoBackupEnabled, scheduledTime, emailNotification, notifyEmail, retentionDays } = req.body;
      if (typeof autoBackupEnabled === 'boolean') backupSettings.autoBackupEnabled = autoBackupEnabled;
      if (scheduledTime) backupSettings.scheduledTime = scheduledTime;
      if (typeof emailNotification === 'boolean') backupSettings.emailNotification = emailNotification;
      if (notifyEmail) backupSettings.notifyEmail = notifyEmail;
      if (retentionDays) backupSettings.retentionDays = Number(retentionDays);

      // Persist to Firestore siteSettings/backupSettings
      try {
        const db = getServerFirestoreDb();
        if (db) {
          await setDoc(doc(db, 'siteSettings', 'backupSettings'), backupSettings, { merge: true });
        }
      } catch (e) {}

      return res.json({ success: true, settings: backupSettings });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Delete a Backup Archive
  app.delete('/api/admin/backups/:id', requireAdmin, async (req, res) => {
    try {
      const backupId = req.params.id;

      // 1. Delete from Firestore
      try {
        const db = getServerFirestoreDb();
        if (db) {
          await deleteDoc(doc(db, 'cloud_backups', backupId));
        }
      } catch (e) {}

      // 2. Delete file from disk if matches filename pattern
      try {
        const files = fs.readdirSync(backupsDirectory);
        for (const f of files) {
          if (f.includes(backupId) || backupId.includes(f.replace('.xlsx', ''))) {
            fs.unlinkSync(path.join(backupsDirectory, f));
          }
        }
      } catch (e) {}

      return res.json({ success: true, message: 'Backup archive deleted' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Professional Dynamic XML Sitemap Endpoint
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const hostUrl = `${req.protocol}://${req.get('host')}`;

      let products: any[] = [];

      try {
        const firestoreDb = getServerFirestoreDb();
        if (firestoreDb) {
          const prodSnap = await getDocs(collection(firestoreDb, 'products'));
          products = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (e) {
        // Use static fallbacks smoothly
      }

      const staticPages = [
        { url: '/', priority: '1.0', changefreq: 'daily' },
        { url: '/resources', priority: '0.9', changefreq: 'daily' },
        { url: '/membership', priority: '0.8', changefreq: 'weekly' },
        { url: '/bundles', priority: '0.8', changefreq: 'weekly' },
        { url: '/services', priority: '0.8', changefreq: 'weekly' },
        { url: '/reviews', priority: '0.7', changefreq: 'weekly' },
        { url: '/about', priority: '0.6', changefreq: 'monthly' },
        { url: '/contact', priority: '0.6', changefreq: 'monthly' },
        { url: '/legal', priority: '0.3', changefreq: 'yearly' },
        { url: '/terms', priority: '0.3', changefreq: 'yearly' },
        { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
        { url: '/refund', priority: '0.3', changefreq: 'yearly' },
        { url: '/faq', priority: '0.5', changefreq: 'monthly' }
      ];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

      staticPages.forEach(p => {
        xml += `  <url>\n`;
        xml += `    <loc>${hostUrl}${p.url}</loc>\n`;
        xml += `    <changefreq>${p.changefreq}</changefreq>\n`;
        xml += `    <priority>${p.priority}</priority>\n`;
        xml += `  </url>\n`;
      });

      products.forEach((prod: any) => {
        const pId = prod.slug || prod.id;
        xml += `  <url>\n`;
        xml += `    <loc>${hostUrl}/product/${pId}</loc>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      });

      xml += `</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (err) {
      console.error('Error generating sitemap:', err);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Professional robots.txt Endpoint
  app.get('/robots.txt', (req, res) => {
    const hostUrl = `${req.protocol}://${req.get('host')}`;
    const robotsContent = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin-dashboard
Disallow: /account
Disallow: /dashboard
Disallow: /checkout

Sitemap: ${hostUrl}/sitemap.xml
`;
    res.header('Content-Type', 'text/plain');
    res.send(robotsContent);
  });

  // Known valid frontend routes for accurate HTTP 200 vs 404 SEO status codes
  const KNOWN_VALID_ROUTES = new Set([
    '/',
    '/resources',
    '/product',
    '/membership',
    '/bundles',
    '/services',
    '/service',
    '/about',
    '/contact',
    '/legal',
    '/privacy',
    '/privacy-policy',
    '/terms',
    '/terms-conditions',
    '/terms-and-conditions',
    '/refund',
    '/refund-policy',
    '/reviews',
    '/join',
    '/join-us',
    '/joinus',
    '/bio',
    '/linkinbio',
    '/links',
    '/community',
    '/linktree',
    '/auth',
    '/signin',
    '/signup',
    '/login',
    '/register',
    '/dashboard',
    '/account',
    '/customer-dashboard',
    '/admin',
    '/admin-dashboard',
    '/cart',
    '/bag',
    '/checkout',
    '/pay',
    '/order-confirmation',
    '/order-success',
    '/thank-you',
    '/faq'
  ]);

  const isKnownRoute = (reqPath: string): boolean => {
    const cleanPath = reqPath.split('?')[0].replace(/\/+$/, '') || '/';
    const lower = cleanPath.toLowerCase();
    if (KNOWN_VALID_ROUTES.has(lower)) return true;
    if (
      lower.startsWith('/product/') ||
      lower.startsWith('/resources/') ||
      lower.startsWith('/legal/') ||
      lower.startsWith('/ref/') ||
      lower.startsWith('/invite/') ||
      lower.startsWith('/order-confirmation/') ||
      lower.startsWith('/order-success/') ||
      lower.startsWith('/thank-you/') ||
      lower.startsWith('/assets/') ||
      lower.startsWith('/public/') ||
      lower.includes('.')
    ) {
      return true;
    }
    return false;
  };

  // Vite Middleware / Production Static Frontend Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      const isKnown = isKnownRoute(req.path);
      const statusCode = isKnown ? 200 : 404;

      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(statusCode).set({ 'Content-Type': 'text/html' }).send(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1y',
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else if (filePath.includes('/assets/') || /\.(js|css|webp|png|jpg|jpeg|svg|woff2|ico)$/i.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));
    app.get('*', (req, res) => {
      const isKnown = isKnownRoute(req.path);
      const statusCode = isKnown ? 200 : 404;
      res.status(statusCode).sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Crash-Proof Global Express Error Boundary
  // Catches all unexpected synchronous or asynchronous route failures, preventing server termination
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[CRASH-SHIELD] Express route error intercepted safely:', err);
    if (!res.headersSent) {
      res.status(err.status || 500).json({
        success: false,
        error: 'An internal error occurred. Protected by DigiForge Cyber Shield.',
        shieldActive: true
      });
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zohaib DigiForge Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
