import { SubmitKey } from "../store/config";
import { PartialLocaleType } from "../locales/index";
import { getClientConfig } from "../config/client";

const isApp = !!getClientConfig()?.isApp;

const pt: PartialLocaleType = {
  WIP: "Em breve...",
  Error: {
    Unauthorized: isApp
    ? "Chave API inválida, por favor verifique em [Configurações](/#/settings)."
    : "Acesso não autorizado, por favor insira o código de acesso em [auth](/#/auth) ou insira sua Chave API OpenAI.",
    Content_Policy: {
      Title:
        "Sua solicitação foi marcada devido a uma violação da Política de Conteúdo.",
      SubTitle: 
        "Leia Aqui: https://platform.openai.com/docs/guides/moderation/overview",
      Reason: {
        Title: "Motivo",
        sexual: "Sexual",
        hate: "Ódio",
        harassment: "Assédio",
        "self-harm": "Autolesão",
        "sexual/minors": "Sexual/menores",
        "hate/threatening": "Ódio/ameaças",
        "violence/graphic": "Violência/gráfico",
        "self-harm/intent": "Autolesão/intenção",
        "self-harm/instructions": "Autolesão/instruções",
        "harassment/threatening": "Assédio/ameaças",
        violence: "Violência",
      },
    },
  },
  Auth: {
    Title: "Necessário Código de Acesso",
    Tips: "Por favor, insira o código de acesso abaixo",
    SubTips: "Ou insira sua Chave API OpenAI",
    Input: "código de acesso",
    Confirm: "Confirmar",
    Later: "Depois",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} mensagens`,
  },
  Chat: {
    SubTitle: (count: number) => `${count} mensagens`,
    EditMessage: {
      Title: "Editar Todas as Mensagens",
      Topic: {
        Title: "Tópico",
        SubTitle: "Mudar o tópico atual",
      },
    },
    Actions: {
      ChatList: "Ir Para Lista de Chat",
      CompressedHistory: "Prompt de Memória Histórica Comprimida",
      Export: "Exportar Todas as Mensagens como Markdown",
      Copy: "Copiar",
      Stop: "Parar",
      Retry: "Tentar Novamente",
      Pin: "Fixar",
      PinToastContent: "Fixada 1 mensagem para prompts contextuais",
      PinToastAction: "Visualizar",
      PinAppContent: {
        Pinned : "O aplicativo de desktop está fixado",
        UnPinned: "O aplicativo de desktop não está mais fixado",
      },
      Delete: "Deletar",
      Edit: "Editar",
    },
    Commands: {
      new: "Iniciar um novo chat",
      newm: "Iniciar um novo chat com máscara",
      next: "Próximo Chat",
      prev: "Chat Anterior",
      restart: "Reiniciar um cliente",
      clear: "Limpar Contexto",
      del: "Deletar Chat",
      save: "Salvar uma conversa da sessão atual",
      load: "Carregar uma conversa da sessão",
      copymemoryai: "Copiar uma sessão de memória de prompt de IA",
      updatemasks: "Atualizar uma sessão de memória de prompt para uma máscara",
      summarize: "Resumir a sessão atual desta conversa",
      UI: {
        MasksSuccess: "Sessão de máscaras atualizadas com sucesso",
        MasksFail: "Falha ao atualizar sessão de máscaras",
        Summarizing: "Resumindo a sessão atual desta conversa",
        SummarizeSuccess: "Sessão desta conversa resumida com sucesso",
        SummarizeFail: "Falha ao resumir a sessão desta conversa",
      },      
    },
    InputActions: {
      Stop: "Parar",
      ToBottom: "Para o Mais Recente",
      Theme: {
        auto: "Automático",
        light: "Tema Claro",
        dark: "Tema Escuro",
      },
      Prompt: "Prompts",
      Masks: "Máscaras",
      Clear: "Limpar Contexto",
      Settings: "Configurações",
    },
    Rename: "Renomear Chat",
    Typing: "Digitando…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} para enviar`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += ", Shift + Enter para quebrar linha";
      }
      return inputHints + ", / para buscar prompts, : para usar comandos";
    },
    Send: "Enviar",
    Config: {
      Reset: "Redefinir para Padrão",
      SaveAs: "Salvar como Máscara",
    },
    IsContext: "Prompt Contextual",
  },
  Export: {
    Title: "Exportar Mensagens",
    Copy: "Copiar Tudo",
    Download: "Baixar",
    MessageFromYou: "Mensagem De Você",
    MessageFromChatGPT: {
      NoRole: "Mensagem do ChatGPT",
      RoleAssistant: "Assistente",
      RoleSystem: "Sistema",
      SysMemoryPrompt: "Prompt de Memória do Sistema",
    },
    Share: "Compartilhar para ShareGPT",
    Format: {
      Title: "Formato de Exportação",
      SubTitle: "Markdown ou Imagem PNG",
    },
    IncludeContext: {
      Title: "Incluindo Contexto",
      SubTitle: "Exportar prompts de contexto na máscara ou não",
    },
    Steps: {
      Select: "Selecionar",
      Preview: "Pré-visualizar",
    },
    Image: {
      Toast: "Capturando Imagem...",
      Modal:
        "Pressione longamente ou clique com o botão direito para salvar a imagem",
    },
  },
  Select: {
    Search: "Buscar",
    All: "Selecionar Tudo",
    Latest: "Selecionar Mais Recente",
    Clear: "Limpar",
  },
  Memory: {
    Title: "Prompt de Memória",
    EmptyContent: "Nada ainda.",
    Send: "Enviar Memória",
    Copy: "Copiar Memória",
    Reset: "Resetar Sessão",
    ResetConfirm:
      "Resetar irá limpar o histórico de conversa atual e a memória histórica. Você tem certeza que quer resetar?",
  },
  Home: {
    NewChat: "Novo Chat",
    DeleteChat: "Confirmar para deletar a conversa selecionada?",
    DeleteToast: "Chat Deletado",
    Revert: "Reverter",
  },
  Settings: {
    Title: "Configurações",
    SubTitle: "Todas as Configurações",
    Danger: {
      Reset: {
        Title: "Resetar Todas as Configurações",
        SubTitle: "Resetar todos os itens de configuração para o padrão",
        Action: "Resetar",
        Confirm: "Confirmar para resetar todas as configurações para o padrão?",
      },
      Clear: {
        Title: "Limpar Todos os Dados",
        SubTitle: "Limpar todas as mensagens e configurações",
        Action: "Limpar",
        Confirm: "Confirmar para limpar todas as mensagens e configurações?",
      },
    },
    Lang: {
      Name: "Language",
      All: "Todos os Idiomas",
    },
    Avatar: "Avatar",
    FontSize: {
      Title: "Tamanho da Fonte",
      SubTitle: "Ajustar o tamanho da fonte do conteúdo do chat",
    },
    InjectSystemPrompts: {
      Title: "Inserir Prompts de Sistema",
      SubTitle: "Inserir um prompt de sistema global para cada requisição",
    },
    InputTemplate: {
      Title: "Modelo de Entrada",
      SubTitle: "A mensagem mais recente será preenchida neste modelo",
    },

    Update: {
      Version: (x: string) => `Versão: ${x}`,
      IsLatest: "Última versão",
      CheckUpdate: "Verificar Atualização",
      IsChecking: "Verificando atualização...",
      FoundUpdate: (x: string) => `Nova versão encontrada: ${x}`,
      GoToUpdate: "Atualizar",
      IsUpdating: "Atualizando...",
      UpdateSuccessful: "Uma versão foi atualizada para a versão mais recente",
      UpdateFailed: "Falha na atualização",
    },
    SendKey: "Tecla de Envio",
    PinAppKey: "Fixar Tecla de Atalho do Aplicativo",
    Theme: "Tema",
    TightBorder: "Borda Ajustada",
    SendPreviewBubble: {
      Title: "Bolha de Pré-visualização de Envio",
      SubTitle: "Pré-visualizar markdown na bolha",
    },
    AutoScrollMessage: {
      Title: "Resposta com Auto-Scroll",
      SubTitle: "Rolar a mensagem automaticamente durante a resposta",
    },
    AutoGenerateTitle: {
      Title: "Gerar Título Automaticamente",
      SubTitle: "Gerar um título adequado baseado no conteúdo da conversa",
    },
    SpeedAnimation: {
      Title: "Velocidade de Animação da Resposta",
      SubTitle: "Uma resposta de animação de velocidade na qual você pode controlar a rapidez com que o texto da resposta é exibido durante a animação",
    },
    Sync: {
      CloudState: "Última Atualização",
      NotSyncYet: "Ainda não sincronizado",
      Success: "Sincronização bem sucedida",
      Fail: "Falha na sincronização",

      Config: {
        Modal: {
          Title: "Configurar Sincronização",
          Check: "Verificar Conexão",
        },
        SyncType: {
          Title: "Tipo de Sincronização",
          SubTitle: "Escolha seu serviço de sincronização favorito",
        },
        Proxy: {
          Title: "Habilitar Proxy CORS",
          SubTitle: "Habilitar um proxy para evitar restrições de cross-origin",
        },
        ProxyUrl: {
          Title: "Endpoint de Proxy",
          SubTitle: "Apenas aplicável ao proxy CORS embutido para este projeto",
        },
        AccessControl: {
          Title: "Ativar Controle de Acesso de Sobrescrita",
          SubTitle:
            "Aplicável apenas à configuração de controle de acesso de sobrescrita, como um código de acesso",
        },
        LockClient: {
          Title: "Ativar Não Sincronizar Dados Atuais",
          SubTitle: "Sincronizar apenas dados de outras fontes, não os dados atuais",
        },
        WebDav: {
          Endpoint: {
            Name: "Endpoint WebDav",
            SubTitle: "Configure o Endpoint WebDav",
          },
          UserName: {
            Name: "Nome de Usuário",
            SubTitle: "Configure o Nome de Usuário",
          },
          Password: {
            Name: "Senha",
            SubTitle: "Configure a Senha",
          },
          FileName: {
            Name: "Nome do Arquivo",
            SubTitle:
              "Nome do Arquivo, por exemplo: backtrackz.json (deve ser um arquivo JSON)",
          },
        },
        GithubGist: {
          GistID: {
            Name: "ID do Gist do Github",
            SubTitle:
              "Localização do seu ID do Gist, por exemplo: gist.github.com/H0llyW00dzZ/<gistid>/etc. copie e cole o <gistid> aqui.",
          },
          FileName: {
            Name: "Nome do Arquivo",
            SubTitle:
              "Nome do Arquivo, por exemplo: backtrackz.json (deve ser um arquivo JSON)",
          },
          AccessToken: {
            Name: "Token de Acesso",
            SubTitle:
              "Certifique-se de ter permissão para sincronizar. Habilite Privado e Público lá.",
          },
        },

        UpStash: {
          Endpoint: "URL REST Redis UpStash",
          UserName: "Nome do Backup",
          Password: "Token REST Redis UpStash",
        },

        GoSync: {
          Endpoint: "URL REST GoSync",
          UserName: "Nome do Backup",
          Password: "Token REST Gosync",
          FileName: "Nome do Arquivo",
        },

      },

      LocalState: "Dados Locais",
      Overview: (overview: any) => {
        return `${overview.chat} chats，, ${overview.message} mensagens, ${overview.prompt} prompts, ${overview.mask} máscaras`;
      },
      Description: {
        Chat: (overview: any) => {
          const title = "Chats，";
          const description = `${overview.chat} chats，, ${overview.message} mensagens`;
          return { title, description };
        },
        Prompt: (overview: any) => {
          const title = "Prompts";
          const description = `${overview.prompt} prompts`;
          return { title, description };
        },
        Masks: (overview: any) => {
          const title = "Máscaras";
          const description = `${overview.mask} máscaras`;
          return { title, description };
        },
      },
      ImportFailed: "Falha ao importar do arquivo",
      ImportChatSuccess: "Dados do chat importados com sucesso.",
    },
    Mask: {
      Splash: {
        Title: "Tela de Início da Máscara",
        SubTitle:
          "Mostrar uma tela de início da máscara antes de iniciar novo chat",
      },
      Builtin: {
        Title: "Esconder Máscaras Embutidas",
        SubTitle: "Esconder máscaras embutidas na lista de máscaras",
      },
    },
    Prompt: {
      Disable: {
        Title: "Desabilitar auto-completar",
        SubTitle: "Digite / para acionar auto-completar",
      },
      List: "Lista de Prompts",
      ListCount: (builtin: number, custom: number) =>
        `${builtin} embutidos, ${custom} definidos pelo usuário`,
      Edit: "Editar",
      Modal: {
        Title: "Lista de Prompts",
        Add: "Adicionar Um",
        Search: "Buscar Prompts",
      },
      EditModal: {
        Title: "Editar Prompt",
      },
    },
    HistoryCount: {
      Title: "Contagem de Mensagens Anexadas",
      SubTitle: "Número de mensagens enviadas anexadas por requisição",
    },
    CompressThreshold: {
      Title: "Limite de Compressão de Histórico",
      SubTitle:
        "Irá comprimir se o comprimento das mensagens não comprimidas exceder o valor",
    },
    Token: {
      Title: "Chave da API",
      SubTitle: "Use sua chave para ignorar o limite de código de acesso",
      Placeholder: "Chave da API do OpenAI",
    },

    Usage: {
      Title: "Saldo da Conta",
      SubTitle(used: any, total: any) {
        const hardLimitusd = total.hard_limit_usd !== undefined ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total.hard_limit_usd) : "desconhecido";
        const hardLimit = total.system_hard_limit_usd !== undefined ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total.system_hard_limit_usd) : "desconhecido";
        const usedFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(used);
        return `Usado neste mês ${usedFormatted}, Limite máximo ${hardLimitusd}, Limite de uso aprovado ${hardLimit}`;
      },
      IsChecking: "Verificando...",
      Check: "Verificar",
      NoAccess: `Insira a Chave da Sessão na Chave da API iniciando com o prefixo "sess-" para verificar o saldo.`,
    },
    AccessCode: {
      Title: "Código de Acesso",
      SubTitle: "Controle de acesso ativado",
      Placeholder: "Código de Acesso Necessário",
    },
    Endpoint: {
      Title: "Endpoint",
      SubTitle: "O endpoint personalizado deve começar com http(s)://",
    },
    Access: {
      AccessCode: {
        Title: "Código de Acesso",
        SubTitle: "Controle de Acesso Habilitado",
        Placeholder: "Insira o Código",
      },
      CustomEndpoint: {
        Title: "Endpoint Personalizado",
        SubTitle: "Use serviço personalizado Azure ou OpenAI",
      },
      Provider: {
        Title: "Provedor do Modelo",
        SubTitle: "Selecione Azure ou OpenAI",
      },
      OpenAI: {
        ApiKey: {
          Title: "Chave API OpenAI",
          SubTitle: "Usar Chave API OpenAI personalizada",
          Placeholder: "sk-xxx",
        },

        Endpoint: {
          Title: "Endpoint OpenAI",
          SubTitle:
            "Deve começar com http(s):// ou usar /api/openai como padrão",
        },
      },
      Azure: {
        ApiKey: {
          Title: "Chave API Azure",
          SubTitle: "Verifique sua chave API do console Azure",
          Placeholder: "Chave API Azure",
        },

        Endpoint: {
          Title: "Endpoint Azure",
          SubTitle: "Exemplo: ",
        },

        ApiVerion: {
          Title: "Versão API Azure",
          SubTitle: "Verifique sua versão API do console Azure",
        },
      },
      CustomModel: {
        Title: "Modelos Personalizados",
        SubTitle: "Opções de modelo personalizado, separados por vírgula",
      },
    },

    Model: "Modelo",
    Temperature: {
      Title: "Temperatura",
      SubTitle: "Um valor maior torna a saída mais aleatória",
    },
    TopP: {
      Title: "Top P",
      SubTitle: "Não altere este valor junto com a temperatura",
    },
    MaxTokens: {
      Title: "Máximo de Tokens",
      SubTitle: "Comprimento máximo de tokens de entrada e tokens gerados",
    },
    PresencePenalty: {
      Title: "Penalidade de Presença",
      SubTitle:
        "Um valor maior aumenta a probabilidade de falar sobre novos tópicos",
    },
    FrequencyPenalty: {
      Title: "Penalidade de Frequência",
      SubTitle:
        "Um valor maior diminui a probabilidade de repetir a mesma linha",
    },
    TextModeration: {
      Title: "Moderação de Texto",
      SubTitle:
        "Uma moderação de texto para verificar se o conteúdo está em conformidade com as políticas de uso da OpenAI.",
    },
    NumberOfImages: {
      Title: "Número de Imagens a Criar",
      SubTitle:
        "Um número de imagens a serem geradas\nDeve estar entre 1 e 10. Para o modelo dall-e-3, apenas 1 é suportado.",
    },
    QualityOfImages: {
      Title: "Qualidade da Imagem a Criar",
      SubTitle:
        "A qualidade da imagem que será gerada\nEssa configuração é suportada apenas para o modelo dall-e-3.",
    },
    SizeOfImages: {
      Title: "Tamanho da Imagem",
      SubTitle:
        "O tamanho das imagens geradas\nDALL·E-2: Deve ser um dos seguintes: `256x256`, `512x512` ou `1024x1024`.\nDALL-E-3: Deve ser um dos seguintes: `1024x1024`, `1792x1024` ou `1024x1792`.",
    },
    StyleOfImages: {
      Title: "Estilo da Imagem",
      SubTitle:
        "O estilo das imagens geradas\nDeve ser um dos seguintes: vívido ou natural\nEssa configuração é suportada apenas para o modelo dall-e-3",
    },
  },
  Store: {
    DefaultTopic: "Nova Conversa",
    BotHello: "Olá! Como posso ajudá-lo hoje?",
    Error: "Algo deu errado, por favor tente novamente mais tarde.",
    Prompt: {
      History: (content: string) =>
        "Este é um resumo do histórico de chat como um recapitulativo: " +
        content,
      Topic:
        "Por favor, gere um título de quatro a cinco palavras resumindo nossa conversa sem qualquer introdução, pontuação, aspas, períodos, símbolos ou texto adicional. Remova as aspas que o envolvem.",
      Summarize:
        "Resuma a discussão brevemente em 200 palavras ou menos para usar como um prompt para o contexto futuro.",
    },
  },
  Copy: {
    Success: "Copiado para a área de transferência",
    Failed:
      "Falha na cópia, por favor conceda permissão para acessar a área de transferência",
  },
  Download: {
    Success: "Conteúdo baixado para seu diretório.",
    Failed: "Falha no download.",
  },
  Context: {
    Toast: (x: any) => `Com ${x} prompts contextuais`,
    Edit: "Configurações do Chat Atual",
    Add: "Adicionar um Prompt",
    Clear: "Contexto Limpo",
    Revert: "Reverter",
  },
  Plugin: {
    Name: "Plugin",
  },
  FineTuned: {
    Sysmessage: "Você é um assistente que",
  },
  Changelog: {
    Name: "Registro de Alterações",
  },
  PrivacyPage: {
    Name: "Privacidade",
    Confirm: "Concordar",
  },
  Mask: {
    Name: "Máscara",
    Page: {
      Title: "Template de Prompt",
      SubTitle: (count: number) => `${count} templates de prompt`,
      Search: "Buscar Templates",
      Create: "Criar",
    },
    Item: {
      Info: (count: number) => `${count} prompts`,
      Chat: "Chat",
      View: "Visualizar",
      Edit: "Editar",
      Delete: "Deletar",
      DeleteConfirm: "Confirmar para deletar?",
    },
    EditModal: {
      Title: (readonly: boolean) =>
        `Editar Template de Prompt ${readonly ? "(somente leitura)" : ""}`,
      Download: "Baixar",
      Clone: "Clonar",
    },
    Config: {
      Avatar: "Avatar do Bot",
      Name: "Nome do Bot",
      Sync: {
        Title: "Usar Configuração Global",
        SubTitle: "Usar configuração global neste chat",
        Confirm:
          "Confirmar para substituir a configuração personalizada pela configuração global?",
      },
      HideContext: {
        Title: "Esconder Prompts de Contexto",
        SubTitle: "Não mostrar prompts de contexto no chat",
        UnHide: "Mostrar prompts de contexto no chat",
        Hide: "Ocultar prompts de contexto no chat",
      },
      Share: {
        Title: "Compartilhar Esta Máscara",
        SubTitle: "Gerar um link para esta máscara",
        Action: "Copiar Link",
      },
    },
  },
  NewChat: {
    Return: "Retornar",
    Skip: "Apenas Começar",
    Title: "Escolher uma Máscara",
    SubTitle: "Converse com a Alma por trás da Máscara",
    More: "Encontre Mais",
    NotShow: "Nunca Mostrar Novamente",
    ConfirmNoShow:
      "Confirmar para desabilitar？Você pode habilitar nas configurações depois.",
  },

  UI: {
    Confirm: "Confirmar",
    Cancel: "Cancelar",
    Close: "Fechar",
    Create: "Criar",
    Continue: "Continuar",
    Edit: "Editar",
    Export: "Exportar",
    Import: "Importar",
    Sync: "Sincronizar",
    Config: "Configurar",
    Manage: "Gerenciar",
  },
  Exporter: {
    Description: {
      Title: "Apenas mensagens após a limpeza do contexto serão exibidas",
    },
    Model: "Modelo",
    ServiceProvider: "Provedor de Serviço",
    Messages: "Mensagens",
    Topic: "Tópico",
    Time: "Tempo",
  },

  URLCommand: {
    Code: "Código de acesso detectado a partir da url, confirmar para aplicar? ",
    Settings:
      "Configurações detectadas a partir da url, confirmar para aplicar?",
  },
};

export default pt;
