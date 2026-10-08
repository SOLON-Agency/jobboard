import { describe, it, expect } from "vitest";
import { createFormBuilderSchema, formFieldSchema } from "@/components/forms/validations/form-builder.schema";
import { buildApplicationFormSchema, validateApplicationUploads } from "@/components/forms/validations/application.schema";

describe("formFieldSchema", () => {
  it("requires options for radio fields", () => {
    const result = formFieldSchema.safeParse({
      field_type: "radio",
      label: "Choice",
      placeholder: "",
      is_required: false,
      options_raw: "",
      sort_order: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe("createFormBuilderSchema", () => {
  it("requires company_id when multiple companies", () => {
    const schema = createFormBuilderSchema(true);
    const result = schema.safeParse({
      name: "Test",
      description: "",
      company_id: "",
      fields: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("buildApplicationFormSchema", () => {
  it("validates required email fields", () => {
    const schema = buildApplicationFormSchema([
      { id: "f1", label: "Email", field_type: "email", is_required: true },
    ]);
    expect(schema.safeParse({ f1: "bad" }).success).toBe(false);
    expect(schema.safeParse({ f1: "a@b.com" }).success).toBe(true);
  });
});

describe("validateApplicationUploads", () => {
  it("flags missing required uploads", () => {
    const errors = validateApplicationUploads(
      [{ id: "u1", label: "CV", field_type: "upload", is_required: true }],
      {}
    );
    expect(errors.u1).toBe("Câmp obligatoriu");
  });
});
