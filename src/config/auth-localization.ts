import { Localization } from "@supabase/auth-ui-shared";

export const authLocalization: Localization = {
  variables: {
    sign_in: {
      email_label: "El. paštas",
      password_label: "Slaptažodis",
      email_input_placeholder: "Jūsų el. paštas",
      password_input_placeholder: "Jūsų slaptažodis",
      button_label: "Prisijungti",
      loading_button_label: "Jungiamasi...",
      social_provider_text: "Prisijungti su {{provider}}",
      link_text: "Jau turite paskyrą? Prisijunkite",
    },
    sign_up: {
      email_label: "El. paštas",
      password_label: "Slaptažodis",
      email_input_placeholder: "Jūsų el. paštas",
      password_input_placeholder: "Jūsų slaptažodis",
      button_label: "Registruotis",
      loading_button_label: "Registruojama...",
      social_provider_text: "Registruotis su {{provider}}",
      link_text: "Neturite paskyros? Registruokitės",
      confirmation_text: "Patikrinkite savo el. paštą dėl patvirtinimo nuorodos"
    },
    forgotten_password: {
      email_label: "El. paštas",
      password_label: "Slaptažodis",
      email_input_placeholder: "Jūsų el. paštas",
      button_label: "Siųsti atkūrimo nuorodą",
      loading_button_label: "Siunčiama...",
      link_text: "Pamiršote slaptažodį?",
      confirmation_text: "Patikrinkite savo el. paštą dėl slaptažodžio atkūrimo nuorodos"
    }
  }
};