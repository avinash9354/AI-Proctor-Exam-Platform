import { JwtPayload } from '@exam-platform/shared';
export declare function verifyAccessToken(token: string): JwtPayload;
export declare function isTokenBlacklisted(token: string): Promise<boolean>;
//# sourceMappingURL=jwt.d.ts.map