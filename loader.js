(async function(){
  const el = id => document.getElementById(id);
  const inverseResult = (r='') => {
    if(/^win/i.test(r)) return r.replace(/^win/i,'lose').replace(/Higher/g,'Lower').replace(/higher/g,'lower');
    if(/^lose/i.test(r)) return r.replace(/^lose/i,'win').replace(/Lower/g,'Higher').replace(/lower/g,'higher');
    return r;
  };
  const byId = new Map();
  const person = (id, team, manager='') => {
    const t=byId.get(String(id))||{};
    return {id:String(id??''),team:team??t.team??'',manager:manager||t.manager||''};
  };
  try {
    const [raw, rules] = await Promise.all([
      fetch('./results.json',{cache:'no-store'}).then(r=>{if(!r.ok) throw new Error(`results.json: HTTP ${r.status}`); return r.json()}),
      fetch('./rules.json',{cache:'no-store'}).then(r=>r.json())
    ]);
    (raw.TEAMS||[]).forEach(x=>byId.set(String(x.TeamID),{team:x.TeamName,manager:x.Manager}));
    const teams=(raw.TEAMS||[]).map(x=>({id:String(x.TeamID),team:x.TeamName,manager:x.Manager}));
    const qualParticipants={gw14:[],gw15:[]};
    (raw['QUALIFICATION PARTICIPANTS']||[]).forEach(x=>{
      const o={id:String(x.TeamID),team:x.TeamName,manager:x.Manager,status:x.Status,overallRank:x.OverallRank,qualRank:x.QualificationRank,qualRank15:x.QualificationRank,totalPoints:x.TotalPoints};
      (Number(x.GW)===14?qualParticipants.gw14:qualParticipants.gw15).push(o);
    });
    const qualification={gw14:[],gw15:[]};
    (raw['QUALIFICATION MATCHES']||[]).forEach(x=>{
      const ar=x.Result||'', br=inverseResult(ar);
      const m={match:Number(x.Match),a:{...person(x.Team1ID,x.Team1,x.Team1Manager),score:x.Team1Points,result:ar},b:{...person(x.Team2ID,x.Team2,x.Team2Manager),score:x.Team2Points,result:br},winner:x.Winner};
      (Number(x.GW)===14?qualification.gw14:qualification.gw15).push(m);
    });
    const standings=(raw['GROUP STANDINGS']||[]).map(x=>({rank:x.Position,status:x.Status,id:String(x.TeamID),team:x.TeamName,manager:x.Manager,mp:x.MP,gd:x.GD,pts:x.TournamentPoints,w:x.W,d:x.D,l:x.L,max:x.MaxScore}));
    const pots=[];
    for(let n=1;n<=10;n++) pots.push({pot:n,teams:(raw.POTS||[]).filter(x=>Number(x.Pot)===n).map(x=>({rank:x.Position,id:String(x.TeamID),team:x.TeamName,manager:x.Manager}))});
    const schedule={};
    for(let gw=16;gw<=25;gw++){
      const matches=(raw['GROUP SCHEDULE']||[]).filter(x=>Number(x.GW)===gw).map(x=>({match:Number(x.Match),pair:'',a:{...person(x.Team1ID,x.Team1),score:'',mp:'',gd:''},b:{...person(x.Team2ID,x.Team2),score:'',mp:'',gd:''}}));
      schedule['gw'+gw]={label:`Кръг ${gw-15} • GW${gw}`,matches};
    }
    const playoffRows=raw.PLAYOFF||[], playoff=[];
    for(let i=0;i<playoffRows.length;i+=2){
      const a=playoffRows[i],b=playoffRows[i+1]; if(!a||!b) continue;
      playoff.push({match:i/2+1,a:{...person(a.TeamID,a.TeamName,a.Manager),seed:a.Seed,gw26:a.GW26,gw27:a.GW27,total:a.Total,result:a.Result},b:{...person(b.TeamID,b.TeamName,b.Manager),seed:b.Seed,gw26:b.GW26,gw27:b.GW27,total:b.Total,result:b.Result}});
    }
    const stageMap={
      '1/32':['r32','1/32','GW28–29'],'1/16':['r16','1/16','GW30–31'],'1/8':['r8','1/8','GW32–33'],'1/4':['r4','1/4','GW34–35'],'1/2':['r2','1/2','GW36–37'],
      'Final':['final','Финал','GW38'],'3rd Place':['final','Финал','GW38']
    };
    const knockout={r32:{label:'1/32',gw:'GW28–29',matches:[]},r16:{label:'1/16',gw:'GW30–31',matches:[]},r8:{label:'1/8',gw:'GW32–33',matches:[]},r4:{label:'1/4',gw:'GW34–35',matches:[]},r2:{label:'1/2',gw:'GW36–37',matches:[]},final:{label:'Финал',gw:'GW38',matches:[]}};
    (raw.KNOCKOUT||[]).forEach(x=>{
      const sm=stageMap[x.Stage]; if(!sm) return; const [key]=sm; const ar=x.Result||'',br=inverseResult(ar);
      knockout[key].matches.push({match:key==='final'?(x.Stage==='Final'?1:2):Number(x.Match),stage:x.Stage,a:{...person(x.Team1ID,x.Team1),total:x.Team1Total,result:ar},b:{...person(x.Team2ID,x.Team2),total:x.Team2Total,result:br}});
    });
    const groupQualified=(raw['GROUP QUALIFIED']||[]).map(x=>({rank:x.Position,status:x.Status,id:String(x.TeamID),team:x.TeamName,manager:x.Manager,link:x.TeamLink}));
    const podium={};
    (raw['TOURNAMENT PODIUM']||[]).forEach(x=>{const p=person(x.TeamID,x.TeamName); podium[x.Position]={...p,position:x.Position};});
    window.FPLBG_DATA={meta:{source:'V5 Optimisation',version:'Website V25',note:'Live JSON data from Public Export'},teams,qualification,standings,pots,playoff,knockout,rules,schedule,qualParticipants,groupQualified,podium};
    const s=document.createElement('script'); s.src='app.js?v=22'; document.body.appendChild(s);
  } catch(err){
    console.error(err);
    const box=document.createElement('div'); box.className='loaderror'; box.innerHTML='<b>Грешка при зареждане на results.json</b><br>'+String(err.message||err); document.body.prepend(box);
  }
})();
