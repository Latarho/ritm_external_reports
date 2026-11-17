// Данные организации для шапки отчётов — заменить на данные из настроек/авторизации.
export const ORGANIZATION = {
  name: process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Компания не указана",
} as const
