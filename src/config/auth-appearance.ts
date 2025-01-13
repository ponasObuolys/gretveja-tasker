import { ThemeSupa } from "@supabase/auth-ui-shared";

export const authAppearance = {
  theme: ThemeSupa,
  variables: {
    default: {
      colors: {
        brand: '#FF4B6E',
        brandAccent: '#FF3355',
        defaultButtonBackground: '#FF4B6E',
        defaultButtonBackgroundHover: '#FF3355',
        inputBackground: '#1A1D24',
        inputBorder: '#374151',
        inputBorderHover: '#4B5563',
        inputBorderFocus: '#FF4B6E',
      }
    }
  },
  className: {
    container: 'text-white',
    label: 'text-white',
    button: 'bg-[#FF4B6E] hover:bg-[#FF3355] text-white transition-colors duration-200',
    input: 'bg-[#1A1D24] border-gray-700 text-white',
    loader: 'border-t-[#FF4B6E]',
    message: 'text-red-400'
  }
};