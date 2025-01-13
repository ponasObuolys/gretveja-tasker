import type { I18nVariables } from "@supabase/auth-ui-shared";

export const authLocalization = {
  variables: {
    sign_in: {
      email_label: "El. paštas",
      password_label: "Slaptažodis",
      email_input_placeholder: "jusu@paštas.lt",
      password_input_placeholder: "Jūsų slaptažodis",
      button_label: "Prisijungti",
      loading_button_label: "Jungiamasi...",
      social_provider_text: "Prisijungti su {{provider}}",
      link_text: "Jau turite paskyrą? Prisijunkite",
      confirmation_text: "Patikrinkite savo el. paštą"
    },
    sign_up: {
      email_label: "El. paštas",
      password_label: "Slaptažodis",
      email_input_placeholder: "jusu@paštas.lt",
      password_input_placeholder: "Jūsų slaptažodis",
      button_label: "Registruotis",
      loading_button_label: "Registruojama...",
      social_provider_text: "Registruotis su {{provider}}",
      link_text: "Neturite paskyros? Registruokitės",
      confirmation_text: "Patikrinkite savo el. paštą dėl patvirtinimo nuorodos"
    },
    forgotten_password: {
      link_text: "Pamiršote slaptažodį?",
      email_label: "El. paštas",
      password_label: "Slaptažodis",
      email_input_placeholder: "jusu@paštas.lt",
      button_label: "Siųsti atkūrimo nuorodą",
      loading_button_label: "Siunčiama atkūrimo nuoroda...",
      confirmation_text: "Patikrinkite savo el. paštą dėl slaptažodžio atkūrimo nuorodos"
    },
    magic_link: {
      button_label: "Siųsti prisijungimo nuorodą",
      loading_button_label: "Siunčiama nuoroda...",
      confirmation_text: "Patikrinkite savo el. paštą"
    }
  } satisfies I18nVariables
};