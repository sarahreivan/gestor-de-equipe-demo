import { describe, expect, it } from "vitest";
import { validateLoginFields } from "./login-validation";

describe("login field validation", () => {
  it("accepts any valid email domain", () => {
    for (const email of ["seu.nome@empresa.com", "pessoa@gmail.com", "pessoa@equipe.org.br"]) {
      expect(validateLoginFields(email, "senha123").email).toBeUndefined();
    }
    expect(validateLoginFields("email-sem-dominio", "senha123").email).toBeDefined();
  });
  it("blocks empty fields before sign-in", () => {
    const errors = validateLoginFields("", "");
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeDefined();
    expect(validateLoginFields("pessoa@empresa.com", "senha123").password).toBeUndefined();
  });
  it("preserves the existing six-character password minimum", () => {
    expect(validateLoginFields("pessoa@empresa.com", "12345").password).toBeDefined();
    expect(validateLoginFields("pessoa@empresa.com", "123456").password).toBeUndefined();
  });
});