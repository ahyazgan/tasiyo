export function validateField(name, value) {
  if (!value || !value.trim()) return "Bu alan zorunludur";

  if (name === "email") {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(value)) return "Gecerli bir e-posta girin";
  }

  if (name === "tel") {
    const digits = value.replace(/\D/g, "");
    if (digits.length < 10) return "Gecerli bir telefon numarasi girin";
  }

  return null;
}

export function validateForm(fields, values) {
  const errors = {};
  let valid = true;
  for (const f of fields) {
    if (!f.required) continue;
    const err = validateField(f.type, values[f.key] || "");
    if (err) {
      errors[f.key] = err;
      valid = false;
    }
  }
  return { valid, errors };
}
