// services/pdf/generateFeedbackPDF.ts
import type { InterviewSession, FinalReport } from "@/types";

type GeneratePDFParams = {
  session: InterviewSession;
  finalReport: FinalReport | null;
  overallScore: number;
  avgContent: number;
  avgDelivery: number;
  confidenceMetric: number;
};

type RGB = [number, number, number];

export async function generateFeedbackPDF({
  session,
  finalReport,
  overallScore,
  avgContent,
  avgDelivery,
  confidenceMetric,
}: GeneratePDFParams) {
  // --- jsPDF runtime guard ---
  const jspdfGlobal = (window as any)?.jspdf;
  if (!jspdfGlobal?.jsPDF) {
    console.error("jsPDF is not loaded on window.jspdf.jsPDF");
    return;
  }

  const { jsPDF } = jspdfGlobal as { jsPDF: any };
  const doc = new jsPDF();

  // ================= Base Layout =================
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const checkPageBreak = (heightNeeded: number) => {
    if (y + heightNeeded > pageHeight - margin) {
      doc.addPage();
      y = 20;
    }
  };

  // ================= HEADER =================
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 55, "F");

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 52, pageWidth, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("HIREPREP PERFORMANCE REPORT", margin, 30);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);

  const roleTitle = session?.config?.role?.title || "Professional";
  doc.text(`Candidate: ${roleTitle}`, margin, 42);

  const startTime = session?.startTime ? new Date(session.startTime) : new Date();
  doc.text(`Date: ${startTime.toLocaleString()}`, pageWidth - 80, 42);

  const sessionId = session?.id ? String(session.id) : "UNKNOWN";
  doc.text(`Session ID: #${sessionId.slice(-8)}`, pageWidth - 80, 48);

  y = 70;

  // ================= EXECUTIVE SUMMARY =================
  if (finalReport) {
    const summaryText = finalReport.summary || "No summary available.";
    const strengths = Array.isArray(finalReport.strengths) ? finalReport.strengths : [];
    const weaknesses = Array.isArray(finalReport.weaknesses) ? finalReport.weaknesses : [];

    doc.setFillColor(239, 246, 255);
    doc.roundedRect(margin, y, contentWidth, 10, 2, 2, "F");
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("EXECUTIVE SUMMARY", margin + 5, y + 7);
    y += 15;

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");

    const summaryLines = doc.splitTextToSize(summaryText, contentWidth - 10);
    doc.text(summaryLines, margin + 5, y);
    y += summaryLines.length * 5 + 12;

    // Strengths & Weaknesses Grid
    checkPageBreak(60);
    const colWidth = (contentWidth - 10) / 2;

    // Strengths
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(margin, y, colWidth, 8, 1, 1, "F");
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("CORE STRENGTHS", margin + 3, y + 5.5);
    y += 12;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);

    strengths.forEach((s: string) => {
      const txt = `• ${s}`;
      const split = doc.splitTextToSize(txt, colWidth - 8);
      doc.text(split, margin + 3, y);
      y += split.length * 4.5 + 2;
    });

    // Weaknesses column aligned to the same top as strengths block start
    const weakY = 70 + 15 + summaryLines.length * 5 + 12; // derived start (keeps old look)
    // ✅ 更稳：如果你希望完全跟随当前 y，可以用：const weakY = (70 + 15 + summaryLines.length * 5 + 12);
    // 或者：const weakY = yStartOfStrengths;（需要你保存 strengthStartY）

    doc.setFillColor(254, 242, 242);
    doc.roundedRect(margin + colWidth + 5, weakY, colWidth, 8, 1, 1, "F");
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("AREAS OF CONCERN", margin + colWidth + 8, weakY + 5.5);

    let weakTextY = weakY + 12;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);

    weaknesses.forEach((w: string) => {
      const txt = `• ${w}`;
      const split = doc.splitTextToSize(txt, colWidth - 8);
      doc.text(split, margin + colWidth + 8, weakTextY);
      weakTextY += split.length * 4.5 + 2;
    });

    y = Math.max(y, weakTextY) + 8;
  }

  // ================= METRICS DASHBOARD =================
  checkPageBreak(35);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 28, 3, 3, "F");

  const metrics: Array<{ label: string; value: string; color: RGB }> = [
    { label: "OVERALL SCORE", value: `${overallScore}/100`, color: [59, 130, 246] },
    { label: "AVG CONTENT", value: `${avgContent}/10`, color: [34, 197, 94] },
    { label: "AVG DELIVERY", value: `${avgDelivery}/10`, color: [168, 85, 247] },
    { label: "CONFIDENCE", value: `${confidenceMetric}%`, color: [234, 179, 8] },
  ];

  const metricBoxWidth = contentWidth / 4;
  metrics.forEach((m, idx) => {
    const x = margin + idx * metricBoxWidth + 5;
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(m.label, x, y + 8);

    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(m.value, x, y + 20);
  });

  y += 38;

  // ================= QUESTION ANALYSIS =================
  checkPageBreak(30);
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 1, "F");
  y += 10;

  doc.setTextColor(37, 99, 235);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("DETAILED QUESTION ANALYSIS", margin, y);
  y += 12;

  const analyses = Array.isArray(session?.analyses) ? session.analyses : [];

  analyses.forEach((analysis: any, idx: number) => {
    checkPageBreak(100);

    const cardStartY = y;

    doc.setFillColor(249, 250, 251);
    doc.roundedRect(margin, y, contentWidth, 6, 1, 1, "F");

    doc.setFillColor(37, 99, 235);
    doc.circle(margin + 3, y + 3, 2.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${idx + 1}`, margin + 2.2, y + 3.8);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const qTitle = analysis?.questionText || "Question";
    const splitTitle = doc.splitTextToSize(qTitle, contentWidth - 20);
    doc.text(splitTitle, margin + 8, y + 4);
    y += Math.max(6, splitTitle.length * 4.5) + 4;

    // Score pills
    const pillY = y;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, pillY, contentWidth, 16, 2, 2, "F");

    // Content pill
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(margin + 5, pillY + 3, 35, 10, 5, 5, "F");
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("CONTENT", margin + 8, pillY + 7);

    const contentScore = Number(analysis?.contentScore ?? 0);
    const contentColor: RGB = contentScore >= 7 ? [34, 197, 94] : [251, 146, 60];
    doc.setTextColor(contentColor[0], contentColor[1], contentColor[2]);
    doc.setFontSize(12);
    doc.text(`${contentScore}`, margin + 30, pillY + 10);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("/10", margin + 35, pillY + 10);

    // Delivery pill
    doc.setFillColor(243, 232, 255);
    doc.roundedRect(margin + 45, pillY + 3, 35, 10, 5, 5, "F");
    doc.setTextColor(147, 51, 234);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("DELIVERY", margin + 48, pillY + 7);

    const deliveryScore = Number(analysis?.deliveryScore ?? 0);
    const deliveryColor: RGB = deliveryScore >= 7 ? [168, 85, 247] : [251, 146, 60];
    doc.setTextColor(deliveryColor[0], deliveryColor[1], deliveryColor[2]);
    doc.setFontSize(12);
    doc.text(`${deliveryScore}`, margin + 70, pillY + 10);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("/10", margin + 75, pillY + 10);

    // Metrics small text
    const m = analysis?.metrics || {};
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`Eye Contact: ${Number(m.eyeContact ?? 0)}%`, margin + 90, pillY + 7);
    doc.text(`Confidence: ${Number(m.confidence ?? 0)}%`, margin + 90, pillY + 11);
    doc.text(`Speech Rate: ${Math.round(Number(m.speechRate ?? 0))} WPM`, margin + 120, pillY + 7);
    doc.text(`Volume: ${(Number(m.volumeStability ?? 0) * 10).toFixed(0)}/100`, margin + 120, pillY + 11);

    y += 20;

    // User answer block
    checkPageBreak(25);
    const ansText = String(analysis?.userAnswer ?? "");
    const splitAns = doc.splitTextToSize(ansText, contentWidth - 20);
    const answerHeight = splitAns.length * 4.5 + 4;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, answerHeight, 2, 2, "F");

    doc.setTextColor(191, 219, 254);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text('"', margin + 3, y + 8);

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(71, 85, 105);
    doc.text(splitAns, margin + 10, y + 5);

    y += answerHeight + 6;

    // AI feedback block
    checkPageBreak(20);
    const fbText = String(analysis?.feedback ?? "");
    const splitFb = doc.splitTextToSize(fbText, contentWidth - 10);
    const feedbackHeight = splitFb.length * 4.5 + 8;

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, y, contentWidth, feedbackHeight, 2, 2, "F");

    doc.setFillColor(239, 246, 255);
    doc.circle(margin + 3, y + 3, 2, "F");
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("AI", margin + 1.8, y + 4);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8);
    doc.text("AI FEEDBACK", margin + 8, y + 4);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    doc.text(splitFb, margin + 5, y + 10);

    y += feedbackHeight + 6;

    // Strengths & improvements (two columns)
    const aStrengths = Array.isArray(analysis?.strengths) ? analysis.strengths : [];
    const aWeaknesses = Array.isArray(analysis?.weaknesses) ? analysis.weaknesses : [];
    if (aStrengths.length || aWeaknesses.length) {
      checkPageBreak(50);
      const colWidth = (contentWidth - 5) / 2;
      const colStartY = y;

      if (aStrengths.length) {
        doc.setFillColor(240, 253, 244);
        doc.roundedRect(margin, y, colWidth, 5, 1, 1, "F");
        doc.setTextColor(22, 163, 74);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text("✓ STRENGTHS", margin + 2, y + 3.5);
        y += 7;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(21, 128, 61);
        doc.setFontSize(8);
        aStrengths.forEach((s: string) => {
          const txt = `• ${s}`;
          const split = doc.splitTextToSize(txt, colWidth - 6);
          doc.text(split, margin + 2, y);
          y += split.length * 3.8 + 1;
        });
        y += 2;
      }

      if (aWeaknesses.length) {
        let improvY = colStartY;
        doc.setFillColor(254, 242, 242);
        doc.roundedRect(margin + colWidth + 5, improvY, colWidth, 5, 1, 1, "F");
        doc.setTextColor(220, 38, 38);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text("→ IMPROVEMENTS", margin + colWidth + 7, improvY + 3.5);
        improvY += 7;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(185, 28, 28);
        doc.setFontSize(8);
        aWeaknesses.forEach((w: string) => {
          const txt = `• ${w}`;
          const split = doc.splitTextToSize(txt, colWidth - 6);
          doc.text(split, margin + colWidth + 7, improvY);
          improvY += split.length * 3.8 + 1;
        });

        y = Math.max(y, improvY + 2);
      }
    }

    // Border
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, cardStartY, contentWidth, y - cardStartY, 2, 2, "S");

    y += 8;
  });

  // ================= TRAINING PLAN =================
  if (finalReport?.trainingPlan?.length) {
    checkPageBreak(60);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, y, pageWidth, 2, "F");
    y += 12;

    doc.setTextColor(37, 99, 235);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("NEXT STEPS & TRAINING PLAN", margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");

    finalReport.trainingPlan.forEach((step: string, i: number) => {
      checkPageBreak(10);
      const stepText = `${i + 1}. ${step}`;
      const split = doc.splitTextToSize(stepText, contentWidth - 10);
      doc.text(split, margin + 5, y);
      y += split.length * 5 + 3;
    });
  }

  doc.save(`Hireprep_Assessment_${sessionId.slice(-6)}.pdf`);
}
