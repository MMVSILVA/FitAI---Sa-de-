import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateProjectDescription = async (projectName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gere uma descrição profissional e inspiradora para um projeto educacional chamado "${projectName}". A descrição deve ser curta e direta, focada em SaaS educacional.`,
    });
    return response.text || "Descrição não gerada.";
  } catch (error) {
    console.error("Erro ao gerar descrição:", error);
    return "Erro ao gerar descrição com IA.";
  }
};

export const generateTasks = async (projectName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gere uma lista de 5 tarefas essenciais para iniciar o projeto educacional "${projectName}". Retorne apenas as tarefas em formato JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Título da tarefa" },
            },
            required: ["title"],
          },
        },
      },
    });
    
    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr) as { title: string }[];
  } catch (error) {
    console.error("Erro ao gerar tarefas:", error);
    return [];
  }
};

export const generateCanvas = async (projectName: string, projectDescription: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gere um Business Model Canvas para o projeto educacional "${projectName}". Descrição base: ${projectDescription}. Retorne os 9 blocos em formato JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            parceiros_chave: { type: Type.STRING },
            atividades_chave: { type: Type.STRING },
            recursos_chave: { type: Type.STRING },
            proposta_valor: { type: Type.STRING },
            relacionamento_cliente: { type: Type.STRING },
            canais: { type: Type.STRING },
            segmentos_clientes: { type: Type.STRING },
            estrutura_custos: { type: Type.STRING },
            fluxo_receitas: { type: Type.STRING },
          },
          required: ["parceiros_chave", "atividades_chave", "recursos_chave", "proposta_valor", "relacionamento_cliente", "canais", "segmentos_clientes", "estrutura_custos", "fluxo_receitas"],
        },
      },
    });
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Erro ao gerar canvas:", error);
    return null;
  }
};

export const generateReport = async (projectName: string, description: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gere um Resumo Expandido para o projeto "${projectName}". Descrição base: ${description}. O resumo expandido deve ter entre 600 e 700 palavras, e incluir Introdução, Metodologia, Resultados e Conclusão, seguindo o padrão acadêmico.`,
    });
    return response.text || "Resumo Expandido não gerado.";
  } catch (error) {
    console.error("Erro ao gerar resumo expandido:", error);
    return "Erro ao gerar resumo expandido com IA.";
  }
};

export const generateBannerContent = async (projectName: string, projectDescription: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gere o conteúdo textual para um banner de apresentação do projeto "${projectName}". Descrição base: ${projectDescription}. Inclua título, slogan, 3 pontos principais e um call to action.`,
    });
    return response.text || "Conteúdo do banner não gerado.";
  } catch (error) {
    console.error("Erro ao gerar banner:", error);
    return "Erro ao gerar conteúdo do banner com IA.";
  }
};

export const generatePitchScript = async (projectName: string, projectDescription: string, relatorio?: string) => {
  try {
    const context = relatorio ? `Baseie-se no seguinte Resumo Expandido do projeto:\n${relatorio}` : `Descrição base: ${projectDescription}`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gere um roteiro de pitch de 1 a 3 minutos para o projeto "${projectName}". ${context}. O roteiro deve ser persuasivo e seguir a estrutura: Gancho, Problema, Solução, Diferencial e Chamada para Ação.`,
    });
    return response.text || "Roteiro do pitch não gerado.";
  } catch (error) {
    console.error("Erro ao gerar pitch:", error);
    return "Erro ao gerar roteiro do pitch com IA.";
  }
};
