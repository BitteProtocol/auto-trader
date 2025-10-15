import { DEFAULT_STRATEGY, StrategyConfig } from "./strategies";


export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`${key} is not set`);
  }
  return value;
}

export const CRON_SECRET = getEnvVar("CRON_SECRET");
export const BITTE_API_KEY = getEnvVar("BITTE_API_KEY");
export const NEAR_PK = getEnvVar("NEAR_PK") as `ed25519:${string}`;
export const ACCOUNT_ID = getEnvVar("NEXT_PUBLIC_ACCOUNT_ID");
export const DEPLOYMENT_URL = getEnvVar("NEXT_PUBLIC_VERCEL_URL", "");


let envStrategy: StrategyConfig | undefined;
if (process.env.STRATEGY) {
  try {
    envStrategy = JSON.parse(process.env.STRATEGY) as StrategyConfig;
    console.log("Loaded custom strategy from STRATEGY environment variable");
  } catch (error) {
    console.warn("Failed to parse STRATEGY environment variable, using default:", error);
  }
}

export const AGENT_STRATEGY = envStrategy || DEFAULT_STRATEGY;