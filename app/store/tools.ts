import Fuse from "fuse.js";
import { getLang } from "../locales";
import { StoreKey } from "../constant";
import { nanoid } from "nanoid";
import { createPersistStore } from "../utils/store";

export interface ToolParameter {
  type: string;
  description: string;
}

export interface ToolFunction {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
}

export interface Tool {
    [x: string]: string | ToolFunction;
    type: string;
    function: ToolFunction;
}  

export const ToolSearchService = {
  ready: false,
  builtinEngine: new Fuse<Tool>([], { keys: ["function.name"] }),
  userEngine: new Fuse<Tool>([], { keys: ["function.name"] }),
  count: {
    builtin: 0,
  },
  allTools: [] as Tool[],
  builtinTools: [] as Tool[],

  init(builtinTools: Tool[], userTools: Tool[]) {
    if (this.ready) {
      return;
    }
    this.allTools = userTools.concat(builtinTools);
    this.builtinTools = builtinTools.slice();
    this.builtinEngine.setCollection(builtinTools);
    this.userEngine.setCollection(userTools);
    this.ready = true;
  },

  remove(id: string) {
    this.userEngine.remove((doc) => doc.function.name === id);
  },

  add(tool: Tool) {
    this.userEngine.add(tool);
  },

  search(text: string) {
    const userResults = this.userEngine.search(text);
    const builtinResults = this.builtinEngine.search(text);
    return userResults.concat(builtinResults).map((v) => v.item);
  },
};

export const useToolStore = createPersistStore(
  {
    counter: 0,
    tools: {} as Record<string, Tool>,
  },

  (set, get) => ({
    add(tool: Tool) {
      const tools = get().tools;
      tool.function.name = nanoid();
      tools[tool.function.name] = tool;

      set(() => ({
        tools: tools,
      }));

      return tool.function.name!;
    },

    get(name: string) {
      const targetTool = get().tools[name];
      return targetTool;
    },

    remove(name: string) {
      const tools = get().tools;
      delete tools[name];

      set(() => ({
        tools,
        counter: get().counter + 1,
      }));
    },

    getUserTools() {
      return Object.values(get().tools ?? {});
    },

    updateTool(name: string, updater: (tool: Tool) => void) {
      const tool = get().tools[name] ?? {
        type: "function",
        function: {
          name: "",
          description: "",
          parameters: {},
        },
      };

      ToolSearchService.remove(name);
      updater(tool);
      const tools = get().tools;
      tools[name] = tool;
      set(() => ({ tools }));
      ToolSearchService.add(tool);
    },

    search(text: string) {
      if (text.length === 0) {
        // return all tools
        return this.getUserTools().concat(ToolSearchService.builtinTools);
      }
      return ToolSearchService.search(text) as Tool[];
    },
  }),
  {
    name: StoreKey.Tool,
    version: 1.1,

    migrate(state, version) {
      const newState = JSON.parse(JSON.stringify(state)) as {
        tools: Record<string, Tool>;
      };

      if (version < 1.1) {
        Object.values(newState.tools).forEach((tool) => {
          if (!tool.id) {
            tool.id = nanoid();
          }
        });
      }

      return newState as any;
    },

    onRehydrateStorage(state) {
      const TOOL_URL = "./tools.json";

      fetch(TOOL_URL)
        .then((res) => res.json())
        .then((res) => {
          const lang = getLang();
          let fetchTools: Tool[];

          switch (lang) {
            case "cn":
              fetchTools = res.cn;
              break;
            case "id":
              fetchTools = res.id;
              break;
            // Add cases for other languages here
            default:
              fetchTools = res.en;
              break;
          }

          const builtinTools = fetchTools.map((tool) => ({
            ...tool,
            type: "function",
          }));

          const userTools = useToolStore.getState().getUserTools() ?? [];

          const allToolsForSearch: Tool[] = builtinTools.concat(userTools);
          ToolSearchService.count.builtin = fetchTools.length;
          ToolSearchService.init(allToolsForSearch, userTools);
        });
    },
  },
);
