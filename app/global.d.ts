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
    notification:{
      requestPermission(): Promise<Permission>;
      isPermissionGranted(): Promise<boolean>;
      sendNotification(options: string | Options): void;
    };
    updater: {
      manifest: UpdateManifest;
      shouldUpdate: boolean;
      status: UpdateStatus;
      checkUpdate(): Promise<UpdateResult>;
      installUpdate(manifest: UpdateManifest): Promise<void>;
      onUpdaterEvent(handler: (status: UpdateStatusResult) => void): Promise<UnlistenFn>;
    };
  };
}

declare type UpdateResult = {
  status: UpdateStatus;
  error?: string;
};

declare type UpdateStatus = "PENDING" | "ERROR" | "DONE" | "UPTODATE";

declare type UpdateManifest = {
  version: string;
  notes: string;
  pub_date: string;
  platforms: {
    [platform: string]: {
      signature: string;
      url: string;
    };
  };
};

declare type UpdateStatusResult = {
  status: UpdateStatus;
  error: string | null;
};
