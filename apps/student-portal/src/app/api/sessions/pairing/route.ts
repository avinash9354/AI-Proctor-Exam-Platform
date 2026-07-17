import { NextRequest, NextResponse } from 'next/server';
import { generatePairingCode } from '@/lib/qrCode';

/**
 * POST /api/sessions/pairing
 * Generate a pairing code for mobile proctor connection
 */
export async function POST(req: NextRequest) {
  try {
    const { sessionId, studentId } = (await req.json()) as {
      sessionId: string;
      studentId: string;
    };

    if (!sessionId || !studentId) {
      return NextResponse.json(
        { success: false, error: 'Missing sessionId or studentId' },
        { status: 400 }
      );
    }

    // Generate pairing code
    const pairingCode = generatePairingCode();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    return NextResponse.json(
      {
        success: true,
        data: {
          sessionId,
          studentId,
          pairingCode,
          expiresAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Pairing error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate pairing code' },
      { status: 500 }
    );
  }
}
