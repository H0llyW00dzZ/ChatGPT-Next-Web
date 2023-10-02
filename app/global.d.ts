declare module "*.jpg";
declare module "*.png";
declare module "*.woff2";
declare module "*.woff";
declare module "*.ttf";
declare module "*.scss" {
  const content: Record<string, string>;
  export default content;
}

declare module "*.svg";

declare interface Window {
  __TAURI__?: {
    writeText(text: string): Promise<void>;
    invoke(command: string, payload?: Record<string, unknown>): Promise<any>;
    dialog: {
      save(options?: Record<string, unknown>): Promise<string | null>;
    };
    fs: {
      writeBinaryFile(path: string, data: Uint8Array): Promise<void>;
    };
  };
}
// added by backtrackz
// this auth for client-app in future
declare interface Auth {
  __TAURI__?: {
    authenticate(): Promise<Auth>;
    logout(): Promise<void>;
    isAuthenticated(): Promise<boolean>;
    getAccessToken(): Promise<string>;
    getRefreshToken(): Promise<string>;
    setAccessToken(token: string): Promise<void>;
    setRefreshToken(token: string): Promise<void>;
    setTokenExpiration(expiration: number): Promise<void>;
    token: string;
    refreshToken: string;
    expiresAt: number;
  };
}
