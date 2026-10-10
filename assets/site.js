(function(){
  var root=document.documentElement;
  function get(k){try{return localStorage.getItem(k)}catch(e){return null}}function set(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  function applyLang(l){root.setAttribute('data-lang',l);root.setAttribute('lang',l==='zh'?'zh-CN':'en');document.querySelectorAll('[data-lang-btn]').forEach(function(b){b.textContent=l==='zh'?'EN':'中文'})}
  function isDark(){var t=root.getAttribute('data-theme');return t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches}
  var SUN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>';
  var MOON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6z"/></svg>';
  var redraw=function(){};
  function paintTheme(){document.querySelectorAll('[data-theme-btn]').forEach(function(b){b.innerHTML=isDark()?SUN:MOON;b.setAttribute('aria-label',isDark()?'Light mode':'Dark mode')});redraw()}

  document.addEventListener('DOMContentLoaded',function(){
    applyLang(root.getAttribute('data-lang')||'en');paintTheme();
    document.querySelectorAll('[data-lang-btn]').forEach(function(b){b.onclick=function(){var n=root.getAttribute('data-lang')==='zh'?'en':'zh';applyLang(n);set('lang',n)}});
    document.querySelectorAll('[data-theme-btn]').forEach(function(b){b.onclick=function(){var n=isDark()?'light':'dark';root.setAttribute('data-theme',n);set('theme',n);paintTheme()}});

    /* loader */
    var L=document.querySelector('.loader'),N=L&&L.querySelector('.n'),seen=false;try{seen=sessionStorage.getItem('seen')==='1'}catch(e){}
    function done(){root.classList.add('loaded');try{sessionStorage.setItem('seen','1')}catch(e){}}
    if(!L||reduce||seen){if(L)L.style.display='none';done()}else{var t0=performance.now();(function s(n){var p=Math.min(1,(n-t0)/1200);p=1-Math.pow(1-p,3);N.textContent=Math.round(p*100);if(p<1)requestAnimationFrame(s);else setTimeout(done,150)})(t0);setTimeout(done,2500)}

    /* menu */
    var mb=document.getElementById('menuBtn');if(mb){mb.onclick=function(){var o=root.classList.toggle('menu-open');mb.setAttribute('aria-expanded',o)};
      document.addEventListener('keydown',function(e){if(e.key==='Escape')root.classList.remove('menu-open')})}

    /* smooth scroll */
    var lenis=null;if(!reduce&&window.Lenis){try{lenis=new Lenis({lerp:.09});(function r(t){lenis.raf(t);requestAnimationFrame(r)})(performance.now())}catch(e){}}

    /* nav hide */
    var nav=document.querySelector('.nav'),ly=0;window.addEventListener('scroll',function(){var y=scrollY;if(nav)nav.classList.toggle('hide',y>ly&&y>200&&!root.classList.contains('menu-open'));ly=y},{passive:true});

    /* reveals */
    document.querySelectorAll('.draw path,.draw line,.draw rect.k').forEach(function(p){try{p.style.setProperty('--len',Math.ceil(p.getTotalLength()))}catch(e){}});
    document.querySelectorAll('.grid,.stats,.gh,.list').forEach(function(g){[].slice.call(g.children).forEach(function(c,i){c.style.setProperty('--d',(i%4)*.08+'s')})});
    var items=[].slice.call(document.querySelectorAll('.up,.ln,.draw'));
    function cnt(el){(el.querySelectorAll?el.querySelectorAll('[data-to]'):[]).forEach(function(n){if(n._d)return;n._d=1;var to=+n.dataset.to,dec=+(n.dataset.dec||0),pre=n.dataset.pre||'',suf=n.dataset.suf||'';
      var f=function(v){return pre+v.toFixed(dec)+suf};if(reduce){n.textContent=f(to);return}var t0=performance.now();(function s(t){var p=Math.min(1,(t-t0)/1500);p=1-Math.pow(1-p,4);n.textContent=f(to*p);if(p<1)requestAnimationFrame(s)})(t0)})}
    if(reduce||!('IntersectionObserver' in window))items.forEach(function(e){e.classList.add('in');cnt(e)});
    else{var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');cnt(e.target);io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
      items.forEach(function(e){io.observe(e)});setTimeout(function(){items.forEach(function(e){if(e.getBoundingClientRect().top<innerHeight){e.classList.add('in');cnt(e)}})},2600)}

    /* countdown */
    var cd=document.querySelector('[data-countdown]');if(cd){var T=new Date(cd.dataset.countdown).getTime();var tick=function(){var d=Math.max(0,T-Date.now());
      var D=Math.floor(d/864e5),H=Math.floor(d%864e5/36e5),M=Math.floor(d%36e5/6e4);cd.querySelector('[data-d]').textContent=D;cd.querySelector('[data-h]').textContent=String(H).padStart(2,'0');cd.querySelector('[data-m]').textContent=String(M).padStart(2,'0')};tick();setInterval(tick,30000)}

    /* hero: digit-field reveal + parallax */
    var face=document.querySelector('.face'),cv=face&&face.querySelector('canvas');
    if(face&&cv){var ctx=cv.getContext('2d'),img=face.querySelector('.photo img');
      redraw=function(){var r=face.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);cv.width=r.width*dpr|0;cv.height=r.height*dpr|0;if(!cv.width||!cv.height)return;var W=cv.width,H=cv.height,cs=getComputedStyle(root),
        A=cs.getPropertyValue('--acc').trim(),I=cs.getPropertyValue('--ink').trim(),B=cs.getPropertyValue('--bg').trim();ctx.clearRect(0,0,W,H);
        var g=72,s=document.createElement('canvas');s.width=g;s.height=g;var x=s.getContext('2d');
        if(img&&img.complete&&img.naturalWidth){var iw=img.naturalWidth,ih=img.naturalHeight,sc=g*0.84/Math.max(iw,ih);x.drawImage(img,(g-iw*sc)/2,g-ih*sc,iw*sc,ih*sc)}
        else{x.fillStyle='#000';x.beginPath();x.ellipse(g/2,g*0.42,g*0.2,g*0.25,0,0,7);x.fill();x.beginPath();x.ellipse(g/2,g*1.02,g*0.42,g*0.32,0,0,7);x.fill()}
        ctx.imageSmoothingEnabled=true;ctx.drawImage(s,0,0,W,H);ctx.globalCompositeOperation='source-in';ctx.fillStyle=cs.getPropertyValue('--bg').trim();ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over';var d=x.getImageData(0,0,g,g).data,cw=W/g;ctx.textAlign='center';ctx.textBaseline='middle';
        for(var yy=0;yy<g;yy++)for(var xx=0;xx<g;xx++){var i=(yy*g+xx)*4,a=d[i+3]/255;if(a<.1)continue;var L=(d[i]*.3+d[i+1]*.59+d[i+2]*.11)/255,k=a*(1-L*.7);
          ctx.globalAlpha=.35+.65*k;ctx.fillStyle=k>.55?A:I;ctx.font='700 '+(cw*(.6+.5*k))+'px "Mona Sans",monospace';ctx.fillText('0123456789'[(xx*7+yy*3)%10],xx*cw+cw/2,yy*cw+cw/2)}ctx.globalAlpha=1};
      redraw();if(img)img.addEventListener('load',redraw);addEventListener('resize',redraw);document.fonts&&document.fonts.ready.then(redraw);
      if(!reduce){var R=0,TR=0,mx=.5,my=.5,raf=0,idle;function tk(){R+=(TR-R)*.12;cv.style.setProperty('--r',R.toFixed(1)+'px');cv.style.setProperty('--mx',mx*100+'%');cv.style.setProperty('--my',my*100+'%');raf=Math.abs(TR-R)>.3?requestAnimationFrame(tk):0}
        addEventListener('pointermove',function(e){var r=face.getBoundingClientRect();mx=(e.clientX-r.left)/r.width;my=(e.clientY-r.top)/r.height;var inside=mx>-.1&&mx<1.1&&my>-.1&&my<1.1;TR=inside?r.width*.2:0;
          face.style.transform='translate3d('+((mx-.5)*14).toFixed(1)+'px,'+(scrollY*.25).toFixed(1)+'px,0) rotate('+((mx-.5)*2).toFixed(2)+'deg)';clearTimeout(idle);idle=setTimeout(function(){TR=0;if(!raf)raf=requestAnimationFrame(tk)},900);if(!raf)raf=requestAnimationFrame(tk)},{passive:true});
        if(!fine){var a=0;(function au(){a+=.012;mx=.5+Math.cos(a)*.22;my=.5+Math.sin(a*1.3)*.2;cv.style.setProperty('--r',face.offsetWidth*.18+'px');cv.style.setProperty('--mx',mx*100+'%');cv.style.setProperty('--my',my*100+'%');requestAnimationFrame(au)})()}
        addEventListener('scroll',function(){if(scrollY<innerHeight)face.style.transform='translate3d(0,'+(scrollY*.25).toFixed(1)+'px,0)'},{passive:true})}}

    /* pinned horizontal track */
    var ht=document.querySelector('.htrack');
    if(ht){var rail=ht.querySelector('.rail'),pin=ht.querySelector('.pin');
      if(reduce||innerWidth<900||matchMedia('(pointer:coarse)').matches){ht.classList.add('static')}else{
        var setH=function(){var dist=rail.scrollWidth-innerWidth+parseFloat(getComputedStyle(rail).paddingLeft);ht.style.height=(innerHeight+Math.max(0,dist))+'px';ht._dist=Math.max(0,dist)};setH();addEventListener('resize',setH);
        var mv=function(){var r=ht.getBoundingClientRect(),p=Math.min(1,Math.max(0,-r.top/(ht.offsetHeight-innerHeight||1)));rail.style.transform='translate3d('+(-p*ht._dist).toFixed(1)+'px,0,0)'};
        addEventListener('scroll',mv,{passive:true});(function lp(){mv();requestAnimationFrame(lp)})()}}

    /* drag carousels */
    document.querySelectorAll('.car').forEach(function(c){var bar=c.parentNode.querySelector('.bar i'),dn=false,sx=0,sl=0;
      function pg(){if(!bar)return;var m=c.scrollWidth-c.clientWidth,w=c.clientWidth/c.scrollWidth*100;bar.style.width=w+'%';bar.style.left=(m?c.scrollLeft/m:0)*(100-w)+'%'}
      c.addEventListener('scroll',pg,{passive:true});addEventListener('resize',pg);pg();
      if(fine){c.addEventListener('pointerdown',function(e){dn=true;sx=e.clientX;sl=c.scrollLeft});addEventListener('pointermove',function(e){if(!dn)return;var dx=e.clientX-sx;if(Math.abs(dx)>6)c.classList.add('drag');c.scrollLeft=sl-dx});
        addEventListener('pointerup',function(){if(dn){dn=false;setTimeout(function(){c.classList.remove('drag')},0)}})}});

    /* cursor */
    if(fine&&!reduce){var cu=document.createElement('div');cu.className='cur';cu.innerHTML='<span></span>';document.body.appendChild(cu);var cx=-99,cy=-99,tx=-99,ty=-99;
      addEventListener('pointermove',function(e){tx=e.clientX;ty=e.clientY;cu.classList.add('on')},{passive:true});
      (function l(){cx+=(tx-cx)*.2;cy+=(ty-cy)*.2;cu.style.transform='translate3d('+cx+'px,'+cy+'px,0)';requestAnimationFrame(l)})();
      document.querySelectorAll('[data-cur]').forEach(function(el){el.addEventListener('pointerenter',function(){cu.firstChild.textContent=root.getAttribute('data-lang')==='zh'?(el.dataset.curZh||'查看'):el.dataset.cur;cu.classList.add('big')});el.addEventListener('pointerleave',function(){cu.classList.remove('big')})})}

    /* copy */
    document.querySelectorAll('[data-copy]').forEach(function(b){b.addEventListener('click',function(){var ok=function(){b.classList.add('done');setTimeout(function(){b.classList.remove('done')},1800)};navigator.clipboard?navigator.clipboard.writeText(b.dataset.copy).then(ok,ok):ok()})});

    /* page wipe */
    var w=document.createElement('div');w.className='wipe';document.body.appendChild(w);
    document.querySelectorAll('a[href$=".html"],a[href*=".html#"]').forEach(function(a){a.addEventListener('click',function(e){if(reduce||e.metaKey||e.ctrlKey||e.shiftKey||a.target)return;e.preventDefault();var h=a.getAttribute('href');root.classList.add('leaving');setTimeout(function(){location.href=h},520)})});
    addEventListener('pageshow',function(){root.classList.remove('leaving','menu-open')});
  });
})();

/* ============================================================
   terminal typing line + filterable project index
   ============================================================ */
(function(){
  var root=document.documentElement;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ready(fn){if(document.readyState!=='loading')fn();else document.addEventListener('DOMContentLoaded',fn)}

  /* ---- typed line in the hero ---- */
  function typer(){
    var el=document.querySelector('.hero .sig .t');if(!el)return;
    var S={en:['quant research','papers and essays','small products','things I can check'],
           zh:['量化研究','论文与文章','小产品','能被检验的东西']};
    el.textContent='';el.classList.add('caret');
    if(reduce){el.textContent=S[root.getAttribute('data-lang')==='zh'?'zh':'en'][0];return}
    var i=0,j=0,del=false,lang=root.getAttribute('data-lang')==='zh'?'zh':'en';
    (function step(){
      var cur=root.getAttribute('data-lang')==='zh'?'zh':'en';
      if(cur!==lang){lang=cur;i=0;j=0;del=false;el.textContent=''}
      var list=S[lang],w=list[i%list.length];
      j=del?j-1:j+1;el.textContent=w.slice(0,j);
      var wait=del?45:(lang==='zh'?130:62);
      if(!del&&j>=w.length){del=true;wait=1900}
      else if(del&&j<=0){del=false;i++;wait=260}
      setTimeout(step,wait);
    })();
  }

  /* ---- project index ---- */
  function projects(){
    var box=document.getElementById('pindex');if(!box)return;
    var grid=document.getElementById('pgrid');if(!grid)return;
    var idx=box.querySelector('.idx'),count=document.getElementById('pcount');
    var cards=[].slice.call(grid.querySelectorAll('.card'));
    var rows=cards.map(function(c){
      var a=document.createElement('a');
      a.href=c.getAttribute('href');a.setAttribute('data-cat',c.getAttribute('data-cat')||'');
      var t=document.createElement('span');t.className='t';
      var h=c.querySelector('h3');if(h)t.innerHTML=h.innerHTML;
      var m=document.createElement('span');m.className='m';
      var k=c.querySelector('.body > .k');if(k)m.innerHTML=k.innerHTML;
      a.appendChild(t);a.appendChild(m);idx.appendChild(a);return a;
    });
    var empty=box.querySelector('.pempty');
    var cat='all',view='list';
    function apply(){
      var n=0;
      cards.forEach(function(c,i){
        var ok=cat==='all'||(c.getAttribute('data-cat')||'')===cat;
        if(ok)n++;
        c.hidden=!ok;rows[i].hidden=!ok;
      });
      idx.hidden=view!=='list';grid.hidden=view!=='grid';
      box.querySelector('.idxhead').hidden=view!=='list';
      if(empty)empty.hidden=n>0;
      if(count)count.textContent=n+(root.getAttribute('data-lang')==='zh'?' 个项目':(n===1?' project':' projects'));
    }
    box.querySelectorAll('[data-cat-btn]').forEach(function(b){
      b.onclick=function(){cat=b.getAttribute('data-cat-btn');
        box.querySelectorAll('[data-cat-btn]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});apply()}
    });
    box.querySelectorAll('[data-view-btn]').forEach(function(b){
      b.onclick=function(){view=b.getAttribute('data-view-btn');
        box.querySelectorAll('[data-view-btn]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});apply()}
    });
    document.querySelectorAll('[data-lang-btn]').forEach(function(b){b.addEventListener('click',function(){setTimeout(apply,0)})});
    apply();
  }

  ready(function(){typer();projects()});
})();

/* ============================================================
   hero wireframe — scroll drives a camera through a stack of
   cross-section frames. Canvas 2D, hand-rolled projection, no deps.
   ============================================================ */
(function(){
  var root=document.documentElement;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ready(fn){if(document.readyState!=='loading')fn();else document.addEventListener('DOMContentLoaded',fn)}

  ready(function(){
    var hero=document.querySelector('.hero');if(!hero)return;
    var cv=document.createElement('canvas');cv.className='wire';cv.setAttribute('aria-hidden','true');
    hero.insertBefore(cv,hero.firstChild);
    var ctx=cv.getContext('2d');if(!ctx)return;

    var SLICES=30, SIDES=36, GAP=1.5, FOV=2.15, RAIL=6, START=-3.6;   /* RAIL: every Nth vertex gets a longitudinal line */
    var W=0,H=0,dpr=1,depth=SLICES*GAP;

    /* squared-off cross-section (superellipse), so it reads as a technical
       section stack rather than anything architectural */
    function sect(a,rx,ry){
      var c=Math.cos(a),s=Math.sin(a),p=0.5;              /* p=0.5 -> exponent 4 */
      return [Math.sign(c)*Math.pow(Math.abs(c),p)*rx, Math.sign(s)*Math.pow(Math.abs(s),p)*ry];
    }
    /* profile along the stack: wide at the mouth, waisted, opening again */
    function prof(t){return 1.05+0.42*Math.sin(t*Math.PI*1.35)-0.30*t}

    var pts=[];                                            /* [slice][vertex] = [x,y,z] */
    for(var i=0;i<SLICES;i++){
      var t=i/(SLICES-1), rx=prof(t)*1.55, ry=prof(t)*0.92, row=[];
      for(var j=0;j<SIDES;j++){
        var a=j/SIDES*Math.PI*2, p=sect(a,rx,ry);
        row.push([p[0], p[1]+0.10*Math.sin(i*0.55), i*GAP]);
      }
      pts.push(row);
    }

    function resize(){
      var r=hero.getBoundingClientRect();
      dpr=Math.min(r.width<700?1.5:2,devicePixelRatio||1);
      if(!r.width||!r.height)return false;
      cv.width=W=r.width*dpr|0; cv.height=H=r.height*dpr|0;
      cv.style.width=r.width+'px'; cv.style.height=r.height+'px';
      return true;
    }

    function draw(camZ){
      if(!W||!H)return;
      ctx.clearRect(0,0,W,H);
      var cs=getComputedStyle(root), acc=cs.getPropertyValue('--acc').trim()||'#2244E8';
      var cx=W*0.5, cy=H*0.52, k=FOV*Math.min(W,H)*0.5;
      ctx.lineWidth=Math.max(1,dpr*0.9); ctx.strokeStyle=acc; ctx.lineJoin='round';

      var scr=[];                                          /* projected, null when behind camera */
      for(var i=0;i<SLICES;i++){
        var d=pts[i][0][2]-camZ, row=null;
        if(d>0.45){
          var sc=k/d; row=[];
          for(var j=0;j<SIDES;j++){var p=pts[i][j];row.push([cx+p[0]*sc, cy+p[1]*sc])}
        }
        scr.push(row);
      }

      /* cross-sections */
      for(var i=0;i<SLICES;i++){
        var row=scr[i];if(!row)continue;
        var d=pts[i][0][2]-camZ;
        var fade=Math.min(1,Math.max(0,(depth*0.9-d)/(depth*0.55)));   /* far ones fade out */
        var near=Math.min(1,Math.max(0,(d-0.45)/2.2));                  /* and so do ones at the lens */
        ctx.globalAlpha=0.5*fade*near;
        if(ctx.globalAlpha<0.01)continue;
        ctx.beginPath();ctx.moveTo(row[0][0],row[0][1]);
        for(var j=1;j<SIDES;j++)ctx.lineTo(row[j][0],row[j][1]);
        ctx.closePath();ctx.stroke();
      }

      /* longitudinal rails */
      ctx.globalAlpha=0.20;
      for(var j=0;j<SIDES;j+=RAIL){
        ctx.beginPath();var started=false;
        for(var i=0;i<SLICES;i++){
          var row=scr[i];if(!row){started=false;continue}
          if(!started){ctx.moveTo(row[j][0],row[j][1]);started=true}
          else ctx.lineTo(row[j][0],row[j][1]);
        }
        ctx.stroke();
      }
      ctx.globalAlpha=1;
    }

    var cur=0,target=0,raf=0;
    function progress(){
      var h=hero.offsetHeight||innerHeight;
      return Math.min(1,Math.max(0,scrollY/(h*0.92)));
    }
    function tick(){
      cur+=(target-cur)*0.08;
      draw(START+cur*depth*0.74);
      raf=Math.abs(target-cur)>0.0008?requestAnimationFrame(tick):0;
    }
    function kick(){target=progress();if(!raf)raf=requestAnimationFrame(tick)}

    if(!resize())return;
    if(reduce){draw(START);addEventListener('resize',function(){if(resize())draw(START+cur*depth*0.74)});return}
    draw(START);
    addEventListener('scroll',kick,{passive:true});
    addEventListener('resize',function(){if(resize()){cur=target=progress();draw(START+cur*depth*0.74)}});
    document.fonts&&document.fonts.ready.then(function(){if(resize())draw(START+cur*depth*0.74)});
    kick();
  });
})();

/* ---- chained first screens: fade the pinned hero as the next screen covers it ---- */
(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ready(fn){if(document.readyState!=='loading')fn();else document.addEventListener('DOMContentLoaded',fn)}
  ready(function(){
    if(reduce)return;
    var chain=document.querySelector('.chain'),hero=chain&&chain.querySelector('.hero');
    if(!chain||!hero)return;
    var span=1,raf=0;
    function measure(){span=Math.max(1,chain.offsetHeight-hero.offsetHeight)}
    function paint(){
      raf=0;
      var p=Math.min(1,Math.max(0,(scrollY-chain.offsetTop)/span));
      hero.style.setProperty('--cover',p.toFixed(3));
    }
    function kick(){if(!raf)raf=requestAnimationFrame(paint)}
    measure();paint();
    addEventListener('scroll',kick,{passive:true});
    addEventListener('resize',function(){measure();kick()});
    document.fonts&&document.fonts.ready.then(function(){measure();kick()});
  });
})();

/* ---- copy the contents of a referenced block ---- */
(function(){
  function ready(fn){if(document.readyState!=='loading')fn();else document.addEventListener('DOMContentLoaded',fn)}
  ready(function(){
    document.querySelectorAll('[data-copy-from]').forEach(function(b){
      b.addEventListener('click',function(){
        var src=document.getElementById(b.getAttribute('data-copy-from'));if(!src)return;
        var done=function(){b.classList.add('done');setTimeout(function(){b.classList.remove('done')},1800)};
        var txt=src.innerText;
        if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(done,done);
        else done();
      });
    });
  });
})();
