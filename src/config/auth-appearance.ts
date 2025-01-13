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
        inputText: 'white',
        messageText: '#FF4B6E',
        anchorTextColor: '#FF4B6E',
        dividerBackground: '#374151'
      },
      space: {
        inputPadding: '1rem',
        buttonPadding: '1rem'
      },
      borderWidths: {
        inputBorderWidth: '1px'
      }
    }
  },
  className: {
    container: 'text-white',
    label: 'text-white',
    button: 'bg-[#FF4B6E] hover:bg-[#FF3355] text-white transition-colors duration-200',
    input: 'bg-[#1A1D24] border-gray-700 text-white focus:border-[#FF4B6E]',
    loader: 'border-t-[#FF4B6E]',
    message: 'text-red-400',
    anchor: 'text-[#FF4B6E] hover:text-[#FF3355]'
  }
};