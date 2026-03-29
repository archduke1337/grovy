"use client";

import { Account, Client, TablesDB } from "appwrite";

import { getPublicAppwriteConfig } from "@/app/lib/appwrite/config";

let browserClient: Client | null = null;

export function getBrowserAppwriteClient(): Client {
  if (typeof window === "undefined") {
    throw new Error("Browser Appwrite client requested on the server");
  }

  if (!browserClient) {
    const { endpoint, projectId } = getPublicAppwriteConfig();
    browserClient = new Client().setEndpoint(endpoint).setProject(projectId);
  }

  return browserClient;
}

export function getBrowserAccount(): Account {
  return new Account(getBrowserAppwriteClient());
}

export function getBrowserTablesDB(): TablesDB {
  return new TablesDB(getBrowserAppwriteClient());
}
