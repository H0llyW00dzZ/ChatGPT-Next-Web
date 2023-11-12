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
  id: string;
  isUser?: boolean;
  createdAt: number;
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

  remove(name: string) {
    this.userEngine.remove((doc) => doc.function.name === name);
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
      tool.id = nanoid();
      tools[tool.id] = tool;

      set(() => ({
        tools: tools,
      }));

      return tool.id!;
    },

    get(id: string) {
      return get().tools[id];
    },

    remove(id: string) {
      const tools = get().tools;
      delete tools[id];

      set(() => ({
        tools,
        counter: get().counter + 1,
      }));
    },

    getUserTools() {
      return Object.values(get().tools ?? {});
    },

    updateTool(id: string, updater: (tool: Tool) => void) {
      const tool = get().tools[id] ?? {
        id: "",
        isUser: false,
        createdAt: Date.now(),
        type: "",
        function: {
          name: "",
          description: "",
          parameters: {},
        },
      };

      ToolSearchService.remove(id);
      updater(tool);
      const tools = get().tools;
      tools[id] = tool;
      set(() => ({ tools }));
      ToolSearchService.add(tool);
    },

    search(text: string) {
      if (text.length === 0) {
        // Return all tools
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
            id: nanoid(),
            isUser: false,
          }));

          const userTools = useToolStore.getState().getUserTools() ?? [];

          const allToolsForSearch = [...builtinTools, ...userTools].filter((v) => !!v.function.name && !!v.function.description);
          ToolSearchService.count.builtin = fetchTools.length;
          ToolSearchService.init(allToolsForSearch, userTools);
        });
    },
  },
);
