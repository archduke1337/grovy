import { Account, Client, TablesDB } from "node-appwrite";

import {
  getPublicAppwriteConfig,
  getServerAppwriteConfig,
} from "@/app/lib/appwrite/config";

export function createAdminAppwriteClients(userAgent?: string) {
  const { endpoint, projectId, apiKey } = getServerAppwriteConfig();

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  if (userAgent) {
    client.setForwardedUserAgent(userAgent);
  }

  return {
    client,
    account: new Account(client),
    tables: new TablesDB(client),
  };
}

export function createPublicAppwriteClients(userAgent?: string) {
  const { endpoint, projectId } = getPublicAppwriteConfig();

  const client = new Client().setEndpoint(endpoint).setProject(projectId);

  if (userAgent) {
    client.setForwardedUserAgent(userAgent);
  }

  return {
    client,
    account: new Account(client),
    tables: new TablesDB(client),
  };
}

export function createSessionAppwriteClients(
  sessionSecret: string,
  userAgent?: string
) {
  const { endpoint, projectId } = getPublicAppwriteConfig();

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setSession(sessionSecret);

  if (userAgent) {
    client.setForwardedUserAgent(userAgent);
  }

  return {
    client,
    account: new Account(client),
    tables: new TablesDB(client),
  };
}
