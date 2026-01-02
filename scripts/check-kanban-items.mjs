import 'dotenv/config';
import admin from 'firebase-admin';

function initAdmin() {
  if (admin.apps.length) return admin;
  const serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  };
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
  return admin;
}

async function main() {
  const adm = initAdmin();
  const db = adm.database();

  const ordersSnap = await db.ref('xoxo/orders').get();
  const orders = ordersSnap.val() || {};
  const orderKeys = Object.keys(orders);

  const itemsSnap = await db.ref('xoxo/operational_workflow_items').get();
  const items = itemsSnap.val() || {};
  const itemKeys = Object.keys(items);

  const byOrderCode = {};
  for (const id of itemKeys) {
    const it = items[id];
    const code = it.orderCode || '(no orderCode)';
    byOrderCode[code] = (byOrderCode[code] || 0) + 1;
  }

  console.log('Orders count:', orderKeys.length);
  console.log('Kanban items count:', itemKeys.length);
  console.log('Items per orderCode:', byOrderCode);

  // Show any orders that don't have items yet
  const missing = [];
  for (const code of orderKeys) {
    if (!byOrderCode[code]) missing.push(code);
  }
  console.log('Orders missing Kanban items:', missing);
}

main().catch((e) => { console.error(e); process.exit(1); });
