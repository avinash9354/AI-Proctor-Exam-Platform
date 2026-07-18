import { JwtPayload } from '@exam-platform/shared';
export declare function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string;
export declare function signRefreshToken(userId: string): string;
export declare function verifyAccessToken(token: string): JwtPayload;
export declare function verifyRefreshToken(token: string): {
    sub: string;
};
export declare function issueTokenPair(user: {
    id: string;
    email: string;
    role: {
        name: string;
    };
}): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}>;
export declare function revokeRefreshToken(token: string): Promise<void>;
export declare function blacklistAccessToken(token: string, expiresIn: number): Promise<void>;
export declare function isTokenBlacklisted(token: string): Promise<boolean>;
//# sourceMappingURL=jwt.d.ts.map