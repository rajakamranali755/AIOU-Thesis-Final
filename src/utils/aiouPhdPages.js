// ── AIOU PhD template pages (Appendix E & G of the AIOU PhD_New_Template) ────
// These pages are created exactly like every other page of the thesis: their
// text lives in the Preliminary step, pre-filled with the official template
// wording (auto-filled from the Cover step, with fill-in lines for anything
// not provided). The scholar edits the text freely — the page is rebuilt from
// whatever is written, and clearing the text removes the page, just like the
// Abstract or Acknowledgement.

const filled = (v, dashes = 16) =>
  v && String(v).trim() ? String(v).trim() : "_".repeat(dashes);

export function aiouPhdDefaults(cover = {}) {
  const uni = cover.university || "Allama Iqbal Open University, Islamabad";
  const uniShort = cover.university || "Allama Iqbal Open University";
  const degree = cover.degree || "Doctor of Philosophy";
  const deg = cover.degreeAbbr || "PhD";
  const discipline = filled(cover.subject, 18);
  const title = cover.title ? `\u201C${cover.title}\u201D` : "\u201C" + "_".repeat(28) + "\u201D";

  return {
    // Appendix E-II — Inner Title page (the submission statement under the emblem)
    innerTitleText: [
      "Submitted in Partial fulfillment of the requirement for the",
      `${degree} degree in discipline ${discipline}`,
      "With Specialization in ________________ (where applicable)",
      `At the Faculty of ${filled(cover.faculty, 18)}`,
      `${uni}.`,
    ].join("\n"),

    // Appendix E-III — "In the Name of Allah" page
    bismillahText:
      "\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0670\u0646\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650\n" +
      "IN THE NAME OF ALLAH, THE MOST MERCIFUL AND BENEFICIENT",

    // Appendix E-IV — Acceptance by the Viva Voce Committee (the acceptance paragraph)
    vivaVoceText:
      `Accepted by the Faculty of ${filled(cover.faculty, 14)}, ${uniShort} in partial fulfillment of the requirements for the ${degree} Degree in ${discipline} with specialization in ____________ (where applicable).`,

    // Appendix G(a) — Declaration by the student
    studentDeclarationText:
      `I ${filled(cover.authorName, 22)} Son/Daughter of ______________ Roll No. ${filled(cover.registrationNo, 12)} Registration No. ______________ a student of ${deg} at ${uniShort} do hereby solemnly declare that the thesis entitled ${title} submitted by me in partial fulfilment of ${deg} degree in (discipline) ${discipline}, is my original work, except where otherwise acknowledged in the text, and has not been submitted or published earlier and shall not, in future, be submitted by me for obtaining any degree from this or any other university or institution.`,

    // Appendix G(b) — Plagiarism Undertaking
    plagiarismText: [
      `I solemnly declare that research work presented in the thesis titled ${title} is solely my research work with no significant contribution from any other person. Small contribution/help wherever taken has been duly acknowledged and that complete thesis has been written by me.`,
      `I understand the zero tolerance policy of HEC and ${uni} towards plagiarism. Therefore I as an Author of the above titled thesis declare that no portion of my thesis has been plagiarized and material used as reference is properly referred/cited.`,
      `I undertake that if I am found guilty of any formal plagiarism in the above titled thesis even after award of ${deg} degree, the University reserves the rights to withdraw/revoke my ${deg} degree and that HEC and the University has the right to publish my name on the HEC/University website on which names of students are placed who submitted plagiarized thesis.`,
    ].join("\n"),
  };
}

// Resolve the text of each page: the scholar's own text when written (an empty
// string removes the page), otherwise the template wording built from the cover.
export function aiouPhdPageTexts(preliminary = {}, cover = {}) {
  const d = aiouPhdDefaults(cover);
  const pick = (v, def) => (v === undefined || v === null ? def : v);
  return {
    innerTitle: pick(preliminary.innerTitleText, d.innerTitleText),
    bismillah: pick(preliminary.bismillahText, d.bismillahText),
    vivaVoce: pick(preliminary.vivaVoceText, d.vivaVoceText),
    studentDeclaration: pick(preliminary.studentDeclarationText, d.studentDeclarationText),
    plagiarism: pick(preliminary.plagiarismText, d.plagiarismText),
  };
}

// A line containing Arabic script (used to typeset the Bismillah line).
export const isArabicLine = (s) => /[\u0600-\u06FF]/.test(s || "");
