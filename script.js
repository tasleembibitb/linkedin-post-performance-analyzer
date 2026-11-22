// LinkedIn Post Performance Analyzer
// Sample data is demo data only. User posts are saved in this browser (localStorage).
const STORAGE_KEY = "lppa-posts-v1";
const SAMPLE_POSTS = [
  { title: "My Portfolio Website", format: "Image + link in comment", impressions: 210, likes: 12, comments: 4 },
  { title: "JavaScript Tips for Beginners", format: "Text only", impressions: 95, likes: 6, comments: 2 },
  { title: "My First Freelance Project", format: "Image in post", impressions: 180, likes: 15, comments: 6 },
  { title: "Free Course I Completed", format: "Text + external link", impressions: 48, likes: 1, comments: 0 },
  { title: "Weekend Coding Challenge", format: "Video", impressions: 150, likes: 9, comments: 3 },
  { title: "Resume Tips for Freshers", format: "Text only", impressions: 88, likes: 4, comments: 1 }
];
let posts = loadPosts();
function loadPosts() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch (e) { /* fall through to sample data */ }
  return SAMPLE_POSTS.slice();
}
function savePosts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}
function engagement(p) {
  if (!p.impressions) return 0;
  return ((p.likes + p.comments) / p.impressions) * 100;
}
function render() {
  const totalImpressions = posts.reduce((s, p) => s + p.impressions, 0);
  const avg = posts.length ? Math.round(totalImpressions / posts.length) : 0;
  const best = posts.length
    ? posts.reduce((a, b) => (b.impressions > a.impressions ? b : a))
    : null;
  document.getElementById("statPosts").textContent = posts.length;
  document.getElementById("statImpressions").textContent = totalImpressions.toLocaleString();
  document.getElementById("statAvg").textContent = avg.toLocaleString();
  document.getElementById("statBest").textContent = best ? best.title : "—";
  renderInsight(best, avg);
  renderChart(best);
  renderFormats();
  renderTable();
}
function renderInsight(best, avg) {
  const el = document.getElementById("insight");
  if (!posts.length) {
    el.textContent = "Add a few posts to see the insight.";
    return;
  }
  const byFormat = groupByFormat();
  const entries = Object.entries(byFormat).sort((a, b) => b[1].avg - a[1].avg);
  const top = entries[0];
  const bottom = entries[entries.length - 1];
  let text = "Your best post is \"" + best.title + "\" with " +
    best.impressions.toLocaleString() + " impressions. ";
  if (entries.length > 1) {
    text += "On average, \"" + top[0] + "\" posts reach " +
      Math.round(top[1].avg).toLocaleString() + " people, while \"" +
      bottom[0] + "\" posts reach only " +
      Math.round(bottom[1].avg).toLocaleString() + ". ";
    if (top[1].avg > bottom[1].avg) {
      const lift = Math.round(((top[1].avg - bottom[1].avg) / bottom[1].avg) * 100);
      text += "That is about " + lift + "% more reach — format matters more than topic.";
    }
  } else {
    text += "Add posts in different formats to compare them.";
  }
  el.textContent = text;
}
function renderChart(best) {
  const chart = document.getElementById("chart");
  chart.innerHTML = "";
  const max = Math.max.apply(null, posts.map((p) => p.impressions).concat([1]));
  const sorted = posts.slice().sort((a, b) => b.impressions - a.impressions);
  sorted.forEach((p) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    const pct = Math.round((p.impressions / max) * 100);
    row.innerHTML =
      '<span class="bar-label">' + escapeHtml(p.title) + "</span>" +
      '<div class="bar-track"><div class="bar-fill' + (best && p === best ? " top" : "") +
      '" style="width:' + pct + '%"></div></div>' +
      '<span class="bar-num">' + p.impressions.toLocaleString() + "</span>";
    chart.appendChild(row);
  });
}
function groupByFormat() {
  const groups = {};
  posts.forEach((p) => {
    if (!groups[p.format]) groups[p.format] = { count: 0, impressions: 0, engagement: 0 };
    groups[p.format].count++;
    groups[p.format].impressions += p.impressions;
    groups[p.format].engagement += engagement(p);
  });
  Object.keys(groups).forEach((f) => {
    groups[f].avg = groups[f].impressions / groups[f].count;
    groups[f].avgEng = groups[f].engagement / groups[f].count;
  });
  return groups;
}
function renderFormats() {
  const body = document.getElementById("formatRows");
  body.innerHTML = "";
  const groups = groupByFormat();
  const entries = Object.entries(groups).sort((a, b) => b[1].avg - a[1].avg);
  entries.forEach(([format, g]) => {
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + escapeHtml(format) + "</td>" +
      "<td>" + g.count + "</td>" +
      "<td>" + Math.round(g.avg).toLocaleString() + "</td>" +
      "<td>" + g.avgEng.toFixed(1) + "%</td>";
    body.appendChild(tr);
  });
}
function renderTable() {
  const body = document.getElementById("postRows");
  body.innerHTML = "";
  posts.forEach((p, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + escapeHtml(p.title) + "</td>" +
      "<td>" + escapeHtml(p.format) + "</td>" +
      "<td>" + p.impressions.toLocaleString() + "</td>" +
      "<td>" + p.likes + "</td>" +
      "<td>" + p.comments + "</td>" +
      "<td>" + engagement(p).toFixed(1) + "%</td>" +
      '<td><button class="danger" type="button" data-idx="' + idx + '" title="Delete">×</button></td>';
    body.appendChild(tr);
  });
  body.querySelectorAll("button.danger").forEach((btn) => {
    btn.addEventListener("click", () => {
      posts.splice(Number(btn.getAttribute("data-idx")), 1);
      savePosts();
      render();
    });
  });
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}
document.getElementById("addBtn").addEventListener("click", () => {
  const title = document.getElementById("pTitle").value.trim();
  const format = document.getElementById("pFormat").value;
  const impressions = Number(document.getElementById("pImpressions").value);
  const likes = Number(document.getElementById("pLikes").value) || 0;
  const comments = Number(document.getElementById("pComments").value) || 0;
  const error = document.getElementById("formError");
  if (!title || !impressions) {
    error.hidden = false;
    return;
  }
  error.hidden = true;
  posts.push({ title, format, impressions, likes, comments });
  savePosts();
  render();
  document.getElementById("pTitle").value = "";
  document.getElementById("pImpressions").value = "";
  document.getElementById("pLikes").value = "";
  document.getElementById("pComments").value = "";
});
document.getElementById("resetBtn").addEventListener("click", () => {
  posts = SAMPLE_POSTS.slice();
  savePosts();
  render();
});
render();
