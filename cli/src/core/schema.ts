import { readdirSync } from "node:fs";
import { join } from "node:path";
import { Ajv2020, type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { buildEnumsSchema, type Catalog } from "./catalog.js";
import { readYaml } from "./yaml.js";

const BASE = "https://ai-dev.local/schemas/";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class SchemaRegistry {
  private readonly ajv: Ajv2020;

  constructor(cat: Catalog) {
    this.ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false, allowUnionTypes: true });
    addFormats.default(this.ajv);
    this.ajv.addSchema(buildEnumsSchema(cat));
    const dir = join(cat.root, "schemas");
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".schema.yaml"))) {
      this.ajv.addSchema(readYaml<object>(join(dir, file)));
    }
  }

  /** `name` sin extensión, p. ej. "task" o "ai-dev-state". */
  get(name: string): ValidateFunction {
    const fn = this.ajv.getSchema(`${BASE}${name}.schema.yaml`);
    if (!fn) throw new Error(`Esquema desconocido: ${name}`);
    return fn;
  }

  names(): string[] {
    return Object.keys(this.ajv.schemas)
      .filter((id) => id.startsWith(BASE) && !id.endsWith("enums.schema.yaml"))
      .map((id) => id.slice(BASE.length).replace(/\.schema\.yaml$/, ""));
  }

  validate(name: string, data: unknown): ValidationResult {
    const fn = this.get(name);
    const valid = fn(data) as boolean;
    return { valid, errors: valid ? [] : formatErrors(fn.errors) };
  }
}

export function schemaForDocumentType(cat: Catalog, type: string): string {
  return cat.documentTypes.types[type]?.schema ?? cat.documentTypes.default_schema;
}

function formatErrors(errors: ErrorObject[] | null | undefined): string[] {
  return (errors ?? [])
    .filter((e) => e.keyword !== "if")
    .map((e) => `${e.instancePath || "/"} ${e.message ?? ""}${e.keyword === "enum" ? `: ${JSON.stringify(e.params.allowedValues)}` : ""}`.trim());
}
