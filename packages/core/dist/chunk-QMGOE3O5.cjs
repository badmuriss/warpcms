'use strict';

var chunkJUS7ZTDS_cjs = require('./chunk-JUS7ZTDS.cjs');
var chunkTAYKWZ2B_cjs = require('./chunk-TAYKWZ2B.cjs');
var chunkJXL7JFEE_cjs = require('./chunk-JXL7JFEE.cjs');
var chunkH6HP2MEA_cjs = require('./chunk-H6HP2MEA.cjs');
var chunk4IO5UBHK_cjs = require('./chunk-4IO5UBHK.cjs');
var chunkJLNQTGWQ_cjs = require('./chunk-JLNQTGWQ.cjs');
var chunkRCQ2HIQD_cjs = require('./chunk-RCQ2HIQD.cjs');
var hono = require('hono');
var cors = require('hono/cors');
var zod = require('zod');
var cookie = require('hono/cookie');
var html = require('hono/html');

// src/schemas/index.ts
var schemaDefinitions = [];
var apiContentCrudRoutes = new hono.Hono();
apiContentCrudRoutes.get("/check-slug", async (c) => {
  try {
    const db = c.env.DB;
    const collectionId = c.req.query("collectionId");
    const slug = c.req.query("slug");
    const excludeId = c.req.query("excludeId");
    if (!collectionId || !slug) {
      return c.json({ error: "collectionId and slug are required" }, 400);
    }
    let query = "SELECT id FROM content WHERE collection_id = ? AND slug = ?";
    const params = [collectionId, slug];
    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }
    const existing = await db.prepare(query).bind(...params).first();
    if (existing) {
      return c.json({
        available: false,
        message: "This URL slug is already in use in this collection"
      });
    }
    return c.json({ available: true });
  } catch (error) {
    console.error("Error checking slug:", error);
    return c.json({
      error: "Failed to check slug availability",
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});
apiContentCrudRoutes.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const db = c.env.DB;
    const stmt = db.prepare("SELECT * FROM content WHERE id = ?");
    const content = await stmt.bind(id).first();
    if (!content) {
      return c.json({ error: "Content not found" }, 404);
    }
    const transformedContent = {
      id: content.id,
      title: content.title,
      slug: content.slug,
      status: content.status,
      collectionId: content.collection_id,
      data: content.data ? JSON.parse(content.data) : {},
      created_at: content.created_at,
      updated_at: content.updated_at
    };
    return c.json({ data: transformedContent });
  } catch (error) {
    console.error("Error fetching content:", error);
    return c.json({
      error: "Failed to fetch content",
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});
apiContentCrudRoutes.post("/", chunkTAYKWZ2B_cjs.requireAuth(), async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get("user");
    const body = await c.req.json();
    const { collectionId, title, slug, status, data } = body;
    if (!collectionId) {
      return c.json({ error: "collectionId is required" }, 400);
    }
    if (!title) {
      return c.json({ error: "title is required" }, 400);
    }
    let finalSlug = slug || title;
    finalSlug = finalSlug.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
    const duplicateCheck = db.prepare(
      "SELECT id FROM content WHERE collection_id = ? AND slug = ?"
    );
    const existing = await duplicateCheck.bind(collectionId, finalSlug).first();
    if (existing) {
      return c.json({ error: "A content item with this slug already exists in this collection" }, 409);
    }
    const contentId = crypto.randomUUID();
    const now = Date.now();
    const insertStmt = db.prepare(`
      INSERT INTO content (
        id, collection_id, slug, title, data, status,
        author_id, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    await insertStmt.bind(
      contentId,
      collectionId,
      finalSlug,
      title,
      JSON.stringify(data || {}),
      status || "draft",
      user?.userId || "system",
      now,
      now
    ).run();
    const cache = chunkJUS7ZTDS_cjs.getCacheService(chunkJUS7ZTDS_cjs.CACHE_CONFIGS.api);
    await cache.invalidate(`content:list:${collectionId}:*`);
    await cache.invalidate("content-filtered:*");
    const getStmt = db.prepare("SELECT * FROM content WHERE id = ?");
    const createdContent = await getStmt.bind(contentId).first();
    return c.json({
      data: {
        id: createdContent.id,
        title: createdContent.title,
        slug: createdContent.slug,
        status: createdContent.status,
        collectionId: createdContent.collection_id,
        data: createdContent.data ? JSON.parse(createdContent.data) : {},
        created_at: createdContent.created_at,
        updated_at: createdContent.updated_at
      }
    }, 201);
  } catch (error) {
    console.error("Error creating content:", error);
    return c.json({
      error: "Failed to create content",
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});
apiContentCrudRoutes.put("/:id", chunkTAYKWZ2B_cjs.requireAuth(), async (c) => {
  try {
    const id = c.req.param("id");
    const db = c.env.DB;
    const body = await c.req.json();
    const existingStmt = db.prepare("SELECT * FROM content WHERE id = ?");
    const existing = await existingStmt.bind(id).first();
    if (!existing) {
      return c.json({ error: "Content not found" }, 404);
    }
    const updates = [];
    const params = [];
    if (body.title !== void 0) {
      updates.push("title = ?");
      params.push(body.title);
    }
    if (body.slug !== void 0) {
      let finalSlug = body.slug.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
      updates.push("slug = ?");
      params.push(finalSlug);
    }
    if (body.status !== void 0) {
      updates.push("status = ?");
      params.push(body.status);
    }
    if (body.data !== void 0) {
      updates.push("data = ?");
      params.push(JSON.stringify(body.data));
    }
    const now = Date.now();
    updates.push("updated_at = ?");
    params.push(now);
    params.push(id);
    const updateStmt = db.prepare(`
      UPDATE content SET ${updates.join(", ")}
      WHERE id = ?
    `);
    await updateStmt.bind(...params).run();
    const cache = chunkJUS7ZTDS_cjs.getCacheService(chunkJUS7ZTDS_cjs.CACHE_CONFIGS.api);
    await cache.delete(cache.generateKey("content", id));
    await cache.invalidate(`content:list:${existing.collection_id}:*`);
    await cache.invalidate("content-filtered:*");
    const getStmt = db.prepare("SELECT * FROM content WHERE id = ?");
    const updatedContent = await getStmt.bind(id).first();
    return c.json({
      data: {
        id: updatedContent.id,
        title: updatedContent.title,
        slug: updatedContent.slug,
        status: updatedContent.status,
        collectionId: updatedContent.collection_id,
        data: updatedContent.data ? JSON.parse(updatedContent.data) : {},
        created_at: updatedContent.created_at,
        updated_at: updatedContent.updated_at
      }
    });
  } catch (error) {
    console.error("Error updating content:", error);
    return c.json({
      error: "Failed to update content",
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});
apiContentCrudRoutes.delete("/:id", chunkTAYKWZ2B_cjs.requireAuth(), async (c) => {
  try {
    const id = c.req.param("id");
    const db = c.env.DB;
    const existingStmt = db.prepare("SELECT collection_id FROM content WHERE id = ?");
    const existing = await existingStmt.bind(id).first();
    if (!existing) {
      return c.json({ error: "Content not found" }, 404);
    }
    const deleteStmt = db.prepare("DELETE FROM content WHERE id = ?");
    await deleteStmt.bind(id).run();
    const cache = chunkJUS7ZTDS_cjs.getCacheService(chunkJUS7ZTDS_cjs.CACHE_CONFIGS.api);
    await cache.delete(cache.generateKey("content", id));
    await cache.invalidate(`content:list:${existing.collection_id}:*`);
    await cache.invalidate("content-filtered:*");
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting content:", error);
    return c.json({
      error: "Failed to delete content",
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});
var api_content_crud_default = apiContentCrudRoutes;

// src/routes/api.ts
var apiRoutes = new hono.Hono();
apiRoutes.use("*", async (c, next) => {
  const startTime = Date.now();
  c.set("startTime", startTime);
  await next();
  const totalTime = Date.now() - startTime;
  c.header("X-Response-Time", `${totalTime}ms`);
});
apiRoutes.use("*", async (c, next) => {
  const cacheEnabled = await chunkTAYKWZ2B_cjs.isPluginActive(c.env.DB, "core-cache");
  c.set("cacheEnabled", cacheEnabled);
  await next();
});
apiRoutes.use("*", cors.cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"]
}));
function addTimingMeta(c, meta = {}, executionStartTime) {
  const totalTime = Date.now() - c.get("startTime");
  const executionTime = executionStartTime ? Date.now() - executionStartTime : void 0;
  return {
    ...meta,
    timing: {
      total: totalTime,
      execution: executionTime,
      unit: "ms"
    }
  };
}
apiRoutes.get("/", (c) => {
  const baseUrl = new URL(c.req.url);
  const serverUrl = `${baseUrl.protocol}//${baseUrl.host}`;
  return c.json({
    openapi: "3.0.0",
    info: {
      title: "WarpCMS API",
      version: "0.1.0",
      description: "RESTful API for WarpCMS headless CMS - a modern, edge-first content management system built on Cloudflare Workers",
      contact: {
        name: "WarpCMS Support",
        url: `${serverUrl}/docs`,
        email: "support@warpcms.dev"
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT"
      }
    },
    servers: [
      {
        url: serverUrl,
        description: "Current server"
      }
    ],
    paths: {
      "/api/": {
        get: {
          summary: "API Information",
          description: "Returns OpenAPI specification for the WarpCMS API",
          operationId: "getApiInfo",
          tags: ["System"],
          responses: {
            "200": {
              description: "OpenAPI specification",
              content: {
                "application/json": {
                  schema: { type: "object" }
                }
              }
            }
          }
        }
      },
      "/api/health": {
        get: {
          summary: "Health Check",
          description: "Returns API health status and available schemas",
          operationId: "getHealth",
          tags: ["System"],
          responses: {
            "200": {
              description: "Health status",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "healthy" },
                      timestamp: { type: "string", format: "date-time" },
                      schemas: { type: "array", items: { type: "string" } }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/collections": {
        get: {
          summary: "List Collections",
          description: "Returns all active collections with their schemas",
          operationId: "getCollections",
          tags: ["Content"],
          responses: {
            "200": {
              description: "List of collections",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            display_name: { type: "string" },
                            schema: { type: "object" },
                            is_active: { type: "integer" }
                          }
                        }
                      },
                      meta: { type: "object" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/collections/{collection}/content": {
        get: {
          summary: "Get Collection Content",
          description: "Returns content items from a specific collection with filtering support",
          operationId: "getCollectionContent",
          tags: ["Content"],
          parameters: [
            {
              name: "collection",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Collection name"
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 50, maximum: 1e3 },
              description: "Maximum number of items to return"
            },
            {
              name: "offset",
              in: "query",
              schema: { type: "integer", default: 0 },
              description: "Number of items to skip"
            },
            {
              name: "status",
              in: "query",
              schema: { type: "string", enum: ["draft", "published", "archived"] },
              description: "Filter by content status"
            }
          ],
          responses: {
            "200": {
              description: "List of content items",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: { type: "object" } },
                      meta: { type: "object" }
                    }
                  }
                }
              }
            },
            "404": {
              description: "Collection not found"
            }
          }
        }
      },
      "/api/content": {
        get: {
          summary: "List Content",
          description: "Returns content items with advanced filtering support",
          operationId: "getContent",
          tags: ["Content"],
          parameters: [
            {
              name: "collection",
              in: "query",
              schema: { type: "string" },
              description: "Filter by collection name"
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 50, maximum: 1e3 },
              description: "Maximum number of items to return"
            },
            {
              name: "offset",
              in: "query",
              schema: { type: "integer", default: 0 },
              description: "Number of items to skip"
            }
          ],
          responses: {
            "200": {
              description: "List of content items",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: { type: "object" } },
                      meta: { type: "object" }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: "Create Content",
          description: "Creates a new content item",
          operationId: "createContent",
          tags: ["Content"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["collection_id", "title"],
                  properties: {
                    collection_id: { type: "string" },
                    title: { type: "string" },
                    slug: { type: "string" },
                    status: { type: "string", enum: ["draft", "published", "archived"] },
                    data: { type: "object" }
                  }
                }
              }
            }
          },
          responses: {
            "201": { description: "Content created successfully" },
            "400": { description: "Invalid request body" },
            "401": { description: "Unauthorized" }
          }
        }
      },
      "/api/content/{id}": {
        get: {
          summary: "Get Content by ID",
          description: "Returns a specific content item by ID",
          operationId: "getContentById",
          tags: ["Content"],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Content item ID"
            }
          ],
          responses: {
            "200": { description: "Content item" },
            "404": { description: "Content not found" }
          }
        },
        put: {
          summary: "Update Content",
          description: "Updates an existing content item",
          operationId: "updateContent",
          tags: ["Content"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Content item ID"
            }
          ],
          responses: {
            "200": { description: "Content updated successfully" },
            "401": { description: "Unauthorized" },
            "404": { description: "Content not found" }
          }
        },
        delete: {
          summary: "Delete Content",
          description: "Deletes a content item",
          operationId: "deleteContent",
          tags: ["Content"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Content item ID"
            }
          ],
          responses: {
            "200": { description: "Content deleted successfully" },
            "401": { description: "Unauthorized" },
            "404": { description: "Content not found" }
          }
        }
      },
      "/api/media": {
        get: {
          summary: "List Media",
          description: "Returns all media files with pagination",
          operationId: "getMedia",
          tags: ["Media"],
          responses: {
            "200": { description: "List of media files" }
          }
        }
      },
      "/api/media/upload": {
        post: {
          summary: "Upload Media",
          description: "Uploads a new media file to R2 storage",
          operationId: "uploadMedia",
          tags: ["Media"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    file: { type: "string", format: "binary" }
                  }
                }
              }
            }
          },
          responses: {
            "201": { description: "Media uploaded successfully" },
            "401": { description: "Unauthorized" }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        Content: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            slug: { type: "string" },
            status: { type: "string", enum: ["draft", "published", "archived"] },
            collectionId: { type: "string", format: "uuid" },
            data: { type: "object" },
            created_at: { type: "integer" },
            updated_at: { type: "integer" }
          }
        },
        Collection: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            display_name: { type: "string" },
            description: { type: "string" },
            schema: { type: "object" },
            is_active: { type: "integer" }
          }
        },
        Media: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            filename: { type: "string" },
            mimetype: { type: "string" },
            size: { type: "integer" },
            url: { type: "string" }
          }
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            details: { type: "string" }
          }
        }
      }
    },
    tags: [
      { name: "System", description: "System and health endpoints" },
      { name: "Content", description: "Content management operations" },
      { name: "Media", description: "Media file operations" }
    ]
  });
});
apiRoutes.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    schemas: schemaDefinitions.map((s) => s.name)
  });
});
apiRoutes.get("/collections", async (c) => {
  const executionStart = Date.now();
  try {
    const db = c.env.DB;
    const cacheEnabled = c.get("cacheEnabled");
    const cache = chunkJUS7ZTDS_cjs.getCacheService(chunkJUS7ZTDS_cjs.CACHE_CONFIGS.api);
    const cacheKey = cache.generateKey("collections", "all");
    if (cacheEnabled) {
      const cacheResult = await cache.getWithSource(cacheKey);
      if (cacheResult.hit && cacheResult.data) {
        c.header("X-Cache-Status", "HIT");
        c.header("X-Cache-Source", cacheResult.source);
        if (cacheResult.ttl) {
          c.header("X-Cache-TTL", Math.floor(cacheResult.ttl).toString());
        }
        const dataWithMeta = {
          ...cacheResult.data,
          meta: addTimingMeta(c, {
            ...cacheResult.data.meta,
            cache: {
              hit: true,
              source: cacheResult.source,
              ttl: cacheResult.ttl ? Math.floor(cacheResult.ttl) : void 0
            }
          }, executionStart)
        };
        return c.json(dataWithMeta);
      }
    }
    c.header("X-Cache-Status", "MISS");
    c.header("X-Cache-Source", "database");
    const stmt = db.prepare("SELECT * FROM collections WHERE is_active = 1");
    const { results } = await stmt.all();
    const transformedResults = results.map((row) => ({
      ...row,
      schema: row.schema ? JSON.parse(row.schema) : {},
      is_active: row.is_active
      // Keep as number (1 or 0)
    }));
    const responseData = {
      data: transformedResults,
      meta: addTimingMeta(c, {
        count: results.length,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        cache: {
          hit: false,
          source: "database"
        }
      }, executionStart)
    };
    if (cacheEnabled) {
      await cache.set(cacheKey, responseData);
    }
    return c.json(responseData);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return c.json({ error: "Failed to fetch collections" }, 500);
  }
});
apiRoutes.get("/content", async (c) => {
  const executionStart = Date.now();
  try {
    const db = c.env.DB;
    const queryParams = c.req.query();
    if (queryParams.collection) {
      const collectionName = queryParams.collection;
      const collectionStmt = db.prepare("SELECT id FROM collections WHERE name = ? AND is_active = 1");
      const collectionResult = await collectionStmt.bind(collectionName).first();
      if (collectionResult) {
        queryParams.collection_id = collectionResult.id;
        delete queryParams.collection;
      } else {
        return c.json({
          data: [],
          meta: addTimingMeta(c, {
            count: 0,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            message: `Collection '${collectionName}' not found`
          }, executionStart)
        });
      }
    }
    const filter = chunkJLNQTGWQ_cjs.QueryFilterBuilder.parseFromQuery(queryParams);
    if (!filter.limit) {
      filter.limit = 50;
    }
    filter.limit = Math.min(filter.limit, 1e3);
    const builder = new chunkJLNQTGWQ_cjs.QueryFilterBuilder();
    const queryResult = builder.build("content", filter);
    if (queryResult.errors.length > 0) {
      return c.json({
        error: "Invalid filter parameters",
        details: queryResult.errors
      }, 400);
    }
    const cacheEnabled = c.get("cacheEnabled");
    const cache = chunkJUS7ZTDS_cjs.getCacheService(chunkJUS7ZTDS_cjs.CACHE_CONFIGS.api);
    const cacheKey = cache.generateKey("content-filtered", JSON.stringify({ filter, query: queryResult.sql }));
    if (cacheEnabled) {
      const cacheResult = await cache.getWithSource(cacheKey);
      if (cacheResult.hit && cacheResult.data) {
        c.header("X-Cache-Status", "HIT");
        c.header("X-Cache-Source", cacheResult.source);
        if (cacheResult.ttl) {
          c.header("X-Cache-TTL", Math.floor(cacheResult.ttl).toString());
        }
        const dataWithMeta = {
          ...cacheResult.data,
          meta: addTimingMeta(c, {
            ...cacheResult.data.meta,
            cache: {
              hit: true,
              source: cacheResult.source,
              ttl: cacheResult.ttl ? Math.floor(cacheResult.ttl) : void 0
            }
          }, executionStart)
        };
        return c.json(dataWithMeta);
      }
    }
    c.header("X-Cache-Status", "MISS");
    c.header("X-Cache-Source", "database");
    const stmt = db.prepare(queryResult.sql);
    const boundStmt = queryResult.params.length > 0 ? stmt.bind(...queryResult.params) : stmt;
    const { results } = await boundStmt.all();
    const transformedResults = results.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      status: row.status,
      collectionId: row.collection_id,
      data: row.data ? JSON.parse(row.data) : {},
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    const responseData = {
      data: transformedResults,
      meta: addTimingMeta(c, {
        count: results.length,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        filter,
        query: {
          sql: queryResult.sql,
          params: queryResult.params
        },
        cache: {
          hit: false,
          source: "database"
        }
      }, executionStart)
    };
    if (cacheEnabled) {
      await cache.set(cacheKey, responseData);
    }
    return c.json(responseData);
  } catch (error) {
    console.error("Error fetching content:", error);
    return c.json({
      error: "Failed to fetch content",
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});
apiRoutes.get("/collections/:collection/content", async (c) => {
  const executionStart = Date.now();
  try {
    const collection = c.req.param("collection");
    const db = c.env.DB;
    const queryParams = c.req.query();
    const collectionStmt = db.prepare("SELECT * FROM collections WHERE name = ? AND is_active = 1");
    const collectionResult = await collectionStmt.bind(collection).first();
    if (!collectionResult) {
      return c.json({ error: "Collection not found" }, 404);
    }
    const filter = chunkJLNQTGWQ_cjs.QueryFilterBuilder.parseFromQuery(queryParams);
    if (!filter.where) {
      filter.where = { and: [] };
    }
    if (!filter.where.and) {
      filter.where.and = [];
    }
    filter.where.and.push({
      field: "collection_id",
      operator: "equals",
      value: collectionResult.id
    });
    if (!filter.limit) {
      filter.limit = 50;
    }
    filter.limit = Math.min(filter.limit, 1e3);
    const builder = new chunkJLNQTGWQ_cjs.QueryFilterBuilder();
    const queryResult = builder.build("content", filter);
    if (queryResult.errors.length > 0) {
      return c.json({
        error: "Invalid filter parameters",
        details: queryResult.errors
      }, 400);
    }
    const cacheEnabled = c.get("cacheEnabled");
    const cache = chunkJUS7ZTDS_cjs.getCacheService(chunkJUS7ZTDS_cjs.CACHE_CONFIGS.api);
    const cacheKey = cache.generateKey("collection-content-filtered", `${collection}:${JSON.stringify({ filter, query: queryResult.sql })}`);
    if (cacheEnabled) {
      const cacheResult = await cache.getWithSource(cacheKey);
      if (cacheResult.hit && cacheResult.data) {
        c.header("X-Cache-Status", "HIT");
        c.header("X-Cache-Source", cacheResult.source);
        if (cacheResult.ttl) {
          c.header("X-Cache-TTL", Math.floor(cacheResult.ttl).toString());
        }
        const dataWithMeta = {
          ...cacheResult.data,
          meta: addTimingMeta(c, {
            ...cacheResult.data.meta,
            cache: {
              hit: true,
              source: cacheResult.source,
              ttl: cacheResult.ttl ? Math.floor(cacheResult.ttl) : void 0
            }
          }, executionStart)
        };
        return c.json(dataWithMeta);
      }
    }
    c.header("X-Cache-Status", "MISS");
    c.header("X-Cache-Source", "database");
    const stmt = db.prepare(queryResult.sql);
    const boundStmt = queryResult.params.length > 0 ? stmt.bind(...queryResult.params) : stmt;
    const { results } = await boundStmt.all();
    const transformedResults = results.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      status: row.status,
      collectionId: row.collection_id,
      data: row.data ? JSON.parse(row.data) : {},
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    const responseData = {
      data: transformedResults,
      meta: addTimingMeta(c, {
        collection: {
          ...collectionResult,
          schema: collectionResult.schema ? JSON.parse(collectionResult.schema) : {}
        },
        count: results.length,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        filter,
        query: {
          sql: queryResult.sql,
          params: queryResult.params
        },
        cache: {
          hit: false,
          source: "database"
        }
      }, executionStart)
    };
    if (cacheEnabled) {
      await cache.set(cacheKey, responseData);
    }
    return c.json(responseData);
  } catch (error) {
    console.error("Error fetching content:", error);
    return c.json({
      error: "Failed to fetch content",
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});
apiRoutes.route("/content", api_content_crud_default);
var api_default = apiRoutes;
function generateId() {
  return crypto.randomUUID().replace(/-/g, "").substring(0, 21);
}
async function emitEvent(eventName, data) {
  console.log(`[Event] ${eventName}:`, data);
}
var fileValidationSchema = zod.z.object({
  name: zod.z.string().min(1).max(255),
  type: zod.z.string().refine(
    (type) => {
      const allowedTypes = [
        // Images
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        // Documents
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        // Videos
        "video/mp4",
        "video/webm",
        "video/ogg",
        "video/avi",
        "video/mov",
        // Audio
        "audio/mp3",
        "audio/wav",
        "audio/ogg",
        "audio/m4a"
      ];
      return allowedTypes.includes(type);
    },
    { message: "Unsupported file type" }
  ),
  size: zod.z.number().min(1).max(50 * 1024 * 1024)
  // 50MB max
});
var apiMediaRoutes = new hono.Hono();
apiMediaRoutes.use("*", chunkTAYKWZ2B_cjs.requireAuth());
apiMediaRoutes.post("/upload", async (c) => {
  try {
    const user = c.get("user");
    const formData = await c.req.formData();
    const fileData = formData.get("file");
    if (!fileData || typeof fileData === "string") {
      return c.json({ error: "No file provided" }, 400);
    }
    const file = fileData;
    const validation = fileValidationSchema.safeParse({
      name: file.name,
      type: file.type,
      size: file.size
    });
    if (!validation.success) {
      return c.json({
        error: "File validation failed",
        details: validation.error.issues
      }, 400);
    }
    const fileId = generateId();
    const fileExtension = file.name.split(".").pop() || "";
    const filename = `${fileId}.${fileExtension}`;
    const folder = formData.get("folder") || "uploads";
    const r2Key = `${folder}/${filename}`;
    const arrayBuffer = await file.arrayBuffer();
    const uploadResult = await c.env.MEDIA_BUCKET.put(r2Key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
        contentDisposition: `inline; filename="${file.name}"`
      },
      customMetadata: {
        originalName: file.name,
        uploadedBy: user.userId,
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
    if (!uploadResult) {
      return c.json({ error: "Failed to upload file to storage" }, 500);
    }
    const bucketName = c.env.BUCKET_NAME || "warpcms-media-dev";
    const publicUrl = `https://pub-${bucketName}.r2.dev/${r2Key}`;
    let width;
    let height;
    if (file.type.startsWith("image/") && !file.type.includes("svg")) {
      try {
        const dimensions = await getImageDimensions(arrayBuffer);
        width = dimensions.width;
        height = dimensions.height;
      } catch (error) {
        console.warn("Failed to extract image dimensions:", error);
      }
    }
    let thumbnailUrl;
    if (file.type.startsWith("image/") && c.env.IMAGES_ACCOUNT_ID) {
      thumbnailUrl = `https://imagedelivery.net/${c.env.IMAGES_ACCOUNT_ID}/${r2Key}/thumbnail`;
    }
    const mediaRecord = {
      id: fileId,
      filename,
      original_name: file.name,
      mime_type: file.type,
      size: file.size,
      width,
      height,
      folder,
      r2_key: r2Key,
      public_url: publicUrl,
      thumbnail_url: thumbnailUrl,
      uploaded_by: user.userId,
      uploaded_at: Math.floor(Date.now() / 1e3),
      created_at: Math.floor(Date.now() / 1e3)
    };
    const stmt = c.env.DB.prepare(`
      INSERT INTO media (
        id, filename, original_name, mime_type, size, width, height, 
        folder, r2_key, public_url, thumbnail_url, uploaded_by, uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    await stmt.bind(
      mediaRecord.id,
      mediaRecord.filename,
      mediaRecord.original_name,
      mediaRecord.mime_type,
      mediaRecord.size,
      mediaRecord.width ?? null,
      mediaRecord.height ?? null,
      mediaRecord.folder,
      mediaRecord.r2_key,
      mediaRecord.public_url,
      mediaRecord.thumbnail_url ?? null,
      mediaRecord.uploaded_by,
      mediaRecord.uploaded_at
    ).run();
    await emitEvent("media.upload", { id: mediaRecord.id, filename: mediaRecord.filename });
    return c.json({
      success: true,
      file: {
        id: mediaRecord.id,
        filename: mediaRecord.filename,
        originalName: mediaRecord.original_name,
        mimeType: mediaRecord.mime_type,
        size: mediaRecord.size,
        width: mediaRecord.width,
        height: mediaRecord.height,
        r2_key: mediaRecord.r2_key,
        publicUrl: mediaRecord.public_url,
        thumbnailUrl: mediaRecord.thumbnail_url,
        uploadedAt: new Date(mediaRecord.uploaded_at * 1e3).toISOString()
      }
    });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Upload failed" }, 500);
  }
});
apiMediaRoutes.post("/upload-multiple", async (c) => {
  try {
    const user = c.get("user");
    const formData = await c.req.formData();
    const filesData = formData.getAll("files");
    const files = [];
    for (const f of filesData) {
      if (typeof f !== "string") {
        files.push(f);
      }
    }
    if (!files || files.length === 0) {
      return c.json({ error: "No files provided" }, 400);
    }
    const uploadResults = [];
    const errors = [];
    for (const file of files) {
      try {
        const validation = fileValidationSchema.safeParse({
          name: file.name,
          type: file.type,
          size: file.size
        });
        if (!validation.success) {
          errors.push({
            filename: file.name,
            error: "Validation failed",
            details: validation.error.issues
          });
          continue;
        }
        const fileId = generateId();
        const fileExtension = file.name.split(".").pop() || "";
        const filename = `${fileId}.${fileExtension}`;
        const folder = formData.get("folder") || "uploads";
        const r2Key = `${folder}/${filename}`;
        const arrayBuffer = await file.arrayBuffer();
        const uploadResult = await c.env.MEDIA_BUCKET.put(r2Key, arrayBuffer, {
          httpMetadata: {
            contentType: file.type,
            contentDisposition: `inline; filename="${file.name}"`
          },
          customMetadata: {
            originalName: file.name,
            uploadedBy: user.userId,
            uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
        if (!uploadResult) {
          errors.push({
            filename: file.name,
            error: "Failed to upload to storage"
          });
          continue;
        }
        const bucketName = c.env.BUCKET_NAME || "warpcms-media-dev";
        const publicUrl = `https://pub-${bucketName}.r2.dev/${r2Key}`;
        let width;
        let height;
        if (file.type.startsWith("image/") && !file.type.includes("svg")) {
          try {
            const dimensions = await getImageDimensions(arrayBuffer);
            width = dimensions.width;
            height = dimensions.height;
          } catch (error) {
            console.warn("Failed to extract image dimensions:", error);
          }
        }
        let thumbnailUrl;
        if (file.type.startsWith("image/") && c.env.IMAGES_ACCOUNT_ID) {
          thumbnailUrl = `https://imagedelivery.net/${c.env.IMAGES_ACCOUNT_ID}/${r2Key}/thumbnail`;
        }
        const mediaRecord = {
          id: fileId,
          filename,
          original_name: file.name,
          mime_type: file.type,
          size: file.size,
          width,
          height,
          folder,
          r2_key: r2Key,
          public_url: publicUrl,
          thumbnail_url: thumbnailUrl,
          uploaded_by: user.userId,
          uploaded_at: Math.floor(Date.now() / 1e3)
        };
        const stmt = c.env.DB.prepare(`
          INSERT INTO media (
            id, filename, original_name, mime_type, size, width, height, 
            folder, r2_key, public_url, thumbnail_url, uploaded_by, uploaded_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        await stmt.bind(
          mediaRecord.id,
          mediaRecord.filename,
          mediaRecord.original_name,
          mediaRecord.mime_type,
          mediaRecord.size,
          mediaRecord.width ?? null,
          mediaRecord.height ?? null,
          mediaRecord.folder,
          mediaRecord.r2_key,
          mediaRecord.public_url,
          mediaRecord.thumbnail_url ?? null,
          mediaRecord.uploaded_by,
          mediaRecord.uploaded_at
        ).run();
        uploadResults.push({
          id: mediaRecord.id,
          filename: mediaRecord.filename,
          originalName: mediaRecord.original_name,
          mimeType: mediaRecord.mime_type,
          size: mediaRecord.size,
          width: mediaRecord.width,
          height: mediaRecord.height,
          r2_key: mediaRecord.r2_key,
          publicUrl: mediaRecord.public_url,
          thumbnailUrl: mediaRecord.thumbnail_url,
          uploadedAt: new Date(mediaRecord.uploaded_at * 1e3).toISOString()
        });
      } catch (error) {
        errors.push({
          filename: file.name,
          error: "Upload failed",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    if (uploadResults.length > 0) {
      await emitEvent("media.upload", { count: uploadResults.length });
    }
    return c.json({
      success: uploadResults.length > 0,
      uploaded: uploadResults,
      errors,
      summary: {
        total: files.length,
        successful: uploadResults.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error("Multiple upload error:", error);
    return c.json({ error: "Upload failed" }, 500);
  }
});
apiMediaRoutes.post("/bulk-delete", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const fileIds = body.fileIds;
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return c.json({ error: "No file IDs provided" }, 400);
    }
    if (fileIds.length > 50) {
      return c.json({ error: "Too many files selected. Maximum 50 files per operation." }, 400);
    }
    const results = [];
    const errors = [];
    for (const fileId of fileIds) {
      try {
        const stmt = c.env.DB.prepare("SELECT * FROM media WHERE id = ?");
        const fileRecord = await stmt.bind(fileId).first();
        if (!fileRecord) {
          errors.push({ fileId, error: "File not found" });
          continue;
        }
        if (fileRecord.deleted_at !== null) {
          console.log(`File ${fileId} already deleted, skipping`);
          results.push({
            fileId,
            filename: fileRecord.original_name,
            success: true,
            alreadyDeleted: true
          });
          continue;
        }
        if (fileRecord.uploaded_by !== user.userId && user.role !== "admin") {
          errors.push({ fileId, error: "Permission denied" });
          continue;
        }
        try {
          await c.env.MEDIA_BUCKET.delete(fileRecord.r2_key);
        } catch (error) {
          console.warn(`Failed to delete from R2 for file ${fileId}:`, error);
        }
        const deleteStmt = c.env.DB.prepare("UPDATE media SET deleted_at = ? WHERE id = ?");
        await deleteStmt.bind(Math.floor(Date.now() / 1e3), fileId).run();
        results.push({
          fileId,
          filename: fileRecord.original_name,
          success: true
        });
      } catch (error) {
        errors.push({
          fileId,
          error: "Delete failed",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    if (results.length > 0) {
      await emitEvent("media.delete", { count: results.length, ids: fileIds });
    }
    return c.json({
      success: results.length > 0,
      deleted: results,
      errors,
      summary: {
        total: fileIds.length,
        successful: results.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return c.json({ error: "Bulk delete failed" }, 500);
  }
});
apiMediaRoutes.post("/create-folder", async (c) => {
  try {
    const body = await c.req.json();
    const folderName = body.folderName;
    if (!folderName || typeof folderName !== "string") {
      return c.json({ success: false, error: "No folder name provided" }, 400);
    }
    const folderPattern = /^[a-z0-9-_]+$/;
    if (!folderPattern.test(folderName)) {
      return c.json({
        success: false,
        error: "Folder name can only contain lowercase letters, numbers, hyphens, and underscores"
      }, 400);
    }
    const checkStmt = c.env.DB.prepare("SELECT COUNT(*) as count FROM media WHERE folder = ? AND deleted_at IS NULL");
    const existingFolder = await checkStmt.bind(folderName).first();
    if (existingFolder && existingFolder.count > 0) {
      return c.json({
        success: false,
        error: `Folder "${folderName}" already exists`
      }, 400);
    }
    return c.json({
      success: true,
      message: `Folder "${folderName}" is ready. Upload files to this folder to make it appear in the media library.`,
      folder: folderName,
      note: "Folders appear automatically when you upload files to them"
    });
  } catch (error) {
    console.error("Create folder error:", error);
    return c.json({ success: false, error: "Failed to create folder" }, 500);
  }
});
apiMediaRoutes.post("/bulk-move", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const fileIds = body.fileIds;
    const targetFolder = body.folder;
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return c.json({ error: "No file IDs provided" }, 400);
    }
    if (!targetFolder || typeof targetFolder !== "string") {
      return c.json({ error: "No target folder provided" }, 400);
    }
    if (fileIds.length > 50) {
      return c.json({ error: "Too many files selected. Maximum 50 files per operation." }, 400);
    }
    const results = [];
    const errors = [];
    for (const fileId of fileIds) {
      try {
        const stmt = c.env.DB.prepare("SELECT * FROM media WHERE id = ? AND deleted_at IS NULL");
        const fileRecord = await stmt.bind(fileId).first();
        if (!fileRecord) {
          errors.push({ fileId, error: "File not found" });
          continue;
        }
        if (fileRecord.uploaded_by !== user.userId && user.role !== "admin") {
          errors.push({ fileId, error: "Permission denied" });
          continue;
        }
        if (fileRecord.folder === targetFolder) {
          results.push({
            fileId,
            filename: fileRecord.original_name,
            success: true,
            skipped: true
          });
          continue;
        }
        const oldR2Key = fileRecord.r2_key;
        const filename = oldR2Key.split("/").pop() || fileRecord.filename;
        const newR2Key = `${targetFolder}/${filename}`;
        try {
          const object = await c.env.MEDIA_BUCKET.get(oldR2Key);
          if (!object) {
            errors.push({ fileId, error: "File not found in storage" });
            continue;
          }
          await c.env.MEDIA_BUCKET.put(newR2Key, object.body, {
            httpMetadata: object.httpMetadata,
            customMetadata: {
              ...object.customMetadata,
              movedBy: user.userId,
              movedAt: (/* @__PURE__ */ new Date()).toISOString()
            }
          });
          await c.env.MEDIA_BUCKET.delete(oldR2Key);
        } catch (error) {
          console.warn(`Failed to move file in R2 for file ${fileId}:`, error);
          errors.push({ fileId, error: "Failed to move file in storage" });
          continue;
        }
        const bucketName = c.env.BUCKET_NAME || "warpcms-media-dev";
        const newPublicUrl = `https://pub-${bucketName}.r2.dev/${newR2Key}`;
        const updateStmt = c.env.DB.prepare(`
          UPDATE media
          SET folder = ?, r2_key = ?, public_url = ?, updated_at = ?
          WHERE id = ?
        `);
        await updateStmt.bind(
          targetFolder,
          newR2Key,
          newPublicUrl,
          Math.floor(Date.now() / 1e3),
          fileId
        ).run();
        results.push({
          fileId,
          filename: fileRecord.original_name,
          success: true,
          skipped: false
        });
      } catch (error) {
        errors.push({
          fileId,
          error: "Move failed",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    if (results.length > 0) {
      await emitEvent("media.move", { count: results.length, targetFolder, ids: fileIds });
    }
    return c.json({
      success: results.length > 0,
      moved: results,
      errors,
      summary: {
        total: fileIds.length,
        successful: results.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error("Bulk move error:", error);
    return c.json({ error: "Bulk move failed" }, 500);
  }
});
apiMediaRoutes.delete("/:id", async (c) => {
  try {
    const user = c.get("user");
    const fileId = c.req.param("id");
    const stmt = c.env.DB.prepare("SELECT * FROM media WHERE id = ? AND deleted_at IS NULL");
    const fileRecord = await stmt.bind(fileId).first();
    if (!fileRecord) {
      return c.json({ error: "File not found" }, 404);
    }
    if (fileRecord.uploaded_by !== user.userId && user.role !== "admin") {
      return c.json({ error: "Permission denied" }, 403);
    }
    try {
      await c.env.MEDIA_BUCKET.delete(fileRecord.r2_key);
    } catch (error) {
      console.warn("Failed to delete from R2:", error);
    }
    const deleteStmt = c.env.DB.prepare("UPDATE media SET deleted_at = ? WHERE id = ?");
    await deleteStmt.bind(Math.floor(Date.now() / 1e3), fileId).run();
    await emitEvent("media.delete", { id: fileId });
    return c.json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    return c.json({ error: "Delete failed" }, 500);
  }
});
apiMediaRoutes.patch("/:id", async (c) => {
  try {
    const user = c.get("user");
    const fileId = c.req.param("id");
    const body = await c.req.json();
    const stmt = c.env.DB.prepare("SELECT * FROM media WHERE id = ? AND deleted_at IS NULL");
    const fileRecord = await stmt.bind(fileId).first();
    if (!fileRecord) {
      return c.json({ error: "File not found" }, 404);
    }
    if (fileRecord.uploaded_by !== user.userId && user.role !== "admin") {
      return c.json({ error: "Permission denied" }, 403);
    }
    const allowedFields = ["alt", "caption", "tags", "folder"];
    const updates = [];
    const values = [];
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(key === "tags" ? JSON.stringify(value) : value);
      }
    }
    if (updates.length === 0) {
      return c.json({ error: "No valid fields to update" }, 400);
    }
    updates.push("updated_at = ?");
    values.push(Math.floor(Date.now() / 1e3));
    values.push(fileId);
    const updateStmt = c.env.DB.prepare(`
      UPDATE media SET ${updates.join(", ")} WHERE id = ?
    `);
    await updateStmt.bind(...values).run();
    await emitEvent("media.update", { id: fileId });
    return c.json({ success: true, message: "File updated successfully" });
  } catch (error) {
    console.error("Update error:", error);
    return c.json({ error: "Update failed" }, 500);
  }
});
async function getImageDimensions(arrayBuffer) {
  const uint8Array = new Uint8Array(arrayBuffer);
  if (uint8Array[0] === 255 && uint8Array[1] === 216) {
    return getJPEGDimensions(uint8Array);
  }
  if (uint8Array[0] === 137 && uint8Array[1] === 80 && uint8Array[2] === 78 && uint8Array[3] === 71) {
    return getPNGDimensions(uint8Array);
  }
  return { width: 0, height: 0 };
}
function getJPEGDimensions(uint8Array) {
  let i = 2;
  while (i < uint8Array.length) {
    if (i + 8 >= uint8Array.length) break;
    if (uint8Array[i] === 255 && uint8Array[i + 1] === 192) {
      if (i + 8 < uint8Array.length) {
        return {
          height: uint8Array[i + 5] << 8 | uint8Array[i + 6],
          width: uint8Array[i + 7] << 8 | uint8Array[i + 8]
        };
      }
    }
    if (i + 3 < uint8Array.length) {
      i += 2 + (uint8Array[i + 2] << 8 | uint8Array[i + 3]);
    } else {
      break;
    }
  }
  return { width: 0, height: 0 };
}
function getPNGDimensions(uint8Array) {
  if (uint8Array.length < 24) {
    return { width: 0, height: 0 };
  }
  return {
    width: uint8Array[16] << 24 | uint8Array[17] << 16 | uint8Array[18] << 8 | uint8Array[19],
    height: uint8Array[20] << 24 | uint8Array[21] << 16 | uint8Array[22] << 8 | uint8Array[23]
  };
}
var api_media_default = apiMediaRoutes;
var apiSystemRoutes = new hono.Hono();
apiSystemRoutes.get("/health", async (c) => {
  try {
    const startTime = Date.now();
    let dbStatus = "unknown";
    let dbLatency = 0;
    try {
      const dbStart = Date.now();
      await c.env.DB.prepare("SELECT 1").first();
      dbLatency = Date.now() - dbStart;
      dbStatus = "healthy";
    } catch (error) {
      console.error("Database health check failed:", error);
      dbStatus = "unhealthy";
    }
    let kvStatus = "not_configured";
    let kvLatency = 0;
    if (c.env.CACHE_KV) {
      try {
        const kvStart = Date.now();
        await c.env.CACHE_KV.get("__health_check__");
        kvLatency = Date.now() - kvStart;
        kvStatus = "healthy";
      } catch (error) {
        console.error("KV health check failed:", error);
        kvStatus = "unhealthy";
      }
    }
    let r2Status = "not_configured";
    if (c.env.MEDIA_BUCKET) {
      try {
        await c.env.MEDIA_BUCKET.head("__health_check__");
        r2Status = "healthy";
      } catch (error) {
        r2Status = "healthy";
      }
    }
    const totalLatency = Date.now() - startTime;
    const overall = dbStatus === "healthy" ? "healthy" : "degraded";
    return c.json({
      status: overall,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: totalLatency,
      checks: {
        database: {
          status: dbStatus,
          latency: dbLatency
        },
        cache: {
          status: kvStatus,
          latency: kvLatency
        },
        storage: {
          status: r2Status
        }
      },
      environment: c.env.ENVIRONMENT || "production"
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return c.json({
      status: "unhealthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      error: "Health check failed"
    }, 503);
  }
});
apiSystemRoutes.get("/info", (c) => {
  const appVersion = c.get("appVersion") || "1.0.0";
  return c.json({
    name: "WarpCMS",
    version: appVersion,
    description: "Modern headless CMS built on Cloudflare Workers",
    endpoints: {
      api: "/api",
      auth: "/auth",
      health: "/api/system/health",
      docs: "/docs"
    },
    features: {
      content: true,
      media: true,
      auth: true,
      collections: true,
      caching: !!c.env.CACHE_KV,
      storage: !!c.env.MEDIA_BUCKET
    },
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
apiSystemRoutes.get("/stats", async (c) => {
  try {
    const db = c.env.DB;
    const contentStats = await db.prepare(`
      SELECT COUNT(*) as total_content
      FROM content
      WHERE deleted_at IS NULL
    `).first();
    const mediaStats = await db.prepare(`
      SELECT
        COUNT(*) as total_files,
        SUM(size) as total_size
      FROM media
      WHERE deleted_at IS NULL
    `).first();
    const userStats = await db.prepare(`
      SELECT COUNT(*) as total_users
      FROM users
    `).first();
    return c.json({
      content: {
        total: contentStats?.total_content || 0
      },
      media: {
        total_files: mediaStats?.total_files || 0,
        total_size_bytes: mediaStats?.total_size || 0,
        total_size_mb: Math.round((mediaStats?.total_size || 0) / 1024 / 1024 * 100) / 100
      },
      users: {
        total: userStats?.total_users || 0
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Stats query failed:", error);
    return c.json({ error: "Failed to fetch system statistics" }, 500);
  }
});
apiSystemRoutes.get("/ping", async (c) => {
  try {
    const start = Date.now();
    await c.env.DB.prepare("SELECT 1").first();
    const latency = Date.now() - start;
    return c.json({
      pong: true,
      latency,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Ping failed:", error);
    return c.json({
      pong: false,
      error: "Database connection failed"
    }, 503);
  }
});
apiSystemRoutes.get("/env", (c) => {
  return c.json({
    environment: c.env.ENVIRONMENT || "production",
    features: {
      database: !!c.env.DB,
      cache: !!c.env.CACHE_KV,
      media_bucket: !!c.env.MEDIA_BUCKET,
      email_queue: !!c.env.EMAIL_QUEUE,
      sendgrid: !!c.env.SENDGRID_API_KEY,
      cloudflare_images: !!(c.env.IMAGES_ACCOUNT_ID && c.env.IMAGES_API_TOKEN)
    },
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
var api_system_default = apiSystemRoutes;
var adminApiRoutes = new hono.Hono();
adminApiRoutes.use("*", chunkTAYKWZ2B_cjs.requireAuth());
adminApiRoutes.use("*", chunkTAYKWZ2B_cjs.requireRole(["admin", "editor"]));
adminApiRoutes.get("/stats", async (c) => {
  try {
    const db = c.env.DB;
    let collectionsCount = 0;
    try {
      const collectionsStmt = db.prepare("SELECT COUNT(*) as count FROM collections WHERE is_active = 1");
      const collectionsResult = await collectionsStmt.first();
      collectionsCount = collectionsResult?.count || 0;
    } catch (error) {
      console.error("Error fetching collections count:", error);
    }
    let contentCount = 0;
    try {
      const contentStmt = db.prepare("SELECT COUNT(*) as count FROM content WHERE deleted_at IS NULL");
      const contentResult = await contentStmt.first();
      contentCount = contentResult?.count || 0;
    } catch (error) {
      console.error("Error fetching content count:", error);
    }
    let mediaCount = 0;
    let mediaSize = 0;
    try {
      const mediaStmt = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(size), 0) as total_size FROM media WHERE deleted_at IS NULL");
      const mediaResult = await mediaStmt.first();
      mediaCount = mediaResult?.count || 0;
      mediaSize = mediaResult?.total_size || 0;
    } catch (error) {
      console.error("Error fetching media count:", error);
    }
    let usersCount = 0;
    try {
      const usersStmt = db.prepare("SELECT COUNT(*) as count FROM users WHERE is_active = 1");
      const usersResult = await usersStmt.first();
      usersCount = usersResult?.count || 0;
    } catch (error) {
      console.error("Error fetching users count:", error);
    }
    return c.json({
      collections: collectionsCount,
      contentItems: contentCount,
      mediaFiles: mediaCount,
      mediaSize,
      users: usersCount,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return c.json({ error: "Failed to fetch statistics" }, 500);
  }
});
adminApiRoutes.get("/storage", async (c) => {
  try {
    const db = c.env.DB;
    let databaseSize = 0;
    try {
      const result = await db.prepare("SELECT 1").run();
      databaseSize = result?.meta?.size_after || 0;
    } catch (error) {
      console.error("Error fetching database size:", error);
    }
    let mediaSize = 0;
    try {
      const mediaStmt = db.prepare("SELECT COALESCE(SUM(size), 0) as total_size FROM media WHERE deleted_at IS NULL");
      const mediaResult = await mediaStmt.first();
      mediaSize = mediaResult?.total_size || 0;
    } catch (error) {
      console.error("Error fetching media size:", error);
    }
    return c.json({
      databaseSize,
      mediaSize,
      totalSize: databaseSize + mediaSize,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Error fetching storage usage:", error);
    return c.json({ error: "Failed to fetch storage usage" }, 500);
  }
});
adminApiRoutes.get("/activity", async (c) => {
  try {
    const db = c.env.DB;
    const limit = parseInt(c.req.query("limit") || "10");
    const activityStmt = db.prepare(`
      SELECT
        a.id,
        a.action,
        a.resource_type,
        a.resource_id,
        a.details,
        a.created_at,
        u.email,
        u.first_name,
        u.last_name
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.resource_type IN ('content', 'collections', 'users', 'media')
      ORDER BY a.created_at DESC
      LIMIT ?
    `);
    const { results } = await activityStmt.bind(limit).all();
    const recentActivity = (results || []).map((row) => {
      const userName = row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : row.email || "System";
      let details = {};
      try {
        details = row.details ? JSON.parse(row.details) : {};
      } catch (e) {
        console.error("Error parsing activity details:", e);
      }
      return {
        id: row.id,
        type: row.resource_type,
        action: row.action,
        resource_id: row.resource_id,
        details,
        timestamp: new Date(Number(row.created_at)).toISOString(),
        user: userName
      };
    });
    return c.json({
      data: recentActivity,
      count: recentActivity.length,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return c.json({ error: "Failed to fetch recent activity" }, 500);
  }
});
var createCollectionSchema = zod.z.object({
  name: zod.z.string().min(1).max(255).regex(/^[a-z0-9_]+$/, "Must contain only lowercase letters, numbers, and underscores"),
  displayName: zod.z.string().min(1).max(255).optional(),
  display_name: zod.z.string().min(1).max(255).optional(),
  description: zod.z.string().optional()
}).refine((data) => data.displayName || data.display_name, {
  message: "Either displayName or display_name is required",
  path: ["displayName"]
});
var updateCollectionSchema = zod.z.object({
  display_name: zod.z.string().min(1).max(255).optional(),
  description: zod.z.string().optional(),
  is_active: zod.z.boolean().optional()
});
adminApiRoutes.get("/collections", async (c) => {
  try {
    const db = c.env.DB;
    const search = c.req.query("search") || "";
    const includeInactive = c.req.query("includeInactive") === "true";
    let stmt;
    let results;
    if (search) {
      stmt = db.prepare(`
        SELECT id, name, display_name, description, created_at, updated_at, is_active, managed
        FROM collections
        WHERE ${includeInactive ? "1=1" : "is_active = 1"}
        AND (name LIKE ? OR display_name LIKE ? OR description LIKE ?)
        ORDER BY created_at DESC
      `);
      const searchParam = `%${search}%`;
      const queryResults = await stmt.bind(searchParam, searchParam, searchParam).all();
      results = queryResults.results;
    } else {
      stmt = db.prepare(`
        SELECT id, name, display_name, description, created_at, updated_at, is_active, managed
        FROM collections
        ${includeInactive ? "" : "WHERE is_active = 1"}
        ORDER BY created_at DESC
      `);
      const queryResults = await stmt.all();
      results = queryResults.results;
    }
    const fieldCountStmt = db.prepare("SELECT collection_id, COUNT(*) as count FROM content_fields GROUP BY collection_id");
    const { results: fieldCountResults } = await fieldCountStmt.all();
    const fieldCounts = new Map((fieldCountResults || []).map((row) => [String(row.collection_id), Number(row.count)]));
    const collections = (results || []).map((row) => ({
      id: row.id,
      name: row.name,
      display_name: row.display_name,
      description: row.description,
      created_at: Number(row.created_at),
      updated_at: Number(row.updated_at),
      is_active: row.is_active === 1,
      managed: row.managed === 1,
      field_count: fieldCounts.get(String(row.id)) || 0
    }));
    return c.json({
      data: collections,
      count: collections.length,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Error fetching collections:", error);
    return c.json({ error: "Failed to fetch collections" }, 500);
  }
});
adminApiRoutes.get("/collections/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const db = c.env.DB;
    const stmt = db.prepare("SELECT * FROM collections WHERE id = ?");
    const collection = await stmt.bind(id).first();
    if (!collection) {
      return c.json({ error: "Collection not found" }, 404);
    }
    const fieldsStmt = db.prepare(`
      SELECT * FROM content_fields
      WHERE collection_id = ?
      ORDER BY field_order ASC
    `);
    const { results: fieldsResults } = await fieldsStmt.bind(id).all();
    const fields = (fieldsResults || []).map((row) => ({
      id: row.id,
      field_name: row.field_name,
      field_type: row.field_type,
      field_label: row.field_label,
      field_options: row.field_options ? JSON.parse(row.field_options) : {},
      field_order: row.field_order,
      is_required: row.is_required === 1,
      is_searchable: row.is_searchable === 1,
      created_at: Number(row.created_at),
      updated_at: Number(row.updated_at)
    }));
    return c.json({
      id: collection.id,
      name: collection.name,
      display_name: collection.display_name,
      description: collection.description,
      is_active: collection.is_active === 1,
      managed: collection.managed === 1,
      schema: collection.schema ? JSON.parse(collection.schema) : null,
      created_at: Number(collection.created_at),
      updated_at: Number(collection.updated_at),
      fields
    });
  } catch (error) {
    console.error("Error fetching collection:", error);
    return c.json({ error: "Failed to fetch collection" }, 500);
  }
});
adminApiRoutes.get("/references", async (c) => {
  try {
    const db = c.env.DB;
    const url = new URL(c.req.url);
    const collectionParams = url.searchParams.getAll("collection").flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
    const search = c.req.query("search") || "";
    const id = c.req.query("id") || "";
    const limit = Math.min(Number.parseInt(c.req.query("limit") || "20", 10) || 20, 100);
    if (collectionParams.length === 0) {
      return c.json({ error: "Collection is required" }, 400);
    }
    const placeholders = collectionParams.map(() => "?").join(", ");
    const collectionStmt = db.prepare(`
      SELECT id, name, display_name
      FROM collections
      WHERE id IN (${placeholders}) OR name IN (${placeholders})
    `);
    const collectionResults = await collectionStmt.bind(...collectionParams, ...collectionParams).all();
    const collections = collectionResults.results || [];
    if (collections.length === 0) {
      return c.json({ error: "Collection not found" }, 404);
    }
    const collectionById = Object.fromEntries(
      collections.map((entry) => [
        entry.id,
        {
          id: entry.id,
          name: entry.name,
          display_name: entry.display_name
        }
      ])
    );
    const collectionIds = collections.map((entry) => entry.id);
    if (id) {
      const idPlaceholders = collectionIds.map(() => "?").join(", ");
      const itemStmt = db.prepare(`
        SELECT id, title, slug, collection_id
        FROM content
        WHERE id = ? AND collection_id IN (${idPlaceholders})
        LIMIT 1
      `);
      const item = await itemStmt.bind(id, ...collectionIds).first();
      if (!item) {
        return c.json({ error: "Reference not found" }, 404);
      }
      return c.json({
        data: {
          id: item.id,
          title: item.title,
          slug: item.slug,
          collection: collectionById[item.collection_id]
        }
      });
    }
    let stmt;
    let results;
    const listPlaceholders = collectionIds.map(() => "?").join(", ");
    const statusFilterValues = ["published"];
    const statusClause = ` AND status IN (${statusFilterValues.map(() => "?").join(", ")})`;
    if (search) {
      const searchParam = `%${search}%`;
      stmt = db.prepare(`
        SELECT id, title, slug, status, updated_at, collection_id
        FROM content
        WHERE collection_id IN (${listPlaceholders})
        AND (title LIKE ? OR slug LIKE ?)
        ${statusClause}
        ORDER BY updated_at DESC
        LIMIT ?
      `);
      const queryResults = await stmt.bind(...collectionIds, searchParam, searchParam, ...statusFilterValues, limit).all();
      results = queryResults.results;
    } else {
      stmt = db.prepare(`
        SELECT id, title, slug, status, updated_at, collection_id
        FROM content
        WHERE collection_id IN (${listPlaceholders})
        ${statusClause}
        ORDER BY updated_at DESC
        LIMIT ?
      `);
      const queryResults = await stmt.bind(...collectionIds, ...statusFilterValues, limit).all();
      results = queryResults.results;
    }
    const items = (results || []).map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      status: row.status,
      updated_at: row.updated_at ? Number(row.updated_at) : null,
      collection: collectionById[row.collection_id]
    }));
    return c.json({
      data: items,
      count: items.length
    });
  } catch (error) {
    console.error("Error fetching reference options:", error);
    return c.json({ error: "Failed to fetch references" }, 500);
  }
});
adminApiRoutes.post("/collections", async (c) => {
  try {
    const contentType = c.req.header("Content-Type");
    if (!contentType || !contentType.includes("application/json")) {
      return c.json({ error: "Content-Type must be application/json" }, 400);
    }
    let body;
    try {
      body = await c.req.json();
    } catch (e) {
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }
    const validation = createCollectionSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ error: "Validation failed", details: validation.error.issues }, 400);
    }
    const validatedData = validation.data;
    const db = c.env.DB;
    const _user = c.get("user");
    const displayName = validatedData.displayName || validatedData.display_name || "";
    const existingStmt = db.prepare("SELECT id FROM collections WHERE name = ?");
    const existing = await existingStmt.bind(validatedData.name).first();
    if (existing) {
      return c.json({ error: "A collection with this name already exists" }, 400);
    }
    const basicSchema = {
      type: "object",
      properties: {
        title: {
          type: "string",
          title: "Title",
          required: true
        },
        content: {
          type: "string",
          title: "Content",
          format: "richtext"
        },
        status: {
          type: "string",
          title: "Status",
          enum: ["draft", "published", "archived"],
          default: "draft"
        }
      },
      required: ["title"]
    };
    const collectionId = crypto.randomUUID();
    const now = Date.now();
    const insertStmt = db.prepare(`
        INSERT INTO collections (id, name, display_name, description, schema, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
    await insertStmt.bind(
      collectionId,
      validatedData.name,
      displayName,
      validatedData.description || null,
      JSON.stringify(basicSchema),
      1,
      // is_active
      now,
      now
    ).run();
    try {
      await c.env.CACHE_KV.delete("cache:collections:all");
      await c.env.CACHE_KV.delete(`cache:collection:${validatedData.name}`);
    } catch (e) {
      console.error("Error clearing cache:", e);
    }
    return c.json({
      id: collectionId,
      name: validatedData.name,
      displayName,
      description: validatedData.description,
      created_at: now
    }, 201);
  } catch (error) {
    console.error("Error creating collection:", error);
    return c.json({ error: "Failed to create collection" }, 500);
  }
});
adminApiRoutes.patch("/collections/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const validation = updateCollectionSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ error: "Validation failed", details: validation.error.issues }, 400);
    }
    const validatedData = validation.data;
    const db = c.env.DB;
    const checkStmt = db.prepare("SELECT * FROM collections WHERE id = ?");
    const existing = await checkStmt.bind(id).first();
    if (!existing) {
      return c.json({ error: "Collection not found" }, 404);
    }
    const updateFields = [];
    const updateParams = [];
    if (validatedData.display_name !== void 0) {
      updateFields.push("display_name = ?");
      updateParams.push(validatedData.display_name);
    }
    if (validatedData.description !== void 0) {
      updateFields.push("description = ?");
      updateParams.push(validatedData.description);
    }
    if (validatedData.is_active !== void 0) {
      updateFields.push("is_active = ?");
      updateParams.push(validatedData.is_active ? 1 : 0);
    }
    if (updateFields.length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }
    updateFields.push("updated_at = ?");
    updateParams.push(Date.now());
    updateParams.push(id);
    const updateStmt = db.prepare(`
        UPDATE collections
        SET ${updateFields.join(", ")}
        WHERE id = ?
      `);
    await updateStmt.bind(...updateParams).run();
    try {
      await c.env.CACHE_KV.delete("cache:collections:all");
      await c.env.CACHE_KV.delete(`cache:collection:${existing.name}`);
    } catch (e) {
      console.error("Error clearing cache:", e);
    }
    return c.json({ message: "Collection updated successfully" });
  } catch (error) {
    console.error("Error updating collection:", error);
    return c.json({ error: "Failed to update collection" }, 500);
  }
});
adminApiRoutes.delete("/collections/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const db = c.env.DB;
    const collectionStmt = db.prepare("SELECT name FROM collections WHERE id = ?");
    const collection = await collectionStmt.bind(id).first();
    if (!collection) {
      return c.json({ error: "Collection not found" }, 404);
    }
    const contentStmt = db.prepare("SELECT COUNT(*) as count FROM content WHERE collection_id = ?");
    const contentResult = await contentStmt.bind(id).first();
    if (contentResult && contentResult.count > 0) {
      return c.json({
        error: `Cannot delete collection: it contains ${contentResult.count} content item(s). Delete all content first.`
      }, 400);
    }
    const deleteFieldsStmt = db.prepare("DELETE FROM content_fields WHERE collection_id = ?");
    await deleteFieldsStmt.bind(id).run();
    const deleteStmt = db.prepare("DELETE FROM collections WHERE id = ?");
    await deleteStmt.bind(id).run();
    try {
      await c.env.CACHE_KV.delete("cache:collections:all");
      await c.env.CACHE_KV.delete(`cache:collection:${collection.name}`);
    } catch (e) {
      console.error("Error clearing cache:", e);
    }
    return c.json({ message: "Collection deleted successfully" });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return c.json({ error: "Failed to delete collection" }, 500);
  }
});
adminApiRoutes.get("/migrations/status", async (c) => {
  try {
    const { MigrationService: MigrationService2 } = await import('./migrations-LTQXNHI2.cjs');
    const db = c.env.DB;
    const migrationService = new MigrationService2(db);
    const status = await migrationService.getMigrationStatus();
    return c.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error("Error fetching migration status:", error);
    return c.json({
      success: false,
      error: "Failed to fetch migration status"
    }, 500);
  }
});
adminApiRoutes.post("/migrations/run", async (c) => {
  try {
    const user = c.get("user");
    if (!user || user.role !== "admin") {
      return c.json({
        success: false,
        error: "Unauthorized. Admin access required."
      }, 403);
    }
    const { MigrationService: MigrationService2 } = await import('./migrations-LTQXNHI2.cjs');
    const db = c.env.DB;
    const migrationService = new MigrationService2(db);
    const result = await migrationService.runPendingMigrations();
    return c.json({
      success: result.success,
      message: result.message,
      applied: result.applied
    });
  } catch (error) {
    console.error("Error running migrations:", error);
    return c.json({
      success: false,
      error: "Failed to run migrations"
    }, 500);
  }
});
adminApiRoutes.get("/migrations/validate", async (c) => {
  try {
    const { MigrationService: MigrationService2 } = await import('./migrations-LTQXNHI2.cjs');
    const db = c.env.DB;
    const migrationService = new MigrationService2(db);
    const validation = await migrationService.validateSchema();
    return c.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error("Error validating schema:", error);
    return c.json({
      success: false,
      error: "Failed to validate schema"
    }, 500);
  }
});
var admin_api_default = adminApiRoutes;

// src/templates/pages/auth-login.template.ts
function renderLoginPage(data, demoLoginActive = false) {
  return `
    <!DOCTYPE html>
    <html lang="en" class="h-full dark">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login - WarpCMS</title>
      <link rel="icon" type="image/svg+xml" href="/favicon.svg">
      <script src="https://unpkg.com/htmx.org@2.0.3"></script>
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          darkMode: 'class',
          theme: {
            extend: {
              colors: {
                error: '#ef4444'
              }
            }
          }
        }
      </script>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
      </style>
    </head>
    <body class="h-full bg-zinc-950">
      <div class="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
        <!-- Logo Section -->
        <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div class="mx-auto w-64 mb-8">
            <span class="font-bold tracking-tight text-cyan-400" style="font-size: 2.5rem">WarpCMS</span>
          </div>
          <h2 class="mt-6 text-xl font-medium text-white">Welcome Back</h2>
          <p class="mt-2 text-sm text-zinc-400">Sign in to your account to continue</p>
        </div>

        <!-- Form Container -->
        <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div class="bg-zinc-900 shadow-sm ring-1 ring-white/10 rounded-xl px-6 py-8 sm:px-10">
            <!-- Alerts -->
            ${data.error ? `<div class="mb-6">${chunkH6HP2MEA_cjs.renderAlert({ type: "error", message: data.error })}</div>` : ""}
            ${data.message ? `<div class="mb-6">${chunkH6HP2MEA_cjs.renderAlert({ type: "success", message: data.message })}</div>` : ""}

            <!-- Form Response (HTMX target) -->
            <div id="form-response" class="mb-6"></div>

            <!-- Form -->
            <form
              id="login-form"
              hx-post="/auth/login/form"
              hx-target="#form-response"
              hx-swap="innerHTML"
              class="space-y-6"
            >
              <!-- Email -->
              <div>
                <label for="email" class="block text-sm font-medium text-white mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  required
                  class="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white transition-shadow"
                  placeholder="Enter your email"
                >
              </div>

              <!-- Password -->
              <div>
                <label for="password" class="block text-sm font-medium text-white mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autocomplete="current-password"
                  required
                  class="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white transition-shadow"
                  placeholder="Enter your password"
                >
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-900 transition-colors"
              >
                Sign In
              </button>
            </form>

            <!-- Links -->
            <div class="mt-6 text-center">
              <p class="text-sm text-zinc-400">
                Don't have an account?
                <a href="/auth/register" class="font-semibold text-white hover:text-zinc-300 transition-colors">Create one here</a>
              </p>
            </div>
          </div>

          <!-- Version -->
          <div class="mt-6 text-center">
            <span class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium bg-cyan-500/10 text-cyan-400 ring-1 ring-inset ring-cyan-500/20">
              v${data.version || "0.1.0"}
            </span>
          </div>
        </div>
      </div>

      ${demoLoginActive ? `
      <script>
        // Demo Login Prefill Script
        (function() {
          'use strict';

          function prefillLoginForm() {
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');

            if (emailInput && passwordInput) {
              emailInput.value = 'admin@warpcms.com';
              passwordInput.value = 'warpcms!';

              // Add visual indication that form is prefilled (only if not already present)
              const form = emailInput.closest('form');
              if (form && !form.querySelector('.demo-mode-notice')) {
                const notice = document.createElement('div');
                notice.className = 'demo-mode-notice mb-6 rounded-lg bg-blue-500/10 p-4 ring-1 ring-blue-500/20';
                notice.innerHTML = '<div class="flex items-start gap-x-3"><svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><div><h3 class="text-sm font-semibold text-blue-300">Demo Mode</h3><p class="mt-1 text-sm text-blue-400">Login form prefilled with demo credentials</p></div></div>';
                form.insertBefore(notice, form.firstChild);
              }
            }
          }

          // Prefill on page load
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', prefillLoginForm);
          } else {
            prefillLoginForm();
          }

          // Also handle HTMX page changes (for SPA-like navigation)
          document.addEventListener('htmx:afterSwap', function(event) {
            if (event.detail.target.id === 'main-content' ||
                document.getElementById('email')) {
              setTimeout(prefillLoginForm, 100);
            }
          });
        })();
      </script>
      ` : ""}
    </body>
    </html>
  `;
}

// src/templates/pages/auth-register.template.ts
function renderRegisterPage(data) {
  return `
    <!DOCTYPE html>
    <html lang="en" class="h-full dark">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Register - WarpCMS</title>
      <link rel="icon" type="image/svg+xml" href="/favicon.svg">
      <script src="https://unpkg.com/htmx.org@2.0.3"></script>
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          darkMode: 'class',
          theme: {
            extend: {}
          }
        }
      </script>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
      </style>
    </head>
    <body class="h-full bg-zinc-950">
      <div class="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
        <!-- Logo Section -->
        <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white">
            <svg class="h-7 w-7 text-zinc-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <h1 class="mt-6 text-3xl font-semibold tracking-tight text-white">WarpCMS</h1>
          <p class="mt-2 text-sm text-zinc-400">Create your account and get started</p>
        </div>

        <!-- Form Container -->
        <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div class="bg-zinc-900 shadow-sm ring-1 ring-white/10 rounded-xl px-6 py-8 sm:px-10">
            <!-- Alerts -->
            ${data.error ? `<div class="mb-6">${chunkH6HP2MEA_cjs.renderAlert({ type: "error", message: data.error })}</div>` : ""}

            <!-- Form -->
            <form
              id="register-form"
              hx-post="/auth/register/form"
              hx-target="#form-response"
              hx-swap="innerHTML"
              class="space-y-6"
            >
              <!-- First and Last Name -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="firstName" class="block text-sm font-medium text-white mb-2">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    class="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white transition-shadow"
                    placeholder="First name"
                  >
                </div>
                <div>
                  <label for="lastName" class="block text-sm font-medium text-white mb-2">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    class="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white transition-shadow"
                    placeholder="Last name"
                  >
                </div>
              </div>

              <!-- Username -->
              <div>
                <label for="username" class="block text-sm font-medium text-white mb-2">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  class="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white transition-shadow"
                  placeholder="Choose a username"
                >
              </div>

              <!-- Email -->
              <div>
                <label for="email" class="block text-sm font-medium text-white mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  required
                  class="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white transition-shadow"
                  placeholder="Enter your email"
                >
              </div>

              <!-- Password -->
              <div>
                <label for="password" class="block text-sm font-medium text-white mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autocomplete="new-password"
                  required
                  minlength="8"
                  class="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white transition-shadow"
                  placeholder="Create a password (min. 8 characters)"
                >
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-900 transition-colors"
              >
                Create Account
              </button>
            </form>

            <!-- Links -->
            <div class="mt-6 text-center">
              <p class="text-sm text-zinc-400">
                Already have an account?
                <a href="/auth/login" class="font-semibold text-white hover:text-zinc-300 transition-colors">Sign in here</a>
              </p>
            </div>

            <div id="form-response"></div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
async function isRegistrationEnabled(db) {
  try {
    const plugin = await db.prepare("SELECT settings FROM plugins WHERE id = ?").bind("core-auth").first();
    if (plugin?.settings) {
      const settings = JSON.parse(plugin.settings);
      const enabled = settings?.registration?.enabled;
      return enabled !== false && enabled !== 0;
    }
    return true;
  } catch {
    return true;
  }
}
async function isFirstUserRegistration(db) {
  try {
    const result = await db.prepare("SELECT COUNT(*) as count FROM users").first();
    return result?.count === 0;
  } catch {
    return false;
  }
}
var baseRegistrationSchema = zod.z.object({
  email: zod.z.string().email("Valid email is required"),
  password: zod.z.string().min(8, "Password must be at least 8 characters"),
  username: zod.z.string().min(3, "Username must be at least 3 characters").optional(),
  firstName: zod.z.string().min(1, "First name is required").optional(),
  lastName: zod.z.string().min(1, "Last name is required").optional()
});
var authValidationService = {
  /**
   * Build registration schema dynamically based on auth settings
   * For now, returns a static schema with standard fields
   */
  async buildRegistrationSchema(_db) {
    return baseRegistrationSchema;
  },
  /**
   * Generate default values for optional fields
   */
  generateDefaultValue(field, data) {
    switch (field) {
      case "username":
        return data.email ? data.email.split("@")[0] : `user${Date.now()}`;
      case "firstName":
        return "User";
      case "lastName":
        return data.email ? data.email.split("@")[0] : "Account";
      default:
        return "";
    }
  }
};

// src/routes/auth.ts
var authRoutes = new hono.Hono();
authRoutes.get("/login", async (c) => {
  const error = c.req.query("error");
  const message = c.req.query("message");
  const pageData = {
    error: error || void 0,
    message: message || void 0,
    version: c.get("appVersion")
  };
  const db = c.env.DB;
  let demoLoginActive = false;
  try {
    const plugin = await db.prepare("SELECT * FROM plugins WHERE id = ? AND status = ?").bind("demo-login-prefill", "active").first();
    demoLoginActive = !!plugin;
  } catch (error2) {
  }
  return c.html(renderLoginPage(pageData, demoLoginActive));
});
authRoutes.get("/register", async (c) => {
  const db = c.env.DB;
  const isFirstUser = await isFirstUserRegistration(db);
  if (!isFirstUser) {
    const registrationEnabled = await isRegistrationEnabled(db);
    if (!registrationEnabled) {
      return c.redirect("/auth/login?error=Registration is currently disabled");
    }
  }
  const error = c.req.query("error");
  const pageData = {
    error: error || void 0
  };
  return c.html(renderRegisterPage(pageData));
});
var loginSchema = zod.z.object({
  email: zod.z.string().email("Valid email is required"),
  password: zod.z.string().min(1, "Password is required")
});
authRoutes.post(
  "/register",
  async (c) => {
    try {
      const db = c.env.DB;
      const isFirstUser = await isFirstUserRegistration(db);
      if (!isFirstUser) {
        const registrationEnabled = await isRegistrationEnabled(db);
        if (!registrationEnabled) {
          return c.json({ error: "Registration is currently disabled" }, 403);
        }
      }
      let requestData;
      try {
        requestData = await c.req.json();
      } catch (parseError) {
        return c.json({ error: "Invalid JSON in request body" }, 400);
      }
      const validationSchema = await authValidationService.buildRegistrationSchema(db);
      let validatedData;
      try {
        validatedData = await validationSchema.parseAsync(requestData);
      } catch (validationError) {
        return c.json({
          error: "Validation failed",
          details: validationError.issues?.map((e) => e.message) || [validationError.message || "Invalid request data"]
        }, 400);
      }
      const email = validatedData.email;
      const password = validatedData.password;
      const username = validatedData.username || authValidationService.generateDefaultValue("username", validatedData);
      const firstName = validatedData.firstName || authValidationService.generateDefaultValue("firstName", validatedData);
      const lastName = validatedData.lastName || authValidationService.generateDefaultValue("lastName", validatedData);
      const normalizedEmail = email.toLowerCase();
      const existingUser = await db.prepare("SELECT id FROM users WHERE email = ? OR username = ?").bind(normalizedEmail, username).first();
      if (existingUser) {
        return c.json({ error: "User with this email or username already exists" }, 400);
      }
      const passwordHash = await chunkTAYKWZ2B_cjs.AuthManager.hashPassword(password);
      const userId = crypto.randomUUID();
      const now = /* @__PURE__ */ new Date();
      await db.prepare(`
        INSERT INTO users (id, email, username, first_name, last_name, password_hash, role, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        userId,
        normalizedEmail,
        username,
        firstName,
        lastName,
        passwordHash,
        "viewer",
        // Default role
        1,
        // is_active
        now.getTime(),
        now.getTime()
      ).run();
      const token = await chunkTAYKWZ2B_cjs.AuthManager.generateToken(userId, normalizedEmail, "viewer");
      cookie.setCookie(c, "auth_token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        maxAge: 60 * 60 * 24
        // 24 hours
      });
      return c.json({
        user: {
          id: userId,
          email: normalizedEmail,
          username,
          firstName,
          lastName,
          role: "viewer"
        },
        token
      }, 201);
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({
        error: "Registration failed",
        details: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  }
);
authRoutes.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ error: "Validation failed", details: validation.error.issues }, 400);
    }
    const { email, password } = validation.data;
    const db = c.env.DB;
    const normalizedEmail = email.toLowerCase();
    const cache = chunkJUS7ZTDS_cjs.getCacheService(chunkJUS7ZTDS_cjs.CACHE_CONFIGS.user);
    let user = await cache.get(cache.generateKey("user", `email:${normalizedEmail}`));
    if (!user) {
      user = await db.prepare("SELECT * FROM users WHERE email = ? AND is_active = 1").bind(normalizedEmail).first();
      if (user) {
        await cache.set(cache.generateKey("user", `email:${normalizedEmail}`), user);
        await cache.set(cache.generateKey("user", user.id), user);
      }
    }
    if (!user) {
      return c.json({ error: "Invalid email or password" }, 401);
    }
    const isValidPassword = await chunkTAYKWZ2B_cjs.AuthManager.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return c.json({ error: "Invalid email or password" }, 401);
    }
    const token = await chunkTAYKWZ2B_cjs.AuthManager.generateToken(user.id, user.email, user.role);
    cookie.setCookie(c, "auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 60 * 60 * 24
      // 24 hours
    });
    await db.prepare("UPDATE users SET last_login_at = ? WHERE id = ?").bind((/* @__PURE__ */ new Date()).getTime(), user.id).run();
    await cache.delete(cache.generateKey("user", user.id));
    await cache.delete(cache.generateKey("user", `email:${normalizedEmail}`));
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Login failed" }, 500);
  }
});
authRoutes.post("/logout", (c) => {
  cookie.setCookie(c, "auth_token", "", {
    httpOnly: true,
    secure: false,
    // Set to true in production with HTTPS
    sameSite: "Strict",
    maxAge: 0
    // Expire immediately
  });
  return c.json({ message: "Logged out successfully" });
});
authRoutes.get("/logout", (c) => {
  cookie.setCookie(c, "auth_token", "", {
    httpOnly: true,
    secure: false,
    // Set to true in production with HTTPS
    sameSite: "Strict",
    maxAge: 0
    // Expire immediately
  });
  return c.redirect("/auth/login?message=You have been logged out successfully");
});
authRoutes.get("/me", chunkTAYKWZ2B_cjs.requireAuth(), async (c) => {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Not authenticated" }, 401);
    }
    const db = c.env.DB;
    const userData = await db.prepare("SELECT id, email, username, first_name, last_name, role, created_at FROM users WHERE id = ?").bind(user.userId).first();
    if (!userData) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json({ user: userData });
  } catch (error) {
    console.error("Get user error:", error);
    return c.json({ error: "Failed to get user" }, 500);
  }
});
authRoutes.post("/refresh", chunkTAYKWZ2B_cjs.requireAuth(), async (c) => {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Not authenticated" }, 401);
    }
    const token = await chunkTAYKWZ2B_cjs.AuthManager.generateToken(user.userId, user.email, user.role);
    cookie.setCookie(c, "auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 60 * 60 * 24
      // 24 hours
    });
    return c.json({ token });
  } catch (error) {
    console.error("Token refresh error:", error);
    return c.json({ error: "Token refresh failed" }, 500);
  }
});
authRoutes.post("/register/form", async (c) => {
  try {
    const db = c.env.DB;
    const isFirstUser = await isFirstUserRegistration(db);
    if (!isFirstUser) {
      const registrationEnabled = await isRegistrationEnabled(db);
      if (!registrationEnabled) {
        return c.html(html.html`
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Registration is currently disabled. Please contact an administrator.
          </div>
        `);
      }
    }
    const formData = await c.req.formData();
    const requestData = {
      email: formData.get("email"),
      password: formData.get("password"),
      username: formData.get("username"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName")
    };
    const normalizedEmail = requestData.email?.toLowerCase();
    requestData.email = normalizedEmail;
    const validationSchema = await authValidationService.buildRegistrationSchema(db);
    const validation = await validationSchema.safeParseAsync(requestData);
    if (!validation.success) {
      return c.html(html.html`
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          ${validation.error.issues.map((err) => err.message).join(", ")}
        </div>
      `);
    }
    const validatedData = validation.data;
    const password = validatedData.password;
    const username = validatedData.username || authValidationService.generateDefaultValue("username", validatedData);
    const firstName = validatedData.firstName || authValidationService.generateDefaultValue("firstName", validatedData);
    const lastName = validatedData.lastName || authValidationService.generateDefaultValue("lastName", validatedData);
    const existingUser = await db.prepare("SELECT id FROM users WHERE email = ? OR username = ?").bind(normalizedEmail, username).first();
    if (existingUser) {
      return c.html(html.html`
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          User with this email or username already exists
        </div>
      `);
    }
    const passwordHash = await chunkTAYKWZ2B_cjs.AuthManager.hashPassword(password);
    const role = isFirstUser ? "admin" : "viewer";
    const userId = crypto.randomUUID();
    const now = /* @__PURE__ */ new Date();
    await db.prepare(`
      INSERT INTO users (id, email, username, first_name, last_name, password_hash, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      normalizedEmail,
      username,
      firstName,
      lastName,
      passwordHash,
      role,
      1,
      // is_active
      now.getTime(),
      now.getTime()
    ).run();
    const token = await chunkTAYKWZ2B_cjs.AuthManager.generateToken(userId, normalizedEmail, role);
    cookie.setCookie(c, "auth_token", token, {
      httpOnly: true,
      secure: false,
      // Set to true in production with HTTPS
      sameSite: "Strict",
      maxAge: 60 * 60 * 24
      // 24 hours
    });
    const redirectUrl = role === "admin" ? "/admin/dashboard" : "/admin/dashboard";
    return c.html(html.html`
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        Account created successfully! Redirecting...
        <script>
          setTimeout(() => {
            window.location.href = '${redirectUrl}';
          }, 2000);
        </script>
      </div>
    `);
  } catch (error) {
    console.error("Registration error:", error);
    return c.html(html.html`
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Registration failed. Please try again.
      </div>
    `);
  }
});
authRoutes.post("/login/form", async (c) => {
  try {
    const formData = await c.req.formData();
    const email = formData.get("email");
    const password = formData.get("password");
    const normalizedEmail = email.toLowerCase();
    const validation = loginSchema.safeParse({ email: normalizedEmail, password });
    if (!validation.success) {
      return c.html(html.html`
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          ${validation.error.issues.map((err) => err.message).join(", ")}
        </div>
      `);
    }
    const db = c.env.DB;
    const user = await db.prepare("SELECT * FROM users WHERE email = ? AND is_active = 1").bind(normalizedEmail).first();
    if (!user) {
      return c.html(html.html`
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Invalid email or password
        </div>
      `);
    }
    const isValidPassword = await chunkTAYKWZ2B_cjs.AuthManager.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return c.html(html.html`
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Invalid email or password
        </div>
      `);
    }
    const token = await chunkTAYKWZ2B_cjs.AuthManager.generateToken(user.id, user.email, user.role);
    cookie.setCookie(c, "auth_token", token, {
      httpOnly: true,
      secure: false,
      // Set to true in production with HTTPS
      sameSite: "Strict",
      maxAge: 60 * 60 * 24
      // 24 hours
    });
    await db.prepare("UPDATE users SET last_login_at = ? WHERE id = ?").bind((/* @__PURE__ */ new Date()).getTime(), user.id).run();
    return c.html(html.html`
      <div id="form-response">
        <div class="rounded-lg bg-green-100 dark:bg-lime-500/10 p-4 ring-1 ring-green-400 dark:ring-lime-500/20">
          <div class="flex items-start gap-x-3">
            <svg class="h-5 w-5 text-green-600 dark:text-lime-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div class="flex-1">
              <p class="text-sm font-medium text-green-700 dark:text-lime-300">Login successful! Redirecting to admin dashboard...</p>
            </div>
          </div>
          <script>
            setTimeout(() => {
              window.location.href = '/admin/dashboard';
            }, 2000);
          </script>
        </div>
      </div>
    `);
  } catch (error) {
    console.error("Login error:", error);
    return c.html(html.html`
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Login failed. Please try again.
      </div>
    `);
  }
});
authRoutes.post("/seed-admin", async (c) => {
  try {
    const db = c.env.DB;
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        password_hash TEXT,
        role TEXT NOT NULL DEFAULT 'viewer',
        avatar TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        last_login_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `).run();
    const existingAdmin = await db.prepare("SELECT id FROM users WHERE email = ? OR username = ?").bind("admin@warpcms.com", "admin").first();
    if (existingAdmin) {
      const passwordHash2 = await chunkTAYKWZ2B_cjs.AuthManager.hashPassword("warpcms!");
      await db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").bind(passwordHash2, Date.now(), existingAdmin.id).run();
      return c.json({
        message: "Admin user already exists (password updated)",
        user: {
          id: existingAdmin.id,
          email: "admin@warpcms.com",
          username: "admin",
          role: "admin"
        }
      });
    }
    const passwordHash = await chunkTAYKWZ2B_cjs.AuthManager.hashPassword("warpcms!");
    const userId = "admin-user-id";
    const now = Date.now();
    const adminEmail = "admin@warpcms.com".toLowerCase();
    await db.prepare(`
      INSERT INTO users (id, email, username, first_name, last_name, password_hash, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      adminEmail,
      "admin",
      "Admin",
      "User",
      passwordHash,
      "admin",
      1,
      // is_active
      now,
      now
    ).run();
    return c.json({
      message: "Admin user created successfully",
      user: {
        id: userId,
        email: adminEmail,
        username: "admin",
        role: "admin"
      },
      passwordHash
      // For debugging
    });
  } catch (error) {
    console.error("Seed admin error:", error);
    return c.json({ error: "Failed to create admin user", details: error instanceof Error ? error.message : String(error) }, 500);
  }
});
authRoutes.get("/accept-invitation", async (c) => {
  try {
    const token = c.req.query("token");
    if (!token) {
      return c.html(`
        <html>
          <head><title>Invalid Invitation</title></head>
          <body>
            <h1>Invalid Invitation</h1>
            <p>The invitation link is invalid or has expired.</p>
            <a href="/auth/login">Go to Login</a>
          </body>
        </html>
      `);
    }
    const db = c.env.DB;
    const userStmt = db.prepare(`
      SELECT id, email, first_name, last_name, role, invited_at
      FROM users 
      WHERE invitation_token = ? AND is_active = 0
    `);
    const invitedUser = await userStmt.bind(token).first();
    if (!invitedUser) {
      return c.html(`
        <html>
          <head><title>Invalid Invitation</title></head>
          <body>
            <h1>Invalid Invitation</h1>
            <p>The invitation link is invalid or has expired.</p>
            <a href="/auth/login">Go to Login</a>
          </body>
        </html>
      `);
    }
    const invitationAge = Date.now() - invitedUser.invited_at;
    const maxAge = 7 * 24 * 60 * 60 * 1e3;
    if (invitationAge > maxAge) {
      return c.html(`
        <html>
          <head><title>Invitation Expired</title></head>
          <body>
            <h1>Invitation Expired</h1>
            <p>This invitation has expired. Please contact your administrator for a new invitation.</p>
            <a href="/auth/login">Go to Login</a>
          </body>
        </html>
      `);
    }
    return c.html(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Accept Invitation - WarpCMS AI</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            min-height: 100vh;
          }
        </style>
      </head>
      <body class="bg-gray-900 text-white">
        <div class="min-h-screen flex items-center justify-center px-4">
          <div class="max-w-md w-full space-y-8">
            <div class="text-center">
              <div class="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                </svg>
              </div>
              <h2 class="text-3xl font-bold">Accept Invitation</h2>
              <p class="mt-2 text-gray-400">Complete your account setup</p>
              <p class="mt-4 text-sm">
                You've been invited as <strong>${invitedUser.first_name} ${invitedUser.last_name}</strong><br>
                <span class="text-gray-400">${invitedUser.email}</span><br>
                <span class="text-blue-400 capitalize">${invitedUser.role}</span>
              </p>
            </div>

            <form method="POST" action="/auth/accept-invitation" class="mt-8 space-y-6">
              <input type="hidden" name="token" value="${token}" />
              
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <input 
                  type="text" 
                  name="username" 
                  required
                  class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Enter your username"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input 
                  type="password" 
                  name="password" 
                  required
                  minlength="8"
                  class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Enter your password"
                >
                <p class="text-xs text-gray-400 mt-1">Password must be at least 8 characters long</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                <input 
                  type="password" 
                  name="confirm_password" 
                  required
                  minlength="8"
                  class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Confirm your password"
                >
              </div>

              <button 
                type="submit"
                class="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all"
              >
                Accept Invitation & Create Account
              </button>
            </form>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Accept invitation page error:", error);
    return c.html(`
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Error</h1>
          <p>An error occurred while processing your invitation.</p>
          <a href="/auth/login">Go to Login</a>
        </body>
      </html>
    `);
  }
});
authRoutes.post("/accept-invitation", async (c) => {
  try {
    const formData = await c.req.formData();
    const token = formData.get("token")?.toString();
    const username = formData.get("username")?.toString()?.trim();
    const password = formData.get("password")?.toString();
    const confirmPassword = formData.get("confirm_password")?.toString();
    if (!token || !username || !password || !confirmPassword) {
      return c.json({ error: "All fields are required" }, 400);
    }
    if (password !== confirmPassword) {
      return c.json({ error: "Passwords do not match" }, 400);
    }
    if (password.length < 8) {
      return c.json({ error: "Password must be at least 8 characters long" }, 400);
    }
    const db = c.env.DB;
    const userStmt = db.prepare(`
      SELECT id, email, first_name, last_name, role, invited_at
      FROM users 
      WHERE invitation_token = ? AND is_active = 0
    `);
    const invitedUser = await userStmt.bind(token).first();
    if (!invitedUser) {
      return c.json({ error: "Invalid or expired invitation" }, 400);
    }
    const invitationAge = Date.now() - invitedUser.invited_at;
    const maxAge = 7 * 24 * 60 * 60 * 1e3;
    if (invitationAge > maxAge) {
      return c.json({ error: "Invitation has expired" }, 400);
    }
    const existingUsernameStmt = db.prepare(`
      SELECT id FROM users WHERE username = ? AND id != ?
    `);
    const existingUsername = await existingUsernameStmt.bind(username, invitedUser.id).first();
    if (existingUsername) {
      return c.json({ error: "Username is already taken" }, 400);
    }
    const passwordHash = await chunkTAYKWZ2B_cjs.AuthManager.hashPassword(password);
    const updateStmt = db.prepare(`
      UPDATE users SET 
        username = ?,
        password_hash = ?,
        is_active = 1,
        email_verified = 1,
        invitation_token = NULL,
        accepted_invitation_at = ?,
        updated_at = ?
      WHERE id = ?
    `);
    await updateStmt.bind(
      username,
      passwordHash,
      Date.now(),
      Date.now(),
      invitedUser.id
    ).run();
    const authToken = await chunkTAYKWZ2B_cjs.AuthManager.generateToken(invitedUser.id, invitedUser.email, invitedUser.role);
    cookie.setCookie(c, "auth_token", authToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 60 * 60 * 24
      // 24 hours
    });
    return c.redirect("/admin/dashboard?welcome=true");
  } catch (error) {
    console.error("Accept invitation error:", error);
    return c.json({ error: "Failed to accept invitation" }, 500);
  }
});
authRoutes.post("/request-password-reset", async (c) => {
  try {
    const formData = await c.req.formData();
    const email = formData.get("email")?.toString()?.trim()?.toLowerCase();
    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: "Please enter a valid email address" }, 400);
    }
    const db = c.env.DB;
    const userStmt = db.prepare(`
      SELECT id, email, first_name, last_name FROM users 
      WHERE email = ? AND is_active = 1
    `);
    const user = await userStmt.bind(email).first();
    if (!user) {
      return c.json({
        success: true,
        message: "If an account with this email exists, a password reset link has been sent."
      });
    }
    const resetToken = crypto.randomUUID();
    const resetExpires = Date.now() + 60 * 60 * 1e3;
    const updateStmt = db.prepare(`
      UPDATE users SET 
        password_reset_token = ?,
        password_reset_expires = ?,
        updated_at = ?
      WHERE id = ?
    `);
    await updateStmt.bind(
      resetToken,
      resetExpires,
      Date.now(),
      user.id
    ).run();
    const resetLink = `${c.req.header("origin") || "http://localhost:8787"}/auth/reset-password?token=${resetToken}`;
    return c.json({
      success: true,
      message: "If an account with this email exists, a password reset link has been sent.",
      reset_link: resetLink
      // In production, this would be sent via email
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return c.json({ error: "Failed to process password reset request" }, 500);
  }
});
authRoutes.get("/reset-password", async (c) => {
  try {
    const token = c.req.query("token");
    if (!token) {
      return c.html(`
        <html>
          <head><title>Invalid Reset Link</title></head>
          <body>
            <h1>Invalid Reset Link</h1>
            <p>The password reset link is invalid or has expired.</p>
            <a href="/auth/login">Go to Login</a>
          </body>
        </html>
      `);
    }
    const db = c.env.DB;
    const userStmt = db.prepare(`
      SELECT id, email, first_name, last_name, password_reset_expires
      FROM users 
      WHERE password_reset_token = ? AND is_active = 1
    `);
    const user = await userStmt.bind(token).first();
    if (!user) {
      return c.html(`
        <html>
          <head><title>Invalid Reset Link</title></head>
          <body>
            <h1>Invalid Reset Link</h1>
            <p>The password reset link is invalid or has already been used.</p>
            <a href="/auth/login">Go to Login</a>
          </body>
        </html>
      `);
    }
    if (Date.now() > user.password_reset_expires) {
      return c.html(`
        <html>
          <head><title>Reset Link Expired</title></head>
          <body>
            <h1>Reset Link Expired</h1>
            <p>The password reset link has expired. Please request a new one.</p>
            <a href="/auth/login">Go to Login</a>
          </body>
        </html>
      `);
    }
    return c.html(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password - WarpCMS AI</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            min-height: 100vh;
          }
        </style>
      </head>
      <body class="bg-gray-900 text-white">
        <div class="min-h-screen flex items-center justify-center px-4">
          <div class="max-w-md w-full space-y-8">
            <div class="text-center">
              <div class="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3.586l4.293-4.293A6 6 0 0119 9z"/>
                </svg>
              </div>
              <h2 class="text-3xl font-bold">Reset Password</h2>
              <p class="mt-2 text-gray-400">Choose a new password for your account</p>
              <p class="mt-4 text-sm">
                Reset password for <strong>${user.first_name} ${user.last_name}</strong><br>
                <span class="text-gray-400">${user.email}</span>
              </p>
            </div>

            <form method="POST" action="/auth/reset-password" class="mt-8 space-y-6">
              <input type="hidden" name="token" value="${token}" />
              
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                <input 
                  type="password" 
                  name="password" 
                  required
                  minlength="8"
                  class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Enter your new password"
                >
                <p class="text-xs text-gray-400 mt-1">Password must be at least 8 characters long</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                <input 
                  type="password" 
                  name="confirm_password" 
                  required
                  minlength="8"
                  class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Confirm your new password"
                >
              </div>

              <button 
                type="submit"
                class="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all"
              >
                Reset Password
              </button>
            </form>

            <div class="text-center">
              <a href="/auth/login" class="text-sm text-blue-400 hover:text-blue-300">
                Back to Login
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Password reset page error:", error);
    return c.html(`
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Error</h1>
          <p>An error occurred while processing your password reset.</p>
          <a href="/auth/login">Go to Login</a>
        </body>
      </html>
    `);
  }
});
authRoutes.post("/reset-password", async (c) => {
  try {
    const formData = await c.req.formData();
    const token = formData.get("token")?.toString();
    const password = formData.get("password")?.toString();
    const confirmPassword = formData.get("confirm_password")?.toString();
    if (!token || !password || !confirmPassword) {
      return c.json({ error: "All fields are required" }, 400);
    }
    if (password !== confirmPassword) {
      return c.json({ error: "Passwords do not match" }, 400);
    }
    if (password.length < 8) {
      return c.json({ error: "Password must be at least 8 characters long" }, 400);
    }
    const db = c.env.DB;
    const userStmt = db.prepare(`
      SELECT id, email, password_hash, password_reset_expires
      FROM users
      WHERE password_reset_token = ? AND is_active = 1
    `);
    const user = await userStmt.bind(token).first();
    if (!user) {
      return c.json({ error: "Invalid or expired reset token" }, 400);
    }
    if (Date.now() > user.password_reset_expires) {
      return c.json({ error: "Reset token has expired" }, 400);
    }
    const newPasswordHash = await chunkTAYKWZ2B_cjs.AuthManager.hashPassword(password);
    try {
      const historyStmt = db.prepare(`
        INSERT INTO password_history (id, user_id, password_hash, created_at)
        VALUES (?, ?, ?, ?)
      `);
      await historyStmt.bind(
        crypto.randomUUID(),
        user.id,
        user.password_hash,
        Date.now()
      ).run();
    } catch (historyError) {
      console.warn("Could not store password history:", historyError);
    }
    const updateStmt = db.prepare(`
      UPDATE users SET
        password_hash = ?,
        password_reset_token = NULL,
        password_reset_expires = NULL,
        updated_at = ?
      WHERE id = ?
    `);
    await updateStmt.bind(
      newPasswordHash,
      Date.now(),
      user.id
    ).run();
    return c.redirect("/auth/login?message=Password reset successfully. Please log in with your new password.");
  } catch (error) {
    console.error("Password reset error:", error);
    return c.json({ error: "Failed to reset password" }, 500);
  }
});
var auth_default = authRoutes;
var app = new hono.Hono();
app.post("/test-cleanup", async (c) => {
  const db = c.env.DB;
  if (c.env.ENVIRONMENT === "production") {
    return c.json({ error: "Cleanup endpoint not available in production" }, 403);
  }
  try {
    let deletedCount = 0;
    await db.prepare(`
      DELETE FROM content_versions
      WHERE content_id IN (
        SELECT id FROM content
        WHERE title LIKE 'Test %' OR title LIKE '%E2E%' OR title LIKE '%Playwright%' OR title LIKE '%Sample%'
      )
    `).run();
    await db.prepare(`
      DELETE FROM workflow_history
      WHERE content_id IN (
        SELECT id FROM content
        WHERE title LIKE 'Test %' OR title LIKE '%E2E%' OR title LIKE '%Playwright%' OR title LIKE '%Sample%'
      )
    `).run();
    try {
      await db.prepare(`
        DELETE FROM content_data
        WHERE content_id IN (
          SELECT id FROM content
          WHERE title LIKE 'Test %' OR title LIKE '%E2E%' OR title LIKE '%Playwright%' OR title LIKE '%Sample%'
        )
      `).run();
    } catch (e) {
    }
    const contentResult = await db.prepare(`
      DELETE FROM content
      WHERE title LIKE 'Test %' OR title LIKE '%E2E%' OR title LIKE '%Playwright%' OR title LIKE '%Sample%'
    `).run();
    deletedCount += contentResult.meta?.changes || 0;
    await db.prepare(`
      DELETE FROM api_tokens
      WHERE user_id IN (
        SELECT id FROM users
        WHERE email != 'admin@warpcms.com' AND (email LIKE '%test%' OR email LIKE '%example.com%')
      )
    `).run();
    await db.prepare(`
      DELETE FROM media
      WHERE uploaded_by IN (
        SELECT id FROM users
        WHERE email != 'admin@warpcms.com' AND (email LIKE '%test%' OR email LIKE '%example.com%')
      )
    `).run();
    const usersResult = await db.prepare(`
      DELETE FROM users
      WHERE email != 'admin@warpcms.com' AND (email LIKE '%test%' OR email LIKE '%example.com%')
    `).run();
    deletedCount += usersResult.meta?.changes || 0;
    try {
      await db.prepare(`
        DELETE FROM collection_fields
        WHERE collection_id IN (
          SELECT id FROM collections
          WHERE name LIKE 'test_%' OR name IN ('blog_posts', 'test_collection', 'products', 'articles')
        )
      `).run();
    } catch (e) {
    }
    await db.prepare(`
      DELETE FROM content
      WHERE collection_id IN (
        SELECT id FROM collections
        WHERE name LIKE 'test_%' OR name IN ('blog_posts', 'test_collection', 'products', 'articles')
      )
    `).run();
    const collectionsResult = await db.prepare(`
      DELETE FROM collections
      WHERE name LIKE 'test_%' OR name IN ('blog_posts', 'test_collection', 'products', 'articles')
    `).run();
    deletedCount += collectionsResult.meta?.changes || 0;
    try {
      await db.prepare(`
        DELETE FROM content_data WHERE content_id NOT IN (SELECT id FROM content)
      `).run();
    } catch (e) {
    }
    try {
      await db.prepare(`
        DELETE FROM collection_fields WHERE collection_id NOT IN (SELECT id FROM collections)
      `).run();
    } catch (e) {
    }
    try {
      await db.prepare(`
        DELETE FROM content_versions WHERE content_id NOT IN (SELECT id FROM content)
      `).run();
    } catch (e) {
    }
    try {
      await db.prepare(`
        DELETE FROM workflow_history WHERE content_id NOT IN (SELECT id FROM content)
      `).run();
    } catch (e) {
    }
    await db.prepare(`
      DELETE FROM activity_logs
      WHERE id NOT IN (
        SELECT id FROM activity_logs
        ORDER BY created_at DESC
        LIMIT 100
      )
    `).run();
    return c.json({
      success: true,
      deletedCount,
      message: "Test data cleaned up successfully"
    });
  } catch (error) {
    console.error("Test cleanup error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.post("/test-cleanup/users", async (c) => {
  const db = c.env.DB;
  if (c.env.ENVIRONMENT === "production") {
    return c.json({ error: "Cleanup endpoint not available in production" }, 403);
  }
  try {
    const result = await db.prepare(`
      DELETE FROM users
      WHERE email != 'admin@warpcms.com'
      AND (
        email LIKE '%test%'
        OR email LIKE '%example.com%'
        OR first_name = 'Test'
      )
    `).run();
    return c.json({
      success: true,
      deletedCount: result.meta?.changes || 0,
      message: "Test users cleaned up successfully"
    });
  } catch (error) {
    console.error("User cleanup error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.post("/test-cleanup/collections", async (c) => {
  const db = c.env.DB;
  if (c.env.ENVIRONMENT === "production") {
    return c.json({ error: "Cleanup endpoint not available in production" }, 403);
  }
  try {
    let deletedCount = 0;
    const collections = await db.prepare(`
      SELECT id FROM collections
      WHERE name LIKE 'test_%'
      OR name IN ('blog_posts', 'test_collection', 'products', 'articles')
    `).all();
    if (collections.results && collections.results.length > 0) {
      const collectionIds = collections.results.map((c2) => c2.id);
      for (const id of collectionIds) {
        await db.prepare("DELETE FROM collection_fields WHERE collection_id = ?").bind(id).run();
      }
      for (const id of collectionIds) {
        await db.prepare("DELETE FROM content WHERE collection_id = ?").bind(id).run();
      }
      const result = await db.prepare(`
        DELETE FROM collections
        WHERE id IN (${collectionIds.map(() => "?").join(",")})
      `).bind(...collectionIds).run();
      deletedCount = result.meta?.changes || 0;
    }
    return c.json({
      success: true,
      deletedCount,
      message: "Test collections cleaned up successfully"
    });
  } catch (error) {
    console.error("Collection cleanup error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app.post("/test-cleanup/content", async (c) => {
  const db = c.env.DB;
  if (c.env.ENVIRONMENT === "production") {
    return c.json({ error: "Cleanup endpoint not available in production" }, 403);
  }
  try {
    const result = await db.prepare(`
      DELETE FROM content
      WHERE title LIKE 'Test %'
      OR title LIKE '%E2E%'
      OR title LIKE '%Playwright%'
      OR title LIKE '%Sample%'
    `).run();
    await db.prepare(`
      DELETE FROM content_data
      WHERE content_id NOT IN (SELECT id FROM content)
    `).run();
    return c.json({
      success: true,
      deletedCount: result.meta?.changes || 0,
      message: "Test content cleaned up successfully"
    });
  } catch (error) {
    console.error("Content cleanup error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
var test_cleanup_default = app;

// src/templates/pages/admin-content-form.template.ts
chunk4IO5UBHK_cjs.init_admin_layout_catalyst_template();
function renderField(field, value, errors) {
  const errorHTML = errors && errors.length > 0 ? `<p class="mt-1 text-sm text-red-600 dark:text-red-400">${errors.join(", ")}</p>` : "";
  const requiredMark = field.required ? '<span class="text-red-500">*</span>' : "";
  const helpHTML = field.helpText ? `<p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">${field.helpText}</p>` : "";
  const inputClasses = "w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow";
  switch (field.type) {
    case "text":
      return `
        <div>
          <label for="field-${field.name}" class="block text-sm/6 font-medium text-zinc-950 dark:text-white">${field.label} ${requiredMark}</label>
          <div class="mt-2">
            <input type="text" id="field-${field.name}" name="${field.name}" value="${escapeAttr(String(value || ""))}"
              placeholder="${escapeAttr(field.placeholder || "")}"
              ${field.required ? "required" : ""}
              class="${inputClasses}"
            />
          </div>
          ${helpHTML}
          ${errorHTML}
        </div>
      `;
    case "textarea":
      return `
        <div>
          <label for="field-${field.name}" class="block text-sm/6 font-medium text-zinc-950 dark:text-white">${field.label} ${requiredMark}</label>
          <div class="mt-2">
            <textarea id="field-${field.name}" name="${field.name}" rows="8"
              placeholder="${escapeAttr(field.placeholder || "")}"
              ${field.required ? "required" : ""}
              class="${inputClasses}"
            >${escapeHtml2(String(value || ""))}</textarea>
          </div>
          ${helpHTML}
          ${errorHTML}
        </div>
      `;
    case "richtext":
      return `
        <div>
          <label for="field-${field.name}" class="block text-sm/6 font-medium text-zinc-950 dark:text-white">${field.label} ${requiredMark}</label>
          <div class="mt-2">
            <div id="quill-editor-${field.name}" class="quill-editor bg-white dark:bg-zinc-800 rounded-lg ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10" style="min-height: 300px;"></div>
            <input type="hidden" id="field-${field.name}" name="${field.name}" value="${escapeAttr(String(value || ""))}">
          </div>
          ${helpHTML}
          ${errorHTML}
        </div>
      `;
    case "file":
      return `
        <div>
          <label class="block text-sm/6 font-medium text-zinc-950 dark:text-white">${field.label} ${requiredMark}</label>
          <input type="hidden" id="field-${field.name}" name="${field.name}" value="${escapeAttr(String(value || ""))}">
          <div class="mt-2">
            <!-- Preview area -->
            <div id="file-preview-${field.name}" class="${value ? "" : "hidden"} mb-3">
              ${value ? renderFilePreview(String(value), field.accept) : ""}
            </div>
            <!-- Drop zone -->
            <div id="dropzone-${field.name}"
              class="relative rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 p-6 text-center hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors cursor-pointer"
              ondragover="event.preventDefault(); this.classList.add('border-cyan-500', 'bg-cyan-50/50', 'dark:bg-cyan-500/5')"
              ondragleave="this.classList.remove('border-cyan-500', 'bg-cyan-50/50', 'dark:bg-cyan-500/5')"
              ondrop="handleFileDrop(event, '${field.name}', '${escapeAttr(field.accept || "")}')"
              onclick="document.getElementById('file-input-${field.name}').click()"
            >
              <svg class="mx-auto h-10 w-10 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
              <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span class="font-semibold text-cyan-600 dark:text-cyan-400">Click to upload</span> or drag and drop
              </p>
              <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">${field.helpText || "Any file"}</p>
              <div id="upload-progress-${field.name}" class="hidden mt-3">
                <div class="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                  <div id="upload-bar-${field.name}" class="bg-cyan-500 h-2 rounded-full transition-all" style="width: 0%"></div>
                </div>
                <p id="upload-status-${field.name}" class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Uploading...</p>
              </div>
            </div>
            <input type="file" id="file-input-${field.name}" class="hidden"
              ${field.accept ? `accept="${escapeAttr(field.accept)}"` : ""}
              onchange="handleFileSelect(this, '${field.name}', '${escapeAttr(field.accept || "")}')"
            />
            ${value ? `
              <button type="button" onclick="clearFileField('${field.name}')"
                class="mt-2 inline-flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                Remove file
              </button>
            ` : ""}
          </div>
          ${errorHTML}
        </div>
      `;
    case "tags":
      const tagsValue = Array.isArray(value) ? value.join(", ") : String(value || "");
      return `
        <div>
          <label for="field-${field.name}" class="block text-sm/6 font-medium text-zinc-950 dark:text-white">${field.label}</label>
          <div class="mt-2">
            <input type="text" id="field-${field.name}" name="${field.name}" value="${escapeAttr(tagsValue)}"
              placeholder="${escapeAttr(field.placeholder || "Comma-separated tags")}"
              class="${inputClasses}"
            />
          </div>
          <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Separate tags with commas</p>
          ${errorHTML}
        </div>
      `;
    default:
      return "";
  }
}
function renderFilePreview(url, accept) {
  if (!url) return "";
  const isImage = accept?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  if (isImage) {
    return `<img src="${escapeAttr(url)}" alt="Preview" class="h-32 w-32 object-cover rounded-lg ring-1 ring-zinc-950/10 dark:ring-white/10">`;
  }
  return `
    <div class="inline-flex items-center gap-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 px-3 py-2 ring-1 ring-zinc-950/10 dark:ring-white/10">
      <svg class="h-5 w-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
      <span class="text-sm text-zinc-700 dark:text-zinc-300 truncate max-w-xs">${escapeHtml2(url.split("/").pop() || url)}</span>
    </div>
  `;
}
function escapeHtml2(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(str) {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function renderContentFormPage(data) {
  const isEdit = data.isEdit || !!data.id;
  const ct = data.contentType;
  const title = isEdit ? `Edit: ${data.title || "Content"}` : `New ${ct.displayName}`;
  const backUrl = data.referrerParams ? `/admin/content?${data.referrerParams}` : `/admin/content?type=${ct.name}`;
  const getFieldValue = (fieldName) => {
    if (fieldName === "title") return data.title || data.data?.[fieldName] || "";
    if (fieldName === "slug") return data.slug || data.data?.[fieldName] || "";
    return data.data?.[fieldName] || "";
  };
  const titleField = ct.fields.find((f) => f.name === "title");
  const contentFields = ct.fields.filter((f) => f.name !== "title" && f.type !== "tags");
  const tagFields = ct.fields.filter((f) => f.type === "tags");
  const hasRichtext = ct.fields.some((f) => f.type === "richtext");
  const hasFileUpload = ct.fields.some((f) => f.type === "file");
  const descriptionText = ct.description || `Manage ${ct.displayName.toLowerCase()} content`;
  const pageContent = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl/8 font-semibold text-zinc-950 dark:text-white sm:text-xl/8">${isEdit ? "Edit Content" : "New Content"}</h1>
          <p class="mt-2 text-sm/6 text-zinc-500 dark:text-zinc-400">
            ${descriptionText}
          </p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <a href="${backUrl}" class="inline-flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm font-semibold text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm">
            <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Back to Content
          </a>
        </div>
      </div>

      <!-- Form Container -->
      <div class="rounded-lg bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 overflow-hidden">
        <!-- Form Header -->
        <div class="border-b border-zinc-950/5 dark:border-white/10 px-6 py-6">
          <div class="flex items-center gap-x-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              ${ct.icon}
            </div>
            <div>
              <h2 class="text-base/7 font-semibold text-zinc-950 dark:text-white">${ct.displayName}</h2>
              <p class="text-sm/6 text-zinc-500 dark:text-zinc-400">${isEdit ? "Update your content" : "Create new content"}</p>
            </div>
          </div>
        </div>

        <!-- Form Content -->
        <div class="px-6 py-6">
          <div id="form-messages">
            ${data.error ? chunkH6HP2MEA_cjs.renderAlert({ type: "error", message: data.error, dismissible: true }) : ""}
            ${data.success ? chunkH6HP2MEA_cjs.renderAlert({ type: "success", message: data.success, dismissible: true }) : ""}
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content Form -->
        <div class="lg:col-span-2">
          <form
            id="content-form"
            ${isEdit ? `hx-put="/admin/content/${data.id}"` : `hx-post="/admin/content"`}
            hx-target="#form-messages"
            hx-encoding="multipart/form-data"
            class="space-y-6"
          >
            <input type="hidden" name="content_type" value="${ct.name}">
            ${isEdit ? `<input type="hidden" name="id" value="${data.id}">` : ""}
            ${data.referrerParams ? `<input type="hidden" name="referrer_params" value="${escapeAttr(data.referrerParams)}">` : ""}

            <!-- Title Field -->
            ${titleField ? `
              <div class="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-4 ring-1 ring-zinc-950/5 dark:ring-white/10">
                <h3 class="text-sm font-semibold text-zinc-950 dark:text-white mb-3">Basic Information</h3>
                ${renderField(titleField, getFieldValue("title"), data.validationErrors?.["title"])}
              </div>
            ` : ""}

            <!-- Content Fields -->
            ${contentFields.length > 0 ? `
              <div class="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-4 ring-1 ring-zinc-950/5 dark:ring-white/10">
                <h3 class="text-sm font-semibold text-zinc-950 dark:text-white mb-3">Content Details</h3>
                <div class="space-y-4">
                  ${contentFields.map((f) => renderField(f, getFieldValue(f.name), data.validationErrors?.[f.name])).join("")}
                </div>
              </div>
            ` : ""}

            <!-- Tags -->
            ${tagFields.length > 0 ? `
              <div class="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-4 ring-1 ring-zinc-950/5 dark:ring-white/10">
                <h3 class="text-sm font-semibold text-zinc-950 dark:text-white mb-3">Organization</h3>
                <div class="space-y-4">
                  ${tagFields.map((f) => renderField(f, getFieldValue(f.name), data.validationErrors?.[f.name])).join("")}
                </div>
              </div>
            ` : ""}

            <div id="form-messages"></div>
          </form>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Publishing Options -->
          <div class="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 p-6">
            <h3 class="text-base/7 font-semibold text-zinc-950 dark:text-white mb-4">Publishing</h3>
            <div class="mb-6">
              <label for="status" class="block text-sm/6 font-medium text-zinc-950 dark:text-white">Status</label>
              <div class="mt-2 grid grid-cols-1">
                <select
                  id="status"
                  name="status"
                  form="content-form"
                  class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white/5 dark:bg-white/5 py-1.5 pl-3 pr-8 text-base text-zinc-950 dark:text-white outline outline-1 -outline-offset-1 outline-zinc-500/30 dark:outline-zinc-400/30 *:bg-white dark:*:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zinc-500 dark:focus-visible:outline-zinc-400 sm:text-sm/6"
                >
                  <option value="draft" ${data.status === "draft" ? "selected" : ""}>Draft</option>
                  <option value="published" ${data.status === "published" ? "selected" : ""}>Published</option>
                </select>
                <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-zinc-600 dark:text-zinc-400 sm:size-4">
                  <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" fill-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Content Info -->
          ${isEdit ? `
            <div class="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 p-6">
              <h3 class="text-base/7 font-semibold text-zinc-950 dark:text-white mb-4">Content Info</h3>
              <dl class="space-y-3 text-sm">
                <div>
                  <dt class="text-zinc-500 dark:text-zinc-400">Type</dt>
                  <dd class="mt-1 text-zinc-950 dark:text-white">${ct.displayName}</dd>
                </div>
                <div>
                  <dt class="text-zinc-500 dark:text-zinc-400">Created</dt>
                  <dd class="mt-1 text-zinc-950 dark:text-white">${data.data?.created_at ? new Date(data.data.created_at).toLocaleDateString() : "Unknown"}</dd>
                </div>
                <div>
                  <dt class="text-zinc-500 dark:text-zinc-400">Last Modified</dt>
                  <dd class="mt-1 text-zinc-950 dark:text-white">${data.data?.updated_at ? new Date(data.data.updated_at).toLocaleDateString() : "Unknown"}</dd>
                </div>
              </dl>
              <div class="mt-4 pt-4 border-t border-zinc-950/5 dark:border-white/10">
                <button
                  type="button"
                  onclick="showVersionHistory('${data.id}')"
                  class="inline-flex items-center gap-x-1.5 text-sm font-medium text-zinc-950 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  View Version History
                </button>
              </div>
            </div>
          ` : ""}

          <!-- Quick Actions -->
          <div class="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 p-6">
            <h3 class="text-base/7 font-semibold text-zinc-950 dark:text-white mb-4">Quick Actions</h3>
            <div class="space-y-2">
              <button
                type="button"
                onclick="duplicateContent()"
                class="w-full inline-flex items-center gap-x-2 px-3 py-2 text-sm font-medium text-zinc-950 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                Duplicate Content
              </button>
              ${isEdit ? `
                <button
                  type="button"
                  onclick="deleteContent('${data.id}')"
                  class="w-full inline-flex items-center gap-x-2 px-3 py-2 text-sm font-medium text-pink-700 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                  </svg>
                  Delete Content
                </button>
              ` : ""}
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="lg:col-span-3 mt-6 pt-6 border-t border-zinc-950/5 dark:border-white/10 flex items-center justify-between">
          <a href="${backUrl}" class="inline-flex items-center justify-center gap-x-1.5 rounded-lg bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm font-semibold text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            Cancel
          </a>
          <div class="flex items-center gap-x-3">
            <button
              type="submit"
              form="content-form"
              name="action"
              value="save"
              class="inline-flex items-center justify-center gap-x-1.5 rounded-lg bg-zinc-950 dark:bg-white px-3.5 py-2.5 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              ${isEdit ? "Update" : "Save"}
            </button>
            ${data.user?.role !== "viewer" ? `
              <button
                type="submit"
                form="content-form"
                name="action"
                value="save_and_publish"
                class="inline-flex items-center justify-center gap-x-1.5 rounded-lg bg-lime-600 dark:bg-lime-500 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-lime-700 dark:hover:bg-lime-600 transition-colors shadow-sm"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                ${isEdit ? "Update" : "Save"} & Publish
              </button>
            ` : ""}
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- Confirmation Dialogs -->
    ${chunkH6HP2MEA_cjs.renderConfirmationDialog({
    id: "duplicate-content-confirm",
    title: "Duplicate Content",
    message: "Create a copy of this content?",
    confirmText: "Duplicate",
    cancelText: "Cancel",
    iconColor: "blue",
    confirmClass: "bg-blue-500 hover:bg-blue-400",
    onConfirm: "performDuplicateContent()"
  })}

    ${chunkH6HP2MEA_cjs.renderConfirmationDialog({
    id: "delete-content-confirm",
    title: "Delete Content",
    message: "Are you sure you want to delete this content? This action cannot be undone.",
    confirmText: "Delete",
    cancelText: "Cancel",
    iconColor: "red",
    confirmClass: "bg-red-500 hover:bg-red-400",
    onConfirm: `performDeleteContent('\${data.id}')`
  })}

    ${chunkH6HP2MEA_cjs.getConfirmationDialogScript()}

    ${hasRichtext ? getQuillCDNAndInit(ct.fields.filter((f) => f.type === "richtext")) : ""}

    <script>
      ${hasFileUpload ? getFileUploadScript() : ""}

      // Quick actions
      function duplicateContent() {
        showConfirmDialog('duplicate-content-confirm');
      }

      function performDuplicateContent() {
        var form = document.getElementById('content-form');
        var formData = new FormData(form);
        formData.append('action', 'duplicate');

        fetch('/admin/content/duplicate', {
          method: 'POST',
          body: formData
        })
        .then(function(response) { return response.json(); })
        .then(function(data) {
          if (data.success) {
            window.location.href = '/admin/content/' + data.id + '/edit';
          } else {
            alert('Error duplicating content');
          }
        });
      }

      function deleteContent(contentId) {
        showConfirmDialog('delete-content-confirm');
      }

      function performDeleteContent(contentId) {
        fetch('/admin/content/' + contentId, {
          method: 'DELETE'
        })
        .then(function(response) {
          if (response.ok) {
            window.location.href = '/admin/content';
          } else {
            alert('Error deleting content');
          }
        });
      }

      function showVersionHistory(contentId) {
        var modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
        modal.innerHTML = '<div id="version-history-content"><div class="flex items-center justify-center h-32"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div></div></div>';
        document.body.appendChild(modal);

        fetch('/admin/content/' + contentId + '/versions')
        .then(function(response) { return response.text(); })
        .then(function(html) {
          document.getElementById('version-history-content').innerHTML = html;
        })
        .catch(function(error) {
          console.error('Error loading version history:', error);
          document.getElementById('version-history-content').innerHTML = '<p class="text-zinc-950 dark:text-white">Error loading version history</p>';
        });
      }

      // Auto-save
      let autoSaveTimeout;
      function scheduleAutoSave() {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
          const form = document.getElementById('content-form');
          const formData = new FormData(form);
          formData.append('action', 'autosave');
          fetch(form.action, { method: 'POST', body: formData })
            .then(r => { if (r.ok) console.log('Auto-saved'); })
            .catch(e => console.error('Auto-save failed:', e));
        }, 30000);
      }

      document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('content-form');
        if (form) {
          form.addEventListener('input', scheduleAutoSave);
          form.addEventListener('change', scheduleAutoSave);
        }
      });
    </script>
  `;
  const layoutData = {
    title,
    pageTitle: "Content Management",
    currentPath: "/admin/content",
    user: data.user,
    content: pageContent,
    version: data.version
  };
  return chunk4IO5UBHK_cjs.renderAdminLayoutCatalyst(layoutData);
}
function getQuillCDNAndInit(richtextFields) {
  return `
    <link href="https://cdn.quilljs.com/1.3.7/quill.snow.css" rel="stylesheet">
    <script src="https://cdn.quilljs.com/1.3.7/quill.min.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        ${richtextFields.map((f) => `
          (function() {
            var quill = new Quill('#quill-editor-${f.name}', {
              theme: 'snow',
              modules: {
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['blockquote', 'code-block'],
                  ['link', 'image'],
                  ['clean']
                ]
              },
              placeholder: 'Write your content here...'
            });
            var hiddenInput = document.getElementById('field-${f.name}');
            if (hiddenInput && hiddenInput.value) {
              quill.root.innerHTML = hiddenInput.value;
            }
            quill.on('text-change', function() {
              hiddenInput.value = quill.root.innerHTML;
            });
            var form = document.getElementById('content-form');
            if (form) {
              form.addEventListener('submit', function() {
                hiddenInput.value = quill.root.innerHTML;
              });
            }
          })();
        `).join("")}
      });
    </script>
  `;
}
function getFileUploadScript() {
  return `
    function handleFileDrop(event, fieldName, accept) {
      event.preventDefault();
      event.currentTarget.classList.remove('border-cyan-500', 'bg-cyan-50/50', 'dark:bg-cyan-500/5');
      var files = event.dataTransfer.files;
      if (files.length > 0) {
        uploadFile(files[0], fieldName, accept);
      }
    }

    function handleFileSelect(input, fieldName, accept) {
      if (input.files.length > 0) {
        uploadFile(input.files[0], fieldName, accept);
      }
    }

    function uploadFile(file, fieldName, accept) {
      // Validate file type if accept is specified
      if (accept && accept !== '*') {
        var acceptTypes = accept.split(',').map(function(t) { return t.trim(); });
        var accepted = acceptTypes.some(function(type) {
          if (type.endsWith('/*')) {
            return file.type.startsWith(type.replace('/*', '/'));
          }
          return file.type === type;
        });
        if (!accepted) {
          alert('Invalid file type. Accepted: ' + accept);
          return;
        }
      }

      var progressEl = document.getElementById('upload-progress-' + fieldName);
      var barEl = document.getElementById('upload-bar-' + fieldName);
      var statusEl = document.getElementById('upload-status-' + fieldName);
      progressEl.classList.remove('hidden');
      barEl.style.width = '10%';
      statusEl.textContent = 'Uploading ' + file.name + '...';

      var formData = new FormData();
      formData.append('file', file);

      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/media/upload');

      xhr.upload.addEventListener('progress', function(e) {
        if (e.lengthComputable) {
          var pct = Math.round((e.loaded / e.total) * 100);
          barEl.style.width = pct + '%';
          statusEl.textContent = 'Uploading... ' + pct + '%';
        }
      });

      xhr.addEventListener('load', function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var result = JSON.parse(xhr.responseText);
            var url = result.url || result.data?.url || '';
            document.getElementById('field-' + fieldName).value = url;

            // Show preview
            var previewEl = document.getElementById('file-preview-' + fieldName);
            if (url && previewEl) {
              var isImage = file.type.startsWith('image/');
              if (isImage) {
                previewEl.innerHTML = '<img src="' + url + '" alt="Preview" class="h-32 w-32 object-cover rounded-lg ring-1 ring-zinc-950/10 dark:ring-white/10">';
              } else {
                previewEl.innerHTML = '<div class="inline-flex items-center gap-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 px-3 py-2 ring-1 ring-zinc-950/10 dark:ring-white/10"><span class="text-sm text-zinc-700 dark:text-zinc-300">' + file.name + '</span></div>';
              }
              previewEl.classList.remove('hidden');
            }

            barEl.style.width = '100%';
            statusEl.textContent = 'Upload complete!';
            setTimeout(function() { progressEl.classList.add('hidden'); }, 2000);
          } catch(e) {
            statusEl.textContent = 'Upload failed: could not parse response';
          }
        } else {
          statusEl.textContent = 'Upload failed: ' + xhr.statusText;
        }
      });

      xhr.addEventListener('error', function() {
        statusEl.textContent = 'Upload failed: network error';
      });

      xhr.send(formData);
    }

    function clearFileField(fieldName) {
      document.getElementById('field-' + fieldName).value = '';
      var previewEl = document.getElementById('file-preview-' + fieldName);
      if (previewEl) {
        previewEl.innerHTML = '';
        previewEl.classList.add('hidden');
      }
    }
  `;
}

// src/templates/pages/admin-content-list.template.ts
chunk4IO5UBHK_cjs.init_admin_layout_catalyst_template();
function renderContentListPage(data) {
  const urlParams = new URLSearchParams();
  if (data.modelName && data.modelName !== "all") urlParams.set("type", data.modelName);
  if (data.status && data.status !== "all") urlParams.set("status", data.status);
  if (data.search) urlParams.set("search", data.search);
  if (data.page && data.page !== 1) urlParams.set("page", data.page.toString());
  const currentParams = urlParams.toString();
  data.modelName !== "all" || data.status !== "all" || !!data.search;
  const filterBarData = {
    filters: [
      {
        name: "type",
        label: "Type",
        options: [
          { value: "all", label: "All Types", selected: data.modelName === "all" },
          ...data.models.map((model) => ({
            value: model.name,
            label: model.displayName,
            selected: data.modelName === model.name
          }))
        ]
      },
      {
        name: "status",
        label: "Status",
        options: [
          { value: "all", label: "All Status", selected: data.status === "all" },
          { value: "draft", label: "Draft", selected: data.status === "draft" },
          { value: "review", label: "Under Review", selected: data.status === "review" },
          { value: "scheduled", label: "Scheduled", selected: data.status === "scheduled" },
          { value: "published", label: "Published", selected: data.status === "published" },
          { value: "archived", label: "Archived", selected: data.status === "archived" },
          { value: "deleted", label: "Deleted", selected: data.status === "deleted" }
        ]
      }
    ],
    actions: [
      {
        label: "Advanced Search",
        className: "btn-primary",
        onclick: "openAdvancedSearch()"
      },
      {
        label: "Refresh",
        className: "btn-secondary",
        onclick: "location.reload()"
      }
    ],
    bulkActions: [
      { label: "Publish", value: "publish", icon: "check-circle" },
      { label: "Unpublish", value: "unpublish", icon: "x-circle" },
      { label: "Delete", value: "delete", icon: "trash", className: "text-pink-600" }
    ]
  };
  const tableColumns = [
    {
      key: "title",
      label: "Title",
      sortable: true,
      sortType: "string",
      render: (value, row) => `
        <div class="flex items-center">
          <div>
            <div class="text-sm font-medium text-zinc-950 dark:text-white">
              <a href="/admin/content/${row.id}/edit${currentParams ? `?ref=${encodeURIComponent(currentParams)}` : ""}" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">${row.title}</a>
            </div>
            <div class="text-sm text-zinc-500 dark:text-zinc-400">${row.slug}</div>
          </div>
        </div>
      `
    },
    {
      key: "modelName",
      label: "Type",
      sortable: true,
      sortType: "string",
      className: "text-sm text-zinc-500 dark:text-zinc-400"
    },
    {
      key: "statusBadge",
      label: "Status",
      sortable: true,
      sortType: "string",
      render: (value) => value
    },
    {
      key: "authorName",
      label: "Author",
      sortable: true,
      sortType: "string",
      className: "text-sm text-zinc-500 dark:text-zinc-400"
    },
    {
      key: "formattedDate",
      label: "Updated",
      sortable: true,
      sortType: "date",
      className: "text-sm text-zinc-500 dark:text-zinc-400"
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      className: "text-sm font-medium",
      render: (value, row) => `
        <div class="flex space-x-2">
          <button
            class="inline-flex items-center justify-center p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 ring-1 ring-inset ring-cyan-600/20 dark:ring-cyan-500/20 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition-colors"
            onclick="window.location.href='/admin/content/${row.id}/edit${currentParams ? `?ref=${encodeURIComponent(currentParams)}` : ""}'"
            title="Edit"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
            </svg>
          </button>
          <button
            class="inline-flex items-center justify-center p-1.5 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 ring-1 ring-inset ring-purple-600/20 dark:ring-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
            onclick="window.open('/api/content/${row.id}', '_blank')"
            title="View API"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
            </svg>
          </button>
          <button
            class="inline-flex items-center justify-center p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-600/20 dark:ring-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
            hx-delete="/admin/content/${row.id}"
            hx-confirm="Are you sure you want to delete this content item?"
            hx-target="#content-list"
            hx-swap="outerHTML"
            title="Delete"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      `
    }
  ];
  const tableData = {
    tableId: "content-table",
    columns: tableColumns,
    rows: data.contentItems,
    selectable: true,
    rowClickable: true,
    rowClickUrl: (row) => `/admin/content/${row.id}/edit${currentParams ? `?ref=${encodeURIComponent(currentParams)}` : ""}`,
    emptyMessage: "No content found. Create your first content item to get started."
  };
  const totalPages = Math.ceil(data.totalItems / data.itemsPerPage);
  const startItem = (data.page - 1) * data.itemsPerPage + 1;
  const endItem = Math.min(data.page * data.itemsPerPage, data.totalItems);
  const paginationData = {
    currentPage: data.page,
    totalPages,
    totalItems: data.totalItems,
    itemsPerPage: data.itemsPerPage,
    startItem,
    endItem,
    baseUrl: "/admin/content",
    queryParams: {
      type: data.modelName,
      status: data.status,
      ...data.search ? { search: data.search } : {}
    },
    showPageSizeSelector: true,
    pageSizeOptions: [10, 20, 50, 100]
  };
  const pageContent = `
    <div>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 class="text-2xl/8 font-semibold text-zinc-950 dark:text-white sm:text-xl/8">Content Management</h1>
          <p class="mt-2 text-sm/6 text-zinc-500 dark:text-zinc-400">Manage and organize your content items</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <a href="/admin/content/new" class="inline-flex items-center justify-center rounded-lg bg-zinc-950 dark:bg-white px-3.5 py-2.5 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm">
            <svg class="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            New Content
          </a>
        </div>
      </div>
      <!-- Filters -->
      <div class="relative rounded-xl mb-6">
        <!-- Gradient Background -->
        <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 dark:from-cyan-400/20 dark:via-blue-400/20 dark:to-purple-400/20 rounded-xl"></div>

        <div class="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 rounded-xl">
          <div class="px-6 py-5">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4 flex-1">
                <!-- Type Filter -->
                <div>
                  <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Type</label>
                  <div class="grid grid-cols-1">
                    <select
                      name="type"
                      onchange="updateContentFilters('type', this.value)"
                      class="col-start-1 row-start-1 w-full appearance-none rounded-lg bg-white/5 dark:bg-white/5 py-2 pl-3 pr-8 text-sm text-zinc-950 dark:text-white outline outline-1 -outline-offset-1 outline-cyan-500/30 dark:outline-cyan-400/30 *:bg-white dark:*:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-500 dark:focus-visible:outline-cyan-400 min-w-40"
                    >
                      <option value="all" ${data.modelName === "all" ? "selected" : ""}>All Types</option>
                      ${data.models.map((model) => `
                        <option value="${model.name}" ${data.modelName === model.name ? "selected" : ""}>
                          ${model.displayName}
                        </option>
                      `).join("")}
                    </select>
                    <svg viewBox="0 0 16 16" fill="currentColor" data-slot="icon" aria-hidden="true" class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-cyan-600 dark:text-cyan-400 sm:size-4">
                      <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" fill-rule="evenodd" />
                    </svg>
                  </div>
                </div>

                <!-- Status Filter -->
                <div>
                  <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Status</label>
                  <div class="grid grid-cols-1">
                    <select
                      name="status"
                      onchange="updateContentFilters('status', this.value)"
                      class="col-start-1 row-start-1 w-full appearance-none rounded-lg bg-white/5 dark:bg-white/5 py-2 pl-3 pr-8 text-sm text-zinc-950 dark:text-white outline outline-1 -outline-offset-1 outline-cyan-500/30 dark:outline-cyan-400/30 *:bg-white dark:*:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-500 dark:focus-visible:outline-cyan-400 min-w-40"
                    >
                      <option value="all" ${data.status === "all" ? "selected" : ""}>All Status</option>
                      <option value="draft" ${data.status === "draft" ? "selected" : ""}>Draft</option>
                      <option value="review" ${data.status === "review" ? "selected" : ""}>Under Review</option>
                      <option value="scheduled" ${data.status === "scheduled" ? "selected" : ""}>Scheduled</option>
                      <option value="published" ${data.status === "published" ? "selected" : ""}>Published</option>
                      <option value="archived" ${data.status === "archived" ? "selected" : ""}>Archived</option>
                      <option value="deleted" ${data.status === "deleted" ? "selected" : ""}>Deleted</option>
                    </select>
                    <svg viewBox="0 0 16 16" fill="currentColor" data-slot="icon" aria-hidden="true" class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-cyan-600 dark:text-cyan-400 sm:size-4">
                      <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" fill-rule="evenodd" />
                    </svg>
                  </div>
                </div>

                <!-- Search Input -->
                <div class="flex-1 max-w-md">
                  <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Search</label>
                  <form onsubmit="performContentSearch(event)" class="flex items-center space-x-2">
                    <div class="relative group flex-1">
                      <input
                        type="text"
                        name="search"
                        id="content-search-input"
                        value="${data.search || ""}"
                        oninput="toggleContentClearButton()"
                        placeholder="Search content..."
                        class="w-full rounded-full bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm px-4 py-2.5 pl-11 pr-10 text-sm text-zinc-950 dark:text-white border-2 border-cyan-200/50 dark:border-cyan-700/50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:bg-white dark:focus:bg-zinc-800 focus:shadow-lg focus:shadow-cyan-500/20 dark:focus:shadow-cyan-400/20 transition-all duration-300"
                      >
                      <div class="absolute left-3.5 top-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 dark:from-cyan-300 dark:to-blue-400 opacity-90 group-focus-within:opacity-100 transition-opacity">
                        <svg class="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                      </div>
                      <button
                        type="button"
                        id="clear-content-search"
                        onclick="clearContentSearch()"
                        class="${data.search ? "" : "hidden"} absolute right-3 top-3 flex items-center justify-center w-5 h-5 rounded-full bg-zinc-400/20 dark:bg-zinc-500/20 hover:bg-zinc-400/30 dark:hover:bg-zinc-500/30 transition-colors"
                      >
                        <svg class="h-3 w-3 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                    <button
                      type="submit"
                      class="inline-flex items-center gap-x-1.5 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 dark:from-cyan-400 dark:to-blue-400 text-white text-sm font-medium rounded-full hover:from-cyan-600 hover:to-blue-600 dark:hover:from-cyan-500 dark:hover:to-blue-500 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      </svg>
                      Search
                    </button>
                  </form>
                  <script>
                    function performContentSearch(event) {
                      event.preventDefault();
                      const searchInput = document.getElementById('content-search-input');
                      const value = searchInput.value.trim();
                      const params = new URLSearchParams(window.location.search);
                      if (value) {
                        params.set('search', value);
                      } else {
                        params.delete('search');
                      }
                      params.set('page', '1');
                      window.location.href = window.location.pathname + '?' + params.toString();
                    }

                    function clearContentSearch() {
                      const params = new URLSearchParams(window.location.search);
                      params.delete('search');
                      params.set('page', '1');
                      window.location.href = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
                    }

                    function toggleContentClearButton() {
                      const searchInput = document.getElementById('content-search-input');
                      const clearButton = document.getElementById('clear-content-search');
                      if (searchInput.value.trim()) {
                        clearButton.classList.remove('hidden');
                      } else {
                        clearButton.classList.add('hidden');
                      }
                    }

                    function updateContentFilters(filterName, filterValue) {
                      const params = new URLSearchParams(window.location.search);
                      params.set(filterName, filterValue);
                      params.set('page', '1');
                      window.location.href = window.location.pathname + '?' + params.toString();
                    }

                    function clearAllFilters() {
                      window.location.href = window.location.pathname;
                    }
                  </script>
                </div>
              </div>
              <div class="flex items-center gap-x-3">
                <span class="text-sm/6 font-medium text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded-full bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm">${data.totalItems} ${data.totalItems === 1 ? "item" : "items"}</span>
                ${filterBarData.actions?.map((action) => `
                  <button
                    ${action.onclick ? `onclick="${action.onclick}"` : ""}
                    ${action.hxGet ? `hx-get="${action.hxGet}"` : ""}
                    ${action.hxTarget ? `hx-target="${action.hxTarget}"` : ""}
                    class="inline-flex items-center gap-x-1.5 px-3 py-1.5 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm text-zinc-950 dark:text-white text-sm font-medium rounded-full ring-1 ring-inset ring-cyan-200/50 dark:ring-cyan-700/50 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 dark:hover:from-cyan-900/30 dark:hover:to-blue-900/30 hover:ring-cyan-300 dark:hover:ring-cyan-600 transition-all duration-200"
                  >
                    ${action.label === "Refresh" ? `
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                    ` : ""}
                    ${action.label}
                  </button>
                `).join("") || ""}
                ${filterBarData.bulkActions && filterBarData.bulkActions.length > 0 ? `
                  <div class="relative inline-block" id="bulk-actions-dropdown">
                    <button
                      id="bulk-actions-btn"
                      onclick="toggleBulkActionsDropdown()"
                      class="inline-flex items-center gap-x-1.5 px-3 py-1.5 bg-zinc-100/60 dark:bg-zinc-800/60 backdrop-blur-sm text-zinc-400 dark:text-zinc-600 text-sm font-medium rounded-full ring-1 ring-inset ring-zinc-200/50 dark:ring-zinc-700/50 cursor-not-allowed"
                      disabled
                    >
                      Bulk Actions
                      <svg viewBox="0 0 20 20" fill="currentColor" class="size-4">
                        <path d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" fill-rule="evenodd" />
                      </svg>
                    </button>

                    <div
                      id="bulk-actions-menu"
                      class="hidden absolute right-0 mt-2 w-56 origin-top-right divide-y divide-zinc-200 dark:divide-white/10 rounded-lg bg-white dark:bg-zinc-900 shadow-xl ring-1 ring-zinc-950/5 dark:ring-white/10 z-50 transition-all duration-100 scale-95 opacity-0"
                      style="transition-behavior: allow-discrete;"
                    >
                      <div class="py-1">
                        <button
                          onclick="performBulkAction('publish')"
                          class="group/item flex w-full items-center px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-950 dark:hover:text-white transition-colors"
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor" class="mr-3 size-5 text-zinc-400 dark:text-zinc-500 group-hover/item:text-zinc-950 dark:group-hover/item:text-white">
                            <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" />
                          </svg>
                          Publish Selected
                        </button>
                        <button
                          onclick="performBulkAction('draft')"
                          class="group/item flex w-full items-center px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-950 dark:hover:text-white transition-colors"
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor" class="mr-3 size-5 text-zinc-400 dark:text-zinc-500 group-hover/item:text-zinc-950 dark:group-hover/item:text-white">
                            <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                          </svg>
                          Move to Draft
                        </button>
                      </div>
                      <div class="py-1">
                        <button
                          onclick="performBulkAction('delete')"
                          class="group/item flex w-full items-center px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor" class="mr-3 size-5 text-zinc-400 dark:text-zinc-500 group-hover/item:text-red-600 dark:group-hover/item:text-red-400">
                            <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd" fill-rule="evenodd" />
                          </svg>
                          Delete Selected
                        </button>
                      </div>
                    </div>
                  </div>
                ` : ""}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Content List -->
      <div id="content-list">
        ${chunkH6HP2MEA_cjs.renderTable(tableData)}
        ${chunkH6HP2MEA_cjs.renderPagination(paginationData)}
      </div>
      
    </div>
    
    <!-- Modals -->
    <div id="bulk-actions-modal"></div>
    <div id="versions-modal"></div>
    
    <script>
      // Update bulk actions button state
      function updateBulkActionsButton() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"].row-checkbox');
        const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
        const btn = document.getElementById('bulk-actions-btn');
        const menu = document.getElementById('bulk-actions-menu');

        if (!btn) return;

        if (checkedCount > 0) {
          btn.disabled = false;
          btn.className = 'inline-flex items-center gap-x-1.5 px-3 py-1.5 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm text-zinc-950 dark:text-white text-sm font-medium rounded-full ring-1 ring-inset ring-cyan-200/50 dark:ring-cyan-700/50 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 dark:hover:from-cyan-900/30 dark:hover:to-blue-900/30 hover:ring-cyan-300 dark:hover:ring-cyan-600 transition-all duration-200';
        } else {
          btn.disabled = true;
          btn.className = 'inline-flex items-center gap-x-1.5 px-3 py-1.5 bg-zinc-100/60 dark:bg-zinc-800/60 backdrop-blur-sm text-zinc-400 dark:text-zinc-600 text-sm font-medium rounded-full ring-1 ring-inset ring-zinc-200/50 dark:ring-zinc-700/50 cursor-not-allowed';
          // Hide menu when no items selected
          if (menu) {
            menu.classList.remove('scale-100', 'opacity-100');
            menu.classList.add('scale-95', 'opacity-0', 'hidden');
          }
        }
      }

      // Select all functionality
      document.addEventListener('change', function(e) {
        if (e.target.id === 'select-all') {
          const checkboxes = document.querySelectorAll('.row-checkbox');
          checkboxes.forEach(cb => cb.checked = e.target.checked);
          updateBulkActionsButton();
        } else if (e.target.classList.contains('row-checkbox')) {
          updateBulkActionsButton();
        }
      });

      // Initialize button state on page load
      document.addEventListener('DOMContentLoaded', function() {
        updateBulkActionsButton();
      });

      // Toggle bulk actions dropdown
      function toggleBulkActionsDropdown() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"].row-checkbox');
        const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;

        if (checkedCount === 0) return;

        const menu = document.getElementById('bulk-actions-menu');
        const isHidden = menu.classList.contains('hidden');

        if (isHidden) {
          menu.classList.remove('hidden');
          setTimeout(() => {
            menu.classList.remove('scale-95', 'opacity-0');
            menu.classList.add('scale-100', 'opacity-100');
          }, 10);
        } else {
          menu.classList.remove('scale-100', 'opacity-100');
          menu.classList.add('scale-95', 'opacity-0');
          setTimeout(() => {
            menu.classList.add('hidden');
          }, 100);
        }
      }

      // Close dropdown when clicking outside
      document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('bulk-actions-dropdown');
        const menu = document.getElementById('bulk-actions-menu');
        if (dropdown && menu && !dropdown.contains(e.target)) {
          menu.classList.remove('scale-100', 'opacity-100');
          menu.classList.add('scale-95', 'opacity-0');
          setTimeout(() => {
            menu.classList.add('hidden');
          }, 100);
        }
      });

      // Store current bulk action context
      // Using var instead of let to avoid redeclaration errors when HTMX re-executes script tags
      var currentBulkAction = null;
      var currentSelectedIds = [];

      // Perform bulk action
      function performBulkAction(action) {
        const selectedIds = Array.from(document.querySelectorAll('input[type="checkbox"].row-checkbox:checked'))
          .map(cb => cb.value)
          .filter(id => id);

        if (selectedIds.length === 0) {
          alert('Please select at least one item');
          return;
        }

        // Store context for confirmation
        currentBulkAction = action;
        currentSelectedIds = selectedIds;

        // Update dialog content based on action
        updateDialogContent(action, selectedIds.length);

        // Show confirmation dialog
        showConfirmDialog('bulk-action-confirm');
      }

      // Update dialog content dynamically
      function updateDialogContent(action, count) {
        const dialog = document.getElementById('bulk-action-confirm');
        const titleEl = dialog.querySelector('h3');
        const messageEl = dialog.querySelector('p');
        const confirmBtn = dialog.querySelector('.confirm-button');

        let title, message, btnText, btnClass;

        switch(action) {
          case 'delete':
            title = 'Confirm Bulk Delete';
            message = 'Are you sure you want to delete ' + count + ' selected item' + (count > 1 ? 's' : '') + '? This action cannot be undone.';
            btnText = 'Delete';
            btnClass = 'bg-red-500 hover:bg-red-400';
            break;
          case 'publish':
            title = 'Confirm Bulk Publish';
            message = 'Are you sure you want to publish ' + count + ' selected item' + (count > 1 ? 's' : '') + '? They will become publicly visible.';
            btnText = 'Publish';
            btnClass = 'bg-green-500 hover:bg-green-400';
            break;
          case 'draft':
            title = 'Confirm Bulk Draft';
            message = 'Are you sure you want to move ' + count + ' selected item' + (count > 1 ? 's' : '') + ' to draft status? They will be unpublished.';
            btnText = 'Move to Draft';
            btnClass = 'bg-blue-500 hover:bg-blue-400';
            break;
          default:
            title = 'Confirm Bulk Action';
            message = 'Are you sure you want to perform this action on ' + count + ' selected item' + (count > 1 ? 's' : '') + '?';
            btnText = 'Confirm';
            btnClass = 'bg-blue-500 hover:bg-blue-400';
        }

        titleEl.textContent = title;
        messageEl.textContent = message;
        confirmBtn.textContent = btnText;
        confirmBtn.className = confirmBtn.className.replace(/bg-w+-d+s+hover:bg-w+-d+/, btnClass);
      }

      // Execute the bulk action after confirmation
      function executeBulkAction() {
        if (!currentBulkAction || currentSelectedIds.length === 0) return;

        // Close dropdown
        const menu = document.getElementById('bulk-actions-menu');
        menu.classList.add('hidden');

        fetch('/admin/content/bulk-action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: currentBulkAction,
            ids: currentSelectedIds
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            location.reload();
          } else {
            alert('Error: ' + (data.error || 'Unknown error'));
          }
        })
        .catch(err => {
          console.error('Bulk action error:', err);
          alert('Failed to perform bulk action');
        })
        .finally(() => {
          // Clear context
          currentBulkAction = null;
          currentSelectedIds = [];
        });
      }

      // Helper to get action text for display
      function getActionText(action) {
        const actionCount = currentSelectedIds.length;
        switch(action) {
          case 'publish':
            return \`publish \${actionCount} item\${actionCount > 1 ? 's' : ''}\`;
          case 'draft':
            return \`move \${actionCount} item\${actionCount > 1 ? 's' : ''} to draft\`;
          case 'delete':
            return \`delete \${actionCount} item\${actionCount > 1 ? 's' : ''}\`;
          default:
            return \`perform action on \${actionCount} item\${actionCount > 1 ? 's' : ''}\`;
        }
      }

    </script>

    <!-- Confirmation Dialog for Bulk Actions -->
    ${chunkH6HP2MEA_cjs.renderConfirmationDialog({
    id: "bulk-action-confirm",
    title: "Confirm Bulk Action",
    message: "Are you sure you want to perform this action? This operation will affect multiple items.",
    confirmText: "Confirm",
    cancelText: "Cancel",
    confirmClass: "bg-blue-500 hover:bg-blue-400",
    iconColor: "blue",
    onConfirm: "executeBulkAction()"
  })}

    <!-- Confirmation Dialog Script -->
    ${chunkH6HP2MEA_cjs.getConfirmationDialogScript()}

    <!-- Advanced Search Modal -->
    <div id="advancedSearchModal" class="hidden fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onclick="closeAdvancedSearch()"></div>

        <!-- Modal panel -->
        <div class="inline-block align-bottom bg-white dark:bg-zinc-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div class="bg-white dark:bg-zinc-900 px-4 pt-5 pb-4 sm:p-6">
            <!-- Header -->
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-zinc-950 dark:text-white" id="modal-title">
                \u{1F50D} Advanced Search
              </h3>
              <button onclick="closeAdvancedSearch()" class="text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Search Form -->
            <form id="advancedSearchForm" class="space-y-4">
              <!-- Search Input -->
              <div>
                <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Search Query</label>
                <div class="relative">
                  <input
                    type="text"
                    id="searchQuery"
                    name="query"
                    placeholder="Enter your search query..."
                    class="w-full rounded-lg bg-white dark:bg-white/5 px-4 py-3 text-sm text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 focus:ring-2 focus:ring-indigo-500"
                    autocomplete="off"
                  />
                  <div id="searchSuggestions" class="hidden absolute z-10 w-full mt-1 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 max-h-60 overflow-y-auto"></div>
                </div>
              </div>

              <!-- Mode Toggle -->
              <div>
                <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Search Mode</label>
                <div class="flex gap-4">
                  <label class="flex items-center">
                    <input type="radio" name="mode" value="ai" checked class="mr-2">
                    <span class="text-sm text-zinc-950 dark:text-white">\u{1F916} AI Search (Semantic)</span>
                  </label>
                  <label class="flex items-center">
                    <input type="radio" name="mode" value="keyword" class="mr-2">
                    <span class="text-sm text-zinc-950 dark:text-white">\u{1F524} Keyword Search</span>
                  </label>
                </div>
              </div>

              <!-- Filters -->
              <div class="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                <h4 class="text-sm font-semibold text-zinc-950 dark:text-white mb-3">Filters</h4>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Type Filter -->
                  <div>
                    <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Types</label>
                    <select
                      id="filterCollections"
                      name="collections"
                      multiple
                      class="w-full rounded-lg bg-white dark:bg-white/5 px-3 py-2 text-sm text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10"
                      size="4"
                    >
                      <option value="">All Types</option>
                      ${data.models.map(
    (model) => `
                          <option value="${model.name}">${model.displayName}</option>
                        `
  ).join("")}
                    </select>
                    <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>

                  <!-- Status Filter -->
                  <div>
                    <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Status</label>
                    <select
                      id="filterStatus"
                      name="status"
                      multiple
                      class="w-full rounded-lg bg-white dark:bg-white/5 px-3 py-2 text-sm text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10"
                      size="4"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="review">Under Review</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onclick="closeAdvancedSearch()"
                  class="inline-flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="inline-flex items-center justify-center rounded-lg bg-indigo-600 text-white px-6 py-2.5 text-sm font-semibold hover:bg-indigo-500 shadow-sm"
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          <!-- Results Area -->
          <div id="searchResults" class="hidden px-4 pb-4 sm:px-6">
            <div class="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <div id="searchResultsContent" class="space-y-3"></div>
              <div id="searchResultsPagination" class="mt-4 flex items-center justify-between"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <script>
      // Open modal
      function openAdvancedSearch() {
        document.getElementById('advancedSearchModal').classList.remove('hidden');
        document.getElementById('searchQuery').focus();
      }

      // Close modal
      function closeAdvancedSearch() {
        document.getElementById('advancedSearchModal').classList.add('hidden');
        document.getElementById('searchResults').classList.add('hidden');
      }

      // Autocomplete
      // Using var instead of let to avoid redeclaration errors when HTMX re-executes script tags
      var autocompleteTimeout;
      var searchQueryInput = document.getElementById('searchQuery');
      if (searchQueryInput) {
        searchQueryInput.addEventListener('input', (e) => {
          const query = e.target.value.trim();
          const suggestionsDiv = document.getElementById('searchSuggestions');
          
          clearTimeout(autocompleteTimeout);
          
          if (query.length < 2) {
            suggestionsDiv.classList.add('hidden');
            return;
          }

          autocompleteTimeout = setTimeout(async () => {
            try {
              const res = await fetch(\`/api/search/suggest?q=\${encodeURIComponent(query)}\`);
              const { data } = await res.json();
              
              if (data && data.length > 0) {
                suggestionsDiv.innerHTML = data.map(s => \`
                  <div class="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer" onclick="selectSuggestion('\${s.replace(/'/g, "\\'")}')">\${s}</div>
                \`).join('');
                suggestionsDiv.classList.remove('hidden');
              } else {
                suggestionsDiv.classList.add('hidden');
              }
            } catch (error) {
              console.error('Autocomplete error:', error);
            }
          }, 300);
        });
      }

      function selectSuggestion(suggestion) {
        document.getElementById('searchQuery').value = suggestion;
        document.getElementById('searchSuggestions').classList.add('hidden');
      }

      // Hide suggestions when clicking outside
      document.addEventListener('click', (e) => {
        const suggestionsDiv = document.getElementById('searchSuggestions');
        if (!e.target.closest('#searchQuery') && !e.target.closest('#searchSuggestions')) {
          suggestionsDiv.classList.add('hidden');
        }
      });

      // Form submission
      var advancedSearchForm = document.getElementById('advancedSearchForm');
      if (advancedSearchForm) {
        advancedSearchForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const formData = new FormData(e.target);
          const query = formData.get('query');
          const mode = formData.get('mode') || 'ai';
          
          // Build filters
          const filters = {};
          
          const collections = Array.from(formData.getAll('collections')).filter(c => c !== '');
          if (collections.length > 0) {
            // Need to convert collection names to IDs - for now, pass names
            filters.collections = collections;
          }
          
          const status = Array.from(formData.getAll('status'));
          if (status.length > 0) {
            filters.status = status;
          }
          
          const dateStart = formData.get('date_start');
          const dateEnd = formData.get('date_end');
          if (dateStart || dateEnd) {
            filters.dateRange = {
              start: dateStart ? new Date(dateStart) : null,
              end: dateEnd ? new Date(dateEnd) : null,
              field: 'created_at'
            };
          }

          // Execute search
          try {
            const res = await fetch('/api/search', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                query,
                mode,
                filters,
                limit: 20
              })
            });

            const { data } = await res.json();
            
            if (data && data.results) {
              displaySearchResults(data);
            }
          } catch (error) {
            console.error('Search error:', error);
            alert('Search failed. Please try again.');
          }
        });
      }

      function displaySearchResults(searchData) {
        const resultsDiv = document.getElementById('searchResultsContent');
        const resultsSection = document.getElementById('searchResults');
        
        if (searchData.results.length === 0) {
          resultsDiv.innerHTML = '<p class="text-sm text-zinc-500 dark:text-zinc-400">No results found.</p>';
        } else {
          resultsDiv.innerHTML = searchData.results.map(result => \`
            <div class="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h4 class="text-sm font-semibold text-zinc-950 dark:text-white mb-1">
                    <a href="/admin/content/\${result.id}/edit" class="hover:text-indigo-600 dark:hover:text-indigo-400">\${result.title || 'Untitled'}</a>
                  </h4>
                  <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                    \${result.collection_name} \u2022 \${new Date(result.created_at).toLocaleDateString()}
                    \${result.relevance_score ? \` \u2022 Relevance: \${(result.relevance_score * 100).toFixed(0)}%\` : ''}
                  </p>
                  \${result.snippet ? \`<p class="text-sm text-zinc-600 dark:text-zinc-400">\${result.snippet}</p>\` : ''}
                </div>
                <div class="ml-4">
                  <span class="px-2 py-1 text-xs rounded-full \${result.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}">\${result.status}</span>
                </div>
              </div>
            </div>
          \`).join('');
        }
        
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      // Make functions globally available
      window.openAdvancedSearch = openAdvancedSearch;
      window.closeAdvancedSearch = closeAdvancedSearch;
    </script>
  `;
  const layoutData = {
    title: "Content Management",
    pageTitle: "Content Management",
    currentPath: "/admin/content",
    user: data.user,
    version: data.version,
    content: pageContent
  };
  return chunk4IO5UBHK_cjs.renderAdminLayoutCatalyst(layoutData);
}

// src/templates/components/version-history.template.ts
function renderVersionHistory(data) {
  return `
    <div class="version-history-modal">
      <div class="backdrop-blur-xl bg-white/10 rounded-xl border border-white/20 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <!-- Header -->
        <div class="relative px-6 py-4 border-b border-white/10">
          <div class="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
          <div class="relative flex items-center justify-between">
            <h3 class="text-lg font-semibold text-white">Version History</h3>
            <button onclick="closeVersionHistory()" class="text-gray-300 hover:text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Versions List -->
        <div class="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div class="p-6 space-y-4">
            ${data.versions.map((version, index) => `
              <div class="version-item backdrop-blur-sm bg-white/5 rounded-xl border border-white/10 p-4 ${version.is_current ? "ring-2 ring-blue-500/50" : ""}">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center space-x-3">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${version.is_current ? "bg-blue-500/20 text-blue-300" : "bg-white/10 text-gray-300"}">
                      Version ${version.version}${version.is_current ? " (Current)" : ""}
                    </span>
                    <span class="text-sm text-gray-300">
                      ${new Date(version.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div class="flex items-center space-x-2">
                    ${!version.is_current ? `
                      <button 
                        onclick="restoreVersion('${data.contentId}', ${version.version})"
                        class="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-xl hover:bg-green-700 transition-all"
                      >
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                        </svg>
                        Restore
                      </button>
                    ` : ""}
                    <button 
                      onclick="previewVersion('${data.contentId}', ${version.version})"
                      class="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-all"
                    >
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                      Preview
                    </button>
                  </div>
                </div>
                
                <!-- Version Summary -->
                <div class="version-summary text-sm">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span class="text-gray-400">Title:</span>
                      <span class="text-white ml-2">${escapeHtml3(version.data?.title || "Untitled")}</span>
                    </div>
                    <div>
                      <span class="text-gray-400">Author:</span>
                      <span class="text-white ml-2">${escapeHtml3(version.author_name || "Unknown")}</span>
                    </div>
                    ${version.data?.excerpt ? `
                      <div class="md:col-span-2">
                        <span class="text-gray-400">Excerpt:</span>
                        <p class="text-white mt-1 text-xs">${escapeHtml3(version.data.excerpt.substring(0, 200))}${version.data.excerpt.length > 200 ? "..." : ""}</p>
                      </div>
                    ` : ""}
                  </div>
                </div>
                
                <!-- Changes Summary (if not current) -->
                ${!version.is_current && index < data.versions.length - 1 ? `
                  <div class="mt-3 pt-3 border-t border-white/10">
                    <button 
                      onclick="toggleChanges('changes-${version.version}')"
                      class="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
                      </svg>
                      View Changes
                    </button>
                    <div id="changes-${version.version}" class="hidden mt-2 text-xs text-gray-300">
                      <em>Change detection coming soon...</em>
                    </div>
                  </div>
                ` : ""}
              </div>
            `).join("")}
          </div>
        </div>
        
        <!-- Footer -->
        <div class="px-6 py-4 border-t border-white/10 bg-white/5">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-400">
              ${data.versions.length} version${data.versions.length !== 1 ? "s" : ""} total
            </span>
            <button 
              onclick="closeVersionHistory()"
              class="px-4 py-2 bg-white/10 text-white rounded-xl border border-white/20 hover:bg-white/20 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <script>
      function closeVersionHistory() {
        document.querySelector('.version-history-modal').closest('.fixed').remove();
      }
      
      function restoreVersion(contentId, version) {
        if (confirm(\`Are you sure you want to restore to version \${version}? This will create a new version with the restored content.\`)) {
          fetch(\`/admin/content/\${contentId}/restore/\${version}\`, {
            method: 'POST'
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              showNotification('Version restored successfully! Refreshing page...', 'success');
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } else {
              showNotification('Failed to restore version', 'error');
            }
          })
          .catch(error => {
            console.error('Error restoring version:', error);
            showNotification('Error restoring version', 'error');
          });
        }
      }
      
      function previewVersion(contentId, version) {
        const preview = window.open('', '_blank');
        preview.document.write('<p>Loading version preview...</p>');
        
        fetch(\`/admin/content/\${contentId}/version/\${version}/preview\`)
        .then(response => response.text())
        .then(html => {
          preview.document.open();
          preview.document.write(html);
          preview.document.close();
        })
        .catch(error => {
          preview.document.write('<p>Error loading preview</p>');
        });
      }
      
      function toggleChanges(elementId) {
        const element = document.getElementById(elementId);
        element.classList.toggle('hidden');
      }
    </script>
  `;
}
function escapeHtml3(text) {
  if (typeof text !== "string") return String(text || "");
  return text.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char] || char);
}

// src/content-types.ts
var CONTENT_TYPES = {
  image: {
    name: "image",
    displayName: "Image",
    description: "Upload and manage images with metadata",
    icon: `<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
    </svg>`,
    acceptedMimeTypes: "image/*",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, placeholder: "Image title" },
      { name: "alt_text", label: "Alt Text", type: "text", placeholder: "Descriptive alt text for accessibility" },
      { name: "description", label: "Description", type: "textarea", placeholder: "Optional description" },
      { name: "file", label: "Image File", type: "file", required: true, accept: "image/*", helpText: "JPG, PNG, GIF, WebP, SVG" },
      { name: "tags", label: "Tags", type: "tags", placeholder: "Comma-separated tags" }
    ]
  },
  pdf: {
    name: "pdf",
    displayName: "PDF",
    description: "Upload and manage PDF documents",
    icon: `<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
    </svg>`,
    acceptedMimeTypes: "application/pdf",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, placeholder: "Document title" },
      { name: "description", label: "Description", type: "textarea", placeholder: "Optional description" },
      { name: "file", label: "PDF File", type: "file", required: true, accept: "application/pdf", helpText: "PDF files only" },
      { name: "tags", label: "Tags", type: "tags", placeholder: "Comma-separated tags" }
    ]
  },
  text: {
    name: "text",
    displayName: "Text",
    description: "Create plain text content",
    icon: `<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/>
    </svg>`,
    fields: [
      { name: "title", label: "Title", type: "text", required: true, placeholder: "Content title" },
      { name: "content", label: "Content", type: "textarea", required: true, placeholder: "Write your content here..." },
      { name: "tags", label: "Tags", type: "tags", placeholder: "Comma-separated tags" }
    ]
  },
  html: {
    name: "html",
    displayName: "HTML",
    description: "Create rich HTML content with the visual editor",
    icon: `<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
    </svg>`,
    fields: [
      { name: "title", label: "Title", type: "text", required: true, placeholder: "Content title" },
      { name: "content", label: "Content", type: "richtext", required: true },
      { name: "tags", label: "Tags", type: "tags", placeholder: "Comma-separated tags" }
    ]
  },
  file: {
    name: "file",
    displayName: "File",
    description: "Upload and manage any type of file",
    icon: `<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
    </svg>`,
    fields: [
      { name: "title", label: "Title", type: "text", required: true, placeholder: "File title" },
      { name: "description", label: "Description", type: "textarea", placeholder: "Optional description" },
      { name: "file", label: "File", type: "file", required: true, helpText: "Any file type" },
      { name: "tags", label: "Tags", type: "tags", placeholder: "Comma-separated tags" }
    ]
  }
};
function getContentType(name) {
  return CONTENT_TYPES[name];
}
function getAllContentTypes() {
  return Object.values(CONTENT_TYPES);
}

// src/routes/admin-content.ts
var adminContentRoutes = new hono.Hono();
adminContentRoutes.use("*", chunkTAYKWZ2B_cjs.requireAuth());
function extractFormData(fields, formData) {
  const data = {};
  const errors = {};
  for (const field of fields) {
    const value = formData.get(field.name);
    if (field.type === "tags") {
      data[field.name] = value ? String(value).split(",").map((t) => t.trim()).filter(Boolean) : [];
    } else if (field.type === "file") {
      data[field.name] = value ? String(value) : "";
    } else {
      data[field.name] = value ? String(value) : "";
    }
    if (field.required) {
      const val = data[field.name];
      const isEmpty = val === "" || val === null || val === void 0 || Array.isArray(val) && val.length === 0;
      if (isEmpty) {
        errors[field.name] = [`${field.label} is required`];
      }
    }
  }
  return { data, errors };
}
adminContentRoutes.get("/", async (c) => {
  try {
    const user = c.get("user");
    const url = new URL(c.req.url);
    const db = c.env.DB;
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const typeName = url.searchParams.get("type") || "all";
    const status = url.searchParams.get("status") || "all";
    const search = url.searchParams.get("search") || "";
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    if (status !== "deleted") {
      conditions.push("c.status != 'deleted'");
    }
    if (search) {
      conditions.push("(c.title LIKE ? OR c.slug LIKE ? OR c.data LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (typeName !== "all") {
      conditions.push("c.collection_id = ?");
      params.push(typeName);
    }
    if (status !== "all" && status !== "deleted") {
      conditions.push("c.status = ?");
      params.push(status);
    } else if (status === "deleted") {
      conditions.push("c.status = 'deleted'");
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM content c ${whereClause}`);
    const countResult = await countStmt.bind(...params).first();
    const totalItems = countResult?.count || 0;
    const contentStmt = db.prepare(`
      SELECT c.id, c.title, c.slug, c.status, c.collection_id, c.created_at, c.updated_at,
             u.first_name, u.last_name, u.email as author_email
      FROM content c
      LEFT JOIN users u ON c.author_id = u.id
      ${whereClause}
      ORDER BY c.updated_at DESC
      LIMIT ? OFFSET ?
    `);
    const { results } = await contentStmt.bind(...params, limit, offset).all();
    const statusConfig = {
      draft: { class: "bg-zinc-50 dark:bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 ring-1 ring-inset ring-zinc-600/20 dark:ring-zinc-500/20", text: "Draft" },
      review: { class: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-inset ring-amber-600/20 dark:ring-amber-500/20", text: "Under Review" },
      scheduled: { class: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-600/20 dark:ring-blue-500/20", text: "Scheduled" },
      published: { class: "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20 dark:ring-green-500/20", text: "Published" },
      archived: { class: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 ring-1 ring-inset ring-purple-600/20 dark:ring-purple-500/20", text: "Archived" },
      deleted: { class: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-600/20 dark:ring-red-500/20", text: "Deleted" }
    };
    const contentItems = (results || []).map((row) => {
      const cfg = statusConfig[row.status] ?? statusConfig.draft;
      const statusBadge = `<span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${cfg.class}">${cfg.text}</span>`;
      const authorName = row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : row.author_email || "Unknown";
      const ct = getContentType(row.collection_id);
      const typeDisplayName = ct?.displayName || row.collection_id || "Unknown";
      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        modelName: typeDisplayName,
        statusBadge,
        authorName,
        formattedDate: new Date(row.updated_at).toLocaleDateString(),
        availableActions: []
      };
    });
    const types = getAllContentTypes().map((ct) => ({
      name: ct.name,
      displayName: ct.displayName
    }));
    const pageData = {
      modelName: typeName,
      status,
      page,
      search,
      models: types,
      contentItems,
      totalItems,
      itemsPerPage: limit,
      user: user ? { name: user.email, email: user.email, role: user.role } : void 0,
      version: c.get("appVersion")
    };
    return c.html(renderContentListPage(pageData));
  } catch (error) {
    console.error("Error fetching content list:", error);
    return c.html(`<p>Error loading content: ${error}</p>`);
  }
});
adminContentRoutes.get("/new", async (c) => {
  try {
    const user = c.get("user");
    const url = new URL(c.req.url);
    const typeName = url.searchParams.get("type");
    if (!typeName) {
      const types = getAllContentTypes();
      const { renderAdminLayoutCatalyst: renderAdminLayoutCatalyst2 } = await import('./admin-layout-catalyst.template-IPHZBJYY.cjs');
      const cards = types.map((ct) => `
        <a href="/admin/content/new?type=${ct.name}"
           class="group block rounded-xl bg-white dark:bg-zinc-800 p-6 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 hover:ring-cyan-500/50 dark:hover:ring-cyan-400/50 hover:shadow-md transition-all">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              ${ct.icon}
            </div>
            <div>
              <h3 class="text-base font-semibold text-zinc-950 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">${ct.displayName}</h3>
              <p class="text-sm text-zinc-500 dark:text-zinc-400">${ct.description}</p>
            </div>
          </div>
        </a>
      `).join("");
      const pageContent = `
        <div class="mb-6">
          <a href="/admin/content" class="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            Back to Content
          </a>
        </div>
        <div class="mb-8">
          <h1 class="text-2xl font-semibold text-zinc-950 dark:text-white">Create New Content</h1>
          <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Choose a content type to get started</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          ${cards}
        </div>
      `;
      return c.html(renderAdminLayoutCatalyst2({
        title: "New Content",
        currentPath: "/admin/content",
        user: user ? { name: user.email, email: user.email, role: user.role } : void 0,
        version: c.get("appVersion"),
        content: pageContent
      }));
    }
    const contentType = getContentType(typeName);
    if (!contentType) {
      return c.html(renderContentFormPage({
        contentType: { name: "unknown", displayName: "Unknown", description: "", icon: "", fields: [] },
        error: "Content type not found.",
        user: user ? { name: user.email, email: user.email, role: user.role } : void 0
      }));
    }
    return c.html(renderContentFormPage({
      contentType,
      isEdit: false,
      user: user ? { name: user.email, email: user.email, role: user.role } : void 0,
      version: c.get("appVersion")
    }));
  } catch (error) {
    console.error("Error loading new content form:", error);
    return c.html(renderContentFormPage({
      contentType: { name: "unknown", displayName: "Unknown", description: "", icon: "", fields: [] },
      error: "Failed to load content form.",
      user: c.get("user") ? { name: c.get("user").email, email: c.get("user").email, role: c.get("user").role } : void 0
    }));
  }
});
adminContentRoutes.get("/:id/edit", async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    const db = c.env.DB;
    const url = new URL(c.req.url);
    const referrerParams = url.searchParams.get("ref") || "";
    const cache = chunkJUS7ZTDS_cjs.getCacheService(chunkJUS7ZTDS_cjs.CACHE_CONFIGS.content);
    const content = await cache.getOrSet(
      cache.generateKey("content", id),
      async () => {
        const stmt = db.prepare("SELECT * FROM content WHERE id = ?");
        return await stmt.bind(id).first();
      }
    );
    if (!content) {
      return c.html(renderContentFormPage({
        contentType: { name: "unknown", displayName: "Unknown", description: "", icon: "", fields: [] },
        error: "Content not found.",
        user: user ? { name: user.email, email: user.email, role: user.role } : void 0
      }));
    }
    const contentType = getContentType(content.collection_id) || {
      name: content.collection_id || "unknown",
      displayName: content.collection_id || "Unknown",
      description: "",
      icon: "",
      fields: []
    };
    const contentData = content.data ? JSON.parse(content.data) : {};
    return c.html(renderContentFormPage({
      id: content.id,
      title: content.title,
      slug: content.slug,
      data: contentData,
      status: content.status,
      contentType,
      isEdit: true,
      referrerParams,
      user: user ? { name: user.email, email: user.email, role: user.role } : void 0,
      version: c.get("appVersion")
    }));
  } catch (error) {
    console.error("Error loading edit content form:", error);
    return c.html(renderContentFormPage({
      contentType: { name: "unknown", displayName: "Unknown", description: "", icon: "", fields: [] },
      error: "Failed to load content for editing.",
      user: c.get("user") ? { name: c.get("user").email, email: c.get("user").email, role: c.get("user").role } : void 0
    }));
  }
});
adminContentRoutes.post("/", async (c) => {
  try {
    const user = c.get("user");
    const formData = await c.req.formData();
    const typeName = formData.get("content_type");
    const action = formData.get("action");
    const contentType = getContentType(typeName);
    if (!contentType) {
      return c.html(html.html`<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Invalid content type.</div>`);
    }
    const db = c.env.DB;
    const { data, errors } = extractFormData(contentType.fields, formData);
    if (Object.keys(errors).length > 0) {
      return c.html(renderContentFormPage({
        contentType,
        data,
        validationErrors: errors,
        error: "Please fix the validation errors below.",
        user: user ? { name: user.email, email: user.email, role: user.role } : void 0
      }));
    }
    let slug = (data.title || "untitled").toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
    let status = formData.get("status") || "draft";
    if (action === "save_and_publish") status = "published";
    const contentId = crypto.randomUUID();
    const now = Date.now();
    await db.prepare(`
      INSERT INTO content (id, collection_id, slug, title, data, status, author_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(contentId, typeName, slug, data.title || "Untitled", JSON.stringify(data), status, user?.userId || "unknown", now, now).run();
    const cache = chunkJUS7ZTDS_cjs.getCacheService(chunkJUS7ZTDS_cjs.CACHE_CONFIGS.content);
    await cache.invalidate("content:list:*");
    await db.prepare(`
      INSERT INTO content_versions (id, content_id, version, data, author_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), contentId, 1, JSON.stringify(data), user?.userId || "unknown", now).run();
    await db.prepare(`
      INSERT INTO workflow_history (id, content_id, action, from_status, to_status, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), contentId, "created", "none", status, user?.userId || "unknown", now).run();
    const referrerParams = formData.get("referrer_params");
    const redirectUrl = action === "save_and_continue" ? `/admin/content/${contentId}/edit?success=Content saved successfully!${referrerParams ? `&ref=${encodeURIComponent(referrerParams)}` : ""}` : referrerParams ? `/admin/content?${referrerParams}&success=Content created successfully!` : `/admin/content?type=${typeName}&success=Content created successfully!`;
    const isHTMX = c.req.header("HX-Request") === "true";
    return isHTMX ? c.text("", 200, { "HX-Redirect": redirectUrl }) : c.redirect(redirectUrl);
  } catch (error) {
    console.error("Error creating content:", error);
    return c.html(html.html`<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Failed to create content. Please try again.</div>`);
  }
});
adminContentRoutes.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    const formData = await c.req.formData();
    const action = formData.get("action");
    const db = c.env.DB;
    const existingContent = await db.prepare("SELECT * FROM content WHERE id = ?").bind(id).first();
    if (!existingContent) {
      return c.html(html.html`<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Content not found.</div>`);
    }
    const contentType = getContentType(existingContent.collection_id);
    if (!contentType) {
      return c.html(html.html`<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Content type not found.</div>`);
    }
    const { data, errors } = extractFormData(contentType.fields, formData);
    if (Object.keys(errors).length > 0) {
      return c.html(renderContentFormPage({
        id,
        contentType,
        data,
        validationErrors: errors,
        error: "Please fix the validation errors below.",
        isEdit: true,
        user: user ? { name: user.email, email: user.email, role: user.role } : void 0
      }));
    }
    let slug = (data.title || "untitled").toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
    let status = formData.get("status") || existingContent.status;
    if (action === "save_and_publish") status = "published";
    const now = Date.now();
    await db.prepare(`
      UPDATE content SET slug = ?, title = ?, data = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).bind(slug, data.title || "Untitled", JSON.stringify(data), status, now, id).run();
    const cache = chunkJUS7ZTDS_cjs.getCacheService(chunkJUS7ZTDS_cjs.CACHE_CONFIGS.content);
    await cache.delete(cache.generateKey("content", id));
    await cache.invalidate("content:list:*");
    const existingData = JSON.parse(existingContent.data || "{}");
    if (JSON.stringify(existingData) !== JSON.stringify(data)) {
      const versionResult = await db.prepare("SELECT MAX(version) as max_version FROM content_versions WHERE content_id = ?").bind(id).first();
      const nextVersion = (versionResult?.max_version || 0) + 1;
      await db.prepare(`
        INSERT INTO content_versions (id, content_id, version, data, author_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), id, nextVersion, JSON.stringify(data), user?.userId || "unknown", now).run();
    }
    if (status !== existingContent.status) {
      await db.prepare(`
        INSERT INTO workflow_history (id, content_id, action, from_status, to_status, user_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), id, "status_changed", existingContent.status, status, user?.userId || "unknown", now).run();
    }
    const referrerParams = formData.get("referrer_params");
    const redirectUrl = action === "save_and_continue" ? `/admin/content/${id}/edit?success=Content updated successfully!${referrerParams ? `&ref=${encodeURIComponent(referrerParams)}` : ""}` : referrerParams ? `/admin/content?${referrerParams}&success=Content updated successfully!` : `/admin/content?type=${existingContent.collection_id}&success=Content updated successfully!`;
    const isHTMX = c.req.header("HX-Request") === "true";
    return isHTMX ? c.text("", 200, { "HX-Redirect": redirectUrl }) : c.redirect(redirectUrl);
  } catch (error) {
    console.error("Error updating content:", error);
    return c.html(html.html`<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Failed to update content. Please try again.</div>`);
  }
});
adminContentRoutes.post("/duplicate", async (c) => {
  try {
    const user = c.get("user");
    const formData = await c.req.formData();
    const originalId = formData.get("id");
    if (!originalId) return c.json({ success: false, error: "Content ID required" });
    const db = c.env.DB;
    const original = await db.prepare("SELECT * FROM content WHERE id = ?").bind(originalId).first();
    if (!original) return c.json({ success: false, error: "Content not found" });
    const newId = crypto.randomUUID();
    const now = Date.now();
    const originalData = JSON.parse(original.data || "{}");
    originalData.title = `${originalData.title || "Untitled"} (Copy)`;
    await db.prepare(`
      INSERT INTO content (id, collection_id, slug, title, data, status, author_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(newId, original.collection_id, `${original.slug}-copy-${Date.now()}`, originalData.title, JSON.stringify(originalData), "draft", user?.userId || "unknown", now, now).run();
    return c.json({ success: true, id: newId });
  } catch (error) {
    console.error("Error duplicating content:", error);
    return c.json({ success: false, error: "Failed to duplicate content" });
  }
});
adminContentRoutes.post("/bulk-action", async (c) => {
  try {
    const body = await c.req.json();
    const { action, ids } = body;
    if (!action || !ids || ids.length === 0) return c.json({ success: false, error: "Action and IDs required" });
    const db = c.env.DB;
    const now = Date.now();
    const placeholders = ids.map(() => "?").join(",");
    if (action === "delete") {
      await db.prepare(`UPDATE content SET status = 'deleted', updated_at = ? WHERE id IN (${placeholders})`).bind(now, ...ids).run();
    } else if (action === "publish" || action === "draft") {
      const publishedAt = action === "publish" ? now : null;
      await db.prepare(`UPDATE content SET status = ?, published_at = ?, updated_at = ? WHERE id IN (${placeholders})`).bind(action, publishedAt, now, ...ids).run();
    } else {
      return c.json({ success: false, error: "Invalid action" });
    }
    const cache = chunkJUS7ZTDS_cjs.getCacheService(chunkJUS7ZTDS_cjs.CACHE_CONFIGS.content);
    for (const contentId of ids) {
      await cache.delete(cache.generateKey("content", contentId));
    }
    await cache.invalidate("content:list:*");
    return c.json({ success: true, count: ids.length });
  } catch (error) {
    console.error("Bulk action error:", error);
    return c.json({ success: false, error: "Failed to perform bulk action" });
  }
});
adminContentRoutes.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const db = c.env.DB;
    const content = await db.prepare("SELECT id FROM content WHERE id = ?").bind(id).first();
    if (!content) return c.json({ success: false, error: "Content not found" }, 404);
    const now = Date.now();
    await db.prepare(`UPDATE content SET status = 'deleted', updated_at = ? WHERE id = ?`).bind(now, id).run();
    const cache = chunkJUS7ZTDS_cjs.getCacheService(chunkJUS7ZTDS_cjs.CACHE_CONFIGS.content);
    await cache.delete(cache.generateKey("content", id));
    await cache.invalidate("content:list:*");
    return c.html(`
      <div id="content-list" hx-get="/admin/content" hx-trigger="load" hx-swap="outerHTML">
        <div class="flex items-center justify-center p-8">
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 text-lime-500 dark:text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Content deleted successfully. Refreshing...</p>
          </div>
        </div>
      </div>
    `);
  } catch (error) {
    console.error("Delete content error:", error);
    return c.json({ success: false, error: "Failed to delete content" }, 500);
  }
});
adminContentRoutes.get("/:id/versions", async (c) => {
  try {
    const id = c.req.param("id");
    const db = c.env.DB;
    const content = await db.prepare("SELECT * FROM content WHERE id = ?").bind(id).first();
    if (!content) return c.html("<p>Content not found</p>");
    const { results } = await db.prepare(`
      SELECT cv.*, u.first_name, u.last_name, u.email
      FROM content_versions cv
      LEFT JOIN users u ON cv.author_id = u.id
      WHERE cv.content_id = ?
      ORDER BY cv.version DESC
    `).bind(id).all();
    const versions = (results || []).map((row) => ({
      id: row.id,
      version: row.version,
      data: JSON.parse(row.data || "{}"),
      author_id: row.author_id,
      author_name: row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : row.email,
      created_at: row.created_at,
      is_current: false
    }));
    if (versions.length > 0) versions[0].is_current = true;
    return c.html(renderVersionHistory({
      contentId: id,
      versions,
      currentVersion: versions.length > 0 ? versions[0].version : 1
    }));
  } catch (error) {
    console.error("Error loading version history:", error);
    return c.html("<p>Error loading version history</p>");
  }
});
adminContentRoutes.post("/:id/restore/:version", async (c) => {
  try {
    const id = c.req.param("id");
    const version = parseInt(c.req.param("version"));
    const user = c.get("user");
    const db = c.env.DB;
    const versionData = await db.prepare("SELECT * FROM content_versions WHERE content_id = ? AND version = ?").bind(id, version).first();
    if (!versionData) return c.json({ success: false, error: "Version not found" });
    const currentContent = await db.prepare("SELECT * FROM content WHERE id = ?").bind(id).first();
    if (!currentContent) return c.json({ success: false, error: "Content not found" });
    const restoredData = JSON.parse(versionData.data);
    const now = Date.now();
    await db.prepare("UPDATE content SET title = ?, data = ?, updated_at = ? WHERE id = ?").bind(restoredData.title || "Untitled", versionData.data, now, id).run();
    const nextVersionResult = await db.prepare("SELECT MAX(version) as max_version FROM content_versions WHERE content_id = ?").bind(id).first();
    const nextVersion = (nextVersionResult?.max_version || 0) + 1;
    await db.prepare("INSERT INTO content_versions (id, content_id, version, data, author_id, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), id, nextVersion, versionData.data, user?.userId || "unknown", now).run();
    await db.prepare("INSERT INTO workflow_history (id, content_id, action, from_status, to_status, user_id, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), id, "version_restored", currentContent.status, currentContent.status, user?.userId || "unknown", `Restored to version ${version}`, now).run();
    return c.json({ success: true });
  } catch (error) {
    console.error("Error restoring version:", error);
    return c.json({ success: false, error: "Failed to restore version" });
  }
});
adminContentRoutes.get("/:id/version/:version/preview", async (c) => {
  try {
    const id = c.req.param("id");
    const version = parseInt(c.req.param("version"));
    const db = c.env.DB;
    const versionData = await db.prepare(`
      SELECT cv.*, c.collection_id
      FROM content_versions cv
      JOIN content c ON cv.content_id = c.id
      WHERE cv.content_id = ? AND cv.version = ?
    `).bind(id, version).first();
    if (!versionData) return c.html("<p>Version not found</p>");
    const ct = getContentType(versionData.collection_id);
    const data = JSON.parse(versionData.data || "{}");
    return c.html(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Version ${version} Preview: ${data.title || "Untitled"}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          .meta { color: #666; font-size: 14px; margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 5px; }
          .version-badge { background: #007cba; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="meta">
          <span class="version-badge">Version ${version}</span>
          <strong>Type:</strong> ${ct?.displayName || versionData.collection_id}<br>
          <strong>Created:</strong> ${new Date(versionData.created_at).toLocaleString()}<br>
          <em>Historical version preview</em>
        </div>
        <h1>${data.title || "Untitled"}</h1>
        <div>${data.content || ""}</div>
        <h3>All Field Data:</h3>
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto;">${JSON.stringify(data, null, 2)}</pre>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Error generating version preview:", error);
    return c.html("<p>Error generating preview</p>");
  }
});
var admin_content_default = adminContentRoutes;

// src/templates/pages/admin-profile.template.ts
chunk4IO5UBHK_cjs.init_admin_layout_catalyst_template();
function renderAvatarImage(avatarUrl, firstName, lastName) {
  return `<div id="avatar-image-container" class="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center ring-4 ring-zinc-950/5 dark:ring-white/10">
    ${avatarUrl ? `<img src="${avatarUrl}" alt="Profile picture" class="w-full h-full object-cover">` : `<span class="text-2xl font-bold text-white">${firstName.charAt(0)}${lastName.charAt(0)}</span>`}
  </div>`;
}
function renderProfilePage(data) {
  const pageContent = `
    <div class="space-y-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl/8 font-semibold text-zinc-950 dark:text-white sm:text-xl/8">User Profile</h1>
          <p class="mt-2 text-sm/6 text-zinc-500 dark:text-zinc-400">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <!-- Alert Messages -->
      ${data.error ? chunkH6HP2MEA_cjs.renderAlert({ type: "error", message: data.error, dismissible: true }) : ""}
      ${data.success ? chunkH6HP2MEA_cjs.renderAlert({ type: "success", message: data.success, dismissible: true }) : ""}

      <!-- Profile Form -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Profile Form -->
        <div class="lg:col-span-2">
          <div class="rounded-xl bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10">
            <!-- Form Header -->
            <div class="px-6 py-5 border-b border-zinc-950/5 dark:border-white/5">
              <div class="flex items-center gap-x-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-950 dark:bg-white">
                  <svg class="h-5 w-5 text-white dark:text-zinc-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <div>
                  <h2 class="text-base font-semibold text-zinc-950 dark:text-white">Profile Information</h2>
                  <p class="text-sm text-zinc-500 dark:text-zinc-400">Update your account details</p>
                </div>
              </div>
            </div>

            <!-- Form Content -->
            <form id="profile-form" hx-put="/admin/profile" hx-target="#form-messages" class="p-6 space-y-6">
              <div id="form-messages"></div>

              <!-- Basic Information -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value="${data.profile.first_name}"
                    required
                    class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                    placeholder="Enter your first name"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value="${data.profile.last_name}"
                    required
                    class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                    placeholder="Enter your last name"
                  >
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value="${data.profile.username}"
                  required
                  class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                  placeholder="Enter your username"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value="${data.profile.email}"
                  required
                  class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                  placeholder="Enter your email address"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value="${data.profile.phone || ""}"
                  class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                  placeholder="Enter your phone number"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Bio</label>
                <textarea
                  name="bio"
                  rows="3"
                  class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow resize-none"
                  placeholder="Tell us about yourself..."
                >${data.profile.bio || ""}</textarea>
              </div>

              <!-- Preferences -->
              <div class="pt-6 border-t border-zinc-950/5 dark:border-white/5">
                <h3 class="text-base font-semibold text-zinc-950 dark:text-white mb-4">Preferences</h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label for="timezone" class="block text-sm/6 font-medium text-zinc-950 dark:text-white mb-2">Timezone</label>
                    <div class="grid grid-cols-1">
                      <select id="timezone" name="timezone" class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white/5 dark:bg-white/5 py-1.5 pl-3 pr-8 text-base text-zinc-950 dark:text-white outline outline-1 -outline-offset-1 outline-zinc-500/30 dark:outline-zinc-400/30 *:bg-white dark:*:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zinc-500 dark:focus-visible:outline-zinc-400 sm:text-sm/6">
                        ${data.timezones.map((tz) => `
                          <option value="${tz.value}" ${tz.value === data.profile.timezone ? "selected" : ""}>${tz.label}</option>
                        `).join("")}
                      </select>
                      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-zinc-600 dark:text-zinc-400 sm:size-4">
                        <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" fill-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <label for="language" class="block text-sm/6 font-medium text-zinc-950 dark:text-white mb-2">Language</label>
                    <div class="grid grid-cols-1">
                      <select id="language" name="language" class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white/5 dark:bg-white/5 py-1.5 pl-3 pr-8 text-base text-zinc-950 dark:text-white outline outline-1 -outline-offset-1 outline-zinc-500/30 dark:outline-zinc-400/30 *:bg-white dark:*:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zinc-500 dark:focus-visible:outline-zinc-400 sm:text-sm/6">
                        ${data.languages.map((lang) => `
                          <option value="${lang.value}" ${lang.value === data.profile.language ? "selected" : ""}>${lang.label}</option>
                        `).join("")}
                      </select>
                      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-zinc-600 dark:text-zinc-400 sm:size-4">
                        <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" fill-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Notifications -->
              <div class="pt-6 border-t border-zinc-950/5 dark:border-white/5">
                <h3 class="text-base font-semibold text-zinc-950 dark:text-white mb-4">Notifications</h3>

                <div class="space-y-5">
                  <div class="flex gap-3">
                    <div class="flex h-6 shrink-0 items-center">
                      <div class="group grid size-4 grid-cols-1">
                        <input
                          type="checkbox"
                          id="email_notifications"
                          name="email_notifications"
                          value="1"
                          ${data.profile.email_notifications ? "checked" : ""}
                          class="col-start-1 row-start-1 appearance-none rounded border border-zinc-950/10 dark:border-white/10 bg-white dark:bg-white/5 checked:border-indigo-500 checked:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-zinc-950/5 dark:disabled:border-white/5 disabled:bg-zinc-950/10 dark:disabled:bg-white/10 forced-colors:appearance-auto"
                        />
                        <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-zinc-950/25 dark:group-has-[:disabled]:stroke-white/25">
                          <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:checked]:opacity-100" />
                        </svg>
                      </div>
                    </div>
                    <div class="text-sm/6">
                      <label for="email_notifications" class="font-medium text-zinc-950 dark:text-white">Email notifications</label>
                      <p class="text-zinc-500 dark:text-zinc-400">Receive email updates about new features and product announcements.</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Submit Button -->
              <div class="pt-6 border-t border-zinc-950/5 dark:border-white/5">
                <button
                  type="submit"
                  class="inline-flex justify-center items-center gap-x-2 rounded-lg bg-zinc-950 dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 dark:focus-visible:outline-white transition-colors"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Profile Sidebar -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Avatar -->
          <div class="rounded-xl bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 p-6">
            <h3 class="text-base font-semibold text-zinc-950 dark:text-white mb-4">Profile Picture</h3>

            <div class="text-center">
              ${renderAvatarImage(data.profile.avatar_url, data.profile.first_name, data.profile.last_name)}

              <form id="avatar-form" hx-post="/admin/profile/avatar" hx-target="#avatar-messages" hx-encoding="multipart/form-data">
                <input
                  type="file"
                  name="avatar"
                  accept="image/*"
                  class="hidden"
                  id="avatar-input"
                  onchange="document.getElementById('avatar-form').dispatchEvent(new Event('submit'))"
                >
                <label
                  for="avatar-input"
                  class="inline-flex items-center gap-x-2 rounded-lg bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Change Picture
                </label>
              </form>

              <div id="avatar-messages" class="mt-3"></div>
            </div>
          </div>

          <!-- Account Info -->
          <div class="rounded-xl bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 p-6">
            <h3 class="text-base font-semibold text-zinc-950 dark:text-white mb-4">Account Information</h3>

            <dl class="space-y-3 text-sm">
              <div>
                <dt class="text-zinc-500 dark:text-zinc-400">Role</dt>
                <dd class="mt-1">
                  <span class="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-400/20 capitalize">
                    ${data.profile.role}
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-zinc-500 dark:text-zinc-400">Member Since</dt>
                <dd class="mt-1 text-zinc-950 dark:text-white">${new Date(data.profile.created_at).toLocaleDateString()}</dd>
              </div>
              ${data.profile.last_login_at ? `
                <div>
                  <dt class="text-zinc-500 dark:text-zinc-400">Last Login</dt>
                  <dd class="mt-1 text-zinc-950 dark:text-white">${new Date(data.profile.last_login_at).toLocaleDateString()}</dd>
                </div>
              ` : ""}
              <div>
                <dt class="text-zinc-500 dark:text-zinc-400">Two-Factor Auth</dt>
                <dd class="mt-1">
                  ${data.profile.two_factor_enabled ? '<span class="inline-flex items-center rounded-md bg-green-50 dark:bg-green-500/10 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20 dark:ring-green-500/20">Enabled</span>' : '<span class="inline-flex items-center rounded-md bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 ring-1 ring-inset ring-zinc-500/10 dark:ring-zinc-400/20">Disabled</span>'}
                </dd>
              </div>
            </dl>
          </div>

          <!-- Security Actions -->
          <div class="rounded-xl bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 p-6">
            <h3 class="text-base font-semibold text-zinc-950 dark:text-white mb-4">Security</h3>

            <div class="space-y-2">
              <button
                type="button"
                onclick="showChangePasswordModal()"
                class="w-full text-left flex items-center gap-x-3 px-3 py-2 text-sm text-zinc-950 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
              >
                <svg class="w-4 h-4 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3.586l4.293-4.293A6 6 0 0119 9z"/>
                </svg>
                <span class="font-medium">Change Password</span>
              </button>

              <button
                type="button"
                onclick="toggle2FA()"
                class="w-full text-left flex items-center gap-x-3 px-3 py-2 text-sm text-zinc-950 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
              >
                <svg class="w-4 h-4 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <span class="font-medium">${data.profile.two_factor_enabled ? "Disable" : "Enable"} 2FA</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Change Password Modal -->
    <div id="password-modal" class="fixed inset-0 bg-zinc-950/50 backdrop-blur-sm flex items-center justify-center z-50 hidden">
      <div class="rounded-xl bg-white dark:bg-zinc-900 shadow-2xl ring-1 ring-zinc-950/5 dark:ring-white/10 w-full max-w-md mx-4">
        <div class="px-6 py-5 border-b border-zinc-950/5 dark:border-white/5">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold text-zinc-950 dark:text-white">Change Password</h3>
            <button onclick="closePasswordModal()" class="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <form id="password-form" hx-post="/admin/profile/password" hx-target="#password-messages" class="p-6 space-y-4">
          <div id="password-messages"></div>

          <div>
            <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Current Password</label>
            <input
              type="password"
              name="current_password"
              required
              class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
              placeholder="Enter current password"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">New Password</label>
            <input
              type="password"
              name="new_password"
              required
              minlength="8"
              class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
              placeholder="Enter new password"
            >
            <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Must be at least 8 characters</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Confirm New Password</label>
            <input
              type="password"
              name="confirm_password"
              required
              minlength="8"
              class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
              placeholder="Confirm new password"
            >
          </div>

          <div class="flex justify-end gap-x-3 pt-4 border-t border-zinc-950/5 dark:border-white/5">
            <button
              type="button"
              onclick="closePasswordModal()"
              class="rounded-lg bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="inline-flex items-center gap-x-2 rounded-lg bg-zinc-950 dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>

    <script>
      function showChangePasswordModal() {
        document.getElementById('password-modal').classList.remove('hidden');
      }

      function closePasswordModal() {
        document.getElementById('password-modal').classList.add('hidden');
        document.getElementById('password-form').reset();
      }

      function toggle2FA() {
        // TODO: Implement 2FA toggle
        alert('Two-factor authentication setup coming soon!');
      }

      // Close modal on escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !document.getElementById('password-modal').classList.contains('hidden')) {
          closePasswordModal();
        }
      });

      // Close modal on backdrop click
      document.getElementById('password-modal').addEventListener('click', function(e) {
        if (e.target === this) {
          closePasswordModal();
        }
      });
    </script>
  `;
  const layoutData = {
    title: "User Profile",
    pageTitle: "Profile",
    currentPath: "/admin/profile",
    user: data.user,
    version: data.version,
    content: pageContent
  };
  return chunk4IO5UBHK_cjs.renderAdminLayoutCatalyst(layoutData);
}

// src/templates/components/alert.template.ts
function renderAlert2(data) {
  const typeClasses = {
    success: "bg-green-50 dark:bg-green-500/10 border border-green-600/20 dark:border-green-500/20",
    error: "bg-error/10 border border-red-600/20 dark:border-red-500/20",
    warning: "bg-amber-50 dark:bg-amber-500/10 border border-amber-600/20 dark:border-amber-500/20",
    info: "bg-blue-50 dark:bg-blue-500/10 border border-blue-600/20 dark:border-blue-500/20"
  };
  const iconClasses = {
    success: "text-green-600 dark:text-green-400",
    error: "text-red-600 dark:text-red-400",
    warning: "text-amber-600 dark:text-amber-400",
    info: "text-blue-600 dark:text-blue-400"
  };
  const textClasses = {
    success: "text-green-900 dark:text-green-300",
    error: "text-red-900 dark:text-red-300",
    warning: "text-amber-900 dark:text-amber-300",
    info: "text-blue-900 dark:text-blue-300"
  };
  const messageTextClasses = {
    success: "text-green-700 dark:text-green-400",
    error: "text-red-700 dark:text-red-400",
    warning: "text-amber-700 dark:text-amber-400",
    info: "text-blue-700 dark:text-blue-400"
  };
  const icons = {
    success: `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />`,
    error: `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />`,
    warning: `<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />`,
    info: `<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />`
  };
  return `
    <div class="rounded-lg p-4 ${typeClasses[data.type]} ${data.className || ""}" ${data.dismissible ? 'id="dismissible-alert"' : ""}>
      <div class="flex">
        ${data.icon !== false ? `
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 ${iconClasses[data.type]}" viewBox="0 0 20 20" fill="currentColor">
              ${icons[data.type]}
            </svg>
          </div>
        ` : ""}
        <div class="${data.icon !== false ? "ml-3" : ""}">
          ${data.title ? `
            <h3 class="text-sm font-semibold ${textClasses[data.type]}">
              ${data.title}
            </h3>
          ` : ""}
          <div class="${data.title ? "mt-1 text-sm" : "text-sm"} ${messageTextClasses[data.type]}">
            <p>${data.message}</p>
          </div>
        </div>
        ${data.dismissible ? `
          <div class="ml-auto pl-3">
            <div class="-mx-1.5 -my-1.5">
              <button
                type="button"
                class="inline-flex rounded-md p-1.5 ${iconClasses[data.type]} hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2"
                onclick="document.getElementById('dismissible-alert').remove()"
              >
                <span class="sr-only">Dismiss</span>
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        ` : ""}
      </div>
    </div>
  `;
}

// src/templates/pages/admin-activity-logs.template.ts
function renderActivityLogsPage(data) {
  const pageContent = `
    <div class="w-full px-4 sm:px-6 lg:px-8 py-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold text-white">Activity Logs</h1>
          <p class="mt-2 text-sm text-gray-300">Monitor user actions and system activity</p>
        </div>
      </div>

      <!-- Breadcrumb -->
      <nav class="flex mb-6" aria-label="Breadcrumb">
        <ol class="flex items-center space-x-3">
          <li>
            <a href="/admin" class="text-gray-300 hover:text-white transition-colors">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
              </svg>
            </a>
          </li>
          <li class="flex items-center">
            <svg class="h-5 w-5 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
            </svg>
            <span class="text-sm font-medium text-gray-200">Activity Logs</span>
          </li>
        </ol>
      </nav>

      <!-- Filters -->
      <div class="backdrop-blur-xl bg-white/10 rounded-xl border border-white/20 shadow-2xl p-6 mb-6">
        <h3 class="text-lg font-semibold text-white mb-4">Filters</h3>
        
        <form method="GET" action="/admin/activity-logs" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Action</label>
            <select name="action" class="w-full px-3 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:outline-none focus:bg-white/10 focus:border-white/30">
              <option value="">All Actions</option>
              <option value="user.login" ${data.filters.action === "user.login" ? "selected" : ""}>User Login</option>
              <option value="user.logout" ${data.filters.action === "user.logout" ? "selected" : ""}>User Logout</option>
              <option value="user.invite_sent" ${data.filters.action === "user.invite_sent" ? "selected" : ""}>User Invited</option>
              <option value="user.invitation_accepted" ${data.filters.action === "user.invitation_accepted" ? "selected" : ""}>Invitation Accepted</option>
              <option value="profile.update" ${data.filters.action === "profile.update" ? "selected" : ""}>Profile Update</option>
              <option value="profile.password_change" ${data.filters.action === "profile.password_change" ? "selected" : ""}>Password Change</option>
              <option value="content.create" ${data.filters.action === "content.create" ? "selected" : ""}>Content Created</option>
              <option value="content.update" ${data.filters.action === "content.update" ? "selected" : ""}>Content Updated</option>
              <option value="content.delete" ${data.filters.action === "content.delete" ? "selected" : ""}>Content Deleted</option>
              <option value="collection.create" ${data.filters.action === "collection.create" ? "selected" : ""}>Collection Created</option>
              <option value="collection.update" ${data.filters.action === "collection.update" ? "selected" : ""}>Collection Updated</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Resource Type</label>
            <select name="resource_type" class="w-full px-3 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:outline-none focus:bg-white/10 focus:border-white/30">
              <option value="">All Resources</option>
              <option value="users" ${data.filters.resource_type === "users" ? "selected" : ""}>Users</option>
              <option value="content" ${data.filters.resource_type === "content" ? "selected" : ""}>Content</option>
              <option value="collections" ${data.filters.resource_type === "collections" ? "selected" : ""}>Collections</option>
              <option value="media" ${data.filters.resource_type === "media" ? "selected" : ""}>Media</option>
              <option value="settings" ${data.filters.resource_type === "settings" ? "selected" : ""}>Settings</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">From Date</label>
            <input 
              type="date" 
              name="date_from" 
              value="${data.filters.date_from || ""}"
              class="w-full px-3 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:outline-none focus:bg-white/10 focus:border-white/30"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">To Date</label>
            <input 
              type="date" 
              name="date_to" 
              value="${data.filters.date_to || ""}"
              class="w-full px-3 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:outline-none focus:bg-white/10 focus:border-white/30"
            >
          </div>

          <div class="md:col-span-2 lg:col-span-4 flex gap-3">
            <button 
              type="submit"
              class="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Apply Filters
            </button>
            <a 
              href="/admin/activity-logs"
              class="px-6 py-2 bg-white/10 text-white rounded-xl border border-white/20 hover:bg-white/20 transition-all"
            >
              Clear Filters
            </a>
          </div>
        </form>
      </div>

      <!-- Activity Logs Table -->
      <div class="backdrop-blur-xl bg-white/10 rounded-xl border border-white/20 shadow-2xl overflow-hidden">
        <div class="relative px-6 py-4 border-b border-white/10">
          <div class="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
          <div class="relative flex items-center justify-between">
            <h2 class="text-xl font-semibold text-white">Recent Activity</h2>
            <div class="text-sm text-gray-300">
              Showing ${data.logs.length} of ${data.pagination.total} logs
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-white/5">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Timestamp</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Action</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Resource</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">IP Address</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10">
              ${data.logs.map((log) => `
                <tr class="hover:bg-white/5 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    ${new Date(log.created_at).toLocaleString()}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-white">${log.user_name || "Unknown"}</div>
                    <div class="text-xs text-gray-400">${log.user_email || "N/A"}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${getActionBadgeClass(log.action)}">
                      ${formatAction(log.action)}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    ${log.resource_type ? `
                      <div class="text-white">${log.resource_type}</div>
                      ${log.resource_id ? `<div class="text-xs text-gray-400">${log.resource_id}</div>` : ""}
                    ` : "N/A"}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    ${log.ip_address || "N/A"}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-300">
                    ${log.details ? `
                      <details class="cursor-pointer">
                        <summary class="text-blue-400 hover:text-blue-300">View Details</summary>
                        <pre class="mt-2 text-xs bg-black/20 p-2 rounded overflow-x-auto">${JSON.stringify(log.details, null, 2)}</pre>
                      </details>
                    ` : "N/A"}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        ${data.logs.length === 0 ? `
          <div class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-300">No activity logs found</h3>
            <p class="mt-1 text-sm text-gray-500">Try adjusting your filters or check back later.</p>
          </div>
        ` : ""}

        <!-- Pagination -->
        ${data.pagination.pages > 1 ? `
          <div class="px-6 py-4 border-t border-white/10 flex items-center justify-between">
            <div class="text-sm text-gray-300">
              Page ${data.pagination.page} of ${data.pagination.pages} (${data.pagination.total} total logs)
            </div>
            <div class="flex space-x-2">
              ${data.pagination.page > 1 ? `
                <a href="?page=${data.pagination.page - 1}&${new URLSearchParams(data.filters).toString()}" 
                   class="px-3 py-1 bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20 transition-all">
                  Previous
                </a>
              ` : ""}
              ${data.pagination.page < data.pagination.pages ? `
                <a href="?page=${data.pagination.page + 1}&${new URLSearchParams(data.filters).toString()}" 
                   class="px-3 py-1 bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20 transition-all">
                  Next
                </a>
              ` : ""}
            </div>
          </div>
        ` : ""}
      </div>
    </div>
  `;
  const layoutData = {
    title: "Activity Logs",
    pageTitle: "Activity Logs",
    currentPath: "/admin/activity-logs",
    user: data.user,
    content: pageContent
  };
  return chunkH6HP2MEA_cjs.renderAdminLayout(layoutData);
}
function getActionBadgeClass(action) {
  if (action.includes("login") || action.includes("logout")) {
    return "bg-blue-500/20 text-blue-300";
  } else if (action.includes("create") || action.includes("invite")) {
    return "bg-green-500/20 text-green-300";
  } else if (action.includes("update") || action.includes("change")) {
    return "bg-yellow-500/20 text-yellow-300";
  } else if (action.includes("delete") || action.includes("cancel")) {
    return "bg-red-500/20 text-red-300";
  } else {
    return "bg-gray-500/20 text-gray-300";
  }
}
function formatAction(action) {
  return action.split(".").map((part) => part.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())).join(" - ");
}

// src/templates/pages/admin-user-edit.template.ts
chunk4IO5UBHK_cjs.init_admin_layout_catalyst_template();

// src/templates/components/confirmation-dialog.template.ts
function renderConfirmationDialog2(options) {
  const {
    id,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmClass = "bg-red-500 hover:bg-red-400",
    iconColor = "red",
    onConfirm = ""
  } = options;
  const iconColorClasses = {
    red: "bg-red-500/10 text-red-400",
    yellow: "bg-yellow-500/10 text-yellow-400",
    blue: "bg-blue-500/10 text-blue-400"
  };
  return `
    <el-dialog>
      <dialog
        id="${id}"
        aria-labelledby="${id}-title"
        class="fixed inset-0 m-0 size-auto max-h-none max-w-none overflow-y-auto bg-transparent p-0 backdrop:bg-transparent"
      >
        <el-dialog-backdrop class="fixed inset-0 bg-gray-900/50 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"></el-dialog-backdrop>

        <div tabindex="0" class="flex min-h-full items-end justify-center p-4 text-center focus:outline focus:outline-0 sm:items-center sm:p-0">
          <el-dialog-panel class="relative transform overflow-hidden rounded-lg bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl outline outline-1 -outline-offset-1 outline-white/10 transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full ${iconColorClasses[iconColor]} sm:mx-0 sm:size-10">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-slot="icon" aria-hidden="true" class="size-6">
                  <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 id="${id}-title" class="text-base font-semibold text-white">${title}</h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-400">${message}</p>
                </div>
              </div>
            </div>
            <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onclick="${onConfirm}; document.getElementById('${id}').close()"
                command="close"
                commandfor="${id}"
                class="confirm-button inline-flex w-full justify-center rounded-md ${confirmClass} px-3 py-2 text-sm font-semibold text-white sm:ml-3 sm:w-auto"
              >
                ${confirmText}
              </button>
              <button
                type="button"
                command="close"
                commandfor="${id}"
                class="mt-3 inline-flex w-full justify-center rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/5 hover:bg-white/20 sm:mt-0 sm:w-auto"
              >
                ${cancelText}
              </button>
            </div>
          </el-dialog-panel>
        </div>
      </dialog>
    </el-dialog>
  `;
}
function getConfirmationDialogScript2() {
  return `
    <script src="https://cdn.jsdelivr.net/npm/@tailwindplus/elements@1" type="module"></script>
    <script>
      function showConfirmDialog(dialogId) {
        const dialog = document.getElementById(dialogId);
        if (dialog) {
          dialog.showModal();
        }
      }
    </script>
  `;
}

// src/templates/pages/admin-user-edit.template.ts
function renderUserEditPage(data) {
  const pageContent = `
    <div>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <a href="/admin/users" class="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </a>
            <h1 class="text-2xl/8 font-semibold text-zinc-950 dark:text-white sm:text-xl/8">Edit User</h1>
          </div>
          <p class="mt-2 text-sm/6 text-zinc-500 dark:text-zinc-400">Update user account and permissions</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex space-x-3">
          <button
            type="submit"
            form="user-edit-form"
            class="inline-flex items-center justify-center rounded-lg bg-zinc-950 dark:bg-white px-3.5 py-2.5 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
          >
            <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Save Changes
          </button>
          <a
            href="/admin/users"
            class="inline-flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm font-semibold text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
          >
            Cancel
          </a>
        </div>
      </div>

      <!-- Alert Messages -->
      <div id="form-messages">
        ${data.error ? chunkH6HP2MEA_cjs.renderAlert({ type: "error", message: data.error, dismissible: true }) : ""}
        ${data.success ? chunkH6HP2MEA_cjs.renderAlert({ type: "success", message: data.success, dismissible: true }) : ""}
      </div>

      <!-- User Edit Form -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Form -->
        <div class="lg:col-span-2">
          <div class="rounded-xl bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 p-8">
            <form id="user-edit-form" hx-put="/admin/users/${data.userToEdit.id}" hx-target="#form-messages">

              <!-- Basic Information -->
              <div class="mb-8">
                <h3 class="text-base font-semibold text-zinc-950 dark:text-white mb-4">Basic Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      value="${chunkJLNQTGWQ_cjs.escapeHtml(data.userToEdit.firstName || "")}"
                      required
                      class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      value="${chunkJLNQTGWQ_cjs.escapeHtml(data.userToEdit.lastName || "")}"
                      required
                      class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Username</label>
                    <input
                      type="text"
                      name="username"
                      value="${chunkJLNQTGWQ_cjs.escapeHtml(data.userToEdit.username || "")}"
                      required
                      class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value="${chunkJLNQTGWQ_cjs.escapeHtml(data.userToEdit.email || "")}"
                      required
                      class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value="${chunkJLNQTGWQ_cjs.escapeHtml(data.userToEdit.phone || "")}"
                      class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                    />
                  </div>

                  <div>
                    <label for="role" class="block text-sm/6 font-medium text-zinc-950 dark:text-white">Role</label>
                    <div class="mt-2 grid grid-cols-1">
                      <select
                        id="role"
                        name="role"
                        class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white/5 dark:bg-white/5 py-1.5 pl-3 pr-8 text-base text-zinc-950 dark:text-white outline outline-1 -outline-offset-1 outline-zinc-500/30 dark:outline-zinc-400/30 *:bg-white dark:*:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zinc-500 dark:focus-visible:outline-zinc-400 sm:text-sm/6"
                      >
                        ${data.roles.map((role) => `
                          <option value="${chunkJLNQTGWQ_cjs.escapeHtml(role.value)}" ${data.userToEdit.role === role.value ? "selected" : ""}>${chunkJLNQTGWQ_cjs.escapeHtml(role.label)}</option>
                        `).join("")}
                      </select>
                      <svg viewBox="0 0 16 16" fill="currentColor" data-slot="icon" aria-hidden="true" class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-zinc-600 dark:text-zinc-400 sm:size-4">
                        <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" fill-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Profile Information -->
              <div class="mb-8">
                <h3 class="text-base font-semibold text-zinc-950 dark:text-white mb-4">Profile Information</h3>
                <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Extended profile data for this user</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Display Name</label>
                    <input
                      type="text"
                      name="profile_display_name"
                      value="${chunkJLNQTGWQ_cjs.escapeHtml(data.userToEdit.profile?.displayName || "")}"
                      placeholder="Public display name"
                      class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Company</label>
                    <input
                      type="text"
                      name="profile_company"
                      value="${chunkJLNQTGWQ_cjs.escapeHtml(data.userToEdit.profile?.company || "")}"
                      placeholder="Company or organization"
                      class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Job Title</label>
                    <input
                      type="text"
                      name="profile_job_title"
                      value="${chunkJLNQTGWQ_cjs.escapeHtml(data.userToEdit.profile?.jobTitle || "")}"
                      placeholder="Job title or role"
                      class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Website</label>
                    <input
                      type="url"
                      name="profile_website"
                      value="${chunkJLNQTGWQ_cjs.escapeHtml(data.userToEdit.profile?.website || "")}"
                      placeholder="https://example.com"
                      class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Location</label>
                    <input
                      type="text"
                      name="profile_location"
                      value="${chunkJLNQTGWQ_cjs.escapeHtml(data.userToEdit.profile?.location || "")}"
                      placeholder="City, Country"
                      class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Date of Birth</label>
                    <input
                      type="date"
                      name="profile_date_of_birth"
                      value="${data.userToEdit.profile?.dateOfBirth ? new Date(data.userToEdit.profile.dateOfBirth).toISOString().split("T")[0] : ""}"
                      class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                    />
                  </div>
                </div>

                <div class="mt-6">
                  <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Bio</label>
                  <textarea
                    name="profile_bio"
                    rows="3"
                    placeholder="Short bio or description"
                    class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                  >${chunkJLNQTGWQ_cjs.escapeHtml(data.userToEdit.profile?.bio || "")}</textarea>
                </div>
              </div>

              <!-- Account Status -->
              <div class="mb-8">
                <h3 class="text-base font-semibold text-zinc-950 dark:text-white mb-4">Account Status</h3>
                <div class="space-y-4">
                  <div class="flex gap-3">
                    <div class="flex h-6 shrink-0 items-center">
                      <div class="group grid size-4 grid-cols-1">
                        <input
                          type="checkbox"
                          id="is_active"
                          name="is_active"
                          value="1"
                          ${data.userToEdit.isActive ? "checked" : ""}
                          class="col-start-1 row-start-1 appearance-none rounded border border-zinc-950/10 dark:border-white/10 bg-white dark:bg-white/5 checked:border-indigo-500 checked:bg-indigo-500 indeterminate:border-indigo-500 indeterminate:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-zinc-950/5 dark:disabled:border-white/5 disabled:bg-zinc-950/10 dark:disabled:bg-white/10 disabled:checked:bg-zinc-950/10 dark:disabled:checked:bg-white/10 forced-colors:appearance-auto"
                        />
                        <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-zinc-950/25 dark:group-has-[:disabled]:stroke-white/25">
                          <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:checked]:opacity-100" />
                          <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:indeterminate]:opacity-100" />
                        </svg>
                      </div>
                    </div>
                    <div class="text-sm/6">
                      <label for="is_active" class="font-medium text-zinc-950 dark:text-white">Account Active</label>
                      <p class="text-zinc-500 dark:text-zinc-400">User can sign in and access the system</p>
                    </div>
                  </div>

                  <div class="flex gap-3">
                    <div class="flex h-6 shrink-0 items-center">
                      <div class="group grid size-4 grid-cols-1">
                        <input
                          type="checkbox"
                          id="email_verified"
                          name="email_verified"
                          value="1"
                          ${data.userToEdit.emailVerified ? "checked" : ""}
                          class="col-start-1 row-start-1 appearance-none rounded border border-zinc-950/10 dark:border-white/10 bg-white dark:bg-white/5 checked:border-indigo-500 checked:bg-indigo-500 indeterminate:border-indigo-500 indeterminate:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-zinc-950/5 dark:disabled:border-white/5 disabled:bg-zinc-950/10 dark:disabled:bg-white/10 disabled:checked:bg-zinc-950/10 dark:disabled:checked:bg-white/10 forced-colors:appearance-auto"
                        />
                        <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-zinc-950/25 dark:group-has-[:disabled]:stroke-white/25">
                          <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:checked]:opacity-100" />
                          <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:indeterminate]:opacity-100" />
                        </svg>
                      </div>
                    </div>
                    <div class="text-sm/6">
                      <label for="email_verified" class="font-medium text-zinc-950 dark:text-white">Email Verified</label>
                      <p class="text-zinc-500 dark:text-zinc-400">User has verified their email address</p>
                    </div>
                  </div>
                </div>
              </div>

            </form>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1">
          <!-- User Stats -->
          <div class="rounded-xl bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 p-6 mb-6">
            <h3 class="text-base font-semibold text-zinc-950 dark:text-white mb-4">User Details</h3>
            <dl class="space-y-4 text-sm">
              <div>
                <dt class="text-zinc-500 dark:text-zinc-400">User ID</dt>
                <dd class="mt-1 text-zinc-950 dark:text-white font-mono text-xs">${data.userToEdit.id}</dd>
              </div>
              <div>
                <dt class="text-zinc-500 dark:text-zinc-400">Created</dt>
                <dd class="mt-1 text-zinc-950 dark:text-white">${new Date(data.userToEdit.createdAt).toLocaleDateString()}</dd>
              </div>
              ${data.userToEdit.lastLoginAt ? `
                <div>
                  <dt class="text-zinc-500 dark:text-zinc-400">Last Login</dt>
                  <dd class="mt-1 text-zinc-950 dark:text-white">${new Date(data.userToEdit.lastLoginAt).toLocaleDateString()}</dd>
                </div>
              ` : ""}
              <div>
                <dt class="text-zinc-500 dark:text-zinc-400">Status</dt>
                <dd class="mt-1">
                  ${data.userToEdit.isActive ? '<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-lime-50 dark:bg-lime-500/10 text-lime-700 dark:text-lime-300 ring-1 ring-inset ring-lime-700/10 dark:ring-lime-400/20">Active</span>' : '<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-700/10 dark:ring-red-500/20">Inactive</span>'}
                </dd>
              </div>
              ${data.userToEdit.twoFactorEnabled ? `
                <div>
                  <dt class="text-zinc-500 dark:text-zinc-400">Security</dt>
                  <dd class="mt-1">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-500/20">2FA Enabled</span>
                  </dd>
                </div>
              ` : ""}
            </dl>
          </div>

          <!-- Danger Zone -->
          <div class="rounded-xl bg-red-50 dark:bg-red-500/10 shadow-sm ring-1 ring-red-600/20 dark:ring-red-500/20 p-6">
            <h3 class="text-base font-semibold text-red-900 dark:text-red-300 mb-2">Danger Zone</h3>
            <p class="text-sm text-red-700 dark:text-red-400 mb-4">Irreversible and destructive actions</p>

            <div class="flex gap-3 mb-4">
              <div class="flex h-6 shrink-0 items-center">
                <div class="group grid size-4 grid-cols-1">
                  <input
                    type="checkbox"
                    id="hard-delete-checkbox"
                    class="col-start-1 row-start-1 appearance-none rounded border border-red-300 dark:border-red-700 bg-white dark:bg-red-950/50 checked:border-red-600 checked:bg-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:border-red-200 dark:disabled:border-red-900 disabled:bg-red-50 dark:disabled:bg-red-950/30 disabled:checked:bg-red-300 dark:disabled:checked:bg-red-900 forced-colors:appearance-auto"
                  />
                  <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-red-950/25 dark:group-has-[:disabled]:stroke-white/25">
                    <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:checked]:opacity-100" />
                    <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:indeterminate]:opacity-100" />
                  </svg>
                </div>
              </div>
              <div class="text-sm/6">
                <label for="hard-delete-checkbox" class="font-medium text-red-900 dark:text-red-300 cursor-pointer">Hard Delete (Permanent)</label>
                <p class="text-red-700 dark:text-red-400">Permanently remove from database. Unchecked performs soft delete (deactivate only).</p>
              </div>
            </div>

            <button
              onclick="deleteUser('${data.userToEdit.id}')"
              class="w-full inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
            >
              <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Delete User
            </button>
          </div>
        </div>
      </div>
    </div>

    <script>
      let userIdToDelete = null;

      function deleteUser(userId) {
        userIdToDelete = userId;
        showConfirmDialog('delete-user-confirm');
      }

      function performDeleteUser() {
        if (!userIdToDelete) return;

        const checkbox = document.getElementById('hard-delete-checkbox');
        const hardDelete = checkbox ? checkbox.checked : false;

        fetch(\`/admin/users/\${userIdToDelete}\`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ hardDelete })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Add a small delay to ensure database transaction completes
            // and add cache busting to force refresh
            setTimeout(() => {
              window.location.href = '/admin/users?_t=' + Date.now()
            }, 300)
          } else {
            alert('Error deleting user: ' + (data.error || 'Unknown error'))
          }
        })
        .catch(error => {
          console.error('Error:', error)
          alert('Error deleting user')
        })
        .finally(() => {
          userIdToDelete = null;
        });
      }
    </script>

    <!-- Confirmation Dialogs -->
    ${renderConfirmationDialog2({
    id: "delete-user-confirm",
    title: "Delete User",
    message: 'Are you sure you want to delete this user? Check the "Hard Delete" option to permanently remove all data from the database. This action cannot be undone!',
    confirmText: "Delete",
    cancelText: "Cancel",
    iconColor: "red",
    confirmClass: "bg-red-500 hover:bg-red-400",
    onConfirm: "performDeleteUser()"
  })}

    ${getConfirmationDialogScript2()}
  `;
  const layoutData = {
    title: "Edit User",
    pageTitle: `Edit User - ${data.userToEdit.firstName} ${data.userToEdit.lastName}`,
    currentPath: "/admin/users",
    user: data.user,
    content: pageContent
  };
  return chunk4IO5UBHK_cjs.renderAdminLayoutCatalyst(layoutData);
}

// src/templates/pages/admin-user-new.template.ts
chunk4IO5UBHK_cjs.init_admin_layout_catalyst_template();
function renderUserNewPage(data) {
  const pageContent = `
    <div>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <a href="/admin/users" class="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </a>
            <h1 class="text-2xl/8 font-semibold text-zinc-950 dark:text-white sm:text-xl/8">Create New User</h1>
          </div>
          <p class="mt-2 text-sm/6 text-zinc-500 dark:text-zinc-400">Add a new user account to the system</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex space-x-3">
          <button
            type="submit"
            form="user-new-form"
            class="inline-flex items-center justify-center rounded-lg bg-zinc-950 dark:bg-white px-3.5 py-2.5 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
          >
            <svg class="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Create User
          </button>
          <a
            href="/admin/users"
            class="inline-flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm font-semibold text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
          >
            Cancel
          </a>
        </div>
      </div>

      <!-- Alert Messages -->
      <div id="form-messages">
        ${data.error ? chunkH6HP2MEA_cjs.renderAlert({ type: "error", message: data.error, dismissible: true }) : ""}
        ${data.success ? chunkH6HP2MEA_cjs.renderAlert({ type: "success", message: data.success, dismissible: true }) : ""}
      </div>

      <!-- User New Form -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Form -->
        <div class="lg:col-span-2">
          <div class="rounded-xl bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 p-8">
            <form id="user-new-form" hx-post="/admin/users/new" hx-target="#form-messages">

              <!-- Basic Information -->
              <div class="mb-8">
                <h3 class="text-base font-semibold text-zinc-950 dark:text-white mb-4">Basic Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">
                      First Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      required
                      placeholder="Enter first name"
                      class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">
                      Last Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      required
                      placeholder="Enter last name"
                      class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">
                      Username <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      required
                      placeholder="Enter username"
                      class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">
                      Email <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="user@example.com"
                      class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+1 (555) 000-0000"
                      class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                    />
                  </div>

                  <div>
                    <label for="role" class="block text-sm/6 font-medium text-zinc-950 dark:text-white">
                      Role <span class="text-red-500">*</span>
                    </label>
                    <div class="mt-2 grid grid-cols-1">
                      <select
                        id="role"
                        name="role"
                        required
                        class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white/5 dark:bg-white/5 py-1.5 pl-3 pr-8 text-base text-zinc-950 dark:text-white outline outline-1 -outline-offset-1 outline-zinc-500/30 dark:outline-zinc-400/30 *:bg-white dark:*:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zinc-500 dark:focus-visible:outline-zinc-400 sm:text-sm/6"
                      >
                        ${data.roles.map((role) => `
                          <option value="${role.value}">${role.label}</option>
                        `).join("")}
                      </select>
                      <svg viewBox="0 0 16 16" fill="currentColor" data-slot="icon" aria-hidden="true" class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-zinc-600 dark:text-zinc-400 sm:size-4">
                        <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" fill-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div class="mt-6">
                  <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Bio</label>
                  <textarea
                    name="bio"
                    rows="3"
                    placeholder="Enter a short bio (optional)"
                    class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                  ></textarea>
                </div>
              </div>

              <!-- Password -->
              <div class="mb-8">
                <h3 class="text-base font-semibold text-zinc-950 dark:text-white mb-4">Password</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">
                      Password <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      placeholder="Enter password (min 8 characters)"
                      minlength="8"
                      class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">
                      Confirm Password <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="confirm_password"
                      required
                      placeholder="Confirm password"
                      minlength="8"
                      class="w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                    />
                  </div>
                </div>
              </div>

              <!-- Account Status -->
              <div class="mb-8">
                <h3 class="text-base font-semibold text-zinc-950 dark:text-white mb-4">Account Status</h3>
                <div class="space-y-5">
                  <div class="flex gap-3">
                    <div class="flex h-6 shrink-0 items-center">
                      <div class="group grid size-4 grid-cols-1">
                        <input
                          type="checkbox"
                          id="is_active"
                          name="is_active"
                          value="1"
                          checked
                          class="col-start-1 row-start-1 appearance-none rounded border border-zinc-950/10 dark:border-white/10 bg-white dark:bg-white/5 checked:border-indigo-500 checked:bg-indigo-500 indeterminate:border-indigo-500 indeterminate:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-zinc-950/5 dark:disabled:border-white/5 disabled:bg-zinc-950/10 dark:disabled:bg-white/10 disabled:checked:bg-zinc-950/10 dark:disabled:checked:bg-white/10 forced-colors:appearance-auto"
                        />
                        <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-zinc-950/25 dark:group-has-[:disabled]:stroke-white/25">
                          <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:checked]:opacity-100" />
                          <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:indeterminate]:opacity-100" />
                        </svg>
                      </div>
                    </div>
                    <div class="text-sm/6">
                      <label for="is_active" class="font-medium text-zinc-950 dark:text-white">Account Active</label>
                      <p class="text-zinc-500 dark:text-zinc-400">User can sign in and access the system</p>
                    </div>
                  </div>

                  <div class="flex gap-3">
                    <div class="flex h-6 shrink-0 items-center">
                      <div class="group grid size-4 grid-cols-1">
                        <input
                          type="checkbox"
                          id="email_verified"
                          name="email_verified"
                          value="1"
                          class="col-start-1 row-start-1 appearance-none rounded border border-zinc-950/10 dark:border-white/10 bg-white dark:bg-white/5 checked:border-indigo-500 checked:bg-indigo-500 indeterminate:border-indigo-500 indeterminate:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-zinc-950/5 dark:disabled:border-white/5 disabled:bg-zinc-950/10 dark:disabled:bg-white/10 disabled:checked:bg-zinc-950/10 dark:disabled:checked:bg-white/10 forced-colors:appearance-auto"
                        />
                        <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-zinc-950/25 dark:group-has-[:disabled]:stroke-white/25">
                          <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:checked]:opacity-100" />
                          <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:indeterminate]:opacity-100" />
                        </svg>
                      </div>
                    </div>
                    <div class="text-sm/6">
                      <label for="email_verified" class="font-medium text-zinc-950 dark:text-white">Email Verified</label>
                      <p class="text-zinc-500 dark:text-zinc-400">Mark email as verified</p>
                    </div>
                  </div>
                </div>
              </div>

            </form>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1">
          <!-- Help Text -->
          <div class="rounded-xl bg-blue-50 dark:bg-blue-500/10 shadow-sm ring-1 ring-blue-600/20 dark:ring-blue-500/20 p-6">
            <h3 class="text-base font-semibold text-blue-900 dark:text-blue-300 mb-2">Creating a User</h3>
            <div class="text-sm text-blue-700 dark:text-blue-400 space-y-3">
              <p>Fill in the required fields marked with <span class="text-red-500">*</span> to create a new user account.</p>
              <p>The password must be at least 8 characters long.</p>
              <p>By default, new users are created as active and can sign in immediately.</p>
              <p>You can edit user details and permissions after creation.</p>
            </div>
          </div>

          <!-- Role Descriptions -->
          <div class="rounded-xl bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 p-6 mt-6">
            <h3 class="text-base font-semibold text-zinc-950 dark:text-white mb-4">Role Descriptions</h3>
            <dl class="space-y-3 text-sm">
              <div>
                <dt class="font-medium text-zinc-950 dark:text-white">Administrator</dt>
                <dd class="text-zinc-500 dark:text-zinc-400">Full system access and permissions</dd>
              </div>
              <div>
                <dt class="font-medium text-zinc-950 dark:text-white">Editor</dt>
                <dd class="text-zinc-500 dark:text-zinc-400">Can create and edit content</dd>
              </div>
              <div>
                <dt class="font-medium text-zinc-950 dark:text-white">Author</dt>
                <dd class="text-zinc-500 dark:text-zinc-400">Can create own content</dd>
              </div>
              <div>
                <dt class="font-medium text-zinc-950 dark:text-white">Viewer</dt>
                <dd class="text-zinc-500 dark:text-zinc-400">Read-only access</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  `;
  const layoutData = {
    title: "Create User",
    pageTitle: "Create New User",
    currentPath: "/admin/users",
    user: data.user,
    content: pageContent
  };
  return chunk4IO5UBHK_cjs.renderAdminLayoutCatalyst(layoutData);
}

// src/templates/pages/admin-users-list.template.ts
chunk4IO5UBHK_cjs.init_admin_layout_catalyst_template();
function renderUsersListPage(data) {
  const columns = [
    {
      key: "avatar",
      label: "",
      className: "w-12",
      sortable: false,
      render: (value, row) => {
        const initials = `${row.firstName.charAt(0)}${row.lastName.charAt(0)}`.toUpperCase();
        if (value) {
          return `<img src="${value}" alt="${row.firstName} ${row.lastName}" class="w-8 h-8 rounded-full">`;
        }
        return `
          <div class="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 dark:from-cyan-300 dark:to-blue-400 rounded-full flex items-center justify-center">
            <span class="text-xs font-medium text-white">${initials}</span>
          </div>
        `;
      }
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      sortType: "string",
      render: (_value, row) => {
        const escapeHtml4 = (text) => text.replace(/[&<>"']/g, (char) => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        })[char] || char);
        const truncatedFirstName = row.firstName.length > 25 ? row.firstName.substring(0, 25) + "..." : row.firstName;
        const truncatedLastName = row.lastName.length > 25 ? row.lastName.substring(0, 25) + "..." : row.lastName;
        const fullName = escapeHtml4(`${truncatedFirstName} ${truncatedLastName}`);
        const truncatedUsername = row.username.length > 100 ? row.username.substring(0, 100) + "..." : row.username;
        const username = escapeHtml4(truncatedUsername);
        const statusBadge = row.isActive ? '<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-lime-50 dark:bg-lime-500/10 text-lime-700 dark:text-lime-300 ring-1 ring-inset ring-lime-700/10 dark:ring-lime-400/20 ml-2">Active</span>' : '<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-700/10 dark:ring-red-500/20 ml-2">Inactive</span>';
        return `
          <div>
            <div class="text-sm font-medium text-zinc-950 dark:text-white">${fullName}${statusBadge}</div>
            <div class="text-sm text-zinc-500 dark:text-zinc-400">@${username}</div>
          </div>
        `;
      }
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      sortType: "string",
      render: (value) => {
        const escapeHtml4 = (text) => text.replace(/[&<>"']/g, (char) => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        })[char] || char);
        const escapedEmail = escapeHtml4(value);
        return `<a href="mailto:${escapedEmail}" class="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors">${escapedEmail}</a>`;
      }
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      sortType: "string",
      render: (value) => {
        const roleColors = {
          admin: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-700/10 dark:ring-red-500/20",
          editor: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-500/20",
          author: "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 ring-1 ring-inset ring-cyan-700/10 dark:ring-cyan-500/20",
          viewer: "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 ring-1 ring-inset ring-zinc-500/10 dark:ring-zinc-400/20"
        };
        const colorClass = roleColors[value] || "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 ring-1 ring-inset ring-zinc-500/10 dark:ring-zinc-400/20";
        return `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${colorClass}">${value.charAt(0).toUpperCase() + value.slice(1)}</span>`;
      }
    },
    {
      key: "lastLoginAt",
      label: "Last Login",
      sortable: true,
      sortType: "date",
      render: (value) => {
        if (!value) return '<span class="text-zinc-500 dark:text-zinc-400">Never</span>';
        return `<span class="text-sm text-zinc-500 dark:text-zinc-400">${new Date(value).toLocaleDateString()}</span>`;
      }
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      sortType: "date",
      render: (value) => `<span class="text-sm text-zinc-500 dark:text-zinc-400">${new Date(value).toLocaleDateString()}</span>`
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      sortable: false,
      render: (_value, row) => `
        <div class="flex justify-end space-x-2">
          ${row.isActive ? `<button onclick="toggleUserStatus('${row.id}', false)" title="Deactivate user" class="inline-flex items-center justify-center p-2 text-sm font-medium rounded-lg bg-gradient-to-r from-red-500 to-pink-500 dark:from-red-400 dark:to-pink-400 text-white hover:from-red-600 hover:to-pink-600 dark:hover:from-red-500 dark:hover:to-pink-500 shadow-sm transition-all duration-200">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
              </svg>
            </button>` : `<button onclick="toggleUserStatus('${row.id}', true)" title="Activate user" class="inline-flex items-center justify-center p-2 text-sm font-medium rounded-lg bg-gradient-to-r from-lime-500 to-green-500 dark:from-lime-400 dark:to-green-400 text-white hover:from-lime-600 hover:to-green-600 dark:hover:from-lime-500 dark:hover:to-green-500 shadow-sm transition-all duration-200">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </button>`}
        </div>
      `
    }
  ];
  const tableData = {
    tableId: "users-table",
    columns,
    rows: data.users,
    selectable: false,
    rowClickable: true,
    rowClickUrl: (row) => `/admin/users/${row.id}/edit`,
    emptyMessage: "No users found"
  };
  const pageContent = `
    <div>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 class="text-2xl/8 font-semibold text-zinc-950 dark:text-white sm:text-xl/8">User Management</h1>
          <p class="mt-2 text-sm/6 text-zinc-500 dark:text-zinc-400">Manage user accounts and permissions</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex space-x-3">
          <a href="/admin/users/new" class="inline-flex items-center justify-center rounded-lg bg-zinc-950 dark:bg-white px-3.5 py-2.5 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm">
            <svg class="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Add User
          </a>
          <button class="inline-flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm font-semibold text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm" onclick="exportUsers()">
            <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Export
          </button>
        </div>
      </div>

      <!-- Alert Messages -->
      ${data.error ? chunkH6HP2MEA_cjs.renderAlert({ type: "error", message: data.error, dismissible: true }) : ""}
      ${data.success ? chunkH6HP2MEA_cjs.renderAlert({ type: "success", message: data.success, dismissible: true }) : ""}

      <!-- Stats -->
      <div class="mb-6">
        <h3 class="text-base font-semibold text-zinc-950 dark:text-white">User Statistics</h3>
        <dl class="mt-5 grid grid-cols-1 divide-zinc-950/5 dark:divide-white/10 overflow-hidden rounded-lg bg-zinc-800/75 dark:bg-zinc-800/75 ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 md:grid-cols-4 md:divide-x md:divide-y-0">
          <div class="px-4 py-5 sm:p-6">
            <dt class="text-base font-normal text-zinc-700 dark:text-zinc-100">Total Users</dt>
            <dd class="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div class="flex items-baseline text-2xl font-semibold text-cyan-400">
                ${data.totalUsers}
              </div>
              <div class="inline-flex items-baseline rounded-full bg-lime-400/10 text-lime-600 dark:text-lime-400 px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0">
                <svg viewBox="0 0 20 20" fill="currentColor" class="-ml-1 mr-0.5 size-5 shrink-0 self-center">
                  <path d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clip-rule="evenodd" fill-rule="evenodd" />
                </svg>
                <span class="sr-only">Increased by</span>
                5.2%
              </div>
            </dd>
          </div>
          <div class="px-4 py-5 sm:p-6">
            <dt class="text-base font-normal text-zinc-700 dark:text-zinc-100">Active Users</dt>
            <dd class="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div class="flex items-baseline text-2xl font-semibold text-lime-400">
                ${data.users.filter((u) => u.isActive).length}
              </div>
              <div class="inline-flex items-baseline rounded-full bg-lime-400/10 text-lime-600 dark:text-lime-400 px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0">
                <svg viewBox="0 0 20 20" fill="currentColor" class="-ml-1 mr-0.5 size-5 shrink-0 self-center">
                  <path d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clip-rule="evenodd" fill-rule="evenodd" />
                </svg>
                <span class="sr-only">Increased by</span>
                3.1%
              </div>
            </dd>
          </div>
          <div class="px-4 py-5 sm:p-6">
            <dt class="text-base font-normal text-zinc-700 dark:text-zinc-100">Administrators</dt>
            <dd class="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div class="flex items-baseline text-2xl font-semibold text-pink-400">
                ${data.users.filter((u) => u.role === "admin").length}
              </div>
              <div class="inline-flex items-baseline rounded-full bg-lime-400/10 text-lime-600 dark:text-lime-400 px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0">
                <svg viewBox="0 0 20 20" fill="currentColor" class="-ml-1 mr-0.5 size-5 shrink-0 self-center">
                  <path d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clip-rule="evenodd" fill-rule="evenodd" />
                </svg>
                <span class="sr-only">Increased by</span>
                1.8%
              </div>
            </dd>
          </div>
          <div class="px-4 py-5 sm:p-6">
            <dt class="text-base font-normal text-zinc-700 dark:text-zinc-100">Active This Week</dt>
            <dd class="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div class="flex items-baseline text-2xl font-semibold text-purple-400">
                ${data.users.filter((u) => u.lastLoginAt && u.lastLoginAt > Date.now() - 7 * 24 * 60 * 60 * 1e3).length}
              </div>
              <div class="inline-flex items-baseline rounded-full bg-pink-400/10 text-pink-600 dark:text-pink-400 px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0">
                <svg viewBox="0 0 20 20" fill="currentColor" class="-ml-1 mr-0.5 size-5 shrink-0 self-center">
                  <path d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z" clip-rule="evenodd" fill-rule="evenodd" />
                </svg>
                <span class="sr-only">Decreased by</span>
                2.3%
              </div>
            </dd>
          </div>
        </dl>
      </div>

      <!-- Filters with Gradient Background -->
      <div class="relative rounded-xl overflow-hidden mb-6">
        <!-- Gradient Background Layer -->
        <div class="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 dark:from-purple-400/20 dark:via-pink-400/20 dark:to-blue-400/20"></div>

        <!-- Content Layer with backdrop blur -->
        <div class="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10">
          <div class="px-6 py-5">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <!-- Modern Search Input -->
              <div>
                <label class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Search</label>
                <div class="relative group">
                  <input
                    type="text"
                    name="search"
                    id="user-search-input"
                    value="${data.searchFilter || ""}"
                    placeholder="Search users..."
                    class="rounded-full bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm px-4 py-2.5 pl-11 text-sm w-full text-zinc-950 dark:text-white border-2 border-purple-200/50 dark:border-purple-700/50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 focus:bg-white dark:focus:bg-zinc-800 focus:shadow-lg focus:shadow-purple-500/20 dark:focus:shadow-purple-400/20 transition-all duration-300"
                    hx-get="/admin/users"
                    hx-trigger="keyup changed delay:300ms"
                    hx-target="body"
                    hx-include="[name='role'], [name='status']"
                    hx-on::after-request="
                      const input = document.getElementById('user-search-input');
                      if (input && document.activeElement === input) {
                        const len = input.value.length;
                        setTimeout(() => {
                          input.focus();
                          input.setSelectionRange(len, len);
                        }, 10);
                      }
                    "
                  >
                  <!-- Gradient search icon -->
                  <div class="absolute left-3.5 top-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 dark:from-purple-300 dark:to-pink-400 opacity-90 group-focus-within:opacity-100 transition-opacity">
                    <svg class="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm/6 font-medium text-zinc-950 dark:text-white">Role</label>
                <div class="mt-2 grid grid-cols-1">
                  <select
                    name="role"
                    hx-get="/admin/users"
                    hx-trigger="change"
                    hx-target="body"
                    hx-include="[name='search'], [name='status']"
                    class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white/5 dark:bg-white/5 py-1.5 pl-3 pr-8 text-base text-zinc-950 dark:text-white outline outline-1 -outline-offset-1 outline-purple-500/30 dark:outline-purple-400/30 *:bg-white dark:*:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-purple-500 dark:focus-visible:outline-purple-400 sm:text-sm/6"
                  >
                    <option value="" ${!data.roleFilter ? "selected" : ""}>All Roles</option>
                    <option value="admin" ${data.roleFilter === "admin" ? "selected" : ""}>Admin</option>
                    <option value="editor" ${data.roleFilter === "editor" ? "selected" : ""}>Editor</option>
                    <option value="author" ${data.roleFilter === "author" ? "selected" : ""}>Author</option>
                    <option value="viewer" ${data.roleFilter === "viewer" ? "selected" : ""}>Viewer</option>
                  </select>
                  <svg viewBox="0 0 16 16" fill="currentColor" data-slot="icon" aria-hidden="true" class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-purple-600 dark:text-purple-400 sm:size-4">
                    <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" fill-rule="evenodd" />
                  </svg>
                </div>
              </div>

              <div>
                <label class="block text-sm/6 font-medium text-zinc-950 dark:text-white">Status</label>
                <div class="mt-2 grid grid-cols-1">
                  <select
                    name="status"
                    hx-get="/admin/users"
                    hx-trigger="change"
                    hx-target="body"
                    hx-include="[name='search'], [name='role']"
                    class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white/5 dark:bg-white/5 py-1.5 pl-3 pr-8 text-base text-zinc-950 dark:text-white outline outline-1 -outline-offset-1 outline-purple-500/30 dark:outline-purple-400/30 *:bg-white dark:*:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-purple-500 dark:focus-visible:outline-purple-400 sm:text-sm/6"
                  >
                    <option value="active" ${!data.statusFilter || data.statusFilter === "active" ? "selected" : ""}>Active</option>
                    <option value="inactive" ${data.statusFilter === "inactive" ? "selected" : ""}>Inactive</option>
                    <option value="all" ${data.statusFilter === "all" ? "selected" : ""}>All Users</option>
                  </select>
                  <svg viewBox="0 0 16 16" fill="currentColor" data-slot="icon" aria-hidden="true" class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-purple-600 dark:text-purple-400 sm:size-4">
                    <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" fill-rule="evenodd" />
                  </svg>
                </div>
              </div>

              <div>
                <label class="block text-sm/6 font-medium text-zinc-950 dark:text-white">&nbsp;</label>
                <div class="mt-2">
                  <button
                    class="inline-flex items-center gap-x-1.5 justify-center px-4 py-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm text-zinc-950 dark:text-white text-sm font-medium rounded-full ring-1 ring-inset ring-purple-200/50 dark:ring-purple-700/50 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 hover:ring-purple-300 dark:hover:ring-purple-600 transition-all duration-200 w-full"
                    onclick="clearFilters()"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Users Table -->
      ${chunkH6HP2MEA_cjs.renderTable(tableData)}

      <!-- Pagination -->
      ${data.pagination ? chunkH6HP2MEA_cjs.renderPagination(data.pagination) : ""}
    </div>

    <script>
      let userStatusData = null;

      function toggleUserStatus(userId, activate) {
        userStatusData = { userId, activate };
        showConfirmDialog('toggle-user-status-confirm');
      }

      function performToggleUserStatus() {
        if (!userStatusData) return;

        const { userId, activate } = userStatusData;

        fetch(\`/admin/users/\${userId}/toggle\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ active: activate })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            location.reload()
          } else {
            alert('Error updating user status')
          }
        })
        .catch(error => {
          console.error('Error:', error)
          alert('Error updating user status')
        })
        .finally(() => {
          userStatusData = null;
        });
      }

      function clearFilters() {
        window.location.href = '/admin/users'
      }

      function exportUsers() {
        window.open('/admin/users/export', '_blank')
      }
    </script>

    <!-- Confirmation Dialogs -->
    ${renderConfirmationDialog2({
    id: "toggle-user-status-confirm",
    title: "Toggle User Status",
    message: "Are you sure you want to activate/deactivate this user?",
    confirmText: "Confirm",
    cancelText: "Cancel",
    iconColor: "yellow",
    confirmClass: "bg-yellow-500 hover:bg-yellow-400",
    onConfirm: "performToggleUserStatus()"
  })}

    ${getConfirmationDialogScript2()}
  `;
  const layoutData = {
    title: "Users",
    pageTitle: "User Management",
    currentPath: "/admin/users",
    user: data.user,
    version: data.version,
    content: pageContent
  };
  return chunk4IO5UBHK_cjs.renderAdminLayoutCatalyst(layoutData);
}

// src/routes/admin-users.ts
var userRoutes = new hono.Hono();
userRoutes.use("*", chunkTAYKWZ2B_cjs.requireAuth());
userRoutes.get("/", (c) => {
  return c.redirect("/admin/dashboard");
});
var TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time" },
  { value: "America/Chicago", label: "Central Time" },
  { value: "America/Denver", label: "Mountain Time" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Shanghai", label: "Shanghai" },
  { value: "Australia/Sydney", label: "Sydney" }
];
var LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" }
];
var ROLES = [
  { value: "admin", label: "Administrator" },
  { value: "editor", label: "Editor" },
  { value: "author", label: "Author" },
  { value: "viewer", label: "Viewer" }
];
userRoutes.get("/profile", async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  try {
    const userStmt = db.prepare(`
      SELECT id, email, username, first_name, last_name, phone, bio, avatar_url,
             timezone, language, theme, email_notifications, two_factor_enabled,
             role, created_at, last_login_at
      FROM users 
      WHERE id = ? AND is_active = 1
    `);
    const userProfile = await userStmt.bind(user.userId).first();
    if (!userProfile) {
      return c.json({ error: "User not found" }, 404);
    }
    const profile = {
      id: userProfile.id,
      email: userProfile.email,
      username: userProfile.username || "",
      first_name: userProfile.first_name || "",
      last_name: userProfile.last_name || "",
      phone: userProfile.phone,
      bio: userProfile.bio,
      avatar_url: userProfile.avatar_url,
      timezone: userProfile.timezone || "UTC",
      language: userProfile.language || "en",
      theme: userProfile.theme || "dark",
      email_notifications: Boolean(userProfile.email_notifications),
      two_factor_enabled: Boolean(userProfile.two_factor_enabled),
      role: userProfile.role,
      created_at: userProfile.created_at,
      last_login_at: userProfile.last_login_at
    };
    const pageData = {
      profile,
      timezones: TIMEZONES,
      languages: LANGUAGES,
      user: {
        name: `${profile.first_name} ${profile.last_name}`.trim() || profile.username || user.email,
        email: user.email,
        role: user.role
      }
    };
    return c.html(renderProfilePage(pageData));
  } catch (error) {
    console.error("Profile page error:", error);
    const pageData = {
      profile: {},
      timezones: TIMEZONES,
      languages: LANGUAGES,
      error: "Failed to load profile. Please try again.",
      user: {
        name: user.email,
        email: user.email,
        role: user.role
      }
    };
    return c.html(renderProfilePage(pageData));
  }
});
userRoutes.put("/profile", async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  try {
    const formData = await c.req.formData();
    const firstName = chunkJLNQTGWQ_cjs.sanitizeInput(formData.get("first_name")?.toString());
    const lastName = chunkJLNQTGWQ_cjs.sanitizeInput(formData.get("last_name")?.toString());
    const username = chunkJLNQTGWQ_cjs.sanitizeInput(formData.get("username")?.toString());
    const email = formData.get("email")?.toString()?.trim().toLowerCase() || "";
    const phone = chunkJLNQTGWQ_cjs.sanitizeInput(formData.get("phone")?.toString()) || null;
    const bio = chunkJLNQTGWQ_cjs.sanitizeInput(formData.get("bio")?.toString()) || null;
    const timezone = formData.get("timezone")?.toString() || "UTC";
    const language = formData.get("language")?.toString() || "en";
    const emailNotifications = formData.get("email_notifications") === "1";
    if (!firstName || !lastName || !username || !email) {
      return c.html(renderAlert2({
        type: "error",
        message: "First name, last name, username, and email are required.",
        dismissible: true
      }));
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.html(renderAlert2({
        type: "error",
        message: "Please enter a valid email address.",
        dismissible: true
      }));
    }
    const checkStmt = db.prepare(`
      SELECT id FROM users 
      WHERE (username = ? OR email = ?) AND id != ? AND is_active = 1
    `);
    const existingUser = await checkStmt.bind(username, email, user.userId).first();
    if (existingUser) {
      return c.html(renderAlert2({
        type: "error",
        message: "Username or email is already taken by another user!.",
        dismissible: true
      }));
    }
    const updateStmt = db.prepare(`
      UPDATE users SET 
        first_name = ?, last_name = ?, username = ?, email = ?,
        phone = ?, bio = ?, timezone = ?, language = ?,
        email_notifications = ?, updated_at = ?
      WHERE id = ?
    `);
    await updateStmt.bind(
      firstName,
      lastName,
      username,
      email,
      phone,
      bio,
      timezone,
      language,
      emailNotifications ? 1 : 0,
      Date.now(),
      user.userId
    ).run();
    await chunkTAYKWZ2B_cjs.logActivity(
      db,
      user.userId,
      "profile.update",
      "users",
      user.userId,
      { fields: ["first_name", "last_name", "username", "email", "phone", "bio", "timezone", "language", "email_notifications"] },
      c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip"),
      c.req.header("user-agent")
    );
    return c.html(renderAlert2({
      type: "success",
      message: "Profile updated successfully!",
      dismissible: true
    }));
  } catch (error) {
    console.error("Profile update error:", error);
    return c.html(renderAlert2({
      type: "error",
      message: "Failed to update profile. Please try again.",
      dismissible: true
    }));
  }
});
userRoutes.post("/profile/avatar", async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  try {
    const formData = await c.req.formData();
    const avatarFile = formData.get("avatar");
    if (!avatarFile || typeof avatarFile === "string" || !avatarFile.name) {
      return c.html(renderAlert2({
        type: "error",
        message: "Please select an image file.",
        dismissible: true
      }));
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(avatarFile.type)) {
      return c.html(renderAlert2({
        type: "error",
        message: "Please upload a valid image file (JPEG, PNG, GIF, or WebP).",
        dismissible: true
      }));
    }
    const maxSize = 5 * 1024 * 1024;
    if (avatarFile.size > maxSize) {
      return c.html(renderAlert2({
        type: "error",
        message: "Image file must be smaller than 5MB.",
        dismissible: true
      }));
    }
    const avatarUrl = `/uploads/avatars/${user.userId}-${Date.now()}.${avatarFile.type.split("/")[1]}`;
    const updateStmt = db.prepare(`
      UPDATE users SET avatar_url = ?, updated_at = ?
      WHERE id = ?
    `);
    await updateStmt.bind(avatarUrl, Date.now(), user.userId).run();
    const userStmt = db.prepare(`
      SELECT first_name, last_name FROM users WHERE id = ?
    `);
    const userData = await userStmt.bind(user.userId).first();
    await chunkTAYKWZ2B_cjs.logActivity(
      db,
      user.userId,
      "profile.avatar_update",
      "users",
      user.userId,
      { avatar_url: avatarUrl },
      c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip"),
      c.req.header("user-agent")
    );
    const alertHtml = renderAlert2({
      type: "success",
      message: "Profile picture updated successfully!",
      dismissible: true
    });
    const avatarUrlWithCache = `${avatarUrl}?t=${Date.now()}`;
    const avatarImageHtml = renderAvatarImage(avatarUrlWithCache, userData.first_name, userData.last_name);
    const avatarImageWithOob = avatarImageHtml.replace(
      'id="avatar-image-container"',
      'id="avatar-image-container" hx-swap-oob="true"'
    );
    return c.html(alertHtml + avatarImageWithOob);
  } catch (error) {
    console.error("Avatar upload error:", error);
    return c.html(renderAlert2({
      type: "error",
      message: "Failed to upload profile picture. Please try again.",
      dismissible: true
    }));
  }
});
userRoutes.post("/profile/password", async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  try {
    const formData = await c.req.formData();
    const currentPassword = formData.get("current_password")?.toString() || "";
    const newPassword = formData.get("new_password")?.toString() || "";
    const confirmPassword = formData.get("confirm_password")?.toString() || "";
    if (!currentPassword || !newPassword || !confirmPassword) {
      return c.html(renderAlert2({
        type: "error",
        message: "All password fields are required.",
        dismissible: true
      }));
    }
    if (newPassword !== confirmPassword) {
      return c.html(renderAlert2({
        type: "error",
        message: "New passwords do not match.",
        dismissible: true
      }));
    }
    if (newPassword.length < 8) {
      return c.html(renderAlert2({
        type: "error",
        message: "New password must be at least 8 characters long.",
        dismissible: true
      }));
    }
    const userStmt = db.prepare(`
      SELECT password_hash FROM users WHERE id = ? AND is_active = 1
    `);
    const userData = await userStmt.bind(user.userId).first();
    if (!userData) {
      return c.html(renderAlert2({
        type: "error",
        message: "User not found.",
        dismissible: true
      }));
    }
    const validPassword = await chunkTAYKWZ2B_cjs.AuthManager.verifyPassword(currentPassword, userData.password_hash);
    if (!validPassword) {
      return c.html(renderAlert2({
        type: "error",
        message: "Current password is incorrect.",
        dismissible: true
      }));
    }
    const newPasswordHash = await chunkTAYKWZ2B_cjs.AuthManager.hashPassword(newPassword);
    const historyStmt = db.prepare(`
      INSERT INTO password_history (id, user_id, password_hash, created_at)
      VALUES (?, ?, ?, ?)
    `);
    await historyStmt.bind(
      crypto.randomUUID(),
      user.userId,
      userData.password_hash,
      Date.now()
    ).run();
    const updateStmt = db.prepare(`
      UPDATE users SET password_hash = ?, updated_at = ?
      WHERE id = ?
    `);
    await updateStmt.bind(newPasswordHash, Date.now(), user.userId).run();
    await chunkTAYKWZ2B_cjs.logActivity(
      db,
      user.userId,
      "profile.password_change",
      "users",
      user.userId,
      null,
      c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip"),
      c.req.header("user-agent")
    );
    return c.html(renderAlert2({
      type: "success",
      message: "Password updated successfully!",
      dismissible: true
    }));
  } catch (error) {
    console.error("Password change error:", error);
    return c.html(renderAlert2({
      type: "error",
      message: "Failed to update password. Please try again.",
      dismissible: true
    }));
  }
});
userRoutes.get("/users", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const search = c.req.query("search") || "";
    const roleFilter = c.req.query("role") || "";
    const statusFilter = c.req.query("status") || "active";
    const offset = (page - 1) * limit;
    let whereClause = "";
    let params = [];
    if (statusFilter === "active") {
      whereClause = "WHERE u.is_active = 1";
    } else if (statusFilter === "inactive") {
      whereClause = "WHERE u.is_active = 0";
    } else {
      whereClause = "WHERE 1=1";
    }
    if (search) {
      whereClause += " AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.username LIKE ?)";
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }
    if (roleFilter) {
      whereClause += " AND u.role = ?";
      params.push(roleFilter);
    }
    const usersStmt = db.prepare(`
      SELECT u.id, u.email, u.username, u.first_name, u.last_name,
             u.role, u.avatar_url, u.created_at, u.last_login_at, u.updated_at,
             u.email_verified, u.two_factor_enabled, u.is_active
      FROM users u
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `);
    const { results: usersData } = await usersStmt.bind(...params, limit, offset).all();
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM users u ${whereClause}
    `);
    const countResult = await countStmt.bind(...params).first();
    const totalUsers = countResult?.total || 0;
    await chunkTAYKWZ2B_cjs.logActivity(
      db,
      user.userId,
      "users.list_view",
      "users",
      void 0,
      { search, page, limit },
      c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip"),
      c.req.header("user-agent")
    );
    const acceptHeader = c.req.header("accept") || "";
    const isApiRequest = acceptHeader.includes("application/json");
    if (isApiRequest) {
      return c.json({
        users: usersData || [],
        pagination: {
          page,
          limit,
          total: totalUsers,
          pages: Math.ceil(totalUsers / limit)
        }
      });
    }
    const users = (usersData || []).map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username || "",
      firstName: u.first_name || "",
      lastName: u.last_name || "",
      role: u.role,
      avatar: u.avatar_url,
      isActive: Boolean(u.is_active),
      lastLoginAt: u.last_login_at,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      formattedLastLogin: u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : void 0,
      formattedCreatedAt: new Date(u.created_at).toLocaleDateString()
    }));
    const pageData = {
      users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
      searchFilter: search,
      roleFilter,
      statusFilter,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalItems: totalUsers,
        itemsPerPage: limit,
        startItem: offset + 1,
        endItem: Math.min(offset + limit, totalUsers),
        baseUrl: "/admin/users"
      },
      user: {
        name: user.email.split("@")[0] || user.email,
        email: user.email,
        role: user.role
      }
    };
    return c.html(renderUsersListPage(pageData));
  } catch (error) {
    console.error("Users list error:", error);
    const acceptHeader = c.req.header("accept") || "";
    const isApiRequest = acceptHeader.includes("application/json");
    if (isApiRequest) {
      return c.json({ error: "Failed to load users" }, 500);
    }
    return c.html(renderAlert2({
      type: "error",
      message: "Failed to load users. Please try again.",
      dismissible: true
    }), 500);
  }
});
userRoutes.get("/users/new", async (c) => {
  const user = c.get("user");
  try {
    const pageData = {
      roles: ROLES,
      user: {
        name: user.email.split("@")[0] || user.email,
        email: user.email,
        role: user.role
      }
    };
    return c.html(renderUserNewPage(pageData));
  } catch (error) {
    console.error("User new page error:", error);
    return c.html(renderAlert2({
      type: "error",
      message: "Failed to load user creation page. Please try again.",
      dismissible: true
    }), 500);
  }
});
userRoutes.post("/users/new", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  try {
    const formData = await c.req.formData();
    const firstName = chunkJLNQTGWQ_cjs.sanitizeInput(formData.get("first_name")?.toString());
    const lastName = chunkJLNQTGWQ_cjs.sanitizeInput(formData.get("last_name")?.toString());
    const username = chunkJLNQTGWQ_cjs.sanitizeInput(formData.get("username")?.toString());
    const email = formData.get("email")?.toString()?.trim().toLowerCase() || "";
    const phone = chunkJLNQTGWQ_cjs.sanitizeInput(formData.get("phone")?.toString()) || null;
    const bio = chunkJLNQTGWQ_cjs.sanitizeInput(formData.get("bio")?.toString()) || null;
    const role = formData.get("role")?.toString() || "viewer";
    const password = formData.get("password")?.toString() || "";
    const confirmPassword = formData.get("confirm_password")?.toString() || "";
    const isActive = formData.get("is_active") === "1";
    const emailVerified = formData.get("email_verified") === "1";
    if (!firstName || !lastName || !username || !email || !password) {
      return c.html(renderAlert2({
        type: "error",
        message: "First name, last name, username, email, and password are required.",
        dismissible: true
      }));
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.html(renderAlert2({
        type: "error",
        message: "Please enter a valid email address.",
        dismissible: true
      }));
    }
    if (password.length < 8) {
      return c.html(renderAlert2({
        type: "error",
        message: "Password must be at least 8 characters long.",
        dismissible: true
      }));
    }
    if (password !== confirmPassword) {
      return c.html(renderAlert2({
        type: "error",
        message: "Passwords do not match.",
        dismissible: true
      }));
    }
    const checkStmt = db.prepare(`
      SELECT id FROM users
      WHERE username = ? OR email = ?
    `);
    const existingUser = await checkStmt.bind(username, email).first();
    if (existingUser) {
      return c.html(renderAlert2({
        type: "error",
        message: "Username or email is already taken.",
        dismissible: true
      }));
    }
    const passwordHash = await chunkTAYKWZ2B_cjs.AuthManager.hashPassword(password);
    const userId = crypto.randomUUID();
    const createStmt = db.prepare(`
      INSERT INTO users (
        id, email, username, first_name, last_name, phone, bio,
        password_hash, role, is_active, email_verified, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    await createStmt.bind(
      userId,
      email,
      username,
      firstName,
      lastName,
      phone,
      bio,
      passwordHash,
      role,
      isActive ? 1 : 0,
      emailVerified ? 1 : 0,
      Date.now(),
      Date.now()
    ).run();
    await chunkTAYKWZ2B_cjs.logActivity(
      db,
      user.userId,
      "user!.create",
      "users",
      userId,
      { email, username, role },
      c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip"),
      c.req.header("user-agent")
    );
    return c.redirect(`/admin/users/${userId}/edit?success=User created successfully`);
  } catch (error) {
    console.error("User creation error:", error);
    return c.html(renderAlert2({
      type: "error",
      message: "Failed to create user!. Please try again.",
      dismissible: true
    }));
  }
});
userRoutes.get("/users/:id", async (c) => {
  if (c.req.path.endsWith("/edit")) {
    return c.notFound();
  }
  const db = c.env.DB;
  const user = c.get("user");
  const userId = c.req.param("id");
  try {
    const userStmt = db.prepare(`
      SELECT id, email, username, first_name, last_name, phone, bio, avatar_url,
             role, is_active, email_verified, two_factor_enabled, created_at, last_login_at
      FROM users
      WHERE id = ?
    `);
    const userRecord = await userStmt.bind(userId).first();
    if (!userRecord) {
      return c.json({ error: "User not found" }, 404);
    }
    await chunkTAYKWZ2B_cjs.logActivity(
      db,
      user.userId,
      "user!.view",
      "users",
      userId,
      null,
      c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip"),
      c.req.header("user-agent")
    );
    return c.json({
      user: {
        id: userRecord.id,
        email: userRecord.email,
        username: userRecord.username,
        first_name: userRecord.first_name,
        last_name: userRecord.last_name,
        phone: userRecord.phone,
        bio: userRecord.bio,
        avatar_url: userRecord.avatar_url,
        role: userRecord.role,
        is_active: userRecord.is_active,
        email_verified: userRecord.email_verified,
        two_factor_enabled: userRecord.two_factor_enabled,
        created_at: userRecord.created_at,
        last_login_at: userRecord.last_login_at
      }
    });
  } catch (error) {
    console.error("User fetch error:", error);
    return c.json({ error: "Failed to fetch user" }, 500);
  }
});
userRoutes.get("/users/:id/edit", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const userId = c.req.param("id");
  try {
    const userStmt = db.prepare(`
      SELECT id, email, username, first_name, last_name, phone, avatar_url,
             role, is_active, email_verified, two_factor_enabled, created_at, last_login_at
      FROM users
      WHERE id = ?
    `);
    const userToEdit = await userStmt.bind(userId).first();
    if (!userToEdit) {
      return c.html(renderAlert2({
        type: "error",
        message: "User not found",
        dismissible: true
      }), 404);
    }
    const profileStmt = db.prepare(`
      SELECT display_name, bio, company, job_title, website, location, date_of_birth
      FROM user_profiles
      WHERE user_id = ?
    `);
    const profileData = await profileStmt.bind(userId).first();
    const profile = profileData ? {
      displayName: profileData.display_name,
      bio: profileData.bio,
      company: profileData.company,
      jobTitle: profileData.job_title,
      website: profileData.website,
      location: profileData.location,
      dateOfBirth: profileData.date_of_birth
    } : void 0;
    const editData = {
      id: userToEdit.id,
      email: userToEdit.email,
      username: userToEdit.username || "",
      firstName: userToEdit.first_name || "",
      lastName: userToEdit.last_name || "",
      phone: userToEdit.phone,
      avatarUrl: userToEdit.avatar_url,
      role: userToEdit.role,
      isActive: Boolean(userToEdit.is_active),
      emailVerified: Boolean(userToEdit.email_verified),
      twoFactorEnabled: Boolean(userToEdit.two_factor_enabled),
      createdAt: userToEdit.created_at,
      lastLoginAt: userToEdit.last_login_at,
      profile
    };
    const pageData = {
      userToEdit: editData,
      roles: ROLES,
      user: {
        name: user.email.split("@")[0] || user.email,
        email: user.email,
        role: user.role
      }
    };
    return c.html(renderUserEditPage(pageData));
  } catch (error) {
    console.error("User edit page error:", error);
    return c.html(renderAlert2({
      type: "error",
      message: "Failed to load user. Please try again.",
      dismissible: true
    }), 500);
  }
});
userRoutes.put("/users/:id", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const userId = c.req.param("id");
  try {
    const formData = await c.req.formData();
    const firstName = chunkJLNQTGWQ_cjs.sanitizeInput(formData.get("first_name")?.toString());
    const lastName = chunkJLNQTGWQ_cjs.sanitizeInput(formData.get("last_name")?.toString());
    const username = chunkJLNQTGWQ_cjs.sanitizeInput(formData.get("username")?.toString());
    const email = formData.get("email")?.toString()?.trim().toLowerCase() || "";
    const phone = chunkJLNQTGWQ_cjs.sanitizeInput(formData.get("phone")?.toString()) || null;
    const role = formData.get("role")?.toString() || "viewer";
    const isActive = formData.get("is_active") === "1";
    const emailVerified = formData.get("email_verified") === "1";
    const profileDisplayName = chunkJLNQTGWQ_cjs.sanitizeInput(formData.get("profile_display_name")?.toString()) || null;
    const profileBio = chunkJLNQTGWQ_cjs.sanitizeInput(formData.get("profile_bio")?.toString()) || null;
    const profileCompany = chunkJLNQTGWQ_cjs.sanitizeInput(formData.get("profile_company")?.toString()) || null;
    const profileJobTitle = chunkJLNQTGWQ_cjs.sanitizeInput(formData.get("profile_job_title")?.toString()) || null;
    const profileWebsite = formData.get("profile_website")?.toString()?.trim() || null;
    const profileLocation = chunkJLNQTGWQ_cjs.sanitizeInput(formData.get("profile_location")?.toString()) || null;
    const profileDateOfBirthStr = formData.get("profile_date_of_birth")?.toString()?.trim() || null;
    const profileDateOfBirth = profileDateOfBirthStr ? new Date(profileDateOfBirthStr).getTime() : null;
    if (!firstName || !lastName || !username || !email) {
      return c.html(renderAlert2({
        type: "error",
        message: "First name, last name, username, and email are required.",
        dismissible: true
      }));
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.html(renderAlert2({
        type: "error",
        message: "Please enter a valid email address.",
        dismissible: true
      }));
    }
    if (profileWebsite) {
      try {
        new URL(profileWebsite);
      } catch {
        return c.html(renderAlert2({
          type: "error",
          message: "Please enter a valid website URL.",
          dismissible: true
        }));
      }
    }
    const checkStmt = db.prepare(`
      SELECT id FROM users
      WHERE (username = ? OR email = ?) AND id != ?
    `);
    const existingUser = await checkStmt.bind(username, email, userId).first();
    if (existingUser) {
      return c.html(renderAlert2({
        type: "error",
        message: "Username or email is already taken by another user.",
        dismissible: true
      }));
    }
    const updateStmt = db.prepare(`
      UPDATE users SET
        first_name = ?, last_name = ?, username = ?, email = ?,
        phone = ?, role = ?, is_active = ?, email_verified = ?,
        updated_at = ?
      WHERE id = ?
    `);
    await updateStmt.bind(
      firstName,
      lastName,
      username,
      email,
      phone,
      role,
      isActive ? 1 : 0,
      emailVerified ? 1 : 0,
      Date.now(),
      userId
    ).run();
    const hasProfileData = profileDisplayName || profileBio || profileCompany || profileJobTitle || profileWebsite || profileLocation || profileDateOfBirth;
    if (hasProfileData) {
      const now = Date.now();
      const profileCheckStmt = db.prepare(`SELECT id FROM user_profiles WHERE user_id = ?`);
      const existingProfile = await profileCheckStmt.bind(userId).first();
      if (existingProfile) {
        const updateProfileStmt = db.prepare(`
          UPDATE user_profiles SET
            display_name = ?, bio = ?, company = ?, job_title = ?,
            website = ?, location = ?, date_of_birth = ?, updated_at = ?
          WHERE user_id = ?
        `);
        await updateProfileStmt.bind(
          profileDisplayName,
          profileBio,
          profileCompany,
          profileJobTitle,
          profileWebsite,
          profileLocation,
          profileDateOfBirth,
          now,
          userId
        ).run();
      } else {
        const profileId = `profile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const insertProfileStmt = db.prepare(`
          INSERT INTO user_profiles (id, user_id, display_name, bio, company, job_title, website, location, date_of_birth, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        await insertProfileStmt.bind(
          profileId,
          userId,
          profileDisplayName,
          profileBio,
          profileCompany,
          profileJobTitle,
          profileWebsite,
          profileLocation,
          profileDateOfBirth,
          now,
          now
        ).run();
      }
    }
    await chunkTAYKWZ2B_cjs.logActivity(
      db,
      user.userId,
      "user.update",
      "users",
      userId,
      { fields: ["first_name", "last_name", "username", "email", "phone", "role", "is_active", "email_verified", "profile"] },
      c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip"),
      c.req.header("user-agent")
    );
    return c.html(renderAlert2({
      type: "success",
      message: "User updated successfully!",
      dismissible: true
    }));
  } catch (error) {
    console.error("User update error:", error);
    return c.html(renderAlert2({
      type: "error",
      message: "Failed to update user. Please try again.",
      dismissible: true
    }));
  }
});
userRoutes.post("/users/:id/toggle", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const userId = c.req.param("id");
  try {
    const body = await c.req.json().catch(() => ({ active: true }));
    const active = body.active === true;
    if (userId === user.userId && !active) {
      return c.json({ error: "You cannot deactivate your own account" }, 400);
    }
    const userStmt = db.prepare(`
      SELECT id, email FROM users WHERE id = ?
    `);
    const userToToggle = await userStmt.bind(userId).first();
    if (!userToToggle) {
      return c.json({ error: "User not found" }, 404);
    }
    const toggleStmt = db.prepare(`
      UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?
    `);
    await toggleStmt.bind(active ? 1 : 0, Date.now(), userId).run();
    await chunkTAYKWZ2B_cjs.logActivity(
      db,
      user.userId,
      active ? "user.activate" : "user.deactivate",
      "users",
      userId,
      { email: userToToggle.email },
      c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip"),
      c.req.header("user-agent")
    );
    return c.json({
      success: true,
      message: active ? "User activated successfully" : "User deactivated successfully"
    });
  } catch (error) {
    console.error("User toggle error:", error);
    return c.json({ error: "Failed to toggle user status" }, 500);
  }
});
userRoutes.delete("/users/:id", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const userId = c.req.param("id");
  try {
    const body = await c.req.json().catch(() => ({ hardDelete: false }));
    const hardDelete = body.hardDelete === true;
    if (userId === user.userId) {
      return c.json({ error: "You cannot delete your own account" }, 400);
    }
    const userStmt = db.prepare(`
      SELECT id, email FROM users WHERE id = ?
    `);
    const userToDelete = await userStmt.bind(userId).first();
    if (!userToDelete) {
      return c.json({ error: "User not found" }, 404);
    }
    if (hardDelete) {
      const deleteStmt = db.prepare(`
        DELETE FROM users WHERE id = ?
      `);
      await deleteStmt.bind(userId).run();
      await chunkTAYKWZ2B_cjs.logActivity(
        db,
        user.userId,
        "user!.hard_delete",
        "users",
        userId,
        { email: userToDelete.email, permanent: true },
        c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip"),
        c.req.header("user-agent")
      );
      return c.json({
        success: true,
        message: "User permanently deleted"
      });
    } else {
      const deleteStmt = db.prepare(`
        UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?
      `);
      await deleteStmt.bind(Date.now(), userId).run();
      await chunkTAYKWZ2B_cjs.logActivity(
        db,
        user.userId,
        "user!.soft_delete",
        "users",
        userId,
        { email: userToDelete.email },
        c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip"),
        c.req.header("user-agent")
      );
      return c.json({
        success: true,
        message: "User deactivated successfully"
      });
    }
  } catch (error) {
    console.error("User deletion error:", error);
    return c.json({ error: "Failed to delete user" }, 500);
  }
});
userRoutes.post("/invite-user", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  try {
    const formData = await c.req.formData();
    const email = formData.get("email")?.toString()?.trim().toLowerCase() || "";
    const role = formData.get("role")?.toString()?.trim() || "viewer";
    const firstName = chunkJLNQTGWQ_cjs.sanitizeInput(formData.get("first_name")?.toString());
    const lastName = chunkJLNQTGWQ_cjs.sanitizeInput(formData.get("last_name")?.toString());
    if (!email || !firstName || !lastName) {
      return c.json({ error: "Email, first name, and last name are required" }, 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: "Please enter a valid email address" }, 400);
    }
    const existingUserStmt = db.prepare(`
      SELECT id FROM users WHERE email = ?
    `);
    const existingUser = await existingUserStmt.bind(email).first();
    if (existingUser) {
      return c.json({ error: "A user with this email already exists" }, 400);
    }
    const invitationToken = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const createUserStmt = db.prepare(`
      INSERT INTO users (
        id, email, first_name, last_name, role, 
        invitation_token, invited_by, invited_at,
        is_active, email_verified, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    await createUserStmt.bind(
      userId,
      email,
      firstName,
      lastName,
      role,
      invitationToken,
      user.userId,
      Date.now(),
      0,
      0,
      Date.now(),
      Date.now()
    ).run();
    await chunkTAYKWZ2B_cjs.logActivity(
      db,
      user.userId,
      "user!.invite_sent",
      "users",
      userId,
      { email, role, invited_user_id: userId },
      c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip"),
      c.req.header("user-agent")
    );
    const invitationLink = `${c.req.header("origin") || "http://localhost:8787"}/auth/accept-invitation?token=${invitationToken}`;
    return c.json({
      success: true,
      message: "User invitation sent successfully",
      user: {
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        role
      },
      invitation_link: invitationLink
      // In production, this would be sent via email
    });
  } catch (error) {
    console.error("User invitation error:", error);
    return c.json({ error: "Failed to send user invitation" }, 500);
  }
});
userRoutes.post("/resend-invitation/:id", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const userId = c.req.param("id");
  try {
    const userStmt = db.prepare(`
      SELECT id, email, first_name, last_name, role, invitation_token
      FROM users 
      WHERE id = ? AND is_active = 0 AND invitation_token IS NOT NULL
    `);
    const invitedUser = await userStmt.bind(userId).first();
    if (!invitedUser) {
      return c.json({ error: "User not found or invitation not valid" }, 404);
    }
    const newInvitationToken = crypto.randomUUID();
    const updateStmt = db.prepare(`
      UPDATE users SET 
        invitation_token = ?, 
        invited_at = ?, 
        updated_at = ?
      WHERE id = ?
    `);
    await updateStmt.bind(
      newInvitationToken,
      Date.now(),
      Date.now(),
      userId
    ).run();
    await chunkTAYKWZ2B_cjs.logActivity(
      db,
      user.userId,
      "user!.invitation_resent",
      "users",
      userId,
      { email: invitedUser.email },
      c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip"),
      c.req.header("user-agent")
    );
    const invitationLink = `${c.req.header("origin") || "http://localhost:8787"}/auth/accept-invitation?token=${newInvitationToken}`;
    return c.json({
      success: true,
      message: "Invitation resent successfully",
      invitation_link: invitationLink
    });
  } catch (error) {
    console.error("Resend invitation error:", error);
    return c.json({ error: "Failed to resend invitation" }, 500);
  }
});
userRoutes.delete("/cancel-invitation/:id", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const userId = c.req.param("id");
  try {
    const userStmt = db.prepare(`
      SELECT id, email FROM users 
      WHERE id = ? AND is_active = 0 AND invitation_token IS NOT NULL
    `);
    const invitedUser = await userStmt.bind(userId).first();
    if (!invitedUser) {
      return c.json({ error: "User not found or invitation not valid" }, 404);
    }
    const deleteStmt = db.prepare(`DELETE FROM users WHERE id = ?`);
    await deleteStmt.bind(userId).run();
    await chunkTAYKWZ2B_cjs.logActivity(
      db,
      user.userId,
      "user!.invitation_cancelled",
      "users",
      userId,
      { email: invitedUser.email },
      c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip"),
      c.req.header("user-agent")
    );
    return c.json({
      success: true,
      message: "Invitation cancelled successfully"
    });
  } catch (error) {
    console.error("Cancel invitation error:", error);
    return c.json({ error: "Failed to cancel invitation" }, 500);
  }
});
userRoutes.get("/activity-logs", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = (page - 1) * limit;
    const filters = {
      action: c.req.query("action") || "",
      resource_type: c.req.query("resource_type") || "",
      date_from: c.req.query("date_from") || "",
      date_to: c.req.query("date_to") || "",
      user_id: c.req.query("user_id") || ""
    };
    let whereConditions = [];
    let params = [];
    if (filters.action) {
      whereConditions.push("al.action = ?");
      params.push(filters.action);
    }
    if (filters.resource_type) {
      whereConditions.push("al.resource_type = ?");
      params.push(filters.resource_type);
    }
    if (filters.user_id) {
      whereConditions.push("al.user_id = ?");
      params.push(filters.user_id);
    }
    if (filters.date_from) {
      const fromTimestamp = new Date(filters.date_from).getTime();
      whereConditions.push("al.created_at >= ?");
      params.push(fromTimestamp);
    }
    if (filters.date_to) {
      const toTimestamp = (/* @__PURE__ */ new Date(filters.date_to + " 23:59:59")).getTime();
      whereConditions.push("al.created_at <= ?");
      params.push(toTimestamp);
    }
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";
    const logsStmt = db.prepare(`
      SELECT 
        al.id, al.user_id, al.action, al.resource_type, al.resource_id,
        al.details, al.ip_address, al.user_agent, al.created_at,
        u.email as user_email,
        COALESCE(u.first_name || ' ' || u.last_name, u.username, u.email) as user_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `);
    const { results: logs } = await logsStmt.bind(...params, limit, offset).all();
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total 
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
    `);
    const countResult = await countStmt.bind(...params).first();
    const totalLogs = countResult?.total || 0;
    const formattedLogs = (logs || []).map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    }));
    await chunkTAYKWZ2B_cjs.logActivity(
      db,
      user.userId,
      "activity.logs_viewed",
      void 0,
      void 0,
      { filters, page, limit },
      c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip"),
      c.req.header("user-agent")
    );
    const pageData = {
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total: totalLogs,
        pages: Math.ceil(totalLogs / limit)
      },
      filters,
      user: {
        name: user.email.split("@")[0] || user.email,
        // Use email username as fallback
        email: user.email,
        role: user.role
      }
    };
    return c.html(renderActivityLogsPage(pageData));
  } catch (error) {
    console.error("Activity logs error:", error);
    const pageData = {
      logs: [],
      pagination: { page: 1, limit: 50, total: 0, pages: 0 },
      filters: {},
      user: {
        name: user.email,
        email: user.email,
        role: user.role
      }
    };
    return c.html(renderActivityLogsPage(pageData));
  }
});
userRoutes.get("/activity-logs/export", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  try {
    const filters = {
      action: c.req.query("action") || "",
      resource_type: c.req.query("resource_type") || "",
      date_from: c.req.query("date_from") || "",
      date_to: c.req.query("date_to") || "",
      user_id: c.req.query("user_id") || ""
    };
    let whereConditions = [];
    let params = [];
    if (filters.action) {
      whereConditions.push("al.action = ?");
      params.push(filters.action);
    }
    if (filters.resource_type) {
      whereConditions.push("al.resource_type = ?");
      params.push(filters.resource_type);
    }
    if (filters.user_id) {
      whereConditions.push("al.user_id = ?");
      params.push(filters.user_id);
    }
    if (filters.date_from) {
      const fromTimestamp = new Date(filters.date_from).getTime();
      whereConditions.push("al.created_at >= ?");
      params.push(fromTimestamp);
    }
    if (filters.date_to) {
      const toTimestamp = (/* @__PURE__ */ new Date(filters.date_to + " 23:59:59")).getTime();
      whereConditions.push("al.created_at <= ?");
      params.push(toTimestamp);
    }
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";
    const logsStmt = db.prepare(`
      SELECT 
        al.id, al.user_id, al.action, al.resource_type, al.resource_id,
        al.details, al.ip_address, al.user_agent, al.created_at,
        u.email as user_email,
        COALESCE(u.first_name || ' ' || u.last_name, u.username, u.email) as user_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT 10000
    `);
    const { results: logs } = await logsStmt.bind(...params).all();
    const csvHeaders = ["Timestamp", "User", "Email", "Action", "Resource Type", "Resource ID", "IP Address", "Details"];
    const csvRows = [csvHeaders.join(",")];
    for (const log of logs || []) {
      const row = [
        `"${new Date(log.created_at).toISOString()}"`,
        `"${log.user_name || "Unknown"}"`,
        `"${log.user_email || "N/A"}"`,
        `"${log.action}"`,
        `"${log.resource_type || "N/A"}"`,
        `"${log.resource_id || "N/A"}"`,
        `"${log.ip_address || "N/A"}"`,
        `"${log.details ? JSON.stringify(JSON.parse(log.details)) : "N/A"}"`
      ];
      csvRows.push(row.join(","));
    }
    const csvContent = csvRows.join("\n");
    await chunkTAYKWZ2B_cjs.logActivity(
      db,
      user.userId,
      "activity.logs_exported",
      void 0,
      void 0,
      { filters, count: logs?.length || 0 },
      c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip"),
      c.req.header("user-agent")
    );
    const filename = `activity-logs-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`;
    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error("Activity logs export error:", error);
    return c.json({ error: "Failed to export activity logs" }, 500);
  }
});

// src/templates/pages/admin-logs-list.template.ts
chunk4IO5UBHK_cjs.init_admin_layout_catalyst_template();
function renderLogsListPage(data) {
  const { logs, pagination, filters, user } = data;
  const content = `
    <div>
      <div class="sm:flex sm:items-center sm:justify-between mb-6">
        <div class="sm:flex-auto">
          <h1 class="text-2xl/8 font-semibold text-zinc-950 dark:text-white sm:text-xl/8">System Logs</h1>
          <p class="mt-2 text-sm/6 text-zinc-500 dark:text-zinc-400">
            Monitor and analyze system activity, errors, and performance metrics.
          </p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 flex gap-x-2">
          <a
            href="/admin/logs/config"
            class="inline-flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm font-semibold text-zinc-950 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-700 ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 transition-colors shadow-sm"
          >
            Configure
          </a>
          <a
            href="/admin/logs/export?${new URLSearchParams(filters).toString()}"
            class="inline-flex items-center justify-center rounded-lg bg-zinc-950 dark:bg-white px-3.5 py-2.5 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
          >
            Export
          </a>
        </div>
      </div>

      <!-- Filters -->
      <div class="relative rounded-xl overflow-hidden mb-6">
        <!-- Gradient Background -->
        <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 dark:from-cyan-400/20 dark:via-blue-400/20 dark:to-purple-400/20"></div>

        <div class="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10">
          <div class="px-6 py-5">
            <form method="GET" action="/admin/logs" class="space-y-4">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div class="relative group">
                  <label for="search" class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Search</label>
                  <div class="relative">
                    <div class="absolute left-3.5 top-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 dark:from-cyan-300 dark:to-blue-400 opacity-90 group-focus-within:opacity-100 transition-opacity">
                      <svg class="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="search"
                      id="search"
                      value="${filters.search}"
                      placeholder="Search messages..."
                      class="w-full rounded-full bg-transparent pl-11 pr-4 py-2 text-sm text-zinc-950 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 border-2 border-cyan-200/50 dark:border-cyan-700/50 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/20 dark:focus:shadow-cyan-400/20 transition-all duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label for="level" class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Level</label>
                  <select
                    name="level"
                    id="level"
                    class="w-full rounded-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm px-4 py-2 text-sm text-zinc-950 dark:text-white border-2 border-cyan-200/50 dark:border-cyan-700/50 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/20 dark:focus:shadow-cyan-400/20 transition-all duration-300"
                  >
                    <option value="">All Levels</option>
                    <option value="debug" ${filters.level === "debug" ? "selected" : ""}>Debug</option>
                    <option value="info" ${filters.level === "info" ? "selected" : ""}>Info</option>
                    <option value="warn" ${filters.level === "warn" ? "selected" : ""}>Warning</option>
                    <option value="error" ${filters.level === "error" ? "selected" : ""}>Error</option>
                    <option value="fatal" ${filters.level === "fatal" ? "selected" : ""}>Fatal</option>
                  </select>
                </div>

                <div>
                  <label for="category" class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Category</label>
                  <select
                    name="category"
                    id="category"
                    class="w-full rounded-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm px-4 py-2 text-sm text-zinc-950 dark:text-white border-2 border-cyan-200/50 dark:border-cyan-700/50 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/20 dark:focus:shadow-cyan-400/20 transition-all duration-300"
                  >
                    <option value="">All Categories</option>
                    <option value="auth" ${filters.category === "auth" ? "selected" : ""}>Authentication</option>
                    <option value="api" ${filters.category === "api" ? "selected" : ""}>API</option>
                    <option value="workflow" ${filters.category === "workflow" ? "selected" : ""}>Workflow</option>
                    <option value="plugin" ${filters.category === "plugin" ? "selected" : ""}>Plugin</option>
                    <option value="media" ${filters.category === "media" ? "selected" : ""}>Media</option>
                    <option value="system" ${filters.category === "system" ? "selected" : ""}>System</option>
                    <option value="security" ${filters.category === "security" ? "selected" : ""}>Security</option>
                    <option value="error" ${filters.category === "error" ? "selected" : ""}>Error</option>
                  </select>
                </div>

                <div>
                  <label for="source" class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Source</label>
                  <input
                    type="text"
                    name="source"
                    id="source"
                    value="${filters.source}"
                    placeholder="e.g., http-middleware"
                    class="w-full rounded-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm px-4 py-2 text-sm text-zinc-950 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 border-2 border-cyan-200/50 dark:border-cyan-700/50 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/20 dark:focus:shadow-cyan-400/20 transition-all duration-300"
                  />
                </div>

                <div>
                  <label for="start_date" class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">Start Date</label>
                  <input
                    type="datetime-local"
                    name="start_date"
                    id="start_date"
                    value="${filters.startDate}"
                    class="w-full rounded-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm px-4 py-2 text-sm text-zinc-950 dark:text-white border-2 border-cyan-200/50 dark:border-cyan-700/50 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/20 dark:focus:shadow-cyan-400/20 transition-all duration-300"
                  />
                </div>

                <div>
                  <label for="end_date" class="block text-sm font-medium text-zinc-950 dark:text-white mb-2">End Date</label>
                  <input
                    type="datetime-local"
                    name="end_date"
                    id="end_date"
                    value="${filters.endDate}"
                    class="w-full rounded-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm px-4 py-2 text-sm text-zinc-950 dark:text-white border-2 border-cyan-200/50 dark:border-cyan-700/50 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/20 dark:focus:shadow-cyan-400/20 transition-all duration-300"
                  />
                </div>

                <div class="sm:col-span-2 flex items-end gap-x-2">
                  <button
                    type="submit"
                    class="inline-flex items-center justify-center rounded-lg bg-zinc-950 dark:bg-white px-3.5 py-2.5 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
                  >
                    Apply Filters
                  </button>
                  <a
                    href="/admin/logs"
                    class="inline-flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm font-semibold text-zinc-950 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-700 ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 transition-colors shadow-sm"
                  >
                    Clear
                  </a>
                </div>
              </div>

              <div class="flex items-center justify-end pt-2">
                <span class="text-sm/6 font-medium text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded-full bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm">${pagination.totalItems} ${pagination.totalItems === 1 ? "entry" : "entries"}</span>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Logs Table -->
      <div class="rounded-xl bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-zinc-950/5 dark:border-white/5">
                <th scope="col" class="px-4 py-3.5 text-left text-sm font-semibold text-zinc-950 dark:text-white sm:pl-6">
                  Level
                </th>
                <th scope="col" class="px-4 py-3.5 text-left text-sm font-semibold text-zinc-950 dark:text-white">
                  Category
                </th>
                <th scope="col" class="px-4 py-3.5 text-left text-sm font-semibold text-zinc-950 dark:text-white">
                  Message
                </th>
                <th scope="col" class="px-4 py-3.5 text-left text-sm font-semibold text-zinc-950 dark:text-white">
                  Source
                </th>
                <th scope="col" class="px-4 py-3.5 text-left text-sm font-semibold text-zinc-950 dark:text-white">
                  Time
                </th>
                <th scope="col" class="relative px-4 py-3.5 sm:pr-6">
                  <span class="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              ${logs.map((log) => `
                <tr class="border-t border-zinc-950/5 dark:border-white/5 hover:bg-gradient-to-r hover:from-cyan-50/50 hover:via-blue-50/30 hover:to-purple-50/50 dark:hover:from-cyan-900/20 dark:hover:via-blue-900/10 dark:hover:to-purple-900/20 hover:shadow-sm hover:shadow-cyan-500/5 dark:hover:shadow-cyan-400/5 transition-all duration-300">
                  <td class="px-4 py-4 whitespace-nowrap sm:pl-6">
                    <span class="inline-flex items-center rounded-md px-2.5 py-1 text-sm font-medium ring-1 ring-inset ${log.levelClass}">
                      ${log.level}
                    </span>
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center rounded-md px-2.5 py-1 text-sm font-medium ring-1 ring-inset ${log.categoryClass}">
                      ${log.category}
                    </span>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm max-w-md">
                      <div class="truncate text-zinc-950 dark:text-white" title="${log.message}">${log.message}</div>
                      ${log.url ? `<div class="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-1">${log.method} ${log.url}</div>` : ""}
                      ${log.duration ? `<div class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">${log.formattedDuration}</div>` : ""}
                    </div>
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                    ${log.source || "-"}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                    ${log.formattedDate}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium sm:pr-6">
                    <a href="/admin/logs/${log.id}" class="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors">
                      View Details
                    </a>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        ${logs.length === 0 ? `
          <div class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-zinc-950 dark:text-white">No log entries</h3>
            <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">No log entries found matching your criteria.</p>
          </div>
        ` : ""}
      </div>

      <!-- Pagination -->
      ${pagination.totalPages > 1 ? `
        <div class="mt-6 flex items-center justify-between">
          <div class="flex-1 flex justify-between sm:hidden">
            ${pagination.currentPage > 1 ? `
              <a
                href="${pagination.baseUrl}?${new URLSearchParams({ ...filters, page: (pagination.currentPage - 1).toString() }).toString()}"
                class="relative inline-flex items-center px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-950 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-700 ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 transition-colors"
              >
                Previous
              </a>
            ` : `
              <span class="relative inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 dark:text-zinc-600 bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed">
                Previous
              </span>
            `}
            ${pagination.currentPage < pagination.totalPages ? `
              <a
                href="${pagination.baseUrl}?${new URLSearchParams({ ...filters, page: (pagination.currentPage + 1).toString() }).toString()}"
                class="ml-3 relative inline-flex items-center px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-950 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-700 ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 transition-colors"
              >
                Next
              </a>
            ` : `
              <span class="ml-3 relative inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 dark:text-zinc-600 bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed">
                Next
              </span>
            `}
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-zinc-700 dark:text-zinc-300">
                Showing <span class="font-medium">${pagination.startItem}</span> to <span class="font-medium">${pagination.endItem}</span> of{' '}
                <span class="font-medium">${pagination.totalItems}</span> results
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                ${pagination.currentPage > 1 ? `
                  <a
                    href="${pagination.baseUrl}?${new URLSearchParams({ ...filters, page: (pagination.currentPage - 1).toString() }).toString()}"
                    class="relative inline-flex items-center px-2 py-2 rounded-l-lg bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 transition-colors"
                  >
                    <span class="sr-only">Previous</span>
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </a>
                ` : ""}

                ${Array.from({ length: Math.min(10, pagination.totalPages) }, (_, i) => {
    const page = Math.max(1, Math.min(pagination.totalPages - 9, pagination.currentPage - 5)) + i;
    if (page > pagination.totalPages) return "";
    return `
                    <a
                      href="${pagination.baseUrl}?${new URLSearchParams({ ...filters, page: page.toString() }).toString()}"
                      class="relative inline-flex items-center px-4 py-2 text-sm font-medium ring-1 ring-inset transition-colors ${page === pagination.currentPage ? "z-10 bg-cyan-50 dark:bg-cyan-900/20 ring-cyan-600 dark:ring-cyan-400 text-cyan-600 dark:text-cyan-400" : "bg-white dark:bg-zinc-800 ring-zinc-950/10 dark:ring-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700"}"
                    >
                      ${page}
                    </a>
                  `;
  }).join("")}

                ${pagination.currentPage < pagination.totalPages ? `
                  <a
                    href="${pagination.baseUrl}?${new URLSearchParams({ ...filters, page: (pagination.currentPage + 1).toString() }).toString()}"
                    class="relative inline-flex items-center px-2 py-2 rounded-r-lg bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 transition-colors"
                  >
                    <span class="sr-only">Next</span>
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    </svg>
                  </a>
                ` : ""}
              </nav>
            </div>
          </div>
        </div>
      ` : ""}
    </div>
  `;
  const layoutData = {
    title: "System Logs",
    pageTitle: "System Logs",
    currentPath: "/admin/logs",
    user,
    content
  };
  return chunk4IO5UBHK_cjs.renderAdminLayoutCatalyst(layoutData);
}
function renderLogDetailsPage(data) {
  const { log, user } = data;
  const content = html.html`
    <div class="px-4 sm:px-6 lg:px-8">
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <nav class="mb-4">
            <a href="/admin/logs" class="text-indigo-600 hover:text-indigo-900">
              ← Back to Logs
            </a>
          </nav>
          <h1 class="text-2xl font-semibold text-gray-900">Log Details</h1>
          <p class="mt-2 text-sm text-gray-700">
            Detailed information for log entry ${log.id}
          </p>
        </div>
      </div>

      <div class="mt-6 bg-white shadow rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-medium text-gray-900">Log Entry Information</h2>
            <div class="flex items-center space-x-2">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.levelClass}">
                ${log.level}
              </span>
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.categoryClass}">
                ${log.category}
              </span>
            </div>
          </div>
        </div>
        
        <div class="px-6 py-4">
          <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt class="text-sm font-medium text-gray-500">ID</dt>
              <dd class="mt-1 text-sm text-gray-900 font-mono">${log.id}</dd>
            </div>
            
            <div>
              <dt class="text-sm font-medium text-gray-500">Timestamp</dt>
              <dd class="mt-1 text-sm text-gray-900">${log.formattedDate}</dd>
            </div>
            
            <div>
              <dt class="text-sm font-medium text-gray-500">Level</dt>
              <dd class="mt-1">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.levelClass}">
                  ${log.level}
                </span>
              </dd>
            </div>
            
            <div>
              <dt class="text-sm font-medium text-gray-500">Category</dt>
              <dd class="mt-1">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.categoryClass}">
                  ${log.category}
                </span>
              </dd>
            </div>
            
            ${log.source ? html.html`
              <div>
                <dt class="text-sm font-medium text-gray-500">Source</dt>
                <dd class="mt-1 text-sm text-gray-900">${log.source}</dd>
              </div>
            ` : ""}
            
            ${log.userId ? html.html`
              <div>
                <dt class="text-sm font-medium text-gray-500">User ID</dt>
                <dd class="mt-1 text-sm text-gray-900 font-mono">${log.userId}</dd>
              </div>
            ` : ""}
            
            ${log.sessionId ? html.html`
              <div>
                <dt class="text-sm font-medium text-gray-500">Session ID</dt>
                <dd class="mt-1 text-sm text-gray-900 font-mono">${log.sessionId}</dd>
              </div>
            ` : ""}
            
            ${log.requestId ? html.html`
              <div>
                <dt class="text-sm font-medium text-gray-500">Request ID</dt>
                <dd class="mt-1 text-sm text-gray-900 font-mono">${log.requestId}</dd>
              </div>
            ` : ""}
            
            ${log.ipAddress ? html.html`
              <div>
                <dt class="text-sm font-medium text-gray-500">IP Address</dt>
                <dd class="mt-1 text-sm text-gray-900">${log.ipAddress}</dd>
              </div>
            ` : ""}
            
            ${log.method && log.url ? html.html`
              <div class="sm:col-span-2">
                <dt class="text-sm font-medium text-gray-500">HTTP Request</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  <span class="font-medium">${log.method}</span> ${log.url}
                  ${log.statusCode ? html.html`<span class="ml-2 text-gray-500">(${log.statusCode})</span>` : ""}
                </dd>
              </div>
            ` : ""}
            
            ${log.duration ? html.html`
              <div>
                <dt class="text-sm font-medium text-gray-500">Duration</dt>
                <dd class="mt-1 text-sm text-gray-900">${log.formattedDuration}</dd>
              </div>
            ` : ""}
            
            ${log.userAgent ? html.html`
              <div class="sm:col-span-2">
                <dt class="text-sm font-medium text-gray-500">User Agent</dt>
                <dd class="mt-1 text-sm text-gray-900 break-all">${log.userAgent}</dd>
              </div>
            ` : ""}
          </dl>
        </div>
      </div>

      <!-- Message -->
      <div class="mt-6 bg-white shadow rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Message</h3>
        </div>
        <div class="px-6 py-4">
          <div class="text-sm text-gray-900 whitespace-pre-wrap break-words">
            ${log.message}
          </div>
        </div>
      </div>

      <!-- Tags -->
      ${log.tags && log.tags.length > 0 ? html.html`
        <div class="mt-6 bg-white shadow rounded-lg overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Tags</h3>
          </div>
          <div class="px-6 py-4">
            <div class="flex flex-wrap gap-2">
              ${log.tags.map((tag) => html.html`
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  ${tag}
                </span>
              `).join("")}
            </div>
          </div>
        </div>
      ` : ""}

      <!-- Additional Data -->
      ${log.data ? html.html`
        <div class="mt-6 bg-white shadow rounded-lg overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Additional Data</h3>
          </div>
          <div class="px-6 py-4">
            <pre class="text-sm text-gray-900 bg-gray-50 rounded-md p-4 overflow-x-auto"><code>${JSON.stringify(log.data, null, 2)}</code></pre>
          </div>
        </div>
      ` : ""}

      <!-- Stack Trace -->
      ${log.stackTrace ? html.html`
        <div class="mt-6 bg-white shadow rounded-lg overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Stack Trace</h3>
          </div>
          <div class="px-6 py-4">
            <pre class="text-sm text-gray-900 bg-gray-50 rounded-md p-4 overflow-x-auto whitespace-pre-wrap"><code>${log.stackTrace}</code></pre>
          </div>
        </div>
      ` : ""}

      <!-- Actions -->
      <div class="mt-6 flex justify-between">
        <a
          href="/admin/logs"
          class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          ← Back to Logs
        </a>
        
        <div class="flex space-x-3">
          ${log.level === "error" || log.level === "fatal" ? html.html`
            <button
              type="button"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              onclick="alert('Error reporting functionality would be implemented here')"
            >
              Report Issue
            </button>
          ` : ""}
          
          <button
            type="button"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onclick="navigator.clipboard.writeText(JSON.stringify(${JSON.stringify(log)}, null, 2)).then(() => alert('Log details copied to clipboard'))"
          >
            Copy Details
          </button>
        </div>
      </div>
    </div>
  `;
  return chunkH6HP2MEA_cjs.adminLayoutV2({
    title: `Log Details - ${log.id}`,
    user,
    content
  });
}
function renderLogConfigPage(data) {
  const { configs, user } = data;
  const content = html.html`
    <div class="px-4 sm:px-6 lg:px-8">
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <nav class="mb-4">
            <a href="/admin/logs" class="text-indigo-600 hover:text-indigo-900">
              ← Back to Logs
            </a>
          </nav>
          <h1 class="text-2xl font-semibold text-gray-900">Log Configuration</h1>
          <p class="mt-2 text-sm text-gray-700">
            Configure logging settings for different categories and manage log retention policies.
          </p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            hx-post="/admin/logs/cleanup"
            hx-confirm="Are you sure you want to run log cleanup? This will permanently delete old logs based on retention policies."
            hx-target="#cleanup-result"
            class="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Run Cleanup
          </button>
        </div>
      </div>

      <div id="cleanup-result" class="mt-4"></div>

      <!-- Log Levels Reference -->
      <div class="mt-6 bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">Log Levels Reference</h2>
        </div>
        <div class="px-6 py-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div class="text-center">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                debug
              </span>
              <p class="mt-2 text-xs text-gray-500">Detailed diagnostic information</p>
            </div>
            <div class="text-center">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                info
              </span>
              <p class="mt-2 text-xs text-gray-500">General information messages</p>
            </div>
            <div class="text-center">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                warn
              </span>
              <p class="mt-2 text-xs text-gray-500">Warning conditions</p>
            </div>
            <div class="text-center">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                error
              </span>
              <p class="mt-2 text-xs text-gray-500">Error conditions</p>
            </div>
            <div class="text-center">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                fatal
              </span>
              <p class="mt-2 text-xs text-gray-500">Critical system errors</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Configuration Cards -->
      <div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        ${configs.map((config) => html.html`
          <div class="bg-white shadow rounded-lg overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-gray-900 capitalize">${config.category}</h3>
                <div class="flex items-center">
                  ${config.enabled ? html.html`
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Enabled
                    </span>
                  ` : html.html`
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Disabled
                    </span>
                  `}
                </div>
              </div>
            </div>
            
            <form hx-post="/admin/logs/config/${config.category}" hx-target="#config-result-${config.category}">
              <div class="px-6 py-4 space-y-4">
                <div class="flex gap-3">
                  <div class="flex h-6 shrink-0 items-center">
                    <div class="group grid size-4 grid-cols-1">
                      <input
                        id="enabled-${config.category}"
                        name="enabled"
                        type="checkbox"
                        ${config.enabled ? "checked" : ""}
                        class="col-start-1 row-start-1 appearance-none rounded border border-zinc-950/10 dark:border-white/10 bg-white dark:bg-white/5 checked:border-indigo-500 checked:bg-indigo-500 indeterminate:border-indigo-500 indeterminate:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-zinc-950/5 dark:disabled:border-white/5 disabled:bg-zinc-950/10 dark:disabled:bg-white/10 disabled:checked:bg-zinc-950/10 dark:disabled:checked:bg-white/10 forced-colors:appearance-auto"
                      />
                      <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-zinc-950/25 dark:group-has-[:disabled]:stroke-white/25">
                        <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:checked]:opacity-100" />
                        <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:indeterminate]:opacity-100" />
                      </svg>
                    </div>
                  </div>
                  <div class="text-sm/6">
                    <label for="enabled-${config.category}" class="font-medium text-zinc-950 dark:text-white">
                      Enable logging for this category
                    </label>
                  </div>
                </div>
                
                <div>
                  <label for="level-${config.category}" class="block text-sm font-medium text-gray-700">
                    Minimum Log Level
                  </label>
                  <select
                    id="level-${config.category}"
                    name="level"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="debug" ${config.level === "debug" ? "selected" : ""}>Debug</option>
                    <option value="info" ${config.level === "info" ? "selected" : ""}>Info</option>
                    <option value="warn" ${config.level === "warn" ? "selected" : ""}>Warning</option>
                    <option value="error" ${config.level === "error" ? "selected" : ""}>Error</option>
                    <option value="fatal" ${config.level === "fatal" ? "selected" : ""}>Fatal</option>
                  </select>
                  <p class="mt-1 text-sm text-gray-500">Only logs at this level or higher will be stored</p>
                </div>
                
                <div>
                  <label for="retention-${config.category}" class="block text-sm font-medium text-gray-700">
                    Retention Period (days)
                  </label>
                  <input
                    type="number"
                    id="retention-${config.category}"
                    name="retention"
                    value="${config.retention}"
                    min="1"
                    max="365"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <p class="mt-1 text-sm text-gray-500">Logs older than this will be deleted</p>
                </div>
                
                <div>
                  <label for="max_size-${config.category}" class="block text-sm font-medium text-gray-700">
                    Maximum Log Count
                  </label>
                  <input
                    type="number"
                    id="max_size-${config.category}"
                    name="max_size"
                    value="${config.maxSize || ""}"
                    min="100"
                    max="100000"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <p class="mt-1 text-sm text-gray-500">Maximum number of logs to keep for this category</p>
                </div>
              </div>
              
              <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div id="config-result-${config.category}" class="mb-4"></div>
                <button
                  type="submit"
                  class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Update Configuration
                </button>
              </div>
            </form>
            
            <div class="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div class="text-xs text-gray-500">
                <div>Created: ${new Date(config.createdAt).toLocaleDateString()}</div>
                <div>Updated: ${new Date(config.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        `).join("")}
      </div>

      <!-- Global Settings -->
      <div class="mt-8 bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">Global Log Settings</h2>
        </div>
        <div class="px-6 py-4">
          <div class="space-y-6">
            <div>
              <h3 class="text-base font-medium text-gray-900">Storage Information</h3>
              <div class="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="text-2xl font-bold text-gray-900">-</div>
                  <div class="text-sm text-gray-500">Total Log Entries</div>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="text-2xl font-bold text-gray-900">-</div>
                  <div class="text-sm text-gray-500">Storage Used</div>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="text-2xl font-bold text-gray-900">-</div>
                  <div class="text-sm text-gray-500">Oldest Log</div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 class="text-base font-medium text-gray-900">Log Categories</h3>
              <div class="mt-2 text-sm text-gray-600">
                <ul class="list-disc list-inside space-y-1">
                  <li><strong>auth</strong> - Authentication and authorization events</li>
                  <li><strong>api</strong> - API requests and responses</li>
                  <li><strong>workflow</strong> - Content workflow state changes</li>
                  <li><strong>plugin</strong> - Plugin-related activities</li>
                  <li><strong>media</strong> - File upload and media operations</li>
                  <li><strong>system</strong> - General system events</li>
                  <li><strong>security</strong> - Security-related events and alerts</li>
                  <li><strong>error</strong> - General error conditions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <script src="https://unpkg.com/htmx.org@1.9.6"></script>
  `;
  return chunkH6HP2MEA_cjs.adminLayoutV2({
    title: "Log Configuration",
    user,
    content
  });
}

// src/routes/admin-logs.ts
var adminLogsRoutes = new hono.Hono();
adminLogsRoutes.use("*", chunkTAYKWZ2B_cjs.requireAuth());
adminLogsRoutes.get("/", async (c) => {
  try {
    const user = c.get("user");
    const logger = chunkJUS7ZTDS_cjs.getLogger(c.env.DB);
    const query = c.req.query();
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "50");
    const level = query.level;
    const category = query.category;
    const search = query.search;
    const startDate = query.start_date;
    const endDate = query.end_date;
    const source = query.source;
    const filter = {
      limit,
      offset: (page - 1) * limit,
      sortBy: "created_at",
      sortOrder: "desc"
    };
    if (level) {
      filter.level = level.split(",");
    }
    if (category) {
      filter.category = category.split(",");
    }
    if (search) {
      filter.search = search;
    }
    if (startDate) {
      filter.startDate = new Date(startDate);
    }
    if (endDate) {
      filter.endDate = new Date(endDate);
    }
    if (source) {
      filter.source = source;
    }
    const { logs, total } = await logger.getLogs(filter);
    const formattedLogs = logs.map((log) => ({
      ...log,
      data: log.data ? JSON.parse(log.data) : null,
      tags: log.tags ? JSON.parse(log.tags) : [],
      formattedDate: new Date(log.createdAt).toLocaleString(),
      formattedDuration: log.duration ? `${log.duration}ms` : null,
      levelClass: getLevelClass(log.level),
      categoryClass: getCategoryClass(log.category)
    }));
    const totalPages = Math.ceil(total / limit);
    const pageData = {
      logs: formattedLogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        startItem: (page - 1) * limit + 1,
        endItem: Math.min(page * limit, total),
        baseUrl: "/admin/logs"
      },
      filters: {
        level: level || "",
        category: category || "",
        search: search || "",
        startDate: startDate || "",
        endDate: endDate || "",
        source: source || ""
      },
      user: user ? {
        name: user.email,
        email: user.email,
        role: user.role
      } : void 0
    };
    return c.html(renderLogsListPage(pageData));
  } catch (error) {
    console.error("Error fetching logs:", error);
    return c.html(html.html`<p>Error loading logs: ${error}</p>`);
  }
});
adminLogsRoutes.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    const logger = chunkJUS7ZTDS_cjs.getLogger(c.env.DB);
    const { logs } = await logger.getLogs({
      limit: 1,
      offset: 0,
      search: id
      // Using search to find by ID - this is a simplification
    });
    const log = logs.find((l) => l.id === id);
    if (!log) {
      return c.html(html.html`<p>Log entry not found</p>`);
    }
    const formattedLog = {
      ...log,
      data: log.data ? JSON.parse(log.data) : null,
      tags: log.tags ? JSON.parse(log.tags) : [],
      formattedDate: new Date(log.createdAt).toLocaleString(),
      formattedDuration: log.duration ? `${log.duration}ms` : null,
      levelClass: getLevelClass(log.level),
      categoryClass: getCategoryClass(log.category)
    };
    const pageData = {
      log: formattedLog,
      user: user ? {
        name: user.email,
        email: user.email,
        role: user.role
      } : void 0
    };
    return c.html(renderLogDetailsPage(pageData));
  } catch (error) {
    console.error("Error fetching log details:", error);
    return c.html(html.html`<p>Error loading log details: ${error}</p>`);
  }
});
adminLogsRoutes.get("/config", async (c) => {
  try {
    const user = c.get("user");
    const logger = chunkJUS7ZTDS_cjs.getLogger(c.env.DB);
    const configs = await logger.getAllConfigs();
    const pageData = {
      configs,
      user: user ? {
        name: user.email,
        email: user.email,
        role: user.role
      } : void 0
    };
    return c.html(renderLogConfigPage(pageData));
  } catch (error) {
    console.error("Error fetching log config:", error);
    return c.html(html.html`<p>Error loading log configuration: ${error}</p>`);
  }
});
adminLogsRoutes.post("/config/:category", async (c) => {
  try {
    const category = c.req.param("category");
    const formData = await c.req.formData();
    const enabled = formData.get("enabled") === "on";
    const level = formData.get("level");
    const retention = parseInt(formData.get("retention"));
    const maxSize = parseInt(formData.get("max_size"));
    const logger = chunkJUS7ZTDS_cjs.getLogger(c.env.DB);
    await logger.updateConfig(category, {
      enabled,
      level,
      retention,
      maxSize
    });
    return c.html(html.html`
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        Configuration updated successfully!
      </div>
    `);
  } catch (error) {
    console.error("Error updating log config:", error);
    return c.html(html.html`
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Failed to update configuration. Please try again.
      </div>
    `);
  }
});
adminLogsRoutes.get("/export", async (c) => {
  try {
    const query = c.req.query();
    const format = query.format || "csv";
    const level = query.level;
    const category = query.category;
    const startDate = query.start_date;
    const endDate = query.end_date;
    const logger = chunkJUS7ZTDS_cjs.getLogger(c.env.DB);
    const filter = {
      limit: 1e4,
      // Export up to 10k logs
      offset: 0,
      sortBy: "created_at",
      sortOrder: "desc"
    };
    if (level) {
      filter.level = level.split(",");
    }
    if (category) {
      filter.category = category.split(",");
    }
    if (startDate) {
      filter.startDate = new Date(startDate);
    }
    if (endDate) {
      filter.endDate = new Date(endDate);
    }
    const { logs } = await logger.getLogs(filter);
    if (format === "json") {
      return c.json(logs, 200, {
        "Content-Disposition": 'attachment; filename="logs-export.json"'
      });
    } else {
      const headers = [
        "ID",
        "Level",
        "Category",
        "Message",
        "Source",
        "User ID",
        "IP Address",
        "Method",
        "URL",
        "Status Code",
        "Duration",
        "Created At"
      ];
      const csvRows = [headers.join(",")];
      logs.forEach((log) => {
        const row = [
          log.id,
          log.level,
          log.category,
          `"${log.message.replace(/"/g, '""')}"`,
          // Escape quotes
          log.source || "",
          log.userId || "",
          log.ipAddress || "",
          log.method || "",
          log.url || "",
          log.statusCode || "",
          log.duration || "",
          new Date(log.createdAt).toISOString()
        ];
        csvRows.push(row.join(","));
      });
      const csv = csvRows.join("\n");
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="logs-export.csv"'
        }
      });
    }
  } catch (error) {
    console.error("Error exporting logs:", error);
    return c.json({ error: "Failed to export logs" }, 500);
  }
});
adminLogsRoutes.post("/cleanup", async (c) => {
  try {
    const user = c.get("user");
    if (!user || user.role !== "admin") {
      return c.json({
        success: false,
        error: "Unauthorized. Admin access required."
      }, 403);
    }
    const logger = chunkJUS7ZTDS_cjs.getLogger(c.env.DB);
    await logger.cleanupByRetention();
    return c.html(html.html`
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        Log cleanup completed successfully!
      </div>
    `);
  } catch (error) {
    console.error("Error cleaning up logs:", error);
    return c.html(html.html`
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Failed to clean up logs. Please try again.
      </div>
    `);
  }
});
adminLogsRoutes.post("/search", async (c) => {
  try {
    const formData = await c.req.formData();
    const search = formData.get("search");
    const level = formData.get("level");
    const category = formData.get("category");
    const logger = chunkJUS7ZTDS_cjs.getLogger(c.env.DB);
    const filter = {
      limit: 20,
      offset: 0,
      sortBy: "created_at",
      sortOrder: "desc"
    };
    if (search) filter.search = search;
    if (level) filter.level = [level];
    if (category) filter.category = [category];
    const { logs } = await logger.getLogs(filter);
    const rows = logs.map((log) => {
      const formattedLog = {
        ...log,
        formattedDate: new Date(log.createdAt).toLocaleString(),
        levelClass: getLevelClass(log.level),
        categoryClass: getCategoryClass(log.category)
      };
      return `
        <tr class="hover:bg-gray-50">
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${formattedLog.levelClass}">
              ${formattedLog.level}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${formattedLog.categoryClass}">
              ${formattedLog.category}
            </span>
          </td>
          <td class="px-6 py-4">
            <div class="text-sm text-gray-900 max-w-md truncate">${formattedLog.message}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formattedLog.source || "-"}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formattedLog.formattedDate}</td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <a href="/admin/logs/${formattedLog.id}" class="text-indigo-600 hover:text-indigo-900">View</a>
          </td>
        </tr>
      `;
    }).join("");
    return c.html(rows);
  } catch (error) {
    console.error("Error searching logs:", error);
    return c.html(html.html`<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Error searching logs</td></tr>`);
  }
});
function getLevelClass(level) {
  switch (level) {
    case "debug":
      return "bg-gray-100 text-gray-800";
    case "info":
      return "bg-blue-100 text-blue-800";
    case "warn":
      return "bg-yellow-100 text-yellow-800";
    case "error":
      return "bg-red-100 text-red-800";
    case "fatal":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
function getCategoryClass(category) {
  switch (category) {
    case "auth":
      return "bg-green-100 text-green-800";
    case "api":
      return "bg-blue-100 text-blue-800";
    case "workflow":
      return "bg-purple-100 text-purple-800";
    case "plugin":
      return "bg-indigo-100 text-indigo-800";
    case "media":
      return "bg-pink-100 text-pink-800";
    case "system":
      return "bg-gray-100 text-gray-800";
    case "security":
      return "bg-red-100 text-red-800";
    case "error":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// src/templates/pages/admin-dashboard.template.ts
function renderDashboardPage(data) {
  const pageContent = `
    <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl/8 font-semibold text-zinc-950 dark:text-white sm:text-xl/8">Dashboard</h1>
        <p class="mt-2 text-sm/6 text-zinc-500 dark:text-zinc-400">Welcome to your WarpCMS AI admin dashboard</p>
      </div>
      <div class="mt-4 sm:mt-0 flex items-center gap-x-3">
        <a href="/admin/content/new" class="inline-flex items-center justify-center gap-x-1.5 rounded-lg bg-lime-600 dark:bg-lime-700 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-lime-700 dark:hover:bg-lime-600 transition-colors shadow-sm">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          New Content
        </a>
        <a href="/api" target="_blank" class="inline-flex items-center justify-center gap-x-1.5 rounded-lg bg-zinc-950 dark:bg-white px-3.5 py-2.5 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"/>
          </svg>
          OpenAPI
        </a>
      </div>
    </div>

    <!-- Stats Cards -->
    <div
      id="stats-container"
      class="mb-8"
      hx-get="/admin/dashboard/stats"
      hx-trigger="load"
      hx-swap="innerHTML"
    >
      ${renderStatsCardsSkeleton()}
    </div>

    <!-- Dashboard Grid -->
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-3 mb-8">
      <!-- Analytics Chart -->
      <div class="xl:col-span-2">
        ${renderAnalyticsChart()}
      </div>

      <!-- Recent Activity -->
      <div
        class="xl:col-span-1"
        id="recent-activity-container"
        hx-get="/admin/dashboard/recent-activity"
        hx-trigger="load"
        hx-swap="innerHTML"
      >
        ${renderRecentActivitySkeleton()}
      </div>
    </div>

    <!-- Secondary Grid -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Quick Actions -->
      ${renderQuickActions()}

      <!-- System Status -->
      ${renderSystemStatus()}

      <!-- Storage Usage -->
      <div id="storage-usage-container" hx-get="/admin/dashboard/storage" hx-trigger="load" hx-swap="innerHTML">
        ${renderStorageUsage()}
      </div>
    </div>

    <script>
      function refreshDashboard() {
        htmx.trigger('#stats-container', 'htmx:load');
        showNotification('Dashboard refreshed', 'success');
      }
    </script>
  `;
  const layoutData = {
    title: "Dashboard",
    pageTitle: "Dashboard",
    currentPath: "/admin",
    user: data.user,
    version: data.version,
    content: pageContent
  };
  return chunkH6HP2MEA_cjs.renderAdminLayout(layoutData);
}
function renderStatsCards(stats) {
  const cards = [
    {
      title: "Content Items",
      value: stats.contentItems.toString(),
      change: "8.2",
      isPositive: true
    },
    {
      title: "Media Files",
      value: stats.mediaFiles.toString(),
      change: "15.3",
      isPositive: true
    },
    {
      title: "Active Users",
      value: stats.users.toString(),
      change: "2.4",
      isPositive: false
    }
  ];
  const cardColors = ["text-cyan-400", "text-lime-400", "text-purple-400"];
  return `
    <div>
      <h3 class="text-base font-semibold text-zinc-950 dark:text-white">Last 30 days</h3>
      <dl class="mt-5 grid grid-cols-1 divide-zinc-950/5 dark:divide-white/10 overflow-hidden rounded-lg bg-zinc-800/75 dark:bg-zinc-800/75 ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">
        ${cards.map((card, index) => `
          <div class="px-4 py-5 sm:p-6">
            <dt class="text-base font-normal text-zinc-700 dark:text-zinc-100">${card.title}</dt>
            <dd class="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div class="flex items-baseline text-2xl font-semibold ${cardColors[index]}">
                ${card.value}
              </div>
              <div class="inline-flex items-baseline rounded-full ${card.isPositive ? "bg-lime-400/10 text-lime-600 dark:text-lime-400" : "bg-pink-400/10 text-pink-600 dark:text-pink-400"} px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0">
                <svg viewBox="0 0 20 20" fill="currentColor" class="-ml-1 mr-0.5 size-5 shrink-0 self-center">
                  ${card.isPositive ? '<path d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clip-rule="evenodd" fill-rule="evenodd" />' : '<path d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z" clip-rule="evenodd" fill-rule="evenodd" />'}
                </svg>
                <span class="sr-only">${card.isPositive ? "Increased" : "Decreased"} by</span>
                ${card.change}%
              </div>
            </dd>
          </div>
        `).join("")}
      </dl>
    </div>
  `;
}
function renderStatsCardsSkeleton() {
  return `
    <div>
      <div class="h-6 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-5"></div>
      <div class="grid grid-cols-1 divide-zinc-950/5 dark:divide-white/10 overflow-hidden rounded-lg bg-zinc-800/75 dark:bg-zinc-800/75 ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">
        ${Array(3).fill(0).map(
    () => `
            <div class="px-4 py-5 sm:p-6 animate-pulse">
              <div class="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded mb-3"></div>
              <div class="h-8 w-16 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
            </div>
          `
  ).join("")}
      </div>
    </div>
  `;
}
function renderAnalyticsChart() {
  return `
    <div class="rounded-lg bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10">
      <div class="border-b border-zinc-950/5 dark:border-white/10 px-6 py-6">
        <div class="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
          <div>
            <h3 class="text-base/7 font-semibold text-zinc-950 dark:text-white">Real-Time Analytics</h3>
            <p class="mt-1 text-sm/6 text-zinc-500 dark:text-zinc-400">Requests per second (live)</p>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-2 w-2 rounded-full bg-lime-500 animate-pulse"></div>
            <span class="text-xs text-zinc-500 dark:text-zinc-400">Live</span>
          </div>
        </div>
        <div class="mt-4 flex items-baseline gap-2">
          <span id="current-rps" class="text-4xl font-bold text-cyan-500 dark:text-cyan-400">0</span>
          <span class="text-sm text-zinc-500 dark:text-zinc-400">req/s</span>
        </div>
      </div>

      <div class="px-6 py-6">
        <canvas id="requestsChart" class="w-full" style="height: 300px;"></canvas>
      </div>

      <!-- Hidden div to trigger HTMX polling -->
      <div
        hx-get="/admin/dashboard/api/metrics"
        hx-trigger="every 1s"
        hx-swap="none"
        style="display: none;"
      ></div>
    </div>

    <script>
      // Initialize Chart.js for Real-time Requests
      (function() {
        const ctx = document.getElementById('requestsChart');
        if (!ctx) return;

        // Initialize with last 60 seconds of data (1 data point per second)
        const maxDataPoints = 60;
        const labels = [];
        const data = [];

        for (let i = maxDataPoints - 1; i >= 0; i--) {
          labels.push(\`-\${i}s\`);
          data.push(0);
        }

        const isDark = document.documentElement.classList.contains('dark');

        const chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Requests/sec',
              data: data,
              borderColor: isDark ? 'rgb(34, 211, 238)' : 'rgb(6, 182, 212)',
              backgroundColor: isDark ? 'rgba(34, 211, 238, 0.1)' : 'rgba(6, 182, 212, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointBackgroundColor: isDark ? 'rgb(34, 211, 238)' : 'rgb(6, 182, 212)',
              pointBorderColor: isDark ? 'rgb(17, 24, 39)' : 'rgb(255, 255, 255)',
              pointBorderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                backgroundColor: isDark ? 'rgb(39, 39, 42)' : 'rgb(255, 255, 255)',
                titleColor: isDark ? 'rgb(255, 255, 255)' : 'rgb(9, 9, 11)',
                bodyColor: isDark ? 'rgb(161, 161, 170)' : 'rgb(113, 113, 122)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(9, 9, 11, 0.05)',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                  label: function(context) {
                    return 'Requests/sec: ' + context.parsed.y.toFixed(2);
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                border: {
                  display: false
                },
                grid: {
                  color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  drawBorder: false
                },
                ticks: {
                  color: isDark ? 'rgb(161, 161, 170)' : 'rgb(113, 113, 122)',
                  padding: 8,
                  callback: function(value) {
                    return value.toFixed(1);
                  }
                }
              },
              x: {
                border: {
                  display: false
                },
                grid: {
                  display: false
                },
                ticks: {
                  color: isDark ? 'rgb(161, 161, 170)' : 'rgb(113, 113, 122)',
                  padding: 8,
                  maxTicksLimit: 6
                }
              }
            }
          }
        });

        // Listen for metrics updates from HTMX
        window.addEventListener('htmx:afterRequest', function(event) {
          console.log('[Dashboard] HTMX request completed:', event.detail.pathInfo.requestPath);

          if (event.detail.pathInfo.requestPath === '/admin/dashboard/api/metrics') {
            try {
              const metrics = JSON.parse(event.detail.xhr.responseText);
              console.log('[Dashboard] Metrics received:', metrics);

              // Update current RPS display
              const rpsElement = document.getElementById('current-rps');
              if (rpsElement) {
                rpsElement.textContent = metrics.requestsPerSecond.toFixed(2);
              }

              // Add new data point to chart
              chart.data.datasets[0].data.shift();
              chart.data.datasets[0].data.push(metrics.requestsPerSecond);

              // Regenerate labels to maintain -60s to now format
              const newLabels = [];
              for (let i = maxDataPoints - 1; i >= 1; i--) {
                newLabels.push(\`-\${i}s\`);
              }
              newLabels.push('now');
              chart.data.labels = newLabels;

              chart.update('none'); // Update without animation for smoother real-time updates
              console.log('[Dashboard] Chart updated with RPS:', metrics.requestsPerSecond);
            } catch (e) {
              console.error('[Dashboard] Error updating metrics:', e);
            }
          }
        });
      })();
    </script>
  `;
}
function renderRecentActivitySkeleton() {
  return `
    <div class="rounded-lg bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 animate-pulse">
      <div class="border-b border-zinc-950/5 dark:border-white/10 px-6 py-6">
        <div class="h-5 w-32 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
      </div>
      <div class="px-6 py-6">
        <div class="space-y-6">
          ${Array(3).fill(0).map(() => `
            <div class="flex gap-x-4">
              <div class="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700"></div>
              <div class="flex-auto space-y-2">
                <div class="h-4 w-48 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
                <div class="h-3 w-32 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}
function renderRecentActivity(activities) {
  const getInitials = (user) => {
    const parts = user.split(" ").filter((p) => p.length > 0);
    if (parts.length >= 2) {
      const first = parts[0]?.[0] || "";
      const second = parts[1]?.[0] || "";
      return (first + second).toUpperCase();
    }
    return user.substring(0, 2).toUpperCase();
  };
  const getRelativeTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = /* @__PURE__ */ new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 6e4);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };
  const getColorClasses = (type) => {
    switch (type) {
      case "content":
        return {
          bgColor: "bg-lime-500/10 dark:bg-lime-400/10",
          textColor: "text-lime-700 dark:text-lime-300"
        };
      case "media":
        return {
          bgColor: "bg-cyan-500/10 dark:bg-cyan-400/10",
          textColor: "text-cyan-700 dark:text-cyan-300"
        };
      case "user":
        return {
          bgColor: "bg-pink-500/10 dark:bg-pink-400/10",
          textColor: "text-pink-700 dark:text-pink-300"
        };
      default:
        return {
          bgColor: "bg-gray-500/10 dark:bg-gray-400/10",
          textColor: "text-gray-700 dark:text-gray-300"
        };
    }
  };
  const formattedActivities = (activities || []).map((activity) => {
    const colors = getColorClasses(activity.type);
    return {
      ...activity,
      initials: getInitials(activity.user),
      time: getRelativeTime(activity.timestamp),
      ...colors
    };
  });
  if (formattedActivities.length === 0) {
    formattedActivities.push({
      type: "content",
      description: "No recent activity",
      user: "System",
      time: "",
      initials: "SY",
      bgColor: "bg-gray-500/10 dark:bg-gray-400/10",
      textColor: "text-gray-700 dark:text-gray-300",
      id: "0",
      action: "",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  return `
    <div class="rounded-lg bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10">
      <div class="border-b border-zinc-950/5 dark:border-white/10 px-6 py-6">
        <div class="flex items-center justify-between">
          <h3 class="text-base/7 font-semibold text-zinc-950 dark:text-white">Recent Activity</h3>
          <button class="text-xs/5 font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 transition-colors">
            View all
          </button>
        </div>
      </div>

      <div class="px-6 py-6">
        <ul role="list" class="space-y-6">
          ${formattedActivities.map(
    (activity) => `
            <li class="relative flex gap-x-4">
              <div class="flex h-10 w-10 flex-none items-center justify-center rounded-full ${activity.bgColor}">
                <span class="text-xs font-semibold ${activity.textColor}">${activity.initials}</span>
              </div>
              <div class="flex-auto">
                <p class="text-sm/6 font-medium text-zinc-950 dark:text-white">${activity.description}</p>
                <p class="mt-1 text-xs/5 text-zinc-500 dark:text-zinc-400">
                  <span class="font-medium text-zinc-950 dark:text-white">${activity.user}</span>
                  <span class="text-zinc-400 dark:text-zinc-500"> \xB7 </span>
                  ${activity.time}
                </p>
              </div>
            </li>
          `
  ).join("")}
        </ul>
      </div>
    </div>
  `;
}
function renderQuickActions() {
  const actions = [
    {
      title: "New Image",
      description: "Upload and manage images",
      href: "/admin/content/new?type=image",
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>`
    },
    {
      title: "New Text",
      description: "Create plain text content",
      href: "/admin/content/new?type=text",
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/>
      </svg>`
    },
    {
      title: "New HTML",
      description: "Create rich HTML content",
      href: "/admin/content/new?type=html",
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
      </svg>`
    },
    {
      title: "Manage Users",
      description: "Add or edit user accounts",
      href: "/admin/users",
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
      </svg>`
    }
  ];
  return `
    <div class="rounded-lg bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10">
      <div class="border-b border-zinc-950/5 dark:border-white/10 px-6 py-6">
        <h3 class="text-base/7 font-semibold text-zinc-950 dark:text-white">Quick Actions</h3>
      </div>

      <div class="p-6">
        <div class="space-y-2">
          ${actions.map(
    (action) => `
            <a href="${action.href}" class="group flex items-center gap-x-3 rounded-lg px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
              <div class="flex h-10 w-10 flex-none items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-400">
                ${action.icon}
              </div>
              <div class="flex-auto">
                <p class="text-sm/6 font-medium text-zinc-950 dark:text-white">${action.title}</p>
                <p class="text-xs/5 text-zinc-500 dark:text-zinc-400">${action.description}</p>
              </div>
              <svg class="h-5 w-5 flex-none text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
              </svg>
            </a>
          `
  ).join("")}
        </div>
      </div>
    </div>
  `;
}
function renderSystemStatus() {
  return `
    <div class="rounded-lg bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 overflow-hidden">
      <div class="border-b border-zinc-950/5 dark:border-white/10 px-6 py-6">
        <div class="flex items-center justify-between">
          <h3 class="text-base/7 font-semibold text-zinc-950 dark:text-white">System Status</h3>
          <div class="flex items-center gap-2">
            <div class="h-2 w-2 rounded-full bg-lime-500 animate-pulse"></div>
            <span class="text-xs text-zinc-500 dark:text-zinc-400">Live</span>
          </div>
        </div>
      </div>

      <div
        id="system-status-container"
        class="p-6"
        hx-get="/admin/dashboard/system-status"
        hx-trigger="load, every 30s"
        hx-swap="innerHTML"
      >
        <!-- Loading skeleton with gradient -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          ${[
    { color: "from-blue-500/20 to-cyan-500/20", darkColor: "dark:from-blue-500/10 dark:to-cyan-500/10" },
    { color: "from-purple-500/20 to-pink-500/20", darkColor: "dark:from-purple-500/10 dark:to-pink-500/10" },
    { color: "from-amber-500/20 to-orange-500/20", darkColor: "dark:from-amber-500/10 dark:to-orange-500/10" },
    { color: "from-lime-500/20 to-emerald-500/20", darkColor: "dark:from-lime-500/10 dark:to-emerald-500/10" }
  ].map((gradient, i) => `
            <div class="relative group">
              <div class="absolute inset-0 bg-gradient-to-br ${gradient.color} ${gradient.darkColor} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div class="relative bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-5 border border-zinc-200/50 dark:border-zinc-700/50 animate-pulse">
                <div class="flex items-center justify-between mb-3">
                  <div class="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
                  <div class="h-6 w-6 bg-zinc-200 dark:bg-zinc-700 rounded-full"></div>
                </div>
                <div class="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>

    <style>
      @keyframes ping-slow {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .animate-ping-slow {
        animation: ping-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
    </style>
  `;
}
function renderStorageUsage(databaseSizeBytes, mediaSizeBytes) {
  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };
  const dbSizeGB = databaseSizeBytes ? databaseSizeBytes / 1024 ** 3 : 0;
  const dbMaxGB = 10;
  const dbPercentageRaw = dbSizeGB / dbMaxGB * 100;
  const dbPercentage = Math.min(Math.max(dbPercentageRaw, 0.5), 100);
  const dbUsedFormatted = databaseSizeBytes ? formatBytes(databaseSizeBytes) : "Unknown";
  const mediaUsedFormatted = mediaSizeBytes ? formatBytes(mediaSizeBytes) : "0 B";
  const storageItems = [
    {
      label: "Database",
      used: dbUsedFormatted,
      total: "10 GB",
      percentage: dbPercentage,
      color: dbPercentage > 80 ? "bg-red-500 dark:bg-red-400" : dbPercentage > 60 ? "bg-amber-500 dark:bg-amber-400" : "bg-cyan-500 dark:bg-cyan-400"
    },
    {
      label: "Media Files",
      used: mediaUsedFormatted,
      total: "\u221E",
      percentage: 0,
      color: "bg-lime-500 dark:bg-lime-400",
      note: "Stored in R2"
    },
    {
      label: "Cache (KV)",
      used: "N/A",
      total: "\u221E",
      percentage: 0,
      color: "bg-purple-500 dark:bg-purple-400",
      note: "Unlimited"
    }
  ];
  return `
    <div class="rounded-lg bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10">
      <div class="border-b border-zinc-950/5 dark:border-white/10 px-6 py-6">
        <h3 class="text-base/7 font-semibold text-zinc-950 dark:text-white">Storage Usage</h3>
      </div>

      <div class="px-6 py-6">
        <dl class="space-y-6">
          ${storageItems.map(
    (item) => `
            <div>
              <div class="flex items-center justify-between mb-2">
                <dt class="text-sm/6 text-zinc-500 dark:text-zinc-400">
                  ${item.label}
                  ${item.note ? `<span class="ml-2 text-xs text-zinc-400 dark:text-zinc-500">(${item.note})</span>` : ""}
                </dt>
                <dd class="text-sm/6 font-medium text-zinc-950 dark:text-white">${item.used} / ${item.total}</dd>
              </div>
              <div class="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div class="${item.color} h-full rounded-full transition-all duration-300" style="width: ${item.percentage}%"></div>
              </div>
            </div>
          `
  ).join("")}
        </dl>
      </div>
    </div>
  `;
}

// src/routes/admin-dashboard.ts
var VERSION = chunkJLNQTGWQ_cjs.getCoreVersion();
var router = new hono.Hono();
router.use("*", chunkTAYKWZ2B_cjs.requireAuth());
router.get("/", async (c) => {
  const user = c.get("user");
  try {
    const pageData = {
      user: {
        name: user.email.split("@")[0] || user.email,
        email: user.email,
        role: user.role
      },
      version: VERSION
    };
    return c.html(renderDashboardPage(pageData));
  } catch (error) {
    console.error("Dashboard error:", error);
    const pageData = {
      user: {
        name: user.email,
        email: user.email,
        role: user.role
      },
      version: VERSION
    };
    return c.html(renderDashboardPage(pageData));
  }
});
router.get("/stats", async (c) => {
  try {
    const db = c.env.DB;
    let contentCount = 0;
    try {
      const contentStmt = db.prepare("SELECT COUNT(*) as count FROM content");
      const contentResult = await contentStmt.first();
      contentCount = contentResult?.count || 0;
    } catch (error) {
      console.error("Error fetching content count:", error);
    }
    let mediaCount = 0;
    let mediaSize = 0;
    try {
      const mediaStmt = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(size), 0) as total_size FROM media WHERE deleted_at IS NULL");
      const mediaResult = await mediaStmt.first();
      mediaCount = mediaResult?.count || 0;
      mediaSize = mediaResult?.total_size || 0;
    } catch (error) {
      console.error("Error fetching media count:", error);
    }
    let usersCount = 0;
    try {
      const usersStmt = db.prepare("SELECT COUNT(*) as count FROM users WHERE is_active = 1");
      const usersResult = await usersStmt.first();
      usersCount = usersResult?.count || 0;
    } catch (error) {
      console.error("Error fetching users count:", error);
    }
    const html6 = renderStatsCards({
      contentItems: contentCount,
      mediaFiles: mediaCount,
      users: usersCount,
      mediaSize
    });
    return c.html(html6);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return c.html('<div class="text-red-500">Failed to load statistics</div>');
  }
});
router.get("/storage", async (c) => {
  try {
    const db = c.env.DB;
    let databaseSize = 0;
    try {
      const result = await db.prepare("SELECT 1").run();
      databaseSize = result?.meta?.size_after || 0;
    } catch (error) {
      console.error("Error fetching database size:", error);
    }
    let mediaSize = 0;
    try {
      const mediaStmt = db.prepare("SELECT COALESCE(SUM(size), 0) as total_size FROM media WHERE deleted_at IS NULL");
      const mediaResult = await mediaStmt.first();
      mediaSize = mediaResult?.total_size || 0;
    } catch (error) {
      console.error("Error fetching media size:", error);
    }
    const html6 = renderStorageUsage(databaseSize, mediaSize);
    return c.html(html6);
  } catch (error) {
    console.error("Error fetching storage usage:", error);
    return c.html('<div class="text-red-500">Failed to load storage information</div>');
  }
});
router.get("/recent-activity", async (c) => {
  try {
    const db = c.env.DB;
    const limit = parseInt(c.req.query("limit") || "5");
    const activityStmt = db.prepare(`
      SELECT
        a.id,
        a.action,
        a.resource_type,
        a.resource_id,
        a.details,
        a.created_at,
        u.email,
        u.first_name,
        u.last_name
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.resource_type IN ('content', 'users', 'media')
      ORDER BY a.created_at DESC
      LIMIT ?
    `);
    const { results } = await activityStmt.bind(limit).all();
    const activities = (results || []).map((row) => {
      const userName = row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : row.email || "System";
      let description = "";
      if (row.action === "create") {
        description = `Created new ${row.resource_type}`;
      } else if (row.action === "update") {
        description = `Updated ${row.resource_type}`;
      } else if (row.action === "delete") {
        description = `Deleted ${row.resource_type}`;
      } else {
        description = `${row.action} ${row.resource_type}`;
      }
      return {
        id: row.id,
        type: row.resource_type,
        action: row.action,
        description,
        timestamp: new Date(Number(row.created_at)).toISOString(),
        user: userName
      };
    });
    const html6 = renderRecentActivity(activities);
    return c.html(html6);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    const html6 = renderRecentActivity([]);
    return c.html(html6);
  }
});
router.get("/api/metrics", async (c) => {
  return c.json({
    requestsPerSecond: chunkRCQ2HIQD_cjs.metricsTracker.getRequestsPerSecond(),
    totalRequests: chunkRCQ2HIQD_cjs.metricsTracker.getTotalRequests(),
    averageRPS: Number(chunkRCQ2HIQD_cjs.metricsTracker.getAverageRPS().toFixed(2)),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
router.get("/system-status", async (c) => {
  try {
    const html6 = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="relative group">
          <div class="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 dark:from-blue-500/10 dark:to-cyan-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div class="relative bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-5 border border-zinc-200/50 dark:border-zinc-700/50">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-zinc-600 dark:text-zinc-400">API Status</span>
              <svg class="w-6 h-6 text-lime-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
            </div>
            <p class="text-xs text-zinc-500 dark:text-zinc-400">Operational</p>
          </div>
        </div>

        <div class="relative group">
          <div class="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-500/10 dark:to-pink-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div class="relative bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-5 border border-zinc-200/50 dark:border-zinc-700/50">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-zinc-600 dark:text-zinc-400">Database</span>
              <svg class="w-6 h-6 text-lime-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
            </div>
            <p class="text-xs text-zinc-500 dark:text-zinc-400">Connected</p>
          </div>
        </div>

        <div class="relative group">
          <div class="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 dark:from-amber-500/10 dark:to-orange-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div class="relative bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-5 border border-zinc-200/50 dark:border-zinc-700/50">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-zinc-600 dark:text-zinc-400">R2 Storage</span>
              <svg class="w-6 h-6 text-lime-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
            </div>
            <p class="text-xs text-zinc-500 dark:text-zinc-400">Available</p>
          </div>
        </div>

        <div class="relative group">
          <div class="absolute inset-0 bg-gradient-to-br from-lime-500/20 to-emerald-500/20 dark:from-lime-500/10 dark:to-emerald-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div class="relative bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-5 border border-zinc-200/50 dark:border-zinc-700/50">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-zinc-600 dark:text-zinc-400">KV Cache</span>
              <svg class="w-6 h-6 text-lime-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
            </div>
            <p class="text-xs text-zinc-500 dark:text-zinc-400">Ready</p>
          </div>
        </div>
      </div>
    `;
    return c.html(html6);
  } catch (error) {
    console.error("Error fetching system status:", error);
    return c.html('<div class="text-red-500">Failed to load system status</div>');
  }
});

// src/templates/pages/admin-settings.template.ts
chunk4IO5UBHK_cjs.init_admin_layout_catalyst_template();
function renderSettingsPage(data) {
  const activeTab = data.activeTab || "general";
  const pageContent = `
    <div>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 class="text-2xl/8 font-semibold text-zinc-950 dark:text-white sm:text-xl/8">Settings</h1>
          <p class="mt-2 text-sm/6 text-zinc-500 dark:text-zinc-400">Manage your application settings and preferences</p>
        </div>
      </div>

      <!-- Settings Navigation Tabs -->
      <div class="rounded-xl bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 mb-6 overflow-hidden">
        <div class="border-b border-zinc-950/5 dark:border-white/10">
          <nav class="flex overflow-x-auto" role="tablist">
            ${renderTabButton("general", "General", "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", activeTab)}
            ${renderTabButton("appearance", "Appearance", "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z", activeTab)}
            ${renderTabButton("security", "Security", "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", activeTab)}
            ${renderTabButton("notifications", "Notifications", "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9", activeTab)}
            ${renderTabButton("storage", "Storage", "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12", activeTab)}
            ${renderTabButton("migrations", "Migrations", "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4", activeTab)}
            ${renderTabButton("database-tools", "Database Tools", "M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01", activeTab)}
          </nav>
        </div>
      </div>

      <!-- Settings Content -->
      <div class="rounded-xl bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10">
        <div id="settings-content" class="p-8">
          ${renderTabContent(activeTab, data.settings)}
        </div>
      </div>
    </div>

    <script>
      // Initialize tab-specific features on page load
      const currentTab = '${activeTab}';

      async function saveGeneralSettings() {
        // Collect all form data from general settings
        const formData = new FormData();

        // Get all form inputs in the settings content area
        document.querySelectorAll('#settings-content input, #settings-content select, #settings-content textarea').forEach(input => {
          if (input.type === 'checkbox') {
            formData.append(input.name, input.checked ? 'true' : 'false');
          } else if (input.name) {
            formData.append(input.name, input.value);
          }
        });

        // Show loading state
        const saveBtn = document.querySelector('button[onclick="saveGeneralSettings()"]');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<svg class="animate-spin -ml-0.5 mr-1.5 h-5 w-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>Saving...';
        saveBtn.disabled = true;

        try {
          const response = await fetch('/admin/settings/general', {
            method: 'POST',
            body: formData
          });

          const result = await response.json();

          if (result.success) {
            showNotification(result.message || 'Settings saved successfully!', 'success');
          } else {
            showNotification(result.error || 'Failed to save settings', 'error');
          }
        } catch (error) {
          console.error('Error saving settings:', error);
          showNotification('Failed to save settings. Please try again.', 'error');
        } finally {
          saveBtn.innerHTML = originalText;
          saveBtn.disabled = false;
        }
      }

      // Migration functions
      window.refreshMigrationStatus = async function() {
        try {
          const response = await fetch('/admin/settings/api/migrations/status');
          const result = await response.json();
          
          if (result.success) {
            updateMigrationUI(result.data);
          } else {
            console.error('Failed to refresh migration status');
          }
        } catch (error) {
          console.error('Error loading migration status:', error);
        }
      };

      window.runPendingMigrations = async function() {
        const btn = document.getElementById('run-migrations-btn');
        if (!btn || btn.disabled) return;

        showConfirmDialog('run-migrations-confirm');
      };

      window.performRunMigrations = async function() {
        const btn = document.getElementById('run-migrations-btn');
        if (!btn) return;

        btn.disabled = true;
        btn.innerHTML = 'Running...';

        try {
          const response = await fetch('/admin/settings/api/migrations/run', {
            method: 'POST'
          });
          const result = await response.json();

          if (result.success) {
            alert(result.message);
            setTimeout(() => window.refreshMigrationStatus(), 1000);
          } else {
            alert(result.error || 'Failed to run migrations');
          }
        } catch (error) {
          alert('Error running migrations');
        } finally {
          btn.disabled = false;
          btn.innerHTML = 'Run Pending';
        }
      };

      window.validateSchema = async function() {
        try {
          const response = await fetch('/admin/settings/api/migrations/validate');
          const result = await response.json();
          
          if (result.success) {
            if (result.data.valid) {
              alert('Database schema is valid');
            } else {
              alert(\`Schema validation failed: \${result.data.issues.join(', ')}\`);
            }
          } else {
            alert('Failed to validate schema');
          }
        } catch (error) {
          alert('Error validating schema');
        }
      };

      window.updateMigrationUI = function(data) {
        const totalEl = document.getElementById('total-migrations');
        const appliedEl = document.getElementById('applied-migrations');
        const pendingEl = document.getElementById('pending-migrations');
        
        if (totalEl) totalEl.textContent = data.totalMigrations;
        if (appliedEl) appliedEl.textContent = data.appliedMigrations;
        if (pendingEl) pendingEl.textContent = data.pendingMigrations;
        
        const runBtn = document.getElementById('run-migrations-btn');
        if (runBtn) {
          runBtn.disabled = data.pendingMigrations === 0;
        }
        
        // Update migrations list
        const listContainer = document.getElementById('migrations-list');
        if (listContainer && data.migrations && data.migrations.length > 0) {
          listContainer.innerHTML = data.migrations.map(migration => \`
            <div class="px-6 py-4 flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3">
                  <div class="flex-shrink-0">
                    \${migration.applied 
                      ? '<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
                      : '<svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
                    }
                  </div>
                  <div>
                    <h5 class="text-white font-medium">\${migration.name}</h5>
                    <p class="text-sm text-gray-300">\${migration.filename}</p>
                    \${migration.description ? \`<p class="text-xs text-gray-400 mt-1">\${migration.description}</p>\` : ''}
                  </div>
                </div>
              </div>
              
              <div class="flex items-center space-x-4 text-sm">
                \${migration.size ? \`<span class="text-gray-400">\${(migration.size / 1024).toFixed(1)} KB</span>\` : ''}
                <span class="px-2 py-1 rounded-full text-xs font-medium \${
                  migration.applied 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }">
                  \${migration.applied ? 'Applied' : 'Pending'}
                </span>
                \${migration.appliedAt ? \`<span class="text-gray-400">\${new Date(migration.appliedAt).toLocaleDateString()}</span>\` : ''}
              </div>
            </div>
          \`).join('');
        }
      };
      
      // Auto-load migrations when switching to that tab
      function initializeMigrations() {
        if (currentTab === 'migrations') {
          setTimeout(window.refreshMigrationStatus, 500);
        }
      }
      
      // Database Tools functions
      window.refreshDatabaseStats = async function() {
        try {
          const response = await fetch('/admin/settings/api/database-tools/stats');
          const result = await response.json();
          
          if (result.success) {
            updateDatabaseToolsUI(result.data);
          } else {
            console.error('Failed to refresh database stats');
          }
        } catch (error) {
          console.error('Error loading database stats:', error);
        }
      };

      window.createDatabaseBackup = async function() {
        const btn = document.getElementById('create-backup-btn');
        if (!btn) return;
        
        btn.disabled = true;
        btn.innerHTML = 'Creating Backup...';
        
        try {
          const response = await fetch('/admin/settings/api/database-tools/backup', {
            method: 'POST'
          });
          const result = await response.json();
          
          if (result.success) {
            alert(result.message);
            setTimeout(() => window.refreshDatabaseStats(), 1000);
          } else {
            alert(result.error || 'Failed to create backup');
          }
        } catch (error) {
          alert('Error creating backup');
        } finally {
          btn.disabled = false;
          btn.innerHTML = 'Create Backup';
        }
      };

      window.truncateDatabase = async function() {
        // Show dangerous operation warning
        const confirmText = prompt(
          'WARNING: This will delete ALL data except your admin account!\\n\\n' +
          'This action CANNOT be undone!\\n\\n' +
          'Type "TRUNCATE ALL DATA" to confirm:'
        );
        
        if (confirmText !== 'TRUNCATE ALL DATA') {
          alert('Operation cancelled. Confirmation text did not match.');
          return;
        }
        
        const btn = document.getElementById('truncate-db-btn');
        if (!btn) return;
        
        btn.disabled = true;
        btn.innerHTML = 'Truncating...';
        
        try {
          const response = await fetch('/admin/settings/api/database-tools/truncate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              confirmText: confirmText
            })
          });
          const result = await response.json();
          
          if (result.success) {
            alert(result.message + '\\n\\nTables cleared: ' + result.data.tablesCleared.join(', '));
            setTimeout(() => {
              window.refreshDatabaseStats();
              // Optionally reload page to refresh all data
              window.location.reload();
            }, 2000);
          } else {
            alert(result.error || 'Failed to truncate database');
          }
        } catch (error) {
          alert('Error truncating database');
        } finally {
          btn.disabled = false;
          btn.innerHTML = 'Truncate All Data';
        }
      };

      window.validateDatabase = async function() {
        try {
          const response = await fetch('/admin/settings/api/database-tools/validate');
          const result = await response.json();
          
          if (result.success) {
            if (result.data.valid) {
              alert('Database validation passed. No issues found.');
            } else {
              alert('Database validation failed:\\n\\n' + result.data.issues.join('\\n'));
            }
          } else {
            alert('Failed to validate database');
          }
        } catch (error) {
          alert('Error validating database');
        }
      };

      window.updateDatabaseToolsUI = function(data) {
        const totalTablesEl = document.getElementById('total-tables');
        const totalRowsEl = document.getElementById('total-rows');
        const tablesListEl = document.getElementById('tables-list');

        if (totalTablesEl) totalTablesEl.textContent = data.tables.length;
        if (totalRowsEl) totalRowsEl.textContent = data.totalRows.toLocaleString();

        if (tablesListEl && data.tables && data.tables.length > 0) {
          tablesListEl.innerHTML = data.tables.map(table => \`
            <a
              href="/admin/database-tools/tables/\${table.name}"
              class="flex items-center justify-between py-3 px-4 rounded-lg bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 cursor-pointer transition-colors ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 no-underline"
            >
              <div class="flex items-center space-x-3">
                <svg class="w-5 h-5 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                <span class="text-zinc-950 dark:text-white font-medium">\${table.name}</span>
              </div>
              <div class="flex items-center space-x-3">
                <span class="text-zinc-500 dark:text-zinc-400 text-sm">\${table.rowCount.toLocaleString()} rows</span>
                <svg class="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </a>
          \`).join('');
        }
      };

      // Auto-load tab-specific data after all functions are defined
      if (currentTab === 'migrations') {
        setTimeout(window.refreshMigrationStatus, 500);
      }

      if (currentTab === 'database-tools') {
        setTimeout(window.refreshDatabaseStats, 500);
      }
    </script>

    <!-- Confirmation Dialogs -->
    ${renderConfirmationDialog2({
    id: "run-migrations-confirm",
    title: "Run Migrations",
    message: "Are you sure you want to run pending migrations? This action cannot be undone.",
    confirmText: "Run Migrations",
    cancelText: "Cancel",
    iconColor: "blue",
    confirmClass: "bg-blue-500 hover:bg-blue-400",
    onConfirm: "performRunMigrations()"
  })}

    ${getConfirmationDialogScript2()}
  `;
  const layoutData = {
    title: "Settings",
    pageTitle: "Settings",
    currentPath: "/admin/settings",
    user: data.user,
    version: data.version,
    content: pageContent
  };
  return chunk4IO5UBHK_cjs.renderAdminLayoutCatalyst(layoutData);
}
function renderTabButton(tabId, label, iconPath, activeTab) {
  const isActive = activeTab === tabId;
  const baseClasses = "flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap no-underline";
  const activeClasses = isActive ? "border-zinc-950 dark:border-white text-zinc-950 dark:text-white" : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700";
  return `
    <a
      href="/admin/settings/${tabId}"
      data-tab="${tabId}"
      class="${baseClasses} ${activeClasses}"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}"/>
      </svg>
      <span>${label}</span>
    </a>
  `;
}
function renderTabContent(activeTab, settings) {
  switch (activeTab) {
    case "general":
      return renderGeneralSettings(settings?.general);
    case "appearance":
      return renderAppearanceSettings(settings?.appearance);
    case "security":
      return renderSecuritySettings(settings?.security);
    case "notifications":
      return renderNotificationSettings(settings?.notifications);
    case "storage":
      return renderStorageSettings(settings?.storage);
    case "migrations":
      return renderMigrationSettings(settings?.migrations);
    case "database-tools":
      return renderDatabaseToolsSettings(settings?.databaseTools);
    default:
      return renderGeneralSettings(settings?.general);
  }
}
function renderGeneralSettings(settings) {
  return `
    <div class="space-y-6">
      <div>
        <h3 class="text-lg/7 font-semibold text-zinc-950 dark:text-white">General Settings</h3>
        <p class="mt-1 text-sm/6 text-zinc-500 dark:text-zinc-400">Configure basic application settings and preferences.</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm/6 font-medium text-zinc-950 dark:text-white mb-2">Site Name</label>
            <input
              type="text"
              name="siteName"
              value="${settings?.siteName || "WarpCMS AI"}"
              class="w-full rounded-lg bg-white dark:bg-white/5 px-3 py-2 text-sm/6 text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:focus:ring-indigo-400"
              placeholder="Enter site name"
            />
          </div>

          <div>
            <label class="block text-sm/6 font-medium text-zinc-950 dark:text-white mb-2">Admin Email</label>
            <input
              type="email"
              name="adminEmail"
              value="${settings?.adminEmail || "admin@example.com"}"
              class="w-full rounded-lg bg-white dark:bg-white/5 px-3 py-2 text-sm/6 text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:focus:ring-indigo-400"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label class="block text-sm/6 font-medium text-zinc-950 dark:text-white mb-2">Timezone</label>
            <select
              name="timezone"
              class="w-full rounded-lg bg-white dark:bg-white/5 px-3 py-2 text-sm/6 text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:focus:ring-indigo-400"
            >
              <option value="UTC" ${settings?.timezone === "UTC" ? "selected" : ""}>UTC</option>
              <option value="America/New_York" ${settings?.timezone === "America/New_York" ? "selected" : ""}>Eastern Time</option>
              <option value="America/Chicago" ${settings?.timezone === "America/Chicago" ? "selected" : ""}>Central Time</option>
              <option value="America/Denver" ${settings?.timezone === "America/Denver" ? "selected" : ""}>Mountain Time</option>
              <option value="America/Los_Angeles" ${settings?.timezone === "America/Los_Angeles" ? "selected" : ""}>Pacific Time</option>
            </select>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm/6 font-medium text-zinc-950 dark:text-white mb-2">Site Description</label>
            <textarea
              name="siteDescription"
              rows="3"
              class="w-full rounded-lg bg-white dark:bg-white/5 px-3 py-2 text-sm/6 text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:focus:ring-indigo-400"
              placeholder="Describe your site..."
            >${settings?.siteDescription || ""}</textarea>
          </div>

          <div>
            <label class="block text-sm/6 font-medium text-zinc-950 dark:text-white mb-2">Language</label>
            <select
              name="language"
              class="w-full rounded-lg bg-white dark:bg-white/5 px-3 py-2 text-sm/6 text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:focus:ring-indigo-400"
            >
              <option value="en" ${settings?.language === "en" ? "selected" : ""}>English</option>
              <option value="es" ${settings?.language === "es" ? "selected" : ""}>Spanish</option>
              <option value="fr" ${settings?.language === "fr" ? "selected" : ""}>French</option>
              <option value="de" ${settings?.language === "de" ? "selected" : ""}>German</option>
            </select>
          </div>
          
          <div class="flex gap-3">
            <div class="flex h-6 shrink-0 items-center">
              <div class="group grid size-4 grid-cols-1">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  name="maintenanceMode"
                  ${settings?.maintenanceMode ? "checked" : ""}
                  class="col-start-1 row-start-1 appearance-none rounded border border-zinc-950/10 dark:border-white/10 bg-white dark:bg-white/5 checked:border-indigo-500 checked:bg-indigo-500 indeterminate:border-indigo-500 indeterminate:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-zinc-950/5 dark:disabled:border-white/5 disabled:bg-zinc-950/10 dark:disabled:bg-white/10 disabled:checked:bg-zinc-950/10 dark:disabled:checked:bg-white/10 forced-colors:appearance-auto"
                />
                <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-zinc-950/25 dark:group-has-[:disabled]:stroke-white/25">
                  <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:checked]:opacity-100" />
                  <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:indeterminate]:opacity-100" />
                </svg>
              </div>
            </div>
            <div class="text-sm/6">
              <label for="maintenanceMode" class="font-medium text-zinc-950 dark:text-white">
                Enable maintenance mode
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="mt-8 pt-6 border-t border-zinc-950/5 dark:border-white/10 flex justify-end">
        <button
          onclick="saveGeneralSettings()"
          class="inline-flex items-center justify-center rounded-lg bg-zinc-950 dark:bg-white px-3.5 py-2.5 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
        >
          <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          Save Changes
        </button>
      </div>
    </div>
  `;
}
function renderAppearanceSettings(settings) {
  return `
    <div class="space-y-6">
      <!-- WIP Notice -->
      <div class="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-6 ring-1 ring-inset ring-blue-600/20 dark:ring-blue-500/30">
        <div class="flex items-start space-x-3">
          <svg class="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div class="flex-1">
            <h4 class="text-base/7 font-semibold text-blue-900 dark:text-blue-300">Work in Progress</h4>
            <p class="mt-1 text-sm/6 text-blue-700 dark:text-blue-200">
              This settings section is currently under development and provided for reference and design feedback only. Changes made here will not be saved.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-semibold text-white mb-4">Appearance Settings</h3>
        <p class="text-gray-300 mb-6">Customize the look and feel of your application.</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Theme</label>
            <div class="grid grid-cols-3 gap-3">
              <label class="flex items-center space-x-2 p-3 bg-white/10 rounded-lg border border-white/20 cursor-pointer hover:bg-white/20 transition-colors">
                <input 
                  type="radio" 
                  name="theme" 
                  value="light"
                  ${settings?.theme === "light" ? "checked" : ""}
                  class="text-blue-600"
                />
                <span class="text-sm text-gray-300">Light</span>
              </label>
              <label class="flex items-center space-x-2 p-3 bg-white/10 rounded-lg border border-white/20 cursor-pointer hover:bg-white/20 transition-colors">
                <input 
                  type="radio" 
                  name="theme" 
                  value="dark"
                  ${settings?.theme === "dark" || !settings?.theme ? "checked" : ""}
                  class="text-blue-600"
                />
                <span class="text-sm text-gray-300">Dark</span>
              </label>
              <label class="flex items-center space-x-2 p-3 bg-white/10 rounded-lg border border-white/20 cursor-pointer hover:bg-white/20 transition-colors">
                <input 
                  type="radio" 
                  name="theme" 
                  value="auto"
                  ${settings?.theme === "auto" ? "checked" : ""}
                  class="text-blue-600"
                />
                <span class="text-sm text-gray-300">Auto</span>
              </label>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Primary Color</label>
            <div class="flex items-center space-x-3">
              <input 
                type="color" 
                name="primaryColor"
                value="${settings?.primaryColor || "#465FFF"}"
                class="w-12 h-10 bg-white/10 border border-white/20 rounded-lg cursor-pointer"
              />
              <input 
                type="text" 
                value="${settings?.primaryColor || "#465FFF"}"
                class="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#465FFF"
              />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Logo URL</label>
            <input 
              type="url" 
              name="logoUrl"
              value="${settings?.logoUrl || ""}"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Favicon URL</label>
            <input 
              type="url" 
              name="favicon"
              value="${settings?.favicon || ""}"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/favicon.ico"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Custom CSS</label>
            <textarea 
              name="customCSS"
              rows="6"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="/* Add your custom CSS here */"
            >${settings?.customCSS || ""}</textarea>
          </div>
        </div>
      </div>

      <!-- Save Button (Disabled for WIP) -->
      <div class="mt-8 pt-6 border-t border-zinc-950/5 dark:border-white/10 flex justify-end">
        <button
          disabled
          class="inline-flex items-center justify-center rounded-lg bg-zinc-950/50 dark:bg-white/50 px-3.5 py-2.5 text-sm font-semibold text-white/50 dark:text-zinc-950/50 cursor-not-allowed shadow-sm"
        >
          <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          Save Changes
        </button>
      </div>
    </div>
  `;
}
function renderSecuritySettings(settings) {
  return `
    <div class="space-y-6">
      <!-- WIP Notice -->
      <div class="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-6 ring-1 ring-inset ring-blue-600/20 dark:ring-blue-500/30">
        <div class="flex items-start space-x-3">
          <svg class="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div class="flex-1">
            <h4 class="text-base/7 font-semibold text-blue-900 dark:text-blue-300">Work in Progress</h4>
            <p class="mt-1 text-sm/6 text-blue-700 dark:text-blue-200">
              This settings section is currently under development and provided for reference and design feedback only. Changes made here will not be saved.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-semibold text-white mb-4">Security Settings</h3>
        <p class="text-gray-300 mb-6">Configure security and authentication settings.</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-5">
          <div class="flex gap-3">
            <div class="flex h-6 shrink-0 items-center">
              <div class="group grid size-4 grid-cols-1">
                <input
                  type="checkbox"
                  id="twoFactorEnabled"
                  name="twoFactorEnabled"
                  ${settings?.twoFactorEnabled ? "checked" : ""}
                  class="col-start-1 row-start-1 appearance-none rounded border border-zinc-950/10 dark:border-white/10 bg-white dark:bg-white/5 checked:border-indigo-500 checked:bg-indigo-500 indeterminate:border-indigo-500 indeterminate:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-zinc-950/5 dark:disabled:border-white/5 disabled:bg-zinc-950/10 dark:disabled:bg-white/10 disabled:checked:bg-zinc-950/10 dark:disabled:checked:bg-white/10 forced-colors:appearance-auto"
                />
                <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-zinc-950/25 dark:group-has-[:disabled]:stroke-white/25">
                  <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:checked]:opacity-100" />
                  <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:indeterminate]:opacity-100" />
                </svg>
              </div>
            </div>
            <div class="text-sm/6">
              <label for="twoFactorEnabled" class="font-medium text-zinc-950 dark:text-white">
                Enable Two-Factor Authentication
              </label>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Session Timeout (minutes)</label>
            <input 
              type="number" 
              name="sessionTimeout"
              value="${settings?.sessionTimeout || 30}"
              min="5"
              max="1440"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Password Requirements</label>
            <div class="space-y-3">
              <div class="flex gap-3">
                <div class="flex h-6 shrink-0 items-center">
                  <div class="group grid size-4 grid-cols-1">
                    <input
                      type="checkbox"
                      id="requireUppercase"
                      name="requireUppercase"
                      ${settings?.passwordRequirements?.requireUppercase ? "checked" : ""}
                      class="col-start-1 row-start-1 appearance-none rounded border border-zinc-950/10 dark:border-white/10 bg-white dark:bg-white/5 checked:border-indigo-500 checked:bg-indigo-500 indeterminate:border-indigo-500 indeterminate:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-zinc-950/5 dark:disabled:border-white/5 disabled:bg-zinc-950/10 dark:disabled:bg-white/10 disabled:checked:bg-zinc-950/10 dark:disabled:checked:bg-white/10 forced-colors:appearance-auto"
                    />
                    <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-zinc-950/25 dark:group-has-[:disabled]:stroke-white/25">
                      <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:checked]:opacity-100" />
                      <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:indeterminate]:opacity-100" />
                    </svg>
                  </div>
                </div>
                <div class="text-sm/6">
                  <label for="requireUppercase" class="font-medium text-zinc-950 dark:text-white">Require uppercase letters</label>
                </div>
              </div>
              <div class="flex gap-3">
                <div class="flex h-6 shrink-0 items-center">
                  <div class="group grid size-4 grid-cols-1">
                    <input
                      type="checkbox"
                      id="requireNumbers"
                      name="requireNumbers"
                      ${settings?.passwordRequirements?.requireNumbers ? "checked" : ""}
                      class="col-start-1 row-start-1 appearance-none rounded border border-zinc-950/10 dark:border-white/10 bg-white dark:bg-white/5 checked:border-indigo-500 checked:bg-indigo-500 indeterminate:border-indigo-500 indeterminate:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-zinc-950/5 dark:disabled:border-white/5 disabled:bg-zinc-950/10 dark:disabled:bg-white/10 disabled:checked:bg-zinc-950/10 dark:disabled:checked:bg-white/10 forced-colors:appearance-auto"
                    />
                    <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-zinc-950/25 dark:group-has-[:disabled]:stroke-white/25">
                      <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:checked]:opacity-100" />
                      <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:indeterminate]:opacity-100" />
                    </svg>
                  </div>
                </div>
                <div class="text-sm/6">
                  <label for="requireNumbers" class="font-medium text-zinc-950 dark:text-white">Require numbers</label>
                </div>
              </div>
              <div class="flex gap-3">
                <div class="flex h-6 shrink-0 items-center">
                  <div class="group grid size-4 grid-cols-1">
                    <input
                      type="checkbox"
                      id="requireSymbols"
                      name="requireSymbols"
                      ${settings?.passwordRequirements?.requireSymbols ? "checked" : ""}
                      class="col-start-1 row-start-1 appearance-none rounded border border-zinc-950/10 dark:border-white/10 bg-white dark:bg-white/5 checked:border-indigo-500 checked:bg-indigo-500 indeterminate:border-indigo-500 indeterminate:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-zinc-950/5 dark:disabled:border-white/5 disabled:bg-zinc-950/10 dark:disabled:bg-white/10 disabled:checked:bg-zinc-950/10 dark:disabled:checked:bg-white/10 forced-colors:appearance-auto"
                    />
                    <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-zinc-950/25 dark:group-has-[:disabled]:stroke-white/25">
                      <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:checked]:opacity-100" />
                      <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:indeterminate]:opacity-100" />
                    </svg>
                  </div>
                </div>
                <div class="text-sm/6">
                  <label for="requireSymbols" class="font-medium text-zinc-950 dark:text-white">Require symbols</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Minimum Password Length</label>
            <input 
              type="number" 
              name="minPasswordLength"
              value="${settings?.passwordRequirements?.minLength || 8}"
              min="6"
              max="128"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">IP Whitelist</label>
            <textarea 
              name="ipWhitelist"
              rows="4"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter IP addresses (one per line)&#10;192.168.1.1&#10;10.0.0.1"
            >${settings?.ipWhitelist?.join("\n") || ""}</textarea>
            <p class="text-xs text-gray-400 mt-1">Leave empty to allow all IPs</p>
          </div>
        </div>
      </div>

      <!-- Save Button (Disabled for WIP) -->
      <div class="mt-8 pt-6 border-t border-zinc-950/5 dark:border-white/10 flex justify-end">
        <button
          disabled
          class="inline-flex items-center justify-center rounded-lg bg-zinc-950/50 dark:bg-white/50 px-3.5 py-2.5 text-sm font-semibold text-white/50 dark:text-zinc-950/50 cursor-not-allowed shadow-sm"
        >
          <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          Save Changes
        </button>
      </div>
    </div>
  `;
}
function renderNotificationSettings(settings) {
  return `
    <div class="space-y-6">
      <!-- WIP Notice -->
      <div class="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-6 ring-1 ring-inset ring-blue-600/20 dark:ring-blue-500/30">
        <div class="flex items-start space-x-3">
          <svg class="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div class="flex-1">
            <h4 class="text-base/7 font-semibold text-blue-900 dark:text-blue-300">Work in Progress</h4>
            <p class="mt-1 text-sm/6 text-blue-700 dark:text-blue-200">
              This settings section is currently under development and provided for reference and design feedback only. Changes made here will not be saved.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-semibold text-white mb-4">Notification Settings</h3>
        <p class="text-gray-300 mb-6">Configure how and when you receive notifications.</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div>
            <h4 class="text-md font-medium text-white mb-3">Email Notifications</h4>
            <div class="space-y-5">
              <div class="flex gap-3">
                <div class="flex h-6 shrink-0 items-center">
                  <div class="group grid size-4 grid-cols-1">
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      name="emailNotifications"
                      ${settings?.emailNotifications ? "checked" : ""}
                      class="col-start-1 row-start-1 appearance-none rounded border border-zinc-950/10 dark:border-white/10 bg-white dark:bg-white/5 checked:border-indigo-500 checked:bg-indigo-500 indeterminate:border-indigo-500 indeterminate:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-zinc-950/5 dark:disabled:border-white/5 disabled:bg-zinc-950/10 dark:disabled:bg-white/10 disabled:checked:bg-zinc-950/10 dark:disabled:checked:bg-white/10 forced-colors:appearance-auto"
                    />
                    <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-zinc-950/25 dark:group-has-[:disabled]:stroke-white/25">
                      <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:checked]:opacity-100" />
                      <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:indeterminate]:opacity-100" />
                    </svg>
                  </div>
                </div>
                <div class="text-sm/6">
                  <label for="emailNotifications" class="font-medium text-zinc-950 dark:text-white">Enable email notifications</label>
                </div>
              </div>

              <div class="flex gap-3">
                <div class="flex h-6 shrink-0 items-center">
                  <div class="group grid size-4 grid-cols-1">
                    <input
                      type="checkbox"
                      id="contentUpdates"
                      name="contentUpdates"
                      ${settings?.contentUpdates ? "checked" : ""}
                      class="col-start-1 row-start-1 appearance-none rounded border border-zinc-950/10 dark:border-white/10 bg-white dark:bg-white/5 checked:border-indigo-500 checked:bg-indigo-500 indeterminate:border-indigo-500 indeterminate:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-zinc-950/5 dark:disabled:border-white/5 disabled:bg-zinc-950/10 dark:disabled:bg-white/10 disabled:checked:bg-zinc-950/10 dark:disabled:checked:bg-white/10 forced-colors:appearance-auto"
                    />
                    <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-zinc-950/25 dark:group-has-[:disabled]:stroke-white/25">
                      <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:checked]:opacity-100" />
                      <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:indeterminate]:opacity-100" />
                    </svg>
                  </div>
                </div>
                <div class="text-sm/6">
                  <label for="contentUpdates" class="font-medium text-zinc-950 dark:text-white">Content updates</label>
                </div>
              </div>

              <div class="flex gap-3">
                <div class="flex h-6 shrink-0 items-center">
                  <div class="group grid size-4 grid-cols-1">
                    <input
                      type="checkbox"
                      id="systemAlerts"
                      name="systemAlerts"
                      ${settings?.systemAlerts ? "checked" : ""}
                      class="col-start-1 row-start-1 appearance-none rounded border border-zinc-950/10 dark:border-white/10 bg-white dark:bg-white/5 checked:border-indigo-500 checked:bg-indigo-500 indeterminate:border-indigo-500 indeterminate:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-zinc-950/5 dark:disabled:border-white/5 disabled:bg-zinc-950/10 dark:disabled:bg-white/10 disabled:checked:bg-zinc-950/10 dark:disabled:checked:bg-white/10 forced-colors:appearance-auto"
                    />
                    <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-zinc-950/25 dark:group-has-[:disabled]:stroke-white/25">
                      <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:checked]:opacity-100" />
                      <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:indeterminate]:opacity-100" />
                    </svg>
                  </div>
                </div>
                <div class="text-sm/6">
                  <label for="systemAlerts" class="font-medium text-zinc-950 dark:text-white">System alerts</label>
                </div>
              </div>

              <div class="flex gap-3">
                <div class="flex h-6 shrink-0 items-center">
                  <div class="group grid size-4 grid-cols-1">
                    <input
                      type="checkbox"
                      id="userRegistrations"
                      name="userRegistrations"
                      ${settings?.userRegistrations ? "checked" : ""}
                      class="col-start-1 row-start-1 appearance-none rounded border border-zinc-950/10 dark:border-white/10 bg-white dark:bg-white/5 checked:border-indigo-500 checked:bg-indigo-500 indeterminate:border-indigo-500 indeterminate:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-zinc-950/5 dark:disabled:border-white/5 disabled:bg-zinc-950/10 dark:disabled:bg-white/10 disabled:checked:bg-zinc-950/10 dark:disabled:checked:bg-white/10 forced-colors:appearance-auto"
                    />
                    <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-zinc-950/25 dark:group-has-[:disabled]:stroke-white/25">
                      <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:checked]:opacity-100" />
                      <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:indeterminate]:opacity-100" />
                    </svg>
                  </div>
                </div>
                <div class="text-sm/6">
                  <label for="userRegistrations" class="font-medium text-zinc-950 dark:text-white">New user registrations</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Email Frequency</label>
            <select 
              name="emailFrequency"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="immediate" ${settings?.emailFrequency === "immediate" ? "selected" : ""}>Immediate</option>
              <option value="daily" ${settings?.emailFrequency === "daily" ? "selected" : ""}>Daily Digest</option>
              <option value="weekly" ${settings?.emailFrequency === "weekly" ? "selected" : ""}>Weekly Digest</option>
            </select>
          </div>
          
          <div class="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <div class="flex items-start space-x-3">
              <svg class="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <h5 class="text-sm font-medium text-blue-300">Notification Preferences</h5>
                <p class="text-xs text-blue-200 mt-1">
                  Critical system alerts will always be sent immediately regardless of your frequency setting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Button (Disabled for WIP) -->
      <div class="mt-8 pt-6 border-t border-zinc-950/5 dark:border-white/10 flex justify-end">
        <button
          disabled
          class="inline-flex items-center justify-center rounded-lg bg-zinc-950/50 dark:bg-white/50 px-3.5 py-2.5 text-sm font-semibold text-white/50 dark:text-zinc-950/50 cursor-not-allowed shadow-sm"
        >
          <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          Save Changes
        </button>
      </div>
    </div>
  `;
}
function renderStorageSettings(settings) {
  return `
    <div class="space-y-6">
      <!-- WIP Notice -->
      <div class="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-6 ring-1 ring-inset ring-blue-600/20 dark:ring-blue-500/30">
        <div class="flex items-start space-x-3">
          <svg class="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div class="flex-1">
            <h4 class="text-base/7 font-semibold text-blue-900 dark:text-blue-300">Work in Progress</h4>
            <p class="mt-1 text-sm/6 text-blue-700 dark:text-blue-200">
              This settings section is currently under development and provided for reference and design feedback only. Changes made here will not be saved.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-semibold text-white mb-4">Storage Settings</h3>
        <p class="text-gray-300 mb-6">Configure file storage and backup settings.</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Max File Size (MB)</label>
            <input 
              type="number" 
              name="maxFileSize"
              value="${settings?.maxFileSize || 10}"
              min="1"
              max="100"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Storage Provider</label>
            <select 
              name="storageProvider"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="local" ${settings?.storageProvider === "local" ? "selected" : ""}>Local Storage</option>
              <option value="cloudflare" ${settings?.storageProvider === "cloudflare" ? "selected" : ""}>Cloudflare R2</option>
              <option value="s3" ${settings?.storageProvider === "s3" ? "selected" : ""}>Amazon S3</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Backup Frequency</label>
            <select 
              name="backupFrequency"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily" ${settings?.backupFrequency === "daily" ? "selected" : ""}>Daily</option>
              <option value="weekly" ${settings?.backupFrequency === "weekly" ? "selected" : ""}>Weekly</option>
              <option value="monthly" ${settings?.backupFrequency === "monthly" ? "selected" : ""}>Monthly</option>
            </select>
          </div>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Allowed File Types</label>
            <textarea 
              name="allowedFileTypes"
              rows="3"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="jpg, jpeg, png, gif, pdf, docx"
            >${settings?.allowedFileTypes?.join(", ") || "jpg, jpeg, png, gif, pdf, docx"}</textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Backup Retention (days)</label>
            <input 
              type="number" 
              name="retentionPeriod"
              value="${settings?.retentionPeriod || 30}"
              min="7"
              max="365"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div class="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <div class="flex items-start space-x-3">
              <svg class="w-5 h-5 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <h5 class="text-sm font-medium text-green-300">Storage Status</h5>
                <p class="text-xs text-green-200 mt-1">
                  Current usage: 2.4 GB / 10 GB available
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Button (Disabled for WIP) -->
      <div class="mt-8 pt-6 border-t border-zinc-950/5 dark:border-white/10 flex justify-end">
        <button
          disabled
          class="inline-flex items-center justify-center rounded-lg bg-zinc-950/50 dark:bg-white/50 px-3.5 py-2.5 text-sm font-semibold text-white/50 dark:text-zinc-950/50 cursor-not-allowed shadow-sm"
        >
          <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          Save Changes
        </button>
      </div>
    </div>
  `;
}
function renderMigrationSettings(settings) {
  return `
    <div class="space-y-6">
      <div>
        <h3 class="text-lg font-semibold text-white mb-4">Database Migrations</h3>
        <p class="text-gray-300 mb-6">View and manage database migrations to keep your schema up to date.</p>
      </div>
      
      <!-- Migration Status Overview -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="backdrop-blur-md bg-blue-500/20 rounded-lg border border-blue-500/30 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-blue-300">Total Migrations</p>
              <p id="total-migrations" class="text-2xl font-bold text-white">${settings?.totalMigrations || "0"}</p>
            </div>
            <svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
            </svg>
          </div>
        </div>
        
        <div class="backdrop-blur-md bg-green-500/20 rounded-lg border border-green-500/30 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-green-300">Applied</p>
              <p id="applied-migrations" class="text-2xl font-bold text-white">${settings?.appliedMigrations || "0"}</p>
            </div>
            <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
        
        <div class="backdrop-blur-md bg-orange-500/20 rounded-lg border border-orange-500/30 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-orange-300">Pending</p>
              <p id="pending-migrations" class="text-2xl font-bold text-white">${settings?.pendingMigrations || "0"}</p>
            </div>
            <svg class="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Migration Actions -->
      <div class="flex items-center space-x-4 mb-6">
        <button 
          onclick="window.refreshMigrationStatus()"
          class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Refresh Status
        </button>
        
        <button 
          onclick="window.runPendingMigrations()"
          id="run-migrations-btn"
          class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          ${(settings?.pendingMigrations || 0) === 0 ? "disabled" : ""}
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10v4.586a1 1 0 00.293.707l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1"/>
          </svg>
          Run Pending
        </button>

        <button 
          onclick="window.validateSchema()" 
          class="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Validate Schema
        </button>
      </div>

      <!-- Migrations List -->
      <div class="backdrop-blur-md bg-white/10 rounded-lg border border-white/20 overflow-hidden">
        <div class="px-6 py-4 border-b border-white/10">
          <h4 class="text-lg font-medium text-white">Migration History</h4>
          <p class="text-sm text-gray-300 mt-1">List of all available database migrations</p>
        </div>
        
        <div id="migrations-list" class="divide-y divide-white/10">
          <div class="px-6 py-8 text-center">
            <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
            </svg>
            <p class="text-gray-300">Loading migration status...</p>
          </div>
        </div>
      </div>
    </div>

    <script>
      // Load migration status when tab becomes active
      if (typeof refreshMigrationStatus === 'undefined') {
        window.refreshMigrationStatus = async function() {
          try {
            const response = await fetch('/admin/settings/api/migrations/status');
            const result = await response.json();
            
            if (result.success) {
              updateMigrationUI(result.data);
            } else {
              console.error('Failed to refresh migration status');
            }
          } catch (error) {
            console.error('Error loading migration status:', error);
          }
        };

        window.runPendingMigrations = async function() {
          const btn = document.getElementById('run-migrations-btn');
          if (!btn || btn.disabled) return;

          showConfirmDialog('run-migrations-confirm');
        };

        window.performRunMigrations = async function() {
          const btn = document.getElementById('run-migrations-btn');
          if (!btn) return;

          btn.disabled = true;
          btn.innerHTML = 'Running...';

          try {
            const response = await fetch('/admin/settings/api/migrations/run', {
              method: 'POST'
            });
            const result = await response.json();

            if (result.success) {
              alert(result.message);
              setTimeout(() => window.refreshMigrationStatus(), 1000);
            } else {
              alert(result.error || 'Failed to run migrations');
            }
          } catch (error) {
            alert('Error running migrations');
          } finally {
            btn.disabled = false;
            btn.innerHTML = 'Run Pending';
          }
        };

        window.validateSchema = async function() {
          try {
            const response = await fetch('/admin/settings/api/migrations/validate');
            const result = await response.json();
            
            if (result.success) {
              if (result.data.valid) {
                alert('Database schema is valid');
              } else {
                alert(\`Schema validation failed: \${result.data.issues.join(', ')}\`);
              }
            } else {
              alert('Failed to validate schema');
            }
          } catch (error) {
            alert('Error validating schema');
          }
        };

        window.updateMigrationUI = function(data) {
          const totalEl = document.getElementById('total-migrations');
          const appliedEl = document.getElementById('applied-migrations');
          const pendingEl = document.getElementById('pending-migrations');
          
          if (totalEl) totalEl.textContent = data.totalMigrations;
          if (appliedEl) appliedEl.textContent = data.appliedMigrations;
          if (pendingEl) pendingEl.textContent = data.pendingMigrations;
          
          const runBtn = document.getElementById('run-migrations-btn');
          if (runBtn) {
            runBtn.disabled = data.pendingMigrations === 0;
          }
          
          // Update migrations list
          const listContainer = document.getElementById('migrations-list');
          if (listContainer && data.migrations && data.migrations.length > 0) {
            listContainer.innerHTML = data.migrations.map(migration => \`
              <div class="px-6 py-4 flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                      \${migration.applied 
                        ? '<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
                        : '<svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
                      }
                    </div>
                    <div>
                      <h5 class="text-white font-medium">\${migration.name}</h5>
                      <p class="text-sm text-gray-300">\${migration.filename}</p>
                      \${migration.description ? \`<p class="text-xs text-gray-400 mt-1">\${migration.description}</p>\` : ''}
                    </div>
                  </div>
                </div>
                
                <div class="flex items-center space-x-4 text-sm">
                  \${migration.size ? \`<span class="text-gray-400">\${(migration.size / 1024).toFixed(1)} KB</span>\` : ''}
                  <span class="px-2 py-1 rounded-full text-xs font-medium \${
                    migration.applied 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }">
                    \${migration.applied ? 'Applied' : 'Pending'}
                  </span>
                  \${migration.appliedAt ? \`<span class="text-gray-400">\${new Date(migration.appliedAt).toLocaleDateString()}</span>\` : ''}
                </div>
              </div>
            \`).join('');
          }
        };
      }
      
      // Auto-load when tab becomes active
      if (currentTab === 'migrations') {
        setTimeout(refreshMigrationStatus, 500);
      }
    </script>
  `;
}
function renderDatabaseToolsSettings(settings) {
  return `
    <div class="space-y-6">
      <div>
        <h3 class="text-lg/7 font-semibold text-zinc-950 dark:text-white">Database Tools</h3>
        <p class="mt-1 text-sm/6 text-zinc-500 dark:text-zinc-400">Manage database operations including backup, restore, and maintenance.</p>
      </div>

      <!-- Database Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="rounded-lg bg-white dark:bg-white/5 p-6 ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm/6 font-medium text-zinc-500 dark:text-zinc-400">Total Tables</p>
              <p id="total-tables" class="mt-2 text-3xl/8 font-semibold text-zinc-950 dark:text-white">${settings?.totalTables || "0"}</p>
            </div>
            <div class="rounded-lg bg-indigo-500/10 p-3">
              <svg class="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-white dark:bg-white/5 p-6 ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm/6 font-medium text-zinc-500 dark:text-zinc-400">Total Rows</p>
              <p id="total-rows" class="mt-2 text-3xl/8 font-semibold text-zinc-950 dark:text-white">${settings?.totalRows?.toLocaleString() || "0"}</p>
            </div>
            <div class="rounded-lg bg-green-500/10 p-3">
              <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Database Operations -->
      <div class="space-y-4">
        <!-- Safe Operations -->
        <div class="rounded-lg bg-white dark:bg-white/5 p-6 ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10">
          <h4 class="text-base/7 font-semibold text-zinc-950 dark:text-white mb-4">Safe Operations</h4>
          <div class="flex flex-wrap gap-3">
            <button
              onclick="window.refreshDatabaseStats()"
              class="inline-flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm font-semibold text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
            >
              <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Refresh Stats
            </button>

            <button
              onclick="window.createDatabaseBackup()"
              id="create-backup-btn"
              class="inline-flex items-center justify-center rounded-lg bg-indigo-600 dark:bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 dark:hover:bg-indigo-400 transition-colors shadow-sm"
            >
              <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Create Backup
            </button>

            <button
              onclick="window.validateDatabase()"
              class="inline-flex items-center justify-center rounded-lg bg-green-600 dark:bg-green-500 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-green-500 dark:hover:bg-green-400 transition-colors shadow-sm"
            >
              <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Validate Database
            </button>
          </div>
        </div>
      </div>

      <!-- Tables List -->
      <div class="rounded-lg bg-white dark:bg-white/5 ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 overflow-hidden">
        <div class="px-6 py-4 border-b border-zinc-950/10 dark:border-white/10">
          <h4 class="text-base/7 font-semibold text-zinc-950 dark:text-white">Database Tables</h4>
          <p class="mt-1 text-sm/6 text-zinc-500 dark:text-zinc-400">Click on a table to view its data</p>
        </div>

        <div id="tables-list" class="p-6 space-y-2">
          <div class="text-center py-8">
            <svg class="w-12 h-12 text-zinc-400 dark:text-zinc-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            <p class="text-zinc-500 dark:text-zinc-400">Loading database statistics...</p>
          </div>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="rounded-lg bg-red-50 dark:bg-red-950/20 p-6 ring-1 ring-inset ring-red-600/20 dark:ring-red-500/30">
        <div class="flex items-start space-x-3">
          <svg class="w-6 h-6 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          <div class="flex-1">
            <h4 class="text-base/7 font-semibold text-red-900 dark:text-red-400">Danger Zone</h4>
            <p class="mt-1 text-sm/6 text-red-700 dark:text-red-300">
              These operations are destructive and cannot be undone.
              <strong>Your admin account will be preserved</strong>, but all other data will be permanently deleted.
            </p>
            <div class="mt-4">
              <button
                onclick="window.truncateDatabase()"
                id="truncate-db-btn"
                class="inline-flex items-center justify-center rounded-lg bg-red-600 dark:bg-red-500 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-red-500 dark:hover:bg-red-400 transition-colors shadow-sm"
              >
                <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Truncate All Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// src/routes/admin-settings.ts
var adminSettingsRoutes = new hono.Hono();
adminSettingsRoutes.use("*", chunkTAYKWZ2B_cjs.requireAuth());
function getMockSettings(user) {
  return {
    general: {
      siteName: "WarpCMS AI",
      siteDescription: "A modern headless CMS powered by AI",
      adminEmail: user?.email || "admin@example.com",
      timezone: "UTC",
      language: "en",
      maintenanceMode: false
    },
    appearance: {
      theme: "dark",
      primaryColor: "#465FFF",
      logoUrl: "",
      favicon: "",
      customCSS: ""
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      passwordRequirements: {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSymbols: false
      },
      ipWhitelist: []
    },
    notifications: {
      emailNotifications: true,
      contentUpdates: true,
      systemAlerts: true,
      userRegistrations: false,
      emailFrequency: "immediate"
    },
    storage: {
      maxFileSize: 10,
      allowedFileTypes: ["jpg", "jpeg", "png", "gif", "pdf", "docx"],
      storageProvider: "cloudflare",
      backupFrequency: "daily",
      retentionPeriod: 30
    },
    migrations: {
      totalMigrations: 0,
      appliedMigrations: 0,
      pendingMigrations: 0,
      lastApplied: void 0,
      migrations: []
    },
    databaseTools: {
      totalTables: 0,
      totalRows: 0,
      lastBackup: void 0,
      databaseSize: "0 MB",
      tables: []
    }
  };
}
adminSettingsRoutes.get("/", (c) => {
  return c.redirect("/admin/settings/general");
});
adminSettingsRoutes.get("/general", async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  const settingsService = new chunkJUS7ZTDS_cjs.SettingsService(db);
  const generalSettings = await settingsService.getGeneralSettings(user?.email);
  const mockSettings = getMockSettings(user);
  mockSettings.general = generalSettings;
  const pageData = {
    user: user ? {
      name: user.email,
      email: user.email,
      role: user.role
    } : void 0,
    settings: mockSettings,
    activeTab: "general",
    version: c.get("appVersion")
  };
  return c.html(renderSettingsPage(pageData));
});
adminSettingsRoutes.get("/appearance", (c) => {
  const user = c.get("user");
  const pageData = {
    user: user ? {
      name: user.email,
      email: user.email,
      role: user.role
    } : void 0,
    settings: getMockSettings(user),
    activeTab: "appearance",
    version: c.get("appVersion")
  };
  return c.html(renderSettingsPage(pageData));
});
adminSettingsRoutes.get("/security", (c) => {
  const user = c.get("user");
  const pageData = {
    user: user ? {
      name: user.email,
      email: user.email,
      role: user.role
    } : void 0,
    settings: getMockSettings(user),
    activeTab: "security",
    version: c.get("appVersion")
  };
  return c.html(renderSettingsPage(pageData));
});
adminSettingsRoutes.get("/notifications", (c) => {
  const user = c.get("user");
  const pageData = {
    user: user ? {
      name: user.email,
      email: user.email,
      role: user.role
    } : void 0,
    settings: getMockSettings(user),
    activeTab: "notifications",
    version: c.get("appVersion")
  };
  return c.html(renderSettingsPage(pageData));
});
adminSettingsRoutes.get("/storage", (c) => {
  const user = c.get("user");
  const pageData = {
    user: user ? {
      name: user.email,
      email: user.email,
      role: user.role
    } : void 0,
    settings: getMockSettings(user),
    activeTab: "storage",
    version: c.get("appVersion")
  };
  return c.html(renderSettingsPage(pageData));
});
adminSettingsRoutes.get("/migrations", (c) => {
  const user = c.get("user");
  const pageData = {
    user: user ? {
      name: user.email,
      email: user.email,
      role: user.role
    } : void 0,
    settings: getMockSettings(user),
    activeTab: "migrations",
    version: c.get("appVersion")
  };
  return c.html(renderSettingsPage(pageData));
});
adminSettingsRoutes.get("/database-tools", (c) => {
  const user = c.get("user");
  const pageData = {
    user: user ? {
      name: user.email,
      email: user.email,
      role: user.role
    } : void 0,
    settings: getMockSettings(user),
    activeTab: "database-tools",
    version: c.get("appVersion")
  };
  return c.html(renderSettingsPage(pageData));
});
adminSettingsRoutes.get("/api/migrations/status", async (c) => {
  try {
    const db = c.env.DB;
    const migrationService = new chunkJXL7JFEE_cjs.MigrationService(db);
    const status = await migrationService.getMigrationStatus();
    return c.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error("Error fetching migration status:", error);
    return c.json({
      success: false,
      error: "Failed to fetch migration status"
    }, 500);
  }
});
adminSettingsRoutes.post("/api/migrations/run", async (c) => {
  try {
    const user = c.get("user");
    if (!user || user.role !== "admin") {
      return c.json({
        success: false,
        error: "Unauthorized. Admin access required."
      }, 403);
    }
    const db = c.env.DB;
    const migrationService = new chunkJXL7JFEE_cjs.MigrationService(db);
    const result = await migrationService.runPendingMigrations();
    return c.json({
      success: result.success,
      message: result.message,
      applied: result.applied
    });
  } catch (error) {
    console.error("Error running migrations:", error);
    return c.json({
      success: false,
      error: "Failed to run migrations"
    }, 500);
  }
});
adminSettingsRoutes.get("/api/migrations/validate", async (c) => {
  try {
    const db = c.env.DB;
    const migrationService = new chunkJXL7JFEE_cjs.MigrationService(db);
    const validation = await migrationService.validateSchema();
    return c.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error("Error validating schema:", error);
    return c.json({
      success: false,
      error: "Failed to validate schema"
    }, 500);
  }
});
adminSettingsRoutes.get("/api/database-tools/stats", async (c) => {
  try {
    const db = c.env.DB;
    const tablesQuery = await db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table'
      AND name NOT LIKE 'sqlite_%'
      AND name NOT LIKE '_cf_%'
      ORDER BY name
    `).all();
    const tables = tablesQuery.results || [];
    let totalRows = 0;
    const tableStats = await Promise.all(
      tables.map(async (table) => {
        try {
          const countResult = await db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).first();
          const rowCount = countResult?.count || 0;
          totalRows += rowCount;
          return {
            name: table.name,
            rowCount
          };
        } catch (error) {
          console.error(`Error counting rows in ${table.name}:`, error);
          return {
            name: table.name,
            rowCount: 0
          };
        }
      })
    );
    const estimatedSizeBytes = totalRows * 1024;
    const databaseSizeMB = (estimatedSizeBytes / (1024 * 1024)).toFixed(2);
    return c.json({
      success: true,
      data: {
        totalTables: tables.length,
        totalRows,
        databaseSize: `${databaseSizeMB} MB (estimated)`,
        tables: tableStats
      }
    });
  } catch (error) {
    console.error("Error fetching database stats:", error);
    return c.json({
      success: false,
      error: "Failed to fetch database statistics"
    }, 500);
  }
});
adminSettingsRoutes.get("/api/database-tools/validate", async (c) => {
  try {
    const db = c.env.DB;
    const integrityResult = await db.prepare("PRAGMA integrity_check").first();
    const isValid = integrityResult?.integrity_check === "ok";
    return c.json({
      success: true,
      data: {
        valid: isValid,
        message: isValid ? "Database integrity check passed" : "Database integrity check failed"
      }
    });
  } catch (error) {
    console.error("Error validating database:", error);
    return c.json({
      success: false,
      error: "Failed to validate database"
    }, 500);
  }
});
adminSettingsRoutes.post("/api/database-tools/backup", async (c) => {
  try {
    const user = c.get("user");
    if (!user || user.role !== "admin") {
      return c.json({
        success: false,
        error: "Unauthorized. Admin access required."
      }, 403);
    }
    return c.json({
      success: true,
      message: "Database backup feature coming soon. Use Cloudflare Dashboard for backups."
    });
  } catch (error) {
    console.error("Error creating backup:", error);
    return c.json({
      success: false,
      error: "Failed to create backup"
    }, 500);
  }
});
adminSettingsRoutes.post("/api/database-tools/truncate", async (c) => {
  try {
    const user = c.get("user");
    if (!user || user.role !== "admin") {
      return c.json({
        success: false,
        error: "Unauthorized. Admin access required."
      }, 403);
    }
    const body = await c.req.json();
    const tablesToTruncate = body.tables || [];
    if (!Array.isArray(tablesToTruncate) || tablesToTruncate.length === 0) {
      return c.json({
        success: false,
        error: "No tables specified for truncation"
      }, 400);
    }
    const db = c.env.DB;
    const results = [];
    for (const tableName of tablesToTruncate) {
      try {
        await db.prepare(`DELETE FROM ${tableName}`).run();
        results.push({ table: tableName, success: true });
      } catch (error) {
        console.error(`Error truncating ${tableName}:`, error);
        results.push({ table: tableName, success: false, error: String(error) });
      }
    }
    return c.json({
      success: true,
      message: `Truncated ${results.filter((r) => r.success).length} of ${tablesToTruncate.length} tables`,
      results
    });
  } catch (error) {
    console.error("Error truncating tables:", error);
    return c.json({
      success: false,
      error: "Failed to truncate tables"
    }, 500);
  }
});
adminSettingsRoutes.post("/general", async (c) => {
  try {
    const user = c.get("user");
    if (!user || user.role !== "admin") {
      return c.json({
        success: false,
        error: "Unauthorized. Admin access required."
      }, 403);
    }
    const formData = await c.req.formData();
    const db = c.env.DB;
    const settingsService = new chunkJUS7ZTDS_cjs.SettingsService(db);
    const settings = {
      siteName: formData.get("siteName"),
      siteDescription: formData.get("siteDescription"),
      adminEmail: formData.get("adminEmail"),
      timezone: formData.get("timezone"),
      language: formData.get("language"),
      maintenanceMode: formData.get("maintenanceMode") === "true"
    };
    if (!settings.siteName || !settings.siteDescription) {
      return c.json({
        success: false,
        error: "Site name and description are required"
      }, 400);
    }
    const success = await settingsService.saveGeneralSettings(settings);
    if (success) {
      return c.json({
        success: true,
        message: "General settings saved successfully!"
      });
    } else {
      return c.json({
        success: false,
        error: "Failed to save settings"
      }, 500);
    }
  } catch (error) {
    console.error("Error saving general settings:", error);
    return c.json({
      success: false,
      error: "Failed to save settings. Please try again."
    }, 500);
  }
});
adminSettingsRoutes.post("/", async (c) => {
  return c.redirect("/admin/settings/general");
});

// src/routes/index.ts
var ROUTES_INFO = {
  message: "Core routes available",
  available: [
    "apiRoutes",
    "apiContentCrudRoutes",
    "apiMediaRoutes",
    "apiSystemRoutes",
    "adminApiRoutes",
    "authRoutes",
    "testCleanupRoutes",
    "adminContentRoutes",
    "adminUsersRoutes",
    "adminLogsRoutes",
    "adminDashboardRoutes",
    "adminSettingsRoutes"
  ],
  status: "Core package routes ready",
  reference: "https://github.com/badmuriss/warpcms"
};

exports.ROUTES_INFO = ROUTES_INFO;
exports.adminLogsRoutes = adminLogsRoutes;
exports.adminSettingsRoutes = adminSettingsRoutes;
exports.admin_api_default = admin_api_default;
exports.admin_content_default = admin_content_default;
exports.api_content_crud_default = api_content_crud_default;
exports.api_default = api_default;
exports.api_media_default = api_media_default;
exports.api_system_default = api_system_default;
exports.auth_default = auth_default;
exports.router = router;
exports.test_cleanup_default = test_cleanup_default;
exports.userRoutes = userRoutes;
//# sourceMappingURL=chunk-QMGOE3O5.cjs.map
//# sourceMappingURL=chunk-QMGOE3O5.cjs.map