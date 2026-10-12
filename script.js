const categories = {
  "Artificial Intelligence": ["artificial intelligence","machine learning","deep learning","neural network","neural networks","model","prediction","dataset","classification","training","algorithm","ai","ml","tensorflow","pytorch"],
  "Programming / DSA": ["data structure","data structures","algorithm","algorithms","array","linked list","stack","queue","tree","graph","sorting","searching","recursion","java","programming","binary search","hashmap"],
  "DBMS": ["database","dbms","sql","mongodb","mysql","postgresql","table","tables","query","queries","normalization","transaction","schema","primary key","foreign key"],
  "Cyber Security": ["cybersecurity","cyber security","security","encryption","authentication","authorization","firewall","malware","phishing","password","access control","secure","vulnerability"],
  "Operating Systems": ["operating system","operating systems","process","processes","thread","threads","memory management","deadlock","cpu scheduling","file system","linux","unix","kernel","system call"],
  "Web Development": ["html","css","javascript","web development","website","frontend","backend","react","node.js","responsive","browser","api","http","web page","dom"]
};

let documents = [];
let totalConfidence = 0;

const fileInput = document.getElementById("fileInput");
const docText = document.getElementById("docText");
const fileName = document.getElementById("fileName");
const resultContent = document.getElementById("resultContent");

fileInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if(!file) return;
  fileName.textContent = file.name;
  const reader = new FileReader();
  reader.onload = () => docText.value = reader.result;
  reader.readAsText(file);
});

function tokenize(text){
  return text.toLowerCase().replace(/[^a-z0-9+#.\s-]/g," ").split(/\s+/).filter(Boolean);
}

function analyze(text){
  const lower = text.toLowerCase();
  const scores = {};
  for(const [category, words] of Object.entries(categories)){
    let score = 0;
    const matched = [];
    words.forEach(word => {
      const pattern = new RegExp("\\b" + word.replace(/[.*+?^${}()|[\]\\]/g,"\\$&") + "\\b","i");
      if(pattern.test(lower)){
        score++;
        matched.push(word);
      }
    });
    scores[category] = {score, matched};
  }
  const sorted = Object.entries(scores).sort((a,b)=>b[1].score-a[1].score);
  const best = sorted[0];
  const second = sorted[1];
  const totalWords = tokenize(text).length;
  let confidence = best[1].score === 0 ? 0.25 : Math.min(0.98, 0.58 + best[1].score*0.07 + (best[1].score-second[1].score)*0.04);
  if(totalWords < 8 && best[1].score > 0) confidence = Math.min(confidence,0.72);
  return {category: best[0], confidence, matched: best[1].matched, ranking: sorted};
}

function showResult(data){
  const pct = Math.round(data.confidence*100);
  resultContent.className = "result-box";
  resultContent.innerHTML = `
    <div style="font-size:12px;color:#8997b5">PREDICTED CATEGORY</div>
    <div class="category">${data.category}</div>
    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
      <span>Confidence</span><b>${pct}%</b>
    </div>
    <div class="meter"><div style="width:${pct}%"></div></div>
    <div style="font-size:12px;color:#8997b5;margin-top:18px">EXTRACTED KEYWORDS</div>
    <div class="tags">${data.matched.length ? data.matched.map(x=>`<span class="tag">${x}</span>`).join("") : '<span class="tag">No strong keywords detected</span>'}</div>
  `;
}

function updateStats(){
  document.getElementById("docCount").textContent = documents.length;
  document.getElementById("avgScore").textContent = documents.length ? Math.round(totalConfidence/documents.length*100)+"%" : "0%";
  document.getElementById("catCount").textContent = new Set(documents.map(d=>d.category)).size;
}

function renderSearch(list){
  const el = document.getElementById("searchResults");
  if(!list.length){
    el.innerHTML = '<div class="empty">No matching documents found.</div>';
    return;
  }
  el.innerHTML = list.map((d,i)=>`
    <div class="doc">
      <strong>${escapeHtml(d.name)} <span style="color:#67e8f9;font-weight:500">· ${d.category}</span></strong>
      <small>Confidence: ${Math.round(d.confidence*100)}% · Keywords: ${d.matched.slice(0,5).join(", ") || "none"}</small>
      <div style="color:#a1aec7;font-size:13px;margin-top:6px">${escapeHtml(d.text.slice(0,180))}${d.text.length>180?"…":""}</div>
    </div>
  `).join("");
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

document.getElementById("analyzeBtn").addEventListener("click",()=>{
  const text = docText.value.trim();
  if(!text){
    resultContent.className="empty";
    resultContent.textContent="Please upload a TXT file or paste some document text first.";
    return;
  }
  const data = analyze(text);
  showResult(data);
  const name = fileInput.files[0]?.name || `Document ${documents.length+1}`;
  documents.unshift({name,text,...data});
  totalConfidence += data.confidence;
  updateStats();
  renderSearch(documents);
});

document.getElementById("clearBtn").addEventListener("click",()=>{
  docText.value=""; fileInput.value=""; fileName.textContent="";
  resultContent.className="empty";
  resultContent.textContent="Your category, confidence score and extracted keywords will appear here.";
});

function doSearch(){
  const q = document.getElementById("searchInput").value.toLowerCase().trim();
  if(!q){renderSearch(documents);return;}
  renderSearch(documents.filter(d =>
    d.text.toLowerCase().includes(q) ||
    d.category.toLowerCase().includes(q) ||
    d.matched.some(k=>k.toLowerCase().includes(q)) ||
    d.name.toLowerCase().includes(q)
  ));
}
document.getElementById("searchBtn").addEventListener("click",doSearch);
document.getElementById("searchInput").addEventListener("input",doSearch);