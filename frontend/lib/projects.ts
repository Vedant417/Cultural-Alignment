export async function getProjectTitles() {
  try {
    const res = await fetch("/api/titles");

    if (!res.ok) {
      return [];
    }

    return await res.json();

  } catch (err) {
    console.error("PROJECT FETCH ERROR:", err);
    return [];
  }
}