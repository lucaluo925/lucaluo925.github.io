/* SPK: the film and print engine, run in the browser.
   It is our own simplified spectral pipeline (the same maths as tools/bake_luts.py), driven by the measured
   profiles in data/profiles.json. Light is followed through 81 wavelengths: scene to film, film to paper, paper to eye.
   The result for one film, one paper and one enlarger setting is a 33 x 33 x 33 table that the darkroom then applies to the photo.
   Profiles: spektrafilm by Andrea Volpato (CC BY-SA 4.0) and SpektraLab's black and white set. Coupler numbers: spektrafilm defaults. */
const SPK=(()=>{
  const NW=81, N=33, LN10=Math.LN10, WL=Float64Array.from({length:NW},(_,i)=>380+5*i);
  const lobe=(l,mu,s1,s2)=>Math.exp(-.5*Math.pow((l-mu)/(l<mu?s1:s2),2));
  // CIE 1931 colour matching functions, multi-lobe fit (Wyman, Sloan, Shirley 2013)
  const CMF=[0,1,2].map(k=>WL.map(l=>k===0?1.056*lobe(l,599.8,37.9,31)+.362*lobe(l,442,16,26.7)-.065*lobe(l,501.1,20.4,26.2):k===1?.821*lobe(l,568.8,46.9,40.5)+.286*lobe(l,530.9,16.3,31.1):1.217*lobe(l,437,11.8,36)+.681*lobe(l,459,26,13.8)));
  const bb=T=>{ const s=WL.map(l=>{ const m=l*1e-9; return 1/(Math.pow(m,5)*(Math.exp(1.4388e-2/(m*T))-1)); }), mx=Math.max(...s); return s.map(v=>v/mx); };
  const ILL={D55:bb(5500),D50:bb(5003),T:bb(3200),'TH-KG3':bb(3200),K75P:bb(5400)};
  const M=[[3.1338561,-1.6168667,-.4906146],[-.9787684,1.9161415,.033454],[.0719453,-.2289914,1.4052427]]; // XYZ (D50) to linear sRGB
  // linear sRGB to a smooth spectrum: three bands that add up to one
  const BAS=[WL.map(l=>1/(1+Math.exp(-(l-595)/14))),null,WL.map(l=>1/(1+Math.exp((l-490)/12)))]; BAS[1]=WL.map((l,i)=>1-BAS[0][i]-BAS[2][i]);
  // enlarger filters as smooth dye bands. One CC unit is 0.01 density at the peak.
  const FY=WL.map(l=>1/(1+Math.exp((l-505)/9))), FM=WL.map(l=>Math.exp(-Math.pow((l-548)/38,2)));
  // DIR coupler strengths, donor layer in the row and receiving layer in the column (spektrafilm DirCouplersParams)
  const DIR=[[.341,.355,.305],[.154,.324,.358],[.171,.225,.273]];
  let P=null, loading=null; const ready={}, cache=new Map();

  function load(url){ if(P) return Promise.resolve(P); if(!loading) loading=fetch(url||'data/profiles.json').then(r=>{ if(!r.ok) throw new Error('profiles '+r.status); return r.json(); }).then(j=>{ P=j; return P; }); return loading; }
  function use(j){ P=j; }
  function prof(k){ if(ready[k]) return ready[k]; let raw=P[k]; if(!raw) return null; let info=raw.info||{};
    if(raw.alias){ const b=prof(raw.alias); if(!b) return null; return ready[k]=Object.assign({},b,{info:Object.assign({},b.info,info),key:k}); }
    const n=raw.le.length, sens=new Float64Array(243), cd=Float64Array.from(raw.cd,v=>v||0), base=Float64Array.from(raw.base,v=>v||0), dc=Float64Array.from(raw.dc,v=>v||0), le=Float64Array.from(raw.le);
    for(let i=0;i<243;i++){ const v=raw.ls[i]; sens[i]=v==null?0:Math.pow(10,v); }
    const dmin=[9,9,9], dmax=[0,0,0]; for(let j=0;j<n;j++) for(let c=0;c<3;c++){ const v=dc[j*3+c]; if(v<dmin[c]) dmin[c]=v; if(v>dmax[c]) dmax[c]=v; }
    return ready[k]={key:k,info,n,sens,cd,base,dc,le,dmin,dmax,pos:info.type==='positive',bw:info.channel_model==='bw'}; }
  // linear interpolation on a curve stored as rows of three; xs ascending
  function at(xs,ys,c,n,x){ if(x<=xs[0]) return ys[c]; if(x>=xs[n-1]) return ys[(n-1)*3+c]; let lo=0, hi=n-1; while(hi-lo>1){ const m=(lo+hi)>>1; if(xs[m]<=x) lo=m; else hi=m; } const f=(x-xs[lo])/(xs[hi]-xs[lo]||1); return ys[lo*3+c]+(ys[hi*3+c]-ys[lo*3+c])*f; }
  function inv(p,c,D){ let best=0, bd=1e9; const asc=p.dc[(p.n-1)*3+c]>p.dc[c]; let lo=0, hi=p.n-1; while(hi-lo>1){ const m=(lo+hi)>>1; if((p.dc[m*3+c]<=D)===asc) lo=m; else hi=m; }
    const a=p.dc[lo*3+c], b=p.dc[hi*3+c], f=b===a?0:(D-a)/(b-a); return p.le[lo]+(p.le[hi]-p.le[lo])*Math.min(1,Math.max(0,f)); }
  function trans(p,D,out){ for(let i=0;i<NW;i++) out[i]=Math.exp(-LN10*(D[0]*p.cd[i*3]+D[1]*p.cd[i*3+1]+D[2]*p.cd[i*3+2]+p.base[i])); }
  function toRgb(spec,ill,k,out){ let X=0, Y=0, Z=0; for(let i=0;i<NW;i++){ const v=spec[i]*ill[i]; X+=v*CMF[0][i]; Y+=v*CMF[1][i]; Z+=v*CMF[2][i]; } X/=k; Y/=k; Z/=k;
    out[0]=M[0][0]*X+M[0][1]*Y+M[0][2]*Z; out[1]=M[1][0]*X+M[1][1]*Y+M[1][2]*Z; out[2]=M[2][0]*X+M[2][1]*Y+M[2][2]*Z; }
  function white(p,ill,k){ const s=new Float64Array(NW), o=[0,0,0]; trans(p,p.dmin,s); toRgb(s,ill,k,o); return o[1]; }
  // film curves as they were before the couplers acted, so that a grey scale still lands on the measured curves
  function couple(p,amount){ if(!(amount>0)||p.bw) return {dc:p.dc,Mx:null}; const n=p.n, Mx=DIR.map(r=>r.map(v=>v*amount)), dc2=new Float64Array(n*3), x0=new Float64Array(n);
    for(let c=0;c<3;c++){ for(let j=0;j<n;j++){ let a=0; for(let k=0;k<3;k++){ const s=p.pos?p.dmax[k]-p.dc[j*3+k]:p.dc[j*3+k]; a+=s*Mx[k][c]; } x0[j]=p.le[j]-a; }
      for(let j=1;j<n;j++) if(x0[j]<=x0[j-1]) x0[j]=x0[j-1]+1e-9;
      for(let j=0;j<n;j++){ const x=p.le[j]; let v; if(x<=x0[0]) v=p.dc[c]; else if(x>=x0[n-1]) v=p.dc[(n-1)*3+c]; else { let lo=0, hi=n-1; while(hi-lo>1){ const m=(lo+hi)>>1; if(x0[m]<=x) lo=m; else hi=m; } const f=(x-x0[lo])/(x0[hi]-x0[lo]); v=p.dc[lo*3+c]+(p.dc[hi*3+c]-p.dc[lo*3+c])*f; } dc2[j*3+c]=v; } }
    return {dc:dc2,Mx}; }

  /* o: film, paper, grade (black and white paper), ev (camera, stops), pe (print exposure, stops), fy, fm (CC shifts), couplers, glare (percent) */
  function build(o){ const F=prof(o.film); if(!F) return null; const key=[o.film,o.paper||'',o.grade||'',o.ev||0,o.pe||0,o.fy||0,o.fm||0,o.couplers==null?1:o.couplers,o.glare==null?.03:o.glare,o.pf||0].join('|'); if(cache.has(key)) return cache.get(key);
    const illF=ILL[F.info.reference_illuminant]||ILL.D55, A=[[0,0,0],[0,0,0],[0,0,0]], Eg=[0,0,0];
    for(let k=0;k<3;k++){ for(let j=0;j<3;j++){ let s=0; for(let i=0;i<NW;i++) s+=BAS[j][i]*illF[i]*F.sens[i*3+k]; A[k][j]=s; } Eg[k]=.18*(A[k][0]+A[k][1]+A[k][2]); }
    const cp=couple(F,o.couplers==null?1:o.couplers), fdc=cp.dc, Mx=cp.Mx, ev=(o.ev||0)*.30103, D=[0,0,0], L=[0,0,0], sp=new Float64Array(NW), rgb=[0,0,0];
    const filmD=(r,g,b)=>{ for(let k=0;k<3;k++){ const E=A[k][0]*r+A[k][1]*g+A[k][2]*b; L[k]=Math.log10(Math.max(E/Eg[k],1e-9))+ev; }
      if(Mx){ const d0=at(F.le,F.dc,0,F.n,L[0]), d1=at(F.le,F.dc,1,F.n,L[1]), d2=at(F.le,F.dc,2,F.n,L[2]), s0=F.pos?F.dmax[0]-d0:d0, s1=F.pos?F.dmax[1]-d1:d1, s2=F.pos?F.dmax[2]-d2:d2;
        for(let c=0;c<3;c++) L[c]-=s0*Mx[0][c]+s1*Mx[1][c]+s2*Mx[2][c]; }
      D[0]=at(F.le,fdc,0,F.n,L[0]); D[1]=at(F.le,fdc,1,F.n,L[1]); D[2]=at(F.le,fdc,2,F.n,L[2]); trans(F,D,sp); };
    let run, w; const glare=(o.glare==null?.03:o.glare)/100;
    if(F.pos||!o.paper){ const view=ILL[F.info.viewing_illuminant]||ILL.D50; let kv=0; for(let i=0;i<NW;i++) kv+=view[i]*CMF[1][i]; w=white(F,view,kv); let off=0; const sh=(o.pe||0)*.30103;
      const one=(r,g,b,x)=>{ filmD(r*Math.pow(10,x),g*Math.pow(10,x),b*Math.pow(10,x)); toRgb(sp,view,kv,rgb); };
      if(!F.pos) w=1; if(F.pos){ let lo=-1.5, hi=1.5; for(let i=0;i<40;i++){ const m=(lo+hi)/2; one(.18,.18,.18,m); if(rgb[1]>.18*w) hi=m; else lo=m; } off=(lo+hi)/2-sh; } else off=0;
      run=(r,g,b)=>one(r,g,b,off); }
    else { const Pp=prof(o.paper); if(!Pp) return null; const illP=ILL[Pp.info.reference_illuminant]||ILL['TH-KG3'], view=ILL[Pp.info.viewing_illuminant]||ILL.D50; let kv=0; for(let i=0;i<NW;i++) kv+=view[i]*CMF[1][i]; w=white(Pp,view,kv);
      const gr=Pp.bw&&P._grades?P._grades[o.grade||'2']||P._grades['2']:null, W=new Float64Array(243), dy=((gr?gr[0]:0))/100, dm=((gr?gr[1]:0))/100;
      for(let i=0;i<NW;i++){ const f=Math.exp(-LN10*(dy*FY[i]+dm*FM[i])); for(let k=0;k<3;k++) W[i*3+k]=illP[i]*f*Pp.sens[i*3+k]; }
      const pe=(o.pe||0)*.30103, sh=[pe,pe-(Pp.bw?0:(o.fm||0)/100),pe-(Pp.bw?0:(o.fy||0)/100)], E=[0,0,0], Dp=[0,0,0], sp2=new Float64Array(NW), g0=[1,1,1], tg=[0,0,0];
      // preflash: a short exposure of the paper through clear film base before the picture, which softens the highlights
      const pfE=[0,0,0], pf=o.pf||0; if(pf>0) for(let i=0;i<NW;i++){ const t=Math.exp(-LN10*F.base[i]); pfE[0]+=t*W[i*3]; pfE[1]+=t*W[i*3+1]; pfE[2]+=t*W[i*3+2]; }
      let flash=0; const paperE=()=>{ E[0]=E[1]=E[2]=0; for(let i=0;i<NW;i++){ const t=sp[i]; E[0]+=t*W[i*3]; E[1]+=t*W[i*3+1]; E[2]+=t*W[i*3+2]; } if(flash){ E[0]+=flash*pfE[0]; E[1]+=flash*pfE[1]; E[2]+=flash*pfE[2]; } };
      filmD(.18,.18,.18); paperE(); if(Pp.bw){ const m=(E[0]+E[1]+E[2])/3; g0[0]=g0[1]=g0[2]=m; } else { g0[0]=E[0]; g0[1]=E[1]; g0[2]=E[2]; }
      const one=(r,g,b)=>{ filmD(r,g,b); paperE(); for(let k=0;k<3;k++) Dp[k]=at(Pp.le,Pp.dc,k,Pp.n,Math.log10(Math.max(E[k]/g0[k],1e-12))+tg[k]); trans(Pp,Dp,sp2); toRgb(sp2,view,kv,rgb); };
      // place mid grey: a common exposure for black and white paper, equal layer densities for colour paper
      if(Pp.bw){ let lo=-3, hi=3; for(let i=0;i<40;i++){ const m=(lo+hi)/2; tg[0]=tg[1]=tg[2]=m; one(.18,.18,.18); if(rgb[1]/w>.18) lo=m; else hi=m; } const m=(lo+hi)/2; for(let k=0;k<3;k++) tg[k]=m+sh[k]; }
      else { let lo=.05, hi=2.5; for(let i=0;i<40;i++){ const m=(lo+hi)/2; for(let k=0;k<3;k++) tg[k]=inv(Pp,k,m); one(.18,.18,.18); if(rgb[1]/w>.18) lo=m; else hi=m; } const m=(lo+hi)/2; for(let k=0;k<3;k++) tg[k]=inv(Pp,k,m)+sh[k]; }
      flash=pf; run=one; }
    const out=new Float32Array(N*N*N*3), lin=Float64Array.from({length:N},(_,i)=>4*Math.pow(i/(N-1),2));
    for(let g=0;g<N;g++) for(let b=0;b<N;b++) for(let r=0;r<N;r++){ run(lin[r],lin[g],lin[b]); const i=(g*1089+b*33+r)*3; out[i]=rgb[0]/w+glare; out[i+1]=rgb[1]/w+glare; out[i+2]=rgb[2]/w+glare; }
    // our spectra and lamps are approximations, so the grey axis drifts. Pull it most of the way back and keep a quarter of the stock's own tint.
    // A filter or exposure change made by the user is measured against the neutral setting, so it is kept in full.
    const neu=new Float64Array(N*3), tgt=new Float64Array(N), xs=new Float64Array(N), ys=new Float64Array(N);
    const base=(o.pe||o.fy||o.fm||o.pf)?build(Object.assign({},o,{pe:0,fy:0,fm:0,pf:0})):null, ref=base?base.f:out;
    for(let i=0;i<N;i++){ const j=(i*1089+i*33+i)*3; for(let c=0;c<3;c++) neu[i*3+c]=Math.max(0,ref[j+c]); tgt[i]=.2126*neu[i*3]+.7152*neu[i*3+1]+.0722*neu[i*3+2]; }
    const lut=new Uint8Array(N*N*N*3), rawNeg=!F.pos&&!o.paper;
    for(let c=0;c<3;c++){ let mx=-1; for(let i=0;i<N;i++){ mx=Math.max(mx+1e-9,neu[i*3+c]); xs[i]=mx; ys[i]=.75*tgt[i]+.25*neu[i*3+c]; }
      for(let i=c;i<out.length;i+=3){ const x=out[i]; let v; if(rawNeg) v=x; else if(x<=xs[0]) v=ys[0]; else if(x>=xs[N-1]) v=ys[N-1]; else { let lo=0, hi=N-1; while(hi-lo>1){ const m=(lo+hi)>>1; if(xs[m]<=x) lo=m; else hi=m; } v=ys[lo]+(ys[hi]-ys[lo])*(x-xs[lo])/(xs[hi]-xs[lo]); }
        v=v<0?0:v>1?1:v; lut[i]=(v<=.0031308?v*12.92:1.055*Math.pow(v,1/2.4)-.055)*255+.5; } }
    const res={lut,f:out}; cache.set(key,res); if(cache.size>40) cache.delete(cache.keys().next().value); return res; }

  // numbers the grain and halation models need, read from the film's own green curve
  function meta(k){ const p=prof(k); if(!p) return null; let j0=0; for(let j=0;j<p.n;j++) if(Math.abs(p.le[j])<Math.abs(p.le[j0])) j0=j; const a=Math.max(0,j0-4), b=Math.min(p.n-1,j0+4);
    return {g:(p.dc[b*3+1]-p.dc[a*3+1])/(p.le[b]-p.le[a]),d0:p.dc[j0*3+1],dm:p.dmax[1],ah:p.info.antihalation==='strong'?0:p.info.antihalation==='no'?2:1,cine:p.info.use==='cine'?1:0,bw:p.bw,pos:p.pos,name:p.info.name,paper:p.info.target_print}; }
  // the colour of a light leak: white light that reaches the emulsion through the back of the film is filtered by the film's own base.
  // Returned as the share of that light each layer receives, so a masked colour negative leaks warm and a clear based film leaks white.
  function leak(k){ const p=prof(k); if(!p) return [1,1,1]; const ill=ILL.D55, e=[0,0,0]; for(let c=0;c<3;c++){ let a=0, b=0; for(let i=0;i<NW;i++){ const v=ill[i]*p.sens[i*3+c]; b+=v; a+=v*Math.exp(-LN10*p.base[i]); } e[c]=b?a/b:1; } const m=Math.max(e[0],e[1],e[2])||1; return e.map(v=>v/m); }
  function list(){ const films=[], papers=[]; for(const k in P){ if(k[0]==='_') continue; const p=prof(k); if(!p) continue; const i=p.info, e={id:k,name:i.name||k,bw:p.bw,pos:p.pos,cine:i.use==='cine'};
      if(i.support==='paper'||k==='kodak_2383'||k==='kodak_2393') papers.push(e); else films.push(e); } return {films,papers}; }
  return {load,use,build,meta,list,prof,leak,N,ok:()=>!!P};
})();
if(typeof module!=='undefined') module.exports=SPK;
