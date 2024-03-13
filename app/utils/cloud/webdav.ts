import { STORAGE_KEY } from "@/app/constant";
import { SyncStore } from "@/app/store/sync";
import { corsFetch } from "../cors";

export type WebDAVConfig = SyncStore["webdav"];
export type WebDavClient = ReturnType<typeof createWebDavClient>;

export function createWebDavClient(store: SyncStore) {
  const folder = STORAGE_KEY;
  const fileName = `${folder}/${store.webdav.filename}`;
  const config = store.webdav;
  const proxyUrl =
    store.useProxy && store.proxyUrl.length > 0 ? store.proxyUrl : undefined;

  return {
    async check() {
      try {
        const res = await corsFetch(this.path(fileName), {
          method: "PROPFIND",
          headers: this.headers(),
          proxyUrl,
          mode: "cors",
        });
        console.log(
          "[WebDav] Check Data From File Name",
          `${fileName}`,
          res.status,
          res.statusText,
        );
        return [200, 207, 404].includes(res.status);
      } catch (e) {
        console.error("[WebDav] failed to check", e);
      }

      return false;
    },

    async get(key: string) {
      const res = await corsFetch(this.path(fileName), {
        method: "GET",
        headers: this.headers(),
        proxyUrl,
        mode: "cors",
      });

      console.log("[WebDav] Get File Name =", key, res.status, res.statusText);

      return await res.text();
    },

    async set(key: string, value: string) {
      const exists = await this.check();

      if (!exists) {
        await corsFetch(this.path(fileName), {
          method: "PUT",
          headers: this.headers(),
          body: "",
          proxyUrl,
          mode: "cors",
        });
      }

      const res = await corsFetch(this.path(fileName), {
        method: "PUT",
        headers: this.headers(),
        body: value,
        proxyUrl,
        mode: "cors",
      });

      console.log(
        "[WebDav] Set A new data from File Name =",
        key,
        res.status,
        res.statusText,
      );
    },

    headers() {
      const auth = btoa(config.username + ":" + config.password);

      return {
        authorization: `Basic ${auth}`,
      };
    },
    path(path: string) {
      if (!path.endsWith("/")) {
        path += "/";
      }
      if (path.startsWith("/")) {
        path = path.slice(1);
      }

      let url = new URL("/api/webdav/" + path);

      // add query params
      url.searchParams.append("endpoint", config.endpoint);

      return url + path;
    },
  };
}
