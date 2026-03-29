#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  Client,
  TablesDB,
  TablesDBIndexType,
} = require("node-appwrite");

const DEFAULT_DATABASE_ID = "grovy_main";
const DEFAULT_DATABASE_NAME = "Grovy Main";
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 180000;

const loadedFromFiles = new Set();

const TABLES = [
  {
    id: "playlists",
    name: "Playlists",
    columns: [
      { key: "userId", type: "varchar", size: 64, required: true },
      { key: "name", type: "varchar", size: 256, required: true },
      { key: "cover", type: "url", required: false },
      { key: "description", type: "text", required: false },
      { key: "songCount", type: "integer", required: false, xdefault: 0 },
      { key: "isPinned", type: "boolean", required: false, xdefault: false },
      { key: "updatedAt", type: "datetime", required: true },
    ],
    indexes: [
      {
        key: "idx_pl_user_updated",
        type: "key",
        columns: ["userId", "updatedAt"],
      },
      {
        key: "idx_pl_user_name",
        type: "key",
        columns: ["userId", "name"],
      },
    ],
  },
  {
    id: "playlist_tracks",
    name: "Playlist Tracks",
    columns: [
      { key: "userId", type: "varchar", size: 64, required: true },
      { key: "playlistId", type: "varchar", size: 64, required: true },
      { key: "songId", type: "varchar", size: 128, required: true },
      { key: "title", type: "varchar", size: 512, required: true },
      { key: "artist", type: "varchar", size: 512, required: true },
      { key: "url", type: "url", required: true },
      { key: "cover", type: "url", required: false },
      { key: "genre", type: "varchar", size: 128, required: false },
      { key: "duration", type: "integer", required: false },
      { key: "source", type: "varchar", size: 64, required: true },
      { key: "position", type: "integer", required: true },
      { key: "addedAt", type: "datetime", required: true },
    ],
    indexes: [
      {
        key: "idx_pt_playlist_pos",
        type: "key",
        columns: ["playlistId", "position"],
      },
      {
        key: "uniq_pt_playlist_song",
        type: "unique",
        columns: ["playlistId", "songId"],
      },
      {
        key: "idx_pt_user_playlist",
        type: "key",
        columns: ["userId", "playlistId"],
      },
    ],
  },
  {
    id: "favorites",
    name: "Favorites",
    columns: [
      { key: "userId", type: "varchar", size: 64, required: true },
      { key: "songId", type: "varchar", size: 128, required: true },
      { key: "title", type: "varchar", size: 512, required: true },
      { key: "artist", type: "varchar", size: 512, required: true },
      { key: "url", type: "url", required: true },
      { key: "cover", type: "url", required: false },
      { key: "genre", type: "varchar", size: 128, required: false },
      { key: "duration", type: "integer", required: false },
      { key: "source", type: "varchar", size: 64, required: true },
      { key: "addedAt", type: "datetime", required: true },
    ],
    indexes: [
      {
        key: "uniq_fav_user_song",
        type: "unique",
        columns: ["userId", "songId"],
      },
      {
        key: "idx_fav_user_added",
        type: "key",
        columns: ["userId", "addedAt"],
      },
    ],
  },
  {
    id: "play_history",
    name: "Play History",
    columns: [
      { key: "userId", type: "varchar", size: 64, required: true },
      { key: "songId", type: "varchar", size: 128, required: true },
      { key: "title", type: "varchar", size: 512, required: true },
      { key: "artist", type: "varchar", size: 512, required: true },
      { key: "url", type: "url", required: true },
      { key: "cover", type: "url", required: false },
      { key: "genre", type: "varchar", size: 128, required: false },
      { key: "duration", type: "integer", required: false },
      { key: "source", type: "varchar", size: 64, required: true },
      { key: "playedAt", type: "datetime", required: true },
      {
        key: "contextType",
        type: "enum",
        elements: ["search", "radio", "playlist", "related", "manual"],
        required: true,
      },
      { key: "contextRef", type: "varchar", size: 128, required: false },
    ],
    indexes: [
      {
        key: "idx_hist_user_played",
        type: "key",
        columns: ["userId", "playedAt"],
      },
      {
        key: "idx_hist_user_song",
        type: "key",
        columns: ["userId", "songId"],
      },
    ],
  },
  {
    id: "queue_snapshots",
    name: "Queue Snapshots",
    columns: [
      { key: "userId", type: "varchar", size: 64, required: true },
      { key: "queueJson", type: "text", required: true },
      { key: "currentSongIndex", type: "integer", required: true },
      {
        key: "playbackState",
        type: "enum",
        elements: ["playing", "paused"],
        required: true,
      },
      { key: "updatedAt", type: "datetime", required: true },
    ],
    indexes: [
      {
        key: "uniq_queue_user",
        type: "unique",
        columns: ["userId"],
      },
    ],
  },
  {
    id: "search_cache",
    name: "Search Cache",
    columns: [
      { key: "userId", type: "varchar", size: 64, required: true },
      { key: "cacheKey", type: "varchar", size: 256, required: true },
      { key: "query", type: "varchar", size: 512, required: true },
      { key: "source", type: "varchar", size: 64, required: false },
      { key: "resultsJson", type: "text", required: true },
      { key: "expiresAt", type: "datetime", required: true },
      { key: "updatedAt", type: "datetime", required: true },
    ],
    indexes: [
      {
        key: "uniq_sc_user_cache",
        type: "unique",
        columns: ["userId", "cacheKey"],
      },
      {
        key: "idx_sc_user_exp",
        type: "key",
        columns: ["userId", "expiresAt"],
      },
    ],
  },
];

function loadEnvFile(filePath, options = {}) {
  const { override = false } = options;
  if (!fs.existsSync(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/);

  for (const untrimmed of lines) {
    const line = untrimmed.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator < 0) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    if (!key) {
      continue;
    }

    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Ignore scaffold placeholders like <PROJECT_ID> so they do not
    // override real values from another env file.
    if (/<[^>]+>/.test(value)) {
      continue;
    }

    const alreadyLoadedFromFile = loadedFromFiles.has(key);
    const fromShell =
      Object.prototype.hasOwnProperty.call(process.env, key) &&
      !alreadyLoadedFromFile;

    if (fromShell) {
      continue;
    }

    if (!alreadyLoadedFromFile || override) {
      process.env[key] = value;
      loadedFromFiles.add(key);
    }
  }
}

function loadEnv() {
  const root = process.cwd();
  loadEnvFile(path.join(root, ".env"));
  loadEnvFile(path.join(root, ".env.local"), { override: true });
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getEnv(name, fallback) {
  const value = process.env[name]?.trim();
  return value || fallback;
}

function toErrorMessage(error) {
  if (error && typeof error === "object") {
    const code = error.code ? `code=${error.code}` : "";
    const type = error.type ? `type=${error.type}` : "";
    const message = error.message ? String(error.message) : "Unknown error";
    return [code, type, message].filter(Boolean).join(" ");
  }
  return String(error);
}

function isNotFound(error) {
  const code = Number(error?.code);
  const type = String(error?.type || "");
  const message = String(error?.message || "");

  return code === 404 || type.includes("not_found") || /not found/i.test(message);
}

function isAlreadyExists(error) {
  const code = Number(error?.code);
  const type = String(error?.type || "");
  const message = String(error?.message || "");

  return (
    code === 409 ||
    type.includes("already_exists") ||
    /already exists|duplicate/i.test(message)
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function indexTypeFromString(type) {
  switch (type) {
    case "key":
      return TablesDBIndexType.Key;
    case "unique":
      return TablesDBIndexType.Unique;
    case "fulltext":
      return TablesDBIndexType.Fulltext;
    default:
      throw new Error(`Unsupported index type: ${type}`);
  }
}

async function ensureDatabase(tables, databaseId, databaseName) {
  try {
    await tables.get({ databaseId });
    console.log(`✔ Database exists: ${databaseId}`);
  } catch (error) {
    if (!isNotFound(error)) {
      throw error;
    }

    console.log(`• Creating database: ${databaseId}`);
    await tables.create({
      databaseId,
      name: databaseName,
      enabled: true,
    });
    console.log(`✔ Database created: ${databaseId}`);
  }
}

async function ensureTable(tables, databaseId, tableConfig) {
  try {
    const existing = await tables.getTable({
      databaseId,
      tableId: tableConfig.id,
    });

    console.log(`✔ Table exists: ${tableConfig.id}`);

    const needsUpdate =
      existing.name !== tableConfig.name ||
      existing.rowSecurity !== true ||
      existing.enabled !== true;

    if (needsUpdate) {
      await tables.updateTable({
        databaseId,
        tableId: tableConfig.id,
        name: tableConfig.name,
        rowSecurity: true,
        enabled: true,
      });
      console.log(`↻ Table normalized: ${tableConfig.id}`);
    }
  } catch (error) {
    if (!isNotFound(error)) {
      throw error;
    }

    console.log(`• Creating table: ${tableConfig.id}`);
    await tables.createTable({
      databaseId,
      tableId: tableConfig.id,
      name: tableConfig.name,
      permissions: [],
      rowSecurity: true,
      enabled: true,
    });
    console.log(`✔ Table created: ${tableConfig.id}`);
  }
}

async function getColumnsMap(tables, databaseId, tableId) {
  const response = await tables.listColumns({
    databaseId,
    tableId,
    total: false,
  });

  const map = new Map();
  for (const column of response.columns) {
    map.set(column.key, column);
  }
  return map;
}

async function getIndexesMap(tables, databaseId, tableId) {
  const response = await tables.listIndexes({
    databaseId,
    tableId,
    total: false,
  });

  const map = new Map();
  for (const index of response.indexes) {
    map.set(index.key, index);
  }
  return map;
}

function defaultPayload(column) {
  if (column.required || column.xdefault === undefined) {
    return {};
  }
  return { xdefault: column.xdefault };
}

function arrayPayload(column) {
  return column.array ? { array: true } : {};
}

async function createColumn(tables, databaseId, tableId, column) {
  const common = {
    databaseId,
    tableId,
    key: column.key,
    required: column.required,
  };

  switch (column.type) {
    case "varchar":
      await tables.createVarcharColumn({
        ...common,
        size: column.size,
        ...defaultPayload(column),
        ...arrayPayload(column),
      });
      return;

    case "text":
      await tables.createTextColumn({
        ...common,
        ...defaultPayload(column),
        ...arrayPayload(column),
      });
      return;

    case "url":
      await tables.createUrlColumn({
        ...common,
        ...defaultPayload(column),
        ...arrayPayload(column),
      });
      return;

    case "integer":
      await tables.createIntegerColumn({
        ...common,
        ...(column.min !== undefined ? { min: column.min } : {}),
        ...(column.max !== undefined ? { max: column.max } : {}),
        ...defaultPayload(column),
        ...arrayPayload(column),
      });
      return;

    case "boolean":
      await tables.createBooleanColumn({
        ...common,
        ...defaultPayload(column),
        ...arrayPayload(column),
      });
      return;

    case "datetime":
      await tables.createDatetimeColumn({
        ...common,
        ...defaultPayload(column),
        ...arrayPayload(column),
      });
      return;

    case "enum":
      await tables.createEnumColumn({
        ...common,
        elements: column.elements,
        ...defaultPayload(column),
        ...arrayPayload(column),
      });
      return;

    default:
      throw new Error(`Unsupported column type: ${column.type}`);
  }
}

async function waitForColumnsAvailable(tables, databaseId, tableId, expectedKeys) {
  const start = Date.now();

  while (Date.now() - start < POLL_TIMEOUT_MS) {
    const columns = await getColumnsMap(tables, databaseId, tableId);

    let allReady = true;
    for (const key of expectedKeys) {
      const column = columns.get(key);
      if (!column) {
        allReady = false;
        continue;
      }

      if (column.status === "failed" || column.status === "stuck") {
        throw new Error(`Column ${tableId}.${key} failed: ${column.error || "Unknown error"}`);
      }

      if (column.status !== "available") {
        allReady = false;
      }
    }

    if (allReady) {
      return;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`Timed out waiting for columns on table ${tableId}`);
}

async function waitForIndexesAvailable(tables, databaseId, tableId, expectedKeys) {
  const start = Date.now();

  while (Date.now() - start < POLL_TIMEOUT_MS) {
    const indexes = await getIndexesMap(tables, databaseId, tableId);

    let allReady = true;
    for (const key of expectedKeys) {
      const index = indexes.get(key);
      if (!index) {
        allReady = false;
        continue;
      }

      if (index.status === "failed" || index.status === "stuck") {
        throw new Error(`Index ${tableId}.${key} failed: ${index.error || "Unknown error"}`);
      }

      if (index.status !== "available") {
        allReady = false;
      }
    }

    if (allReady) {
      return;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`Timed out waiting for indexes on table ${tableId}`);
}

async function ensureColumns(tables, databaseId, tableConfig) {
  let existingColumns = await getColumnsMap(tables, databaseId, tableConfig.id);

  for (const column of tableConfig.columns) {
    if (existingColumns.has(column.key)) {
      continue;
    }

    console.log(`  • Creating column: ${tableConfig.id}.${column.key}`);
    try {
      await createColumn(tables, databaseId, tableConfig.id, column);
      console.log(`  ✔ Column created: ${tableConfig.id}.${column.key}`);
    } catch (error) {
      if (!isAlreadyExists(error)) {
        throw error;
      }
      console.log(`  ↻ Column already exists: ${tableConfig.id}.${column.key}`);
    }

    existingColumns = await getColumnsMap(tables, databaseId, tableConfig.id);
  }

  await waitForColumnsAvailable(
    tables,
    databaseId,
    tableConfig.id,
    tableConfig.columns.map((column) => column.key)
  );
}

async function ensureIndexes(tables, databaseId, tableConfig) {
  let existingIndexes = await getIndexesMap(tables, databaseId, tableConfig.id);

  for (const index of tableConfig.indexes) {
    if (existingIndexes.has(index.key)) {
      continue;
    }

    console.log(`  • Creating index: ${tableConfig.id}.${index.key}`);
    try {
      await tables.createIndex({
        databaseId,
        tableId: tableConfig.id,
        key: index.key,
        type: indexTypeFromString(index.type),
        columns: index.columns,
      });
      console.log(`  ✔ Index created: ${tableConfig.id}.${index.key}`);
    } catch (error) {
      if (!isAlreadyExists(error)) {
        throw error;
      }
      console.log(`  ↻ Index already exists: ${tableConfig.id}.${index.key}`);
    }

    existingIndexes = await getIndexesMap(tables, databaseId, tableConfig.id);
  }

  await waitForIndexesAvailable(
    tables,
    databaseId,
    tableConfig.id,
    tableConfig.indexes.map((index) => index.key)
  );
}

async function main() {
  loadEnv();

  const endpoint = requireEnv("NEXT_PUBLIC_APPWRITE_ENDPOINT");
  const projectId = requireEnv("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  const apiKey = requireEnv("APPWRITE_API_KEY");
  const databaseId = getEnv("NEXT_PUBLIC_APPWRITE_DATABASE_ID", DEFAULT_DATABASE_ID);
  const databaseName = getEnv("APPWRITE_DATABASE_NAME", DEFAULT_DATABASE_NAME);

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const tables = new TablesDB(client);

  console.log("\nAppwrite bootstrap started");
  console.log(`Project: ${projectId}`);
  console.log(`Database: ${databaseId}`);

  await ensureDatabase(tables, databaseId, databaseName);

  for (const tableConfig of TABLES) {
    console.log(`\nTable: ${tableConfig.id}`);
    await ensureTable(tables, databaseId, tableConfig);
    await ensureColumns(tables, databaseId, tableConfig);
    await ensureIndexes(tables, databaseId, tableConfig);
  }

  console.log("\nAppwrite bootstrap completed successfully.");
}

main().catch((error) => {
  console.error("\nAppwrite bootstrap failed.");
  console.error(toErrorMessage(error));
  process.exitCode = 1;
});
