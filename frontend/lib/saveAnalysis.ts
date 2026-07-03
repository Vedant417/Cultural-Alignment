export const saveAnalysis = (analysis: any) => {
  try {
    const existing =
      JSON.parse(localStorage.getItem("savedAnalyses") || "[]");

    const alreadyExists = existing.some(
      (item: any) =>
        item.movie === analysis.movie &&
        item.region === analysis.region
    );

    if (alreadyExists) return;

    existing.unshift({
      ...analysis,
      savedAt: new Date().toISOString(),
    });

    localStorage.setItem(
      "savedAnalyses",
      JSON.stringify(existing)
    );
  } catch (err) {
    console.error("Save failed", err);
  }
};