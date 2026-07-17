export interface AuthClaims {
  claims: any;
  userId: string | null;
  publicKey: string | null;
  loginTime: string | null;
}

export function decodeClaims(accessToken: string): AuthClaims | null {
  try {
    const base64Url = accessToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    const claims = {
      ...decoded.app_metadata,
      ...decoded.user_metadata,
      iat: decoded.iat,
      exp: decoded.exp,
      sub: decoded.sub,
    };
    
    const userId = decoded.sub || null;
    const publicKey = decoded.user_metadata?.wallet || null;
    let loginTime = null;
    if (decoded.iat) {
      loginTime = new Date(decoded.iat * 1000).toLocaleString();
    }

    return { claims, userId, publicKey, loginTime };
  } catch (e) {
    console.error('Failed to parse JWT claims:', e);
    return null;
  }
}
