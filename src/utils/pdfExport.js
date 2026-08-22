/**
 * pdfExport.js — exports the thesis as a PDF that is a pixel-faithful copy of
 * the on-screen preview. Each rendered .thesis-page (a fixed A4 box) is captured
 * and placed onto an A4 PDF page, so the download is exactly what the viewer shows.
 */
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function downloadViewerPdf(filename = "thesis.pdf") {
  const root = document.getElementById("preview-pane");
  const pages = root ? Array.from(root.querySelectorAll(".thesis-page")) : [];
  if (!pages.length) throw new Error("PREVIEW_NOT_READY");

  // Wait for fonts and any images to be ready so the capture is complete.
  try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch { /* ignore */ }
  const imgs = root.querySelectorAll("img");
  await Promise.all(Array.from(imgs).map((im) =>
    im.complete ? Promise.resolve() : new Promise((res) => { im.onload = im.onerror = res; })
  ));
  await sleep(120);

  // Off-screen holder so the capture is at true A4 size, free of any preview scaling.
  const holder = document.createElement("div");
  holder.setAttribute("aria-hidden", "true");
  holder.style.cssText = "position:fixed;left:-12000px;top:0;background:#ffffff;z-index:-1;";
  try {
    const cs = window.getComputedStyle(root);
    holder.style.fontFamily = cs.fontFamily;
    holder.style.fontSize = cs.fontSize;
    holder.dir = root.dir || "ltr";
  } catch { /* ignore */ }
  document.body.appendChild(holder);

  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();

  try {
    for (let i = 0; i < pages.length; i++) {
      const clone = pages[i].cloneNode(true);
      clone.style.margin = "0";
      clone.style.boxShadow = "none";
      clone.style.transform = "none";
      clone.style.width = "21cm";
      clone.style.height = "29.7cm";
      holder.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 0,
      });
      holder.removeChild(clone);

      const data = canvas.toDataURL("image/jpeg", 0.95);
      if (i > 0) pdf.addPage();
      pdf.addImage(data, "JPEG", 0, 0, pw, ph, undefined, "FAST");
    }
  } finally {
    document.body.removeChild(holder);
  }

  pdf.save(filename.endsWith(".pdf") ? filename : filename.replace(/\.\w+$/, "") + ".pdf");
}
