import * as admin from 'firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create user account using Firebase Admin SDK (doesn't auto-login)
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: false,
      disabled: false,
    });

    return NextResponse.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
      }
    });

  } catch (error: any) {
    console.error('Error creating user account:', error);

    // Handle specific Firebase errors
    let errorMessage = 'Failed to create user account';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'Email này đã được sử dụng';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email không hợp lệ';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Mật khẩu quá yếu';
    }

    return NextResponse.json(
      { error: errorMessage, code: error.code },
      { status: 400 }
    );
  }
}
