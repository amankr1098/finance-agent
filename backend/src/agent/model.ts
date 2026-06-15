import { ChatGoogle } from "@langchain/google";
import { ChatOpenRouter } from "@langchain/openrouter";
import "dotenv/config";


export type Provider = "google" | "openrouter";

export type ModelName = "gemini-2.5-pro" | "x-ai/grok-4.3" | "gpt-4.1" | "gpt-3.5-turbo" | "openai/gpt-oss-120b:free";

// const geminiModel = new ChatGoogle({
//   temperature: 0.0,
//   model: "gemini-2.5-pro",
//   apiKey : process.env.GEMINI_API_KEY!,
// });


// const openRouterModel = new ChatOpenRouter({
//     temperature: 0.0,
//     model: "x-ai/grok-4.3",
//     apiKey: process.env.OPENROUTER_API_KEY!,
//     maxTokens: 1024,
// })



export function getModel(provider : Provider, modelName?: ModelName) : ChatGoogle | ChatOpenRouter {
    switch(provider) {
        case "google":
            return new ChatGoogle({
                temperature: 0.0,
                model: modelName || "gemini-2.5-pro",
                apiKey : process.env.GEMINI_API_KEY!,
            });
        case "openrouter":
            return new ChatOpenRouter({
                temperature: 0.0,
                model: modelName || "openai/gpt-oss-120b:free",
                apiKey: process.env.OPENROUTER_API_KEY!,
                maxTokens: 1024,
            });
        default:
            throw new Error(`Unsupported provider: ${provider}`);
    }
}