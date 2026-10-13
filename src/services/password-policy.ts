/** Mesmos critérios Unicode da API; espaços não contam como caractere especial. */
export function passwordRequirements(password: string) {
  const length = Array.from(password).length;
  return [
    { id: 'length', label: 'De 8 a 128 caracteres', satisfied: length >= 8 && length <= 128 },
    { id: 'uppercase', label: 'Uma letra maiúscula', satisfied: /\p{Lu}/u.test(password) },
    { id: 'lowercase', label: 'Uma letra minúscula', satisfied: /\p{Ll}/u.test(password) },
    { id: 'number', label: 'Um número', satisfied: /\p{Nd}/u.test(password) },
    { id: 'special', label: 'Um caractere especial (ex.: !, @, #)', satisfied: /[\p{P}\p{S}]/u.test(password) },
  ];
}

export function validNewPassword(password: string) {
  return passwordRequirements(password).every(requirement => requirement.satisfied);
}
