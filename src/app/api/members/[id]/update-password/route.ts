import { env } from '@/env';
import * as admin from 'firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: env.FIREBASE_PROJECT_ID,
    private_key_id: env.FIREBASE_PRIVATE_KEY_ID,
    private_key: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: env.FIREBASE_CLIENT_EMAIL,
    client_id: env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: env.FIREBASE_CLIENT_X509_CERT_URL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Update password using Firebase Admin SDK
    await admin.auth().updateUser(id, {
      password: password,
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating password:', error);

    return NextResponse.json(
      { error: 'Failed to update password', details: error.message },
      { status: 500 }
    );
  }
}
