export const LOCAL_PASSWORD_MIN_LENGTH = 12;
export const localPasswordError = (password: string) => {
  if (password.length < LOCAL_PASSWORD_MIN_LENGTH) return `A senha deve ter ao menos ${LOCAL_PASSWORD_MIN_LENGTH} caracteres.`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "A senha deve conter letras e números.";
  return null;
};

export const canDeactivateLocalAccount = (actorUserId: number, targetUserId: number) => actorUserId !== targetUserId;
