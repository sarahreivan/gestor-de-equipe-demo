import { z } from "zod";

export function validateLoginFields(email: string, password: string) {
  return {
    email: !email.trim()
      ? "Informe seu e-mail."
      : !z.string().email().safeParse(email).success
        ? "Informe um e-mail válido."
        : undefined,
    password: !password
      ? "Informe sua senha."
      : password.length < 6
        ? "A senha deve ter pelo menos 6 caracteres."
        : undefined,
  };
}