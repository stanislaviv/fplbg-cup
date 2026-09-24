
function standingStatusClass(status){
  const s=norm(status);
  if(s.includes('play')) return 'row-playoff';
  if(s.includes('qual') || s.includes('класи')) return 'row-qualified';
  if(s.includes('elim') || s.includes('out') || s.includes('отпад')) return 'row-eliminated';
  return '';
}

const D=window.FPLBG_DATA,$=id=>document.getElementById(id);
function norm(v){return String(v??'').toLowerCase()}
function hit(x,q){return !q||norm(`${x.id} ${x.team} ${x.manager}`).includes(norm(q))}
function statusClass(x,i){return i<32?'directrow':i<96?'porow':'outrow'}
function renderStandings(){let q=$('tableSearch').value,f=$('statusFilter').value; $('standings').innerHTML='';D.standings.forEach((x,i)=>{let b=i<32?'Qualified':i<96?'Play-off':'Eliminated';if(!hit(x,q)||(f&&b!==f))return;$('standings').innerHTML+=`<tr class="${statusClass(x,i)}"><td><b>${x.rank}</b></td><td>${b}</td><td>${x.id}</td><td><b>${x.team}</b></td><td>${x.manager}</td><td><b>${x.mp}</b></td><td>${Number(x.gd)>0?'+':''}${x.gd}</td><td>${x.pts}</td><td>${x.w}</td><td>${x.d}</td><td>${x.l}</td><td>${x.max}</td></tr>`})}
function matchCard(m,round){let win=x=>norm(x.result).startsWith('win')?' winner':'';let score=x=>round==='final'?x.total:(x.total??x.score);return `<article class="matchcard"><div class="matchtop"><span>${round.toUpperCase()} • Match ${m.match}</span></div><div class="teamline${win(m.a)}"><div><b>${m.a.team}</b><small>${m.a.manager} • ID ${m.a.id}${m.a.seed?' • Seed '+m.a.seed:''}</small></div><strong>${score(m.a)}</strong></div><div class="teamline${win(m.b)}"><div><b>${m.b.team}</b><small>${m.b.manager} • ID ${m.b.id}${m.b.seed?' • Seed '+m.b.seed:''}</small></div><strong>${score(m.b)}</strong></div><div class="decision">${norm(m.a.result).startsWith('win')?m.a.result:m.b.result||''}</div></article>`}
let qualPage=1,poPage=1,koPage=1,PER=20;
function pager(arr,page,fn,id){let pages=Math.max(1,Math.ceil(arr.length/PER));page=Math.min(page,pages);let start=(page-1)*PER;let cards=arr.slice(start,start+PER).map(fn).join('');let nav=pages>1?`<div class="pager"><button onclick="${id}Prev()">‹</button><span>Страница ${page} / ${pages} • ${arr.length} двойки</span><button onclick="${id}Next()">›</button></div>`:'';return {html:cards||'<p class="muted">Няма съвпадение.</p>',nav,pages,page}}
function renderQual(){let r=$('qualRound').value,q=$('qualSearch').value;let arr=D.qualification[r].filter(m=>hit(m.a,q)||hit(m.b,q));let p=pager(arr,qualPage,m=>matchCard(m,r),'qual');qualPage=p.page;$('qualMatches').innerHTML=p.nav+p.html+p.nav}
function qualPrev(){qualPage=Math.max(1,qualPage-1);renderQual()} function qualNext(){qualPage++;renderQual()}
function renderPO(){let q=$('poSearch').value;let arr=D.playoff.filter(m=>hit(m.a,q)||hit(m.b,q));let p=pager(arr,poPage,m=>matchCard(m,'play-off'),'po');poPage=p.page;$('playoffMatches').innerHTML=p.nav+p.html+p.nav}
function poPrev(){poPage=Math.max(1,poPage-1);renderPO()} function poNext(){poPage++;renderPO()}
function renderKO(){let key=$('koRound').value,q=$('koSearch').value,r=D.knockout[key],arr=r.matches.filter(m=>hit(m.a,q)||hit(m.b,q));$('koSummary').innerHTML=`<b>${r.label}</b><span>${r.gw}</span><span>${r.matches.length} двойки</span>`;let p=pager(arr,koPage,m=>matchCard(m,key==='final'?'final':r.label),'ko');koPage=p.page;$('knockoutMatches').innerHTML=p.nav+p.html+p.nav}
function koPrev(){koPage=Math.max(1,koPage-1);renderKO()} function koNext(){koPage++;renderKO()}
function renderPots(){D.pots.forEach(p=>{let rows=p.teams.map((x,i)=>`<tr><td>${i+1}</td><td><b>${x.team}</b><small>${x.manager}</small></td><td>${x.rank}</td></tr>`).join('');$('potsGrid').innerHTML+=`<article class="potcard"><div class="pottitle"><b>Pot ${p.pot}</b><span>${p.teams.length} отбора</span></div><div class="tablewrap"><table><thead><tr><th>#</th><th>Отбор</th><th>Seed</th></tr></thead><tbody>${rows}</tbody></table></div></article>`})}
function ruleIcon(title){
  let t=norm(title);
  if(t.includes('квалиф')) return '🎯';
  if(t.includes('груп')) return '🏟️';
  if(t.includes('play')||t.includes('плей')) return '⚔️';
  if(t.includes('директ')) return '🏆';
  if(t.includes('финал')) return '🥇';
  return '📘';
}
function rulePretty(p){
  let cls='';
  let t=norm(p);
  if(t.includes('критер')||t.includes('класират')||t.includes('при равен')||t.includes('tie-break')||t.includes('нетни точки')) cls='rule-highlight';
  return `<p class="${cls}">${p}</p>`;
}
function renderRules(){
  const intro=`<div class="rules-intro">
    <div class="rule-stat"><strong>608</strong><span>СТАРТИРАЩИ ОТБОРА</span></div>
    <div class="rule-stat"><strong>200</strong><span>ГРУПОВА ФАЗА</span></div>
    <div class="rule-stat"><strong>64</strong><span>ДИРЕКТНИ ЕЛИМИНАЦИИ</span></div>
    <div class="rule-stat"><strong>1 🏆</strong><span>ШАМПИОН</span></div>
  </div>`;
  $('rulesFull').innerHTML=intro+D.rules.map((s,i)=>`<details ${i===0?'open':''}>
    <summary><span class="rule-icon">${ruleIcon(s.title)}</span>${s.title}</summary>
    <div class="rulebody">${s.paragraphs.map(rulePretty).join('')}</div>
  </details>`).join('');
}
function searchTeam(){let q=$('search').value.trim(),r=$('searchResult');if(!q){r.textContent='Въведи Team ID, име на отбор или мениджър.';return}let x=D.standings.find(x=>hit(x,q))||D.teams.find(x=>hit(x,q));if(!x){r.textContent='Няма съвпадение във V5 snapshot.';return}let s=D.standings.find(y=>y.id===x.id),pot=D.pots.find(p=>p.teams.some(y=>y.id===x.id));let qs=[];for(const [gw,a] of Object.entries(D.qualification))for(const m of a)if(m.a.id===x.id||m.b.id===x.id)qs.push(`${gw.toUpperCase()} ${m.a.id===x.id?m.a.score:m.b.score} pts`);let po=D.playoff.find(m=>m.a.id===x.id||m.b.id===x.id);let ko=[];for(const rr of Object.values(D.knockout))for(const m of rr.matches)if(m.a.id===x.id||m.b.id===x.id)ko.push(rr.label);r.innerHTML=`<b>${x.team}</b> • ${x.manager} • Team ID ${x.id}${s?` • Group #${s.rank} • MP ${s.mp} • GD ${Number(s.gd)>0?'+':''}${s.gd}`:''}${pot?` • Pot ${pot.pot}`:''}${qs.length?` • ${qs.join(' • ')}`:''}${po?' • Play-off':''}${ko.length?' • KO: '+ko.join(' → '):''}`}

renderStandings();renderPots();renderQual();renderPO();renderKO();renderRules();
$('tableSearch').addEventListener('input',renderStandings);$('statusFilter').addEventListener('change',renderStandings);
$('qualSearch').addEventListener('input',()=>{qualPage=1;renderQual()});$('qualRound').addEventListener('change',()=>{qualPage=1;renderQual()});
$('poSearch').addEventListener('input',()=>{poPage=1;renderPO()});$('koSearch').addEventListener('input',()=>{koPage=1;renderKO()});$('koRound').addEventListener('change',()=>{koPage=1;renderKO()});
$('search').addEventListener('keydown',e=>{if(e.key==='Enter')searchTeam()});
$('menuBtn').onclick=()=>$('nav').classList.toggle('open');document.querySelectorAll('nav a').forEach(a=>a.onclick=()=>$('nav').classList.remove('open'));

let koView='cards';
function setKOView(v){
  koView=v;
  $('cardsBtn').classList.toggle('active',v==='cards');
  $('treeBtn').classList.toggle('active',v==='tree');
  $('knockoutMatches').classList.toggle('hidden',v==='tree');
  $('bracketTree').classList.toggle('hidden',v==='cards');
  if(v==='tree') renderBracketTree();
}
function miniTeam(x){
  let w=norm(x.result).startsWith('win');
  return `<div class="bteam ${w?'bwinner':''}"><span>${x.team}</span><b>${x.total??x.gw1??''}</b></div>`;
}
function miniMatch(m){return `<div class="bmatch">${miniTeam(m.a)}${miniTeam(m.b)}</div>`}
function renderBracketTree(){
  const rounds=['r32','r16','r8','r4','r2'];
  let cols=rounds.map(k=>{
    let r=D.knockout[k], half=Math.ceil(r.matches.length/2);
    return {k,label:r.label,left:r.matches.slice(0,half),right:r.matches.slice(half)}
  });
  let left=cols.map(c=>`<div class="bcol"><h4>${c.label}</h4><div class="bmatches">${c.left.map(miniMatch).join('')}</div></div>`).join('');
  let right=cols.slice().reverse().map(c=>`<div class="bcol"><h4>${c.label}</h4><div class="bmatches">${c.right.map(miniMatch).join('')}</div></div>`).join('');
  let f=D.knockout.final.matches;
  let center=`<div class="bcol finalcol"><h4>ФИНАЛ • GW38</h4><div class="bmatches">${f.map(miniMatch).join('')}</div></div>`;
  $('bracketTree').innerHTML=`<div class="bracketcanvas"><div class="bside leftside">${left}</div>${center}<div class="bside rightside">${right}</div></div><p class="bracketnote">Desktop изглед: лява и дясна половина на схемата. На телефон използвай „Карти“ за най-добра четимост.</p>`;
}
const sections=[...document.querySelectorAll('main section[id],header [id="home"]')];
const navLinks=[...document.querySelectorAll('#nav a')];
window.addEventListener('scroll',()=>{
 let cur='home'; sections.forEach(x=>{if(window.scrollY>=x.offsetTop-130)cur=x.id});
 navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+cur));
});
