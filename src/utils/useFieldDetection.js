/**
 * useFieldDetection.js
 * AI & plagiarism detection has been removed for now. This is an inert stub that
 * returns neutral values so components importing it keep working without running
 * any detection.
 */
export function useFieldDetection() {
  return { aiScore: null, plagScore: null, loading: false, aiLabel: null, modelGuess: null };
}
