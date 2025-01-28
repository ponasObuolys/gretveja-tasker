export const supportedFeatures = {
  webgl: typeof document !== 'undefined' ? 
    !!document.createElement('canvas').getContext('webgl') : false,
  webworkers: typeof Worker !== 'undefined',
  localStorage: typeof window !== 'undefined' ? 
    !!window.localStorage : false
}; 