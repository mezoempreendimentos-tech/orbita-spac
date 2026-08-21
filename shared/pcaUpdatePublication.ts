export function publicationReferenceError(value: string) {
  return value.trim() ? null : "Informe a referência, URL ou comprovante da publicação.";
}
