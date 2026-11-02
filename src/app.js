(function(){
  var root=document.documentElement,saved=null;
  try{saved=localStorage.getItem('pp-theme')}catch(e){}
  function setTheme(t,save){root.setAttribute('data-theme',t);var b=document.getElementById('theme');
    if(b){var l=t==='dark'?'Switch to light mode':'Switch to dark mode';b.setAttribute('aria-label',l);b.title=l}
    if(save){try{localStorage.setItem('pp-theme',t)}catch(e){}}}
  setTheme(saved==='dark'?'dark':'light',false);
  var tb=document.getElementById('theme');
  if(tb)tb.addEventListener('click',function(){setTheme(root.getAttribute('data-theme')==='dark'?'light':'dark',true)});
})();
(function(){
  var el=document.getElementById('pp-data');
  if(el){start(JSON.parse(el.textContent));return}
  fetch('data.json',{cache:'no-cache'}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()}).then(start).catch(function(){
    var a=document.getElementById('answer');a.hidden=false;a.innerHTML='<p class="miss">Prices couldn’t load. Refresh the page to try again.</p>'});
})();
function start(D){
  var WF=D.wageNow/D.wage19, P2=Math.pow(1.02,(D.monthsSinceBase||86)/12);
  var MIN19=D.wage19/40/60, MINNOW=D.wageNow/40/60;
  var REG={'0100':'Northeast','0200':'Midwest','0300':'South','0400':'West'};
  var ST=[["","United States (national)"],["AL","0300"],["AK","0400"],["AZ","0400"],["AR","0300"],["CA","0400"],["CO","0400"],["CT","0100"],["DE","0300"],["DC","0300"],["FL","0300"],["GA","0300"],["HI","0400"],["ID","0400"],["IL","0200"],["IN","0200"],["IA","0200"],["KS","0200"],["KY","0300"],["LA","0300"],["ME","0100"],["MD","0300"],["MA","0100"],["MI","0200"],["MN","0200"],["MS","0300"],["MO","0200"],["MT","0400"],["NE","0200"],["NV","0400"],["NH","0100"],["NJ","0100"],["NM","0400"],["NY","0100"],["NC","0300"],["ND","0200"],["OH","0200"],["OK","0300"],["OR","0400"],["PA","0100"],["RI","0100"],["SC","0300"],["SD","0200"],["TN","0300"],["TX","0300"],["UT","0400"],["VT","0100"],["VA","0300"],["WA","0400"],["WV","0300"],["WI","0200"],["WY","0400"]];
  var NAMES={AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",DC:"District of Columbia",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming"};
  var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function mlab(s){return MON[+s.slice(5,7)-1]+' '+s.slice(0,4)}
  function money(v){return v<1?(v*100).toFixed(1)+'¢':'$'+v.toFixed(2)}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  var sel=document.getElementById('state');
  sel.innerHTML=ST.map(function(s){return '<option value="'+s[0]+'">'+(s[0]?NAMES[s[0]]:s[1])+'</option>'}).join('');
  var saved='';try{saved=localStorage.getItem('pp-state')||''}catch(e){}
  if(NAMES[saved])sel.value=saved;
  function regionOf(st){for(var i=0;i<ST.length;i++)if(ST[i][0]===st)return st?ST[i][1]:'0000';return '0000'}
  function calc(it,reg){
    var n=it.r['0000'],r=it.r[reg],use=(r&&r.cur!=null)?r:n,from=(use===n)?'0000':reg;
    var base=use.base,cur=use.cur,curDt=use.dt,baseFrom=from,curFrom=from;
    var pp=base*WF;
    return {base:base,pp:pp,p2:base*P2,cur:cur,curDt:curDt,baseFrom:baseFrom,curFrom:curFrom,gap:(cur/pp-1)*100};
  }
  function where(c,reg){
    if(reg==='0000')return 'National';
    if(c.baseFrom===reg)return REG[reg];
    return 'US data';
  }
  function whereLong(c,reg){
    if(reg==='0000')return 'National prices';
    if(c.baseFrom===reg)return REG[reg]+' region prices';
    return 'National prices: BLS hasn’t published this item for the '+REG[reg]+' recently';
  }
  var ICON={
    'Dairy & eggs':'<path d="M12 3c-3.3 0-6 5-6 9a6 6 0 0 0 12 0c0-4-2.7-9-6-9z"/>',
    'Meat':'<path d="M7 6c3-3 9-2 11 2 2 5-2 10-7 10-3 0-6-2-6-5 0-2 0-5 2-7z"/><circle cx="12" cy="11" r="2"/>',
    'Pantry':'<rect x="6" y="7" width="12" height="13" rx="2"/><path d="M8 4h8v3H8z"/><path d="M6 12h12"/>',
    'Snacks & drinks':'<path d="M7 4h10l-1.5 16h-7z"/><path d="M7.5 9h9"/>',
    'Produce':'<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l8-8"/>',
    'Energy':'<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
    'Clothing':'<path d="M9 4l3 2 3-2 5 3-2 4-2-1v10H8V10l-2 1-2-4z"/>',
    'Household goods':'<path d="M4 11h16v6H4z"/><path d="M6 11V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3"/><path d="M6 17v2M18 17v2"/>',
    'Tech':'<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M9 20h6M12 16v4"/>',
    'Health':'<path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z"/>',
    'Services':'<rect x="4" y="8" width="16" height="11" rx="2"/><path d="M9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M4 13h16"/>'};
  function icon(cat){return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">'+(ICON[cat]||'')+'</svg>'}
  function sub(it){return (it.desc?it.desc+' · ':'')+'per '+it.unit}
  var catSel=document.getElementById('cat');
  var CATS=[];D.items.forEach(function(it){if(CATS.indexOf(it.cat)<0)CATS.push(it.cat)});
  catSel.innerHTML+=CATS.map(function(c){return '<option>'+esc(c)+'</option>'}).join('');
  var SORT={k:'gap',dir:-1};
  var COLS=[['name','Item'],['pp','People’s Price'],['cur','Average now'],['base','2019 average'],['p2','At +2% a year'],['mnow','Work time 2019 → now'],['gap','vs. People’s Price']];
  function chip(g){var cls=g>2?'over':(g<-2?'under':'none');return '<span class="chip '+cls+'">'+(g>=0?'+':'−')+Math.abs(g).toFixed(0)+'%</span>'}
  function card(o,reg){
    var it=o.it,c=o.c,cls=c.gap>2?'over':(c.gap<-2?'under':'none');
    var verdict=cls==='over'?'<span>Above</span><b>+'+c.gap.toFixed(0)+'%</b>':cls==='under'?'<span>Below</span><b>−'+Math.abs(c.gap).toFixed(0)+'%</b>':'<span>About even</span><b>'+(c.gap>=0?'+':'−')+Math.abs(c.gap).toFixed(0)+'%</b>';
    return '<article class="tag"><div><div class="top"><span class="cat">'+icon(it.cat)+esc(it.cat)+'</span><span class="where">'+esc(where(c,reg))+'</span></div>'+
      '<h3 title="'+esc(it.name)+'">'+esc(it.name)+'</h3><div class="sub">'+esc(sub(it))+'</div></div>'+
      '<div><div class="pp"><small>People’s Price</small><b>'+money(c.pp)+'</b></div>'+
      '<div class="rows"><div class="row"><span>Now ('+mlab(c.curDt)+')</span><b>'+money(c.cur)+'</b></div>'+
      '<div class="row"><span>'+(it.kind==='index'?'2019 spending':'2019 average')+'</span><b>'+money(c.base)+'</b></div>'+
      '<div class="row"><span>At +2% a year</span><b>'+money(c.p2)+'</b></div></div>'+
      '<div class="mins">Work: '+pair(c.base/MIN19,c.cur/MINNOW)+(it.note?'*':'')+'</div></div>'+
      '<div class="verdict '+cls+'">'+verdict+'</div></article>';
  }
  function renderFacts(st,reg){
    var fh=      '<div class="fact"><b>+'+((WF-1)*100).toFixed(0)+'%</b><span>Typical full-time paycheck since 2019 ($'+Math.round(D.wage19)+' → $'+D.wageNow+' a week)</span></div>'+
      '<div class="fact"><b>+'+((P2-1)*100).toFixed(0)+'%</b><span>Fed’s 2% a year target over the same stretch</span></div>'+
      '<div class="fact"><b>'+(reg==='0000'?'National':REG[reg])+'</b><span>'+(st?'Prices for '+esc(NAMES[st])+' use its census region':'Choose a state for regional prices')+'</span></div>';
    document.getElementById('facts').innerHTML=fh;document.getElementById('facts2').innerHTML=fh;
  }
  var SHOWALL=false;
  function render(){
    var st=sel.value,reg=regionOf(st);
    try{localStorage.setItem('pp-state',st)}catch(e){}
    renderFacts(st,reg);
    if(0)document.getElementById('facts').innerHTML=
      '<div class="fact"><b>+'+((WF-1)*100).toFixed(0)+'%</b><span>Typical full-time paycheck since 2019 ($'+Math.round(D.wage19)+' → $'+D.wageNow+' a week)</span></div>'+
      '<div class="fact"><b>+'+((P2-1)*100).toFixed(0)+'%</b><span>Fed’s 2% a year target over the same stretch</span></div>'+
      '<div class="fact"><b>'+(reg==='0000'?'National':REG[reg])+'</b><span>'+(st?'Prices for '+esc(NAMES[st])+' use its census region':'Choose a state for regional prices')+'</span></div>';
    var all=D.items.map(function(it){return {it:it,c:calc(it,reg)}}).sort(function(x,y){return y.c.gap-x.c.gap});
    var above=all.filter(function(o){return o.c.gap>2}).slice(0,5);
    var below=all.filter(function(o){return o.c.gap<-2}).slice(-5).reverse();
    var featured=above.concat(below).map(function(o){return o.it.id});
    document.getElementById('grid-above').innerHTML=above.map(function(o){return card(o,reg)}).join('');
    document.getElementById('grid-below').innerHTML=below.map(function(o){return card(o,reg)}).join('');
    var rest=all.filter(function(o){return !catSel.value||o.it.cat===catSel.value});
    function val(o,k){var c=o.c;switch(k){case'name':return o.it.name;case'pp':return c.pp;case'cur':return c.cur;case'base':return c.base;case'p2':return c.p2;case'm19':return c.base/MIN19;case'mnow':return c.cur/MINNOW;case'gap':return c.gap;case'where':return where(c,reg)}}
    rest.sort(function(x,y){var a=val(x,SORT.k),b=val(y,SORT.k);return (typeof a==='string'?a.localeCompare(b):a-b)*SORT.dir});
    document.getElementById('all-sub').textContent=rest.length+' items · click a column heading to sort';
    var th=COLS.map(function(col){var on=SORT.k===col[0];return '<th scope="col"'+(on?' aria-sort="'+(SORT.dir>0?'ascending':'descending')+'"':'')+'><button type="button" data-k="'+col[0]+'">'+col[1]+(on?(SORT.dir>0?' ▲':' ▼'):'')+'</button></th>'}).join('');
    var rows=rest.map(function(o){var it=o.it,c=o.c;
      return '<tr><td class="nm"><b>'+esc(it.name)+'</b><span>'+esc(it.cat)+' · per '+esc(it.unit)+(reg!=='0000'?' · '+esc(where(c,reg)):'')+'</span></td><td class="ppc">'+money(c.pp)+'</td><td>'+money(c.cur)+'<span class="dt">'+mlab(c.curDt)+'</span></td><td>'+money(c.base)+'</td><td>'+money(c.p2)+'</td><td>'+pair(c.base/MIN19,c.cur/MINNOW)+'</td><td>'+chip(c.gap)+'</td></tr>'}).join('');
    var mx=Math.max.apply(null,all.map(function(o){return Math.abs(o.c.gap)}));mx=Math.ceil(mx/25)*25;
    document.getElementById('glance').innerHTML='<div class="ax"><span></span><div><span>−'+mx+'%</span><span>0</span><span>+'+mx+'%</span></div><span></span></div>'+all.map(function(o){var g=o.c.gap,cls=g>0?'over':'under',w=Math.abs(g)/mx*50;
      return '<button type="button" class="qchip-gl" data-q="'+esc(o.it.name)+'" title="'+esc(o.it.name)+': '+(g>=0?'+':'−')+Math.abs(g).toFixed(0)+'%"><span class="nm">'+esc(o.it.name)+'</span><span class="tk"><i class="'+cls+'" style="width:'+w.toFixed(2)+'%"></i></span><span class="v '+(Math.abs(g)>2?cls:'')+'">'+(g>=0?'+':'−')+Math.abs(g).toFixed(0)+'%</span></button>'}).join('');
    var fog=!SHOWALL&&rest.length>10;
    document.getElementById('tbox').classList.toggle('fog',fog);
    document.getElementById('fogbtn').hidden=rest.length<=10;
    document.getElementById('fogbtn').classList.toggle('open',!fog);
    document.getElementById('showall').textContent=fog?'Show even more':'Show fewer';
    document.getElementById('pt').innerHTML='<thead><tr>'+th+'</tr></thead><tbody>'+(rows||'<tr><td class="nm" colspan="7">No other items in this category. They’re in the top 5 lists above.</td></tr>')+'</tbody>';
  }
  function pair(a,b){var x=fmtMin(a),y=fmtMin(b);['min','sec','hr'].forEach(function(u){if(x.slice(-u.length)===u&&y.slice(-u.length)===u)x=x.slice(0,-u.length-1)});return x+' → '+y}
  function fmtMin(m){return m<1?Math.round(m*60)+' sec':(m>=90?(m/60).toFixed(1)+' hr':m.toFixed(1)+' min')}
  document.getElementById('stamp').textContent='Prices through '+mlab(D.asof);
  var MON2=['January','February','March','April','May','June','July','August','September','October','November','December'];document.getElementById('m-asof').textContent=', through '+MON2[+D.asof.slice(5,7)-1]+' '+D.asof.slice(0,4)+(D.updated?' (updated '+D.updated+')':'');
  document.getElementById('m-wage').textContent='Median full-time weekly pay rose from $'+Math.round(D.wage19).toLocaleString()+' in 2019 to $'+D.wageNow.toLocaleString()+' in '+D.wageQ+', up '+((WF-1)*100).toFixed(1)+'%. For now, the same national pay growth is used for every state.';
  sel.addEventListener('change',render);catSel.addEventListener('change',function(){SHOWALL=false;render()});
  document.getElementById('pt').addEventListener('click',function(e){var b=e.target.closest('button[data-k]');if(!b)return;var k=b.getAttribute('data-k');if(SORT.k===k)SORT.dir=-SORT.dir;else{SORT.k=k;SORT.dir=(k==='name'||k==='where')?1:-1}render();var nb=document.querySelector('#pt button[data-k="'+k+'"]');if(nb)nb.focus()});
  var ALIAS={gas:'gas',petrol:'gas',fuel:'gas',steak:'sirloin',hamburger:'beef',burger:'beef',pop:'soda',soda:'soda',coke:'soda',spaghetti:'pasta',macaroni:'pasta',noodles:'pasta',power:'power',electric:'power',lettuce:'iceberg',orange:'oranges',egg:'eggs',chip:'chips',cookie:'cookies',tomato:'tomatoes',potato:'potatoes',strawberry:'strawberries',lemon:'lemons',banana:'bananas',cheese:'cheddar',pork:'porkchop',chicken:'chicken',heating:'fueloil',oil:'fueloil'};
  function find(q){
    q=q.trim().toLowerCase().replace(/\s*\(.*\)$/,'');if(!q)return [];
    var exact=D.items.filter(function(it){return it.name.toLowerCase()===q});if(exact.length)return exact;
    var hits=D.items.filter(function(it){return (it.name+' '+(it.desc||'')+' '+it.cat).toLowerCase().indexOf(q)>=0});
    if(!hits.length){var w=q.split(/\s+/);w.forEach(function(x){var id=ALIAS[x]||ALIAS[x.replace(/e?s$/,'')];if(id)D.items.forEach(function(it){if(it.id===id&&hits.indexOf(it)<0)hits.push(it)})})}
    if(!hits.length){hits=D.items.filter(function(it){return q.split(/\s+/).some(function(x){return x.length>2&&it.name.toLowerCase().indexOf(x)>=0})})}
    return hits;
  }
  var dl=document.getElementById('q-items');
  dl.innerHTML=D.items.map(function(it){return '<option value="'+esc(it.name)+'">'+esc(sub(it))+'</option>'}).join('');
  var QUICK=['eggs','gas','beef','milk','coffee','power'];
  document.getElementById('quick').innerHTML+=QUICK.map(function(id){var it=D.items.filter(function(x){return x.id===id})[0];return '<button type="button" class="qchip" data-q="'+esc(it.name)+'">'+esc(it.name)+'</button>'}).join('');
  var lastQ=null;
  function answer(){
    var box=document.getElementById('answer'),qv=document.getElementById('q-item').value,pv=String(document.getElementById('q-price').value).replace(/[$,\s]/g,'');
    var v=pv?parseFloat(pv):null;box.hidden=false;
    if(!qv.trim()){box.innerHTML='<p class="miss">Type an item to check, or pick one of the popular items.</p>';return}
    var hits=find(qv);
    if(!hits.length){box.innerHTML='<p class="miss">We don’t track “'+esc(qv.trim())+'” yet. Try one of these: '+QUICK.map(function(id){var it=D.items.filter(function(x){return x.id===id})[0];return '<button type="button" class="qchip" data-q="'+esc(it.name)+'">'+esc(it.name)+'</button>'}).join(' ')+' or open the full list below.</p>';return}
    var it=hits[0],reg=regionOf(sel.value),c=calc(it,reg),o={it:it,c:c};
    var g=c.gap,dir=g>2?'more':(g<-2?'less':'about the same');
    var verb=(/s$/i.test(it.name)&&!/gas$/i.test(it.name))?' cost':' costs';var head=dir==='about the same'?esc(it.name)+verb+' about the same as the People’s Price':esc(it.name)+verb+' <em class="'+(g>0?'over':'under')+'">'+Math.abs(g).toFixed(0)+'% '+dir+'</em> than the People’s Price';
    var place=c.baseFrom==='0000'?(reg==='0000'?'nationally':'(national figures, since BLS doesn’t publish this for the '+REG[reg]+')'):'in the '+REG[reg];
    var lines='';
    if(pv&&!(v>0))lines+='<p class="you">Enter the price as a number, for example 3.49.</p>';
    else if(v>0){var y=(v/c.pp-1)*100,z=(v/c.cur-1)*100;
      lines+='<p class="you '+(y>2?'over':(y<-2?'under':''))+'">You paid <b>'+money(v)+'</b>: <b>'+Math.abs(y).toFixed(0)+'% '+(y>=0?'above':'below')+'</b> the People’s Price and '+Math.abs(z).toFixed(0)+'% '+(z>=0?'above':'below')+' the current average.</p>'}
    var shareTxt=esc(it.name)+(dir==='about the same'?' costs about the same as':(verb+' '+Math.abs(g).toFixed(0)+'% '+dir+' than'))+' the People’s Price';
    lines+='<div class="share" data-id="'+it.id+'" data-text="'+shareTxt+'"><span>Share:</span>'+
      (navigator.share?'<button type="button" data-share="native"><svg viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6"/></svg>Share</button>':'')+
      '<button type="button" data-share="copy"><svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>Copy link</button>'+
      '<a data-share="x" target="_blank" rel="noopener">X</a><a data-share="fb" target="_blank" rel="noopener">Facebook</a><span class="ok" hidden>Link copied</span></div>';
    var also=hits.slice(1,5);
    if(also.length)lines+='<p class="also">Also matching: '+also.map(function(h){return '<button type="button" class="qchip" data-q="'+esc(h.name)+'">'+esc(h.name)+'</button>'}).join(' ')+'</p>';
    var bars=[['b19',it.kind==='index'?'2019 spending':'2019 average',c.base],['b2','At +2% a year',c.p2],['bpp','People’s Price',c.pp],['bnow '+(g>2?'over':(g<-2?'under':'none')),'Average now',c.cur]];
    if(v>0)bars.push(['byou','You paid',v]);
    var bm=Math.max.apply(null,bars.map(function(x){return x[2]}));
    var ladder='<div class="ladder" role="img" aria-label="'+esc(it.name)+' prices: '+bars.map(function(x){return x[1]+' '+money(x[2])}).join(', ')+'">'+bars.map(function(x){return '<div class="lr '+x[0]+'"><span>'+x[1]+'</span><div class="tr"><i style="width:'+(x[2]/bm*100).toFixed(1)+'%"></i></div><b>'+money(x[2])+'</b></div>'}).join('')+'</div>';
    box.innerHTML='<div class="ans-card">'+card(o,reg)+'</div><div class="ans-text"><h2>'+head+'</h2>'+ladder+lines+'</div>';
    renderFacts(sel.value,reg);document.getElementById('facts').hidden=false;
    var sh=box.querySelector('.share');if(sh){var u=shareUrl(it.id),t=sh.getAttribute('data-text')+'. What should it cost?';
      sh.querySelector('[data-share=x]').href='https://twitter.com/intent/tweet?text='+encodeURIComponent(t)+'&url='+encodeURIComponent(u);
      sh.querySelector('[data-share=fb]').href='https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(u)}
    if(window.gtag)window.gtag('event','search',{search_term:it.name,state:sel.value||'US'});[].forEach.call(document.querySelectorAll('.home-feat'),function(s){s.hidden=false});
    lastQ=qv;
  }
  var SITE='https://thepeoplesprice.org/';
  function shareUrl(id){var st=sel.value;return SITE+'?item='+encodeURIComponent(id)+(st?'&state='+st:'')}
  document.getElementById('answer').addEventListener('click',function(e){var b=e.target.closest('[data-share]');if(!b)return;var sh=b.closest('.share'),id=sh.getAttribute('data-id'),u=shareUrl(id),t=sh.getAttribute('data-text')+'. What should it cost?';var k=b.getAttribute('data-share');
    if(window.gtag)window.gtag('event','share',{method:k,item_id:id});
    if(k==='native'){navigator.share({title:'The People’s Price',text:t,url:u}).catch(function(){})}
    else if(k==='copy'){var ok=sh.querySelector('.ok');var done=function(){ok.hidden=false;setTimeout(function(){ok.hidden=true},2500)};
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u).then(done,function(){ok.textContent=u;ok.hidden=false})}else{ok.textContent=u;ok.hidden=false}}});
  document.getElementById('q').addEventListener('submit',function(e){e.preventDefault();answer()});
  document.getElementById('app').addEventListener('click',function(e){var b=e.target.closest('.qchip,.qchip-gl');if(!b)return;document.getElementById('q-item').value=b.getAttribute('data-q');answer();if(b.classList.contains('qchip-gl')){if(location.hash==='#all')location.hash='#check';setTimeout(function(){document.getElementById('answer').scrollIntoView({behavior:'smooth',block:'start'})},30)}});
  document.getElementById('showall').addEventListener('click',function(){SHOWALL=!SHOWALL;render();if(!SHOWALL)document.getElementById('all-h').scrollIntoView({behavior:'smooth',block:'start'});document.getElementById('showall').focus({preventScroll:true})});
  sel.addEventListener('change',function(){if(lastQ!==null)answer()});
  document.getElementById('more-n').textContent=D.items.length;
  var sel2=document.getElementById('state2');sel2.innerHTML=sel.innerHTML;sel2.value=sel.value;
  sel2.addEventListener('change',function(){sel.value=sel2.value;render();if(lastQ!==null)answer()});
  sel.addEventListener('change',function(){sel2.value=sel.value});
  function route(){var all=location.hash==='#all';document.getElementById('view-all').hidden=!all;document.getElementById('view-check').hidden=all;
    document.getElementById('tab-all').setAttribute('aria-current',all?'page':'false');document.getElementById('tab-check').setAttribute('aria-current',all?'false':'page');window.scrollTo(0,0)}
  window.addEventListener('hashchange',route);route();
  var fu=document.getElementById('foot-updated');if(fu)fu.textContent='Prices through '+mlab(D.asof)+(D.updated?' · checked '+D.updated:'');
  try{var qs=new URLSearchParams(location.search),qi=qs.get('item'),qst=(qs.get('state')||'').toUpperCase();
    if(qst&&NAMES[qst]){sel.value=qst;sel2.value=qst;render()}
    if(qi){var hit=D.items.filter(function(x){return x.id===qi})[0];document.getElementById('q-item').value=hit?hit.name:qi;answer()}}catch(e){}
  function fitTitle(){var h=document.getElementById('hero-h'),s=h&&h.querySelector('.fit');if(!s||!h.clientWidth)return;h.style.fontSize='';var cs=parseFloat(getComputedStyle(h).fontSize),r=h.clientWidth/s.offsetWidth;h.style.fontSize=Math.min(84,Math.max(32,Math.floor(cs*r*0.995)))+'px'}
  fitTitle();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fitTitle);var ft;window.addEventListener('resize',function(){clearTimeout(ft);ft=setTimeout(fitTitle,80)});window.addEventListener('hashchange',function(){setTimeout(fitTitle,0)});
  render();
}
