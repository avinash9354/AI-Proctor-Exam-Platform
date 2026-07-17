import { Router, Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

export const reportRouter = Router();

// GET /v1/reports/session/:sessionId/pdf — download official PDF proctoring certificate/summary
reportRouter.get('/session/:sessionId/pdf', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        student: { select: { name: true, rollNumber: true, email: true } },
        exam: { select: { title: true, durationMinutes: true, totalMarks: true } },
        violations: true,
        submissions: true,
      },
    });

    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="proctor-report-${sessionId}.pdf"`);
    doc.pipe(res);

    // Title / Header
    doc.fontSize(20).font('Helvetica-Bold').text('EXAMGUARD PROCTORING AUDIT REPORT', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica').text(`Generated at: ${new Date().toISOString()}`, { align: 'right' });
    doc.moveDown(1);

    // Exam details
    doc.fontSize(14).font('Helvetica-Bold').text('1. Examination & Candidate Info');
    doc.fontSize(11).font('Helvetica').moveDown(0.5);
    doc.text(`Candidate Name: ${session.student.name}`);
    doc.text(`Roll Number: ${session.student.rollNumber || 'N/A'}`);
    doc.text(`Email: ${session.student.email}`);
    doc.text(`Exam Title: ${session.exam.title}`);
    doc.text(`Status: ${session.status.toUpperCase()}`);
    doc.text(`Risk Score: ${session.riskScore} / 100 (${session.riskLevel?.toUpperCase() || 'GREEN'})`);
    doc.moveDown(1.5);

    // Integrity Audit
    doc.fontSize(14).font('Helvetica-Bold').text('2. Integrity & AI Monitoring Summary');
    doc.fontSize(11).font('Helvetica').moveDown(0.5);
    doc.text(`Total Warnings Issued: ${session.warningCount}`);
    doc.text(`Total Logged Violations: ${session.violations.length}`);
    doc.moveDown(0.5);

    if (session.violations.length > 0) {
      session.violations.forEach((v, idx) => {
        doc.text(`[${idx + 1}] Type: ${v.type} | Status: ${v.status} | Confidence: ${(v.confidence * 100).toFixed(0)}%`);
        if (v.reviewNotes) doc.text(`    Proctor Notes: ${v.reviewNotes}`);
      });
    } else {
      doc.text('No AI proctoring violations were recorded during this session.');
    }

    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica-Oblique').text('End of Official Report — ExamGuard Enterprise Integrity Engine', { align: 'center' });
    doc.end();
  } catch (err) {
    logger.error('PDF report error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate PDF report' });
  }
});
