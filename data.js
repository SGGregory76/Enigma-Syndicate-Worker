export async function getCardData(env) {
  const decoded = JSON.parse(atob(env.YOUR_FIREBASE_JSON_BASE64));
  return {
    faction: 'Enigma Syndicate',
    projectId: decoded.project_id,
    email: decoded.client_email
  };
}
