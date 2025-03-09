// Simple environment validation to avoid runtime errors

export function validateEnv() {
  const requiredEnvVars = [
    'MONGODB_URI',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET'
  ];
  
  const optionalEnvVars = [
    'NEXT_PUBLIC_GEMINI_API_KEY',
    'GITHUB_ID',
    'GITHUB_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ];
  
  const missingRequired = requiredEnvVars.filter(envVar => !process.env[envVar]);
  const missingOptional = optionalEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingRequired.length > 0) {
    console.error(`Missing required environment variables: ${missingRequired.join(', ')}`);
    return false;
  }
  
  if (missingOptional.length > 0) {
    console.warn(`Missing optional environment variables: ${missingOptional.join(', ')}`);
  }
  
  return true;
}