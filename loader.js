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
    let standings=(raw['GROUP STANDINGS']||[]).map(x=>({rank:x.Position,status:x.Status,id:String(x.TeamID),team:x.TeamName,manager:x.Manager,mp:(Number(x.W)||0)+(Number(x.D)||0)+(Number(x.L)||0),gd:x.GD,pts:x.TournamentPoints,w:x.W,d:x.D,l:x.L,max:x.MaxScore}));
    const pots=[];
    for(let n=1;n<=10;n++) pots.push({pot:n,teams:(raw.POTS||[]).filter(x=>Number(x.Pot)===n).map(x=>({rank:x.Position,id:String(x.TeamID),team:x.TeamName,manager:x.Manager}))});
    const schedule={};
    for(let gw=16;gw<=25;gw++){
      const matches=(raw['GROUP SCHEDULE']||[]).filter(x=>Number(x.GW)===gw).map(x=>({match:Number(x.Match),pair:'',a:{...person(x.Team1ID,x.Team1),score:x.Team1Score,mp:x.Team1MP,gd:x.Team1GD},b:{...person(x.Team2ID,x.Team2),score:x.Team2Score,mp:x.Team2MP,gd:x.Team2GD}}));
      schedule['gw'+gw]={label:`Кръг ${gw-15} • GW${gw}`,matches};
    }

    // V30.8: Group standings exist as soon as the 200-team group field is known.
    // If the export does not yet contain GROUP STANDINGS (QA/early phase), build a live table
    // only from group matches whose scores are actually present. Future fixtures never count.
    if(!standings.length && (raw['GROUP QUALIFIED']||[]).length){
      const live=(raw['GROUP QUALIFIED']||[]).map((x,i)=>({
        rank:i+1,status:'',id:String(x.TeamID),team:x.TeamName,manager:x.Manager,
        mp:0,gd:0,pts:0,w:0,d:0,l:0,max:0,_seed:i+1
      }));
      const lm=new Map(live.map(x=>[x.id,x]));
      (raw['GROUP SCHEDULE']||[]).forEach(m=>{
        if(m.Team1Score==null || m.Team2Score==null) return;
        const a=lm.get(String(m.Team1ID)), b=lm.get(String(m.Team2ID)); if(!a||!b) return;
        const as=Number(m.Team1Score)||0, bs=Number(m.Team2Score)||0;
        a.mp+=1; b.mp+=1;
        a.gd+=as-bs; b.gd+=bs-as; a.pts+=as; b.pts+=bs;
        a.max=Math.max(a.max,as); b.max=Math.max(b.max,bs);
        if(as>bs){a.w++;b.l++;} else if(bs>as){b.w++;a.l++;} else {a.d++;b.d++;}
      });
      live.sort((a,b)=>b.mp-a.mp || b.gd-a.gd || b.pts-a.pts || b.w-a.w || b.max-a.max || a._seed-b._seed);
      live.forEach((x,i)=>{x.rank=i+1;x.status=i<32?'Qualified':i<96?'Play-off':'Eliminated';delete x._seed;});
      standings=live;
    }
    const legSets={
      playoff:{rows:raw['PLAYOFF LEGS']||[],gws:[26,27]},
      r32:{rows:raw['R32 LEGS']||[],gws:[28,29]},
      r16:{rows:raw['R16 LEGS']||[],gws:[30,31]},
      r8:{rows:raw['R8 LEGS']||[],gws:[32,33]},
      r4:{rows:raw['QF LEGS']||[],gws:[34,35]},
      r2:{rows:raw['SF LEGS']||[],gws:[36,37]}
    };
    const legsFor=(key,match)=>{
      const set=legSets[key]; if(!set) return null;
      const x=set.rows.find(r=>Number(r.Match)===Number(match)); if(!x) return null;
      const [g1,g2]=set.gws;
      return {gws:[g1,g2],a:[x[`Team1GW${g1}`],x[`Team1GW${g2}`]],b:[x[`Team2GW${g1}`],x[`Team2GW${g2}`]]};
    };
    const playoffRows=raw.PLAYOFF||[], playoff=[];
    for(let i=0;i<playoffRows.length;i+=2){
      const a=playoffRows[i],b=playoffRows[i+1]; if(!a||!b) continue;
      const match=i/2+1, legs=legsFor('playoff',match);
      playoff.push({match,legs,a:{...person(a.TeamID,a.TeamName,a.Manager),seed:a.Seed,gw26:a.GW26,gw27:a.GW27,total:a.Total,result:a.Result},b:{...person(b.TeamID,b.TeamName,b.Manager),seed:b.Seed,gw26:b.GW26,gw27:b.GW27,total:b.Total,result:b.Result}});
    }
    // V30.8 placeholders: the Play-off structure is known before the final group table.
    // Rules: 33 v 96, 34 v 95, ... 64 v 65.
    if(!playoff.length && (raw['GROUP QUALIFIED']||[]).length){
      for(let i=0;i<32;i++){
        const hi=33+i, lo=96-i;
        playoff.push({match:i+1,legs:null,
          a:{id:'',team:`${hi}-ти в груповото класиране`,manager:'Placeholder',seed:hi,gw26:null,gw27:null,total:null,result:''},
          b:{id:'',team:`${lo}-ти в груповото класиране`,manager:'Placeholder',seed:lo,gw26:null,gw27:null,total:null,result:''}});
      }
    }
    const stageMap={
      '1/32':['r32','1/32','GW28–29'],'1/16':['r16','1/16','GW30–31'],'1/8':['r8','1/8','GW32–33'],'1/4':['r4','1/4','GW34–35'],'1/2':['r2','1/2','GW36–37'],
      'Final':['final','Финал','GW38'],'3rd Place':['final','Финал','GW38']
    };
    const knockout={r32:{label:'1/32',gw:'GW28–29',matches:[]},r16:{label:'1/16',gw:'GW30–31',matches:[]},r8:{label:'1/8',gw:'GW32–33',matches:[]},r4:{label:'1/4',gw:'GW34–35',matches:[]},r2:{label:'1/2',gw:'GW36–37',matches:[]},final:{label:'Финал',gw:'GW38',matches:[]}};
    (raw.KNOCKOUT||[]).forEach(x=>{
      const sm=stageMap[x.Stage]; if(!sm) return; const [key]=sm; const ar=x.Result||'',br=inverseResult(ar);
      const match=key==='final'?(x.Stage==='Final'?1:2):Number(x.Match);
      knockout[key].matches.push({match,stage:x.Stage,legs:key==='final'?null:legsFor(key,match),a:{...person(x.Team1ID,x.Team1),total:x.Team1Total,result:ar},b:{...person(x.Team2ID,x.Team2),total:x.Team2Total,result:br}});
    });

    // V30.8 phase-aware placeholders. They describe only the tournament route; no future team is inferred.
    const ph=(team)=>({id:'',team,manager:'',total:null,result:''});
    if(!knockout.r32.matches.length && (raw['GROUP QUALIFIED']||[]).length){
      for(let i=0;i<32;i++) knockout.r32.matches.push({match:i+1,stage:'1/32',legs:null,
        a:ph(`${i+1}-ви директно класиран от групата`),
        b:ph(`${i+1===1?'Най-ниско класиран':i+1===32?'Най-високо класиран':(i+1)+'-ти от края'} победител от Play-off`)});
    }
    // V30.8.6: once a knockout round is fully decided, populate the next round
    // with the real winners even when the QA JSON intentionally omits future KNOCKOUT rows.
    // This uses only already-known results from the completed source round.
    const finalWinner=(m)=>{
      if(norm(m.a.result).startsWith('win')) return m.a;
      if(norm(m.b.result).startsWith('win')) return m.b;
      return null;
    };
    const promoteCompletedRound=(targetKey,count,sourceKey,label)=>{
      if(knockout[targetKey].matches.length) return true;
      const src=knockout[sourceKey].matches;
      if(src.length!==count*2) return false;
      const winners=src.map(finalWinner);
      if(winners.some(x=>!x)) return false;
      for(let i=0;i<count;i++){
        const a=winners[i*2], b=winners[i*2+1];
        knockout[targetKey].matches.push({match:i+1,stage:label,legs:null,
          a:{...person(a.id,a.team,a.manager),total:null,result:''},
          b:{...person(b.id,b.team,b.manager),total:null,result:''}});
      }
      return true;
    };
    const makeWinnerRound=(key,count,source,label)=>{
      if(knockout[key].matches.length) return;
      for(let i=0;i<count;i++) knockout[key].matches.push({match:i+1,stage:label,legs:null,
        a:ph(`Победител ${source} • Match ${i*2+1}`),b:ph(`Победител ${source} • Match ${i*2+2}`)});
    };
    if((raw['GROUP QUALIFIED']||[]).length){
      if(!promoteCompletedRound('r16',16,'r32','1/16')) makeWinnerRound('r16',16,'1/32','1/16');
      if(!promoteCompletedRound('r8',8,'r16','1/8')) makeWinnerRound('r8',8,'1/16','1/8');
      if(!promoteCompletedRound('r4',4,'r8','1/4')) makeWinnerRound('r4',4,'1/8','1/4');
      if(!promoteCompletedRound('r2',2,'r4','1/2')) makeWinnerRound('r2',2,'1/4','1/2');
      if(!knockout.final.matches.length){
        knockout.final.matches.push({match:1,stage:'Final',legs:null,a:ph('Победител 1/2 • Match 1'),b:ph('Победител 1/2 • Match 2')});
        knockout.final.matches.push({match:2,stage:'3rd Place',legs:null,a:ph('Загубил 1/2 • Match 1'),b:ph('Загубил 1/2 • Match 2')});
      }
    }
    const groupQualified=(raw['GROUP QUALIFIED']||[]).map(x=>({rank:x.Position,status:x.Status,id:String(x.TeamID),team:x.TeamName,manager:x.Manager,link:x.TeamLink}));
    const podium={};
    (raw['TOURNAMENT PODIUM']||[]).forEach(x=>{const p=person(x.TeamID,x.TeamName); podium[x.Position]={...p,position:x.Position};});
    window.FPLBG_DATA={meta:{source:'V5 Optimisation',version:'Website V30.8.6',note:'Live JSON data from Public Export'},teams,qualification,standings,pots,playoff,knockout,rules,schedule,qualParticipants,groupQualified,podium};
    const s=document.createElement('script'); s.src='app.js?v=30.8.6'; document.body.appendChild(s);
  } catch(err){
    console.error(err);
    const box=document.createElement('div'); box.className='loaderror'; box.innerHTML='<b>Грешка при зареждане на results.json</b><br>'+String(err.message||err); document.body.prepend(box);
  }
})();
