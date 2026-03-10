export const LEGAL_VERSIONS = {
  TOS: 'TOS-v1.0',
  PRIVACY: 'PRIV-v1.0',
  COOKIES: 'COOK-v1.0',
  DPA: 'DPA-v1.0',
} as const;

export type ConsentType =
  | 'tos'
  | 'privacy'
  | 'cookies'
  | 'marketing'
  | 'competence_declaration'
  | 'certificate_responsibility';
