
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
function matchCard(m,round){let win=x=>norm(x.result).startsWith('win')?' winner':'';let score=x=>round==='final'?x.total:(x.total??x.score);let leg=x=>{if(!m.legs)return '';let vals=x===m.a?m.legs.a:m.legs.b,[g1,g2]=m.legs.gws;return `<small class="legscore">GW${g1} ${vals[0]} • GW${g2} ${vals[1]}</small>`};return `<article class="matchcard"><div class="matchtop"><span>${round.toUpperCase()} • Match ${m.match}</span></div><div class="teamline${win(m.a)}"><div><b>${m.a.team}</b><small>${m.a.manager} • ID ${m.a.id}${m.a.seed?' • Seed '+m.a.seed:''}</small>${leg(m.a)}</div><strong>${score(m.a)}</strong></div><div class="teamline${win(m.b)}"><div><b>${m.b.team}</b><small>${m.b.manager} • ID ${m.b.id}${m.b.seed?' • Seed '+m.b.seed:''}</small>${leg(m.b)}</div><strong>${score(m.b)}</strong></div><div class="decision">${norm(m.a.result).startsWith('win')?m.a.result:m.b.result||''}</div></article>`}
let qualPage=1,poPage=1,koPage=1,PER=20;
function pager(arr,page,fn,id){let pages=Math.max(1,Math.ceil(arr.length/PER));page=Math.min(page,pages);let start=(page-1)*PER;let cards=arr.slice(start,start+PER).map(fn).join('');let nav=pages>1?`<div class="pager"><button onclick="${id}Prev()">‹</button><span>Страница ${page} / ${pages} • ${arr.length} двойки</span><button onclick="${id}Next()">›</button></div>`:'';return {html:cards||'<p class="muted">Няма съвпадение.</p>',nav,pages,page}}
function renderQual(){let r=$('qualRound').value,q=$('qualSearch').value;let arr=D.qualification[r].filter(m=>hit(m.a,q)||hit(m.b,q));let p=pager(arr,qualPage,m=>matchCard(m,r),'qual');qualPage=p.page;$('qualMatches').innerHTML=p.nav+p.html+p.nav}
function qualPrev(){qualPage=Math.max(1,qualPage-1);renderQual()} function qualNext(){qualPage++;renderQual()}
function renderPO(){let q=$('poSearch').value;let arr=D.playoff.filter(m=>hit(m.a,q)||hit(m.b,q));let p=pager(arr,poPage,m=>matchCard(m,'play-off'),'po');poPage=p.page;$('playoffMatches').innerHTML=p.nav+p.html+p.nav}
function poPrev(){poPage=Math.max(1,poPage-1);renderPO()} function poNext(){poPage++;renderPO()}
function renderKO(){
  let key=$('koRound').value,q=$('koSearch').value,r=D.knockout[key],arr=r.matches.filter(m=>hit(m.a,q)||hit(m.b,q));
  $('koSummary').innerHTML=`<b>${r.label}</b><span>${r.gw}</span><span>${r.matches.length} ${key==='final'?'мача':'двойки'}</span>`;
  const card=(m)=>{
    if(key!=='final') return matchCard(m,r.label);
    const title=m.match===1?'🏆 ФИНАЛ • GW38':'🥉 ПЛЕЙОФ ЗА 3-ТО МЯСТО • GW38';
    let win=x=>norm(x.result).startsWith('win')?' winner':'';
    return `<article class="matchcard"><div class="matchtop"><span>${title}</span></div><div class="teamline${win(m.a)}"><div><b>${m.a.team}</b><small>${m.a.manager} • ID ${m.a.id}</small></div><strong>${m.a.total}</strong></div><div class="teamline${win(m.b)}"><div><b>${m.b.team}</b><small>${m.b.manager} • ID ${m.b.id}</small></div><strong>${m.b.total}</strong></div><div class="decision">${norm(m.a.result).startsWith('win')?m.a.result:m.b.result||''}</div></article>`;
  };
  let p=pager(arr,koPage,card,'ko');koPage=p.page;$('knockoutMatches').innerHTML=p.nav+p.html+p.nav
}
function koPrev(){koPage=Math.max(1,koPage-1);renderKO()} function koNext(){koPage++;renderKO()}
function renderPots(){
  const q=$('potsSearch')?.value.trim()||'', result=$('potsSearchResult');
  let found=[];
  D.pots.forEach(p=>p.teams.forEach(x=>{if(q&&hit(x,q))found.push({...x,pot:p.pot})}));
  if(result){
    if(!q){result.className='result muted';result.textContent='Въведи Team ID, име на отбор или мениджър, за да видиш в коя урна е.'}
    else if(!found.length){result.className='result muted';result.textContent='Няма съвпадение в урните.'}
    else {result.className='result potresult';result.innerHTML=found.map(x=>`<div><b>${x.team}</b> • ${x.manager} • Team ID ${x.id} → <strong>Урна ${x.pot}</strong> • Seed ${x.rank}</div>`).join('')}
  }
  $('potsGrid').innerHTML='';
  D.pots.forEach(p=>{
    let rows=p.teams.map((x,i)=>{const match=q&&hit(x,q);return `<tr class="${match?'potmatch':''}"><td>${i+1}</td><td class="potteam"><b>${x.team}</b><span class="potmanager"> • ${x.manager}</span></td><td>${x.rank}</td></tr>`}).join('');
    const cardHit=found.some(x=>x.pot===p.pot);
    $('potsGrid').innerHTML+=`<article class="potcard${cardHit?' potcardmatch':''}"><div class="pottitle"><b>Урна ${p.pot}</b><span>${p.teams.length} отбора</span></div><div class="tablewrap"><table><thead><tr><th>#</th><th>Отбор • Мениджър</th><th>Seed</th></tr></thead><tbody>${rows}</tbody></table></div></article>`
  })
}
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
    <a class="rule-stat rule-full-link" href="https://github.com/stanislaviv/fplbg-cup/blob/main/Rules/Rules%20FPL%20BG%20CUP%2026%20-%2027_V6_2026-09-26_.docx" target="_blank" rel="noopener noreferrer" aria-label="Отвори пълните правила"><strong>📄</strong><span>ПЪЛНИ ПРАВИЛА</span></a>
  </div>`;
  $('rulesFull').innerHTML=intro+D.rules.map((s,i)=>`<details>
    <summary><span class="rule-icon">${ruleIcon(s.title)}</span>${s.title}</summary>
    <div class="rulebody">${s.paragraphs.map(rulePretty).join('')}</div>
  </details>`).join('');
}
function searchTeam(){
  let q=$('search').value.trim(),r=$('searchResult');
  if(!q){r.textContent='Въведи Team ID, име на отбор или мениджър.';return}
  let x=D.standings.find(x=>hit(x,q))||D.groupQualified?.find(x=>hit(x,q))||D.teams.find(x=>hit(x,q));
  if(!x){r.textContent='Няма съвпадение във V5 snapshot.';return}
  const id=String(x.id), team=x.team, manager=x.manager;
  const s=D.standings.find(y=>String(y.id)===id), gq=D.groupQualified?.find(y=>String(y.id)===id);
  const pot=D.pots.find(p=>p.teams.some(y=>String(y.id)===id));
  const qp14=(D.qualParticipants?.gw14||[]).find(y=>String(y.id)===id), qp15=(D.qualParticipants?.gw15||[]).find(y=>String(y.id)===id);
  const q14=(D.qualification?.gw14||[]).find(m=>String(m.a.id)===id||String(m.b.id)===id);
  const q15=(D.qualification?.gw15||[]).find(m=>String(m.a.id)===id||String(m.b.id)===id);
  const po=(D.playoff||[]).find(m=>String(m.a.id)===id||String(m.b.id)===id);
  const koRounds=[['r32','1/32 • GW28–29'],['r16','1/16 • GW30–31'],['r8','1/8 • GW32–33'],['r4','1/4 • GW34–35'],['r2','1/2 • GW36–37'],['final','GW38']];
  const side=(m)=>String(m.a.id)===id?m.a:m.b, opp=(m)=>String(m.a.id)===id?m.b:m.a;
  const resultBG=(v='')=>norm(v).startsWith('win')?'Класиран':norm(v).startsWith('lose')?'Отпаднал':'';
  const rows=[];
  if(gq&&norm(gq.status).includes('шампион')) rows.push(['GW13','🏆 Действащ шампион','Гарантирано място • Position #20']);
  else if(gq&&norm(gq.status).includes('директ')) rows.push(['GW13','Директно класиран',`Position #${gq.rank}`]);
  else if(qp14||q14||qp15||q15) rows.push(['GW13','Квалификации',qp14?.qualRank?`Qualification seed #${qp14.qualRank}`:'Участник']);
  if(q14){let me=side(q14),o=opp(q14);rows.push(['GW14',resultBG(me.result),`vs ${o.team} • ${me.score}–${o.score}`])}
  else if(qp14&&qp15) rows.push(['GW14','Bye','Класиран директно за GW15']);
  if(q15){let me=side(q15),o=opp(q15);rows.push(['GW15',resultBG(me.result),`vs ${o.team} • ${me.score}–${o.score}`])}
  if(gq) rows.push(['Групова фаза','Класиран',`Position #${gq.rank}${pot?' • Урна '+pot.pot:''}`]);
  if(s){let gs=Number(s.rank)<=32?'Директно към 1/32':Number(s.rank)<=96?'Play-off':'Отпаднал';rows.push(['След GW25',gs,`#${s.rank} • MP ${s.mp} • GD ${Number(s.gd)>0?'+':''}${s.gd} • Турнирни точки ${s.pts}`])}
  if(po){let me=side(po),o=opp(po),li=po.legs?(String(po.a.id)===id?` • GW26 ${po.legs.a[0]} • GW27 ${po.legs.a[1]}`:` • GW26 ${po.legs.b[0]} • GW27 ${po.legs.b[1]}`):'';rows.push(['Play-off • GW26–27',resultBG(me.result),`vs ${o.team} • ${me.total}–${o.total}${li}`])}
  koRounds.forEach(([key,label])=>{let m=(D.knockout?.[key]?.matches||[]).find(m=>String(m.a.id)===id||String(m.b.id)===id);if(!m)return;let me=side(m),o=opp(m);let stage=m.stage==='3rd Place'?'3-то място • GW38':m.stage==='Final'?'Финал • GW38':label;let li=m.legs?(()=>{let vals=String(m.a.id)===id?m.legs.a:m.legs.b;return ` • GW${m.legs.gws[0]} ${vals[0]} • GW${m.legs.gws[1]} ${vals[1]}`})():'';rows.push([stage,resultBG(me.result),`vs ${o.team} • ${me.total}–${o.total}${li}`])});
  const podium=Object.values(D.podium||{}).find(y=>String(y.id)===id);
  if(podium){let txt=podium.position==='Champion'?'🏆 Шампион':podium.position==='RunnerUp'?'🥈 Второ място':'🥉 Трето място';rows.push(['Краен резултат',txt,'FPLBG Cup 2026/27'])}
  let current=s?(Number(s.rank)<=32?'Директно класиран':Number(s.rank)<=96?'Плейоф':'Отпаднал'):gq?'Класиран за груповата фаза':'Квалификации';
  r.className='result teamjourney';
  r.innerHTML=`<div class="journeyhead"><b>${team}</b> • ${manager} • Team ID ${id}</div><div class="journeysummary">${s?`Позиция #${s.rank} • `:''}Статус: ${current}${pot?` • Урна ${pot.pot}`:''}</div><div class="journeytitle">Път в турнира</div><div class="journeylist">${rows.map(z=>`<div class="journeyrow"><span>${z[0]}</span><strong>${z[1]}</strong><em>${z[2]}</em></div>`).join('')}</div>`;
}


function renderQualParticipants(){
  const round=$('qualParticipantsRound').value;
  const table=$('qualParticipantsTable'), empty=$('qualParticipantsEmpty'), count=$('qualParticipantsCount');
  if(!round){
    table.classList.add('hidden'); empty.classList.remove('hidden'); count.textContent='Избери кръг';
    $('qualParticipants').innerHTML=''; $('qualParticipantsHead').innerHTML=''; return;
  }
  empty.classList.add('hidden'); table.classList.remove('hidden');
  const q=$('qualParticipantsSearch').value;
  const arr=(D.qualParticipants?.[round]||[]).filter(x=>hit(x,q));
  const total=(D.qualParticipants?.[round]||[]).length;
  count.textContent=`${total} отбора`;
  if(round==='gw14'){
    $('qualParticipantsHead').innerHTML='<tr><th>Team ID</th><th>Отбор</th><th>Мениджър</th><th>Total Points</th><th>Total Overall Rank</th><th>Статус</th></tr>';
    $('qualParticipants').innerHTML=arr.map(x=>`<tr><td>${x.id}</td><td><b>${x.team}</b></td><td>${x.manager}</td><td>${x.totalPoints??''}</td><td>${x.overallRank??''}</td><td>${x.status??''}</td></tr>`).join('')||'<tr><td colspan="6" class="muted">Няма съвпадение.</td></tr>';
  }else{
    $('qualParticipantsHead').innerHTML='<tr><th>Team ID</th><th>Отбор</th><th>Мениджър</th><th>Статус</th><th>Rank Qualification GW15</th></tr>';
    $('qualParticipants').innerHTML=arr.map(x=>`<tr><td>${x.id}</td><td><b>${x.team}</b></td><td>${x.manager}</td><td>${x.status??''}</td><td>${x.qualRank15??''}</td></tr>`).join('')||'<tr><td colspan="5" class="muted">Няма съвпадение.</td></tr>';
  }
}
function renderGroupQualified(){
  const q=$('groupQualifiedSearch').value;
  const arr=(D.groupQualified||[]).filter(x=>hit(x,q));
  $('groupQualified').innerHTML=arr.map(x=>`<tr><td><b>${x.rank}</b></td><td>${x.id}</td><td><b>${x.team}</b></td><td>${x.manager}</td><td>${x.status??''}</td></tr>`).join('')||'<tr><td colspan="5" class="muted">Няма съвпадение.</td></tr>';
}


const GROUP_SCHEMES={
  gw16:'P1–P10 | P2–P9 | P3–P8 | P4–P7 | P5–P6',
  gw17:'P1–P9 | P10–P8 | P2–P7 | P3–P6 | P4–P5',
  gw18:'P1–P8 | P9–P7 | P10–P6 | P2–P5 | P3–P4',
  gw19:'P1–P7 | P8–P6 | P9–P5 | P10–P4 | P2–P3',
  gw20:'P1–P6 | P7–P5 | P8–P4 | P9–P3 | P10–P2',
  gw21:'P1–P5 | P6–P4 | P7–P3 | P8–P2 | P9–P10',
  gw22:'P1–P4 | P5–P3 | P6–P2 | P7–P10 | P8–P9',
  gw23:'P1–P3 | P4–P2 | P5–P10 | P6–P9 | P7–P8',
  gw24:'P1–P2 | P3–P10 | P4–P9 | P5–P8 | P6–P7',
  gw25:'P1–P1 | P2–P2 | P3–P3 | P4–P4 | P5–P5 | P6–P6 | P7–P7 | P8–P8 | P9–P9 | P10–P10'
};
let schedulePage=1;
function scheduleCard(m,r){
  const hasScore=m.a.score!==''&&m.a.score!=null&&m.b.score!==''&&m.b.score!=null;
  const aWin=hasScore&&Number(m.a.score)>Number(m.b.score), bWin=hasScore&&Number(m.b.score)>Number(m.a.score);
  const meta=x=>`ID ${x.id}`;
  const score=x=>hasScore?`<strong>${x.score}</strong>`:'';
  const gd=x=>`${Number(x.gd)>0?'+':''}${x.gd}`;
  const decision=hasScore?`Match points ${m.a.mp}–${m.b.mp} • GD ${gd(m.a)} / ${gd(m.b)}`:'';
  return `<article class="matchcard"><div class="matchtop"><span>${r.label}${m.pair?' • '+m.pair:''} • Match ${m.match}</span></div><div class="teamline${aWin?' winner':''}"><div><b>${m.a.team}</b><small>${meta(m.a)}</small></div>${score(m.a)}</div><div class="teamline${bWin?' winner':''}"><div><b>${m.b.team}</b><small>${meta(m.b)}</small></div>${score(m.b)}</div><div class="decision">${decision}</div></article>`;
}
function renderSchedule(){
  const key=$('scheduleRound').value,q=$('scheduleSearch').value,r=D.schedule[key];
  const arr=r.matches.filter(m=>hit(m.a,q)||hit(m.b,q));
  $('scheduleSummary').innerHTML=`<b>${r.label}</b><span>${r.matches.length} мача</span><span>${arr.length===r.matches.length?'Всички двойки':arr.length+' намерени'}</span><div class="schemeline"><strong>Схема:</strong> ${GROUP_SCHEMES[key]||''}</div>`;
  const p=pager(arr,schedulePage,m=>scheduleCard(m,r),'schedule');schedulePage=p.page;
  $('scheduleMatches').innerHTML=p.nav+p.html+p.nav;
}
function schedulePrev(){schedulePage=Math.max(1,schedulePage-1);renderSchedule()}
function scheduleNext(){schedulePage++;renderSchedule()}

renderQualParticipants();renderQual();renderGroupQualified();renderStandings();renderPots();renderSchedule();renderPO();renderKO();renderRules();
$('qualParticipantsSearch').addEventListener('input',renderQualParticipants);$('qualParticipantsRound').addEventListener('change',renderQualParticipants);$('groupQualifiedSearch').addEventListener('input',renderGroupQualified);
$('potsSearch').addEventListener('input',renderPots);
$('tableSearch').addEventListener('input',renderStandings);$('statusFilter').addEventListener('change',renderStandings);
$('qualSearch').addEventListener('input',()=>{qualPage=1;renderQual()});$('qualRound').addEventListener('change',()=>{qualPage=1;renderQual()});
$('scheduleSearch').addEventListener('input',()=>{schedulePage=1;renderSchedule()});$('scheduleRound').addEventListener('change',()=>{schedulePage=1;renderSchedule()});
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
  const finalMatch=f[0], thirdMatch=f[1];
  const champion=D.podium?.Champion||{};
  const third=D.podium?.ThirdPlace||{};
  let center=`<div class="bcol finalcol podiumcol">
    <div class="championhero"><div class="trophy">🏆</div><small>FPLBG CUP CHAMPION 2026/27</small><strong>${champion.team}</strong><span>${champion.manager}</span></div>
    <h4>ФИНАЛ • GW38</h4><div class="bmatches finalmatchonly">${miniMatch(finalMatch)}</div>
    <div class="thirdhero"><small>🥉 3-ТО МЯСТО</small><strong>${third.team}</strong><span>${third.manager}</span><em>Победител в плейофа за 3-то място</em></div>
  </div>`;
  $('bracketTree').innerHTML=`<div class="bracketcanvas"><div class="bside leftside">${left}</div>${center}<div class="bside rightside">${right}</div></div><p class="bracketnote">Desktop изглед: лява и дясна половина на схемата. На телефон използвай „Карти“ за най-добра четимост.</p>`;
}
document.querySelectorAll('main section[id]').forEach(sec=>{const head=sec.querySelector('.sectionhead');if(head){const a=document.createElement('a');a.href='#home';a.className='homejump';a.innerHTML='⌂ Начало';head.appendChild(a)}});
const sections=[...document.querySelectorAll('main section[id],header [id="home"]')];
const navLinks=[...document.querySelectorAll('#nav a')];
window.addEventListener('scroll',()=>{
 let cur='home'; sections.forEach(x=>{if(window.scrollY>=x.offsetTop-130)cur=x.id});
 navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+cur));
});
