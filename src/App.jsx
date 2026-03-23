import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════ DESIGN SYSTEM ═══════ */
const F = { d:`"Playfair Display","Georgia",serif`, b:`"DotGothic16","Courier New",monospace`, h:`"Caveat",cursive` };
const V = {
  terra:"#C0542F",terraDk:"#8B3A1F",oil:"#B8860B",oilLt:"#DAA520",
  basil:"#3A7D44",basilDk:"#2A5E32",esp:"#3C1F0E",mozz:"#FDF6EC",
  flour:"#F5E6D0",walnut:"#5C3A21",walnutDk:"#3D2314",
  oak:"#A07840",birch:"#D4A76A",tomato:"#D4392B",
  night:"#1A1030",dusk:"#2A1845",moon:"#E8D0FF",grape:"#9B59B6",
};
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));

/* ═══════ COOKING CONFIG ═══════ */
const COOK = {
  doughVertices: 24,
  doughInitialRadius: 30,
  guideRadius: 85,
  stretchSpeed: 0.5,
  sauceTypes: {
    tomato:   { name:"トマト",      color:"#D4392B", icon:"🍅" },
    genovese: { name:"ジェノベーゼ", color:"#27AE60", icon:"🌿" },
    white:    { name:"ホワイト",     color:"#F0E8D0", icon:"🥛" },
    soy:      { name:"和風醤油",    color:"#7B3F00", icon:"🫘" },
  },
  cheeseTypes: {
    mozzarella:  { name:"モッツァレラ",  color:"#FFF9C4" },
    cheddar:     { name:"チェダー",      color:"#FFB74D" },
    gorgonzola:  { name:"ゴルゴンゾーラ", color:"#B0BEC5" },
  },
  cheeseW: 70, cheeseH: 52,
  toppings: {
    basil:    { name:"バジル",       size:26, type:"emoji", emoji:"🌿" },
    salami:   { name:"サラミ",       size:44, type:"css" },
    olive:    { name:"オリーブ",     size:20, type:"emoji", emoji:"🫒" },
    mushroom: { name:"マッシュルーム", size:28, type:"css" },
    shrimp:   { name:"エビ",         size:36, type:"emoji", emoji:"🦐" },
    tomato_s: { name:"プチトマト",   size:22, type:"emoji", emoji:"🍅" },
    anchovy:  { name:"アンチョビ",   size:30, sizeH:12, type:"css" },
    honey:    { name:"はちみつ",     size:8,  type:"drizzle", emoji:"🍯", color:"#DAA520" },
  },
  ovenInitialTemp: 200,
  ovenDecayRate: 0.6,
  logTempBoost: 30,
  optimalLow: 280,
  optimalHigh: 370,
  maxTemp: 450,
  oilColor: "#6B8E23",
};

/* ═══════ GAME DATA ═══════ */
const INGS = {
  tomato:{name:"トマト",icon:"🍅",price:200},
  basil_i:{name:"バジル",icon:"🌿",price:150},
  mozz_block:{name:"モッツァレラ(塊)",icon:"🧀",price:500,perUnit:6},
  flour_bag:{name:"小麦粉(5kg)",icon:"🌾",price:800},
  salami_log:{name:"サラミ(本)",icon:"🥩",price:480,perUnit:8},
  shrimp_pack:{name:"エビ(パック)",icon:"🦐",price:600,perUnit:8},
  olive_jar:{name:"オリーブ(瓶)",icon:"🫒",price:180,perUnit:12},
};

const SUPPLIERS = [
  {name:"農家のジョバンニ",icon:"🧑‍🌾",trust:3,items:["tomato","basil_i"],desc:"新鮮な地元野菜"},
  {name:"チーズ工房マリア",icon:"🧀",trust:2,items:["mozz_block"],desc:"最高品質のチーズ"},
  {name:"業務用スーパー",icon:"🏬",trust:4,items:["flour_bag","salami_log","shrimp_pack","olive_jar"],desc:"安くて大量"},
];

const MENUS = [
  {id:1,name:"マルゲリータ",price:1200,cost:480,tops:["🧀","🌿","🧀","🌿","🧀"],sc:"#D4392B"},
  {id:2,name:"サラミピッツァ",price:1300,cost:520,tops:["🧀","🔴","🫒","🧀","🔴"],sc:"#D4392B"},
  {id:3,name:"海鮮スペシャル",price:1600,cost:680,tops:["🧀","🦐","🧀","🦐","🦐"],sc:"#D4392B"},
];

const PERSONAS = [
  {icon:"👨‍👩‍👧",name:"ファミリー",tag:"幼児連れ",patience:200,oTime:28,eTime:50},
  {icon:"🎒",name:"学生",tag:"男子高校生",patience:90,oTime:10,eTime:25},
  {icon:"💑",name:"カップル",tag:"初デート",patience:160,oTime:30,eTime:55},
  {icon:"💼",name:"ビジネス",tag:"サラリーマン",patience:65,oTime:8,eTime:20},
  {icon:"🧐",name:"グルメ",tag:"フードブロガー",patience:120,oTime:20,eTime:40},
];

const TABLES=[
  {id:0,x:30,y:18,w:60,h:36},{id:1,x:115,y:18,w:60,h:36},{id:2,x:200,y:18,w:60,h:36},
  {id:3,x:30,y:76,w:60,h:36},{id:4,x:115,y:76,w:60,h:36},{id:5,x:200,y:76,w:60,h:36},
];

let gid=0;

/* ═══════ SHARED UI ═══════ */
const Btn=({children,onClick,disabled,color="terra",style:st={}})=>{
  const bgs={terra:`linear-gradient(180deg,${V.terra},${V.terraDk})`,basil:`linear-gradient(180deg,${V.basil},${V.basilDk})`,grape:`linear-gradient(180deg,${V.grape},#7D3C98)`,green:`linear-gradient(180deg,#4A7C3F,#3A6530)`,sec:V.mozz};
  return <button onClick={onClick} disabled={disabled} style={{padding:"8px 14px",borderRadius:10,border:color==="sec"?`2px solid ${V.birch}`:"none",background:disabled?"#CCC":bgs[color],color:disabled?"#999":color==="sec"?V.esp:"#FFF",fontFamily:F.b,fontSize:11,fontWeight:"bold",cursor:disabled?"default":"pointer",width:"100%",...st}}>{children}</button>;
};

/* ═══════ MORNING ═══════ */
function Morning({day,money,onNext}){
  const weather=["☀️ 晴れ","☁️ 曇り","🌧️ 雨"][day%3];
  const dayN=["月","火","水","木","金","土","日"][(day-1)%7]+"曜日";
  const ev=[null,"🎓 大学で学園祭",null,"🏟️ サッカー試合",null,null,"🎪 商店街セール"][(day-1)%7];
  return(
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:V.flour}}>
      <div style={{background:`linear-gradient(180deg,#4A2A15,${V.walnutDk})`,padding:"8px 12px",borderBottom:`3px solid ${V.birch}`,flexShrink:0,textAlign:"center"}}>
        <div style={{fontFamily:F.b,color:"#FFF",fontSize:13}}>🌅 Day {day} — おはようございます</div>
      </div>
      <div style={{flex:1,overflow:"auto",padding:"12px 16px"}}>
        <div style={{textAlign:"center",marginBottom:10}}>
          <div style={{fontFamily:F.d,fontSize:24,fontWeight:700,color:V.esp}}>Day {day}</div>
          <div style={{fontFamily:F.h,fontSize:18,color:V.oak}}>Buongiorno!</div>
          <div style={{fontFamily:F.b,fontSize:10,color:"#888",marginTop:3}}>💰 所持金: ¥{money.toLocaleString()}</div>
        </div>
        <div style={{background:"#FFF",borderRadius:12,padding:12,border:`2px solid ${V.birch}`,marginBottom:10}}>
          <div style={{fontFamily:F.b,fontSize:11,fontWeight:"bold",color:V.esp,marginBottom:6}}>📅 今日の情報</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            <div style={{background:V.mozz,borderRadius:8,padding:"5px 8px"}}><div style={{fontFamily:F.b,fontSize:7,color:"#999"}}>曜日</div><div style={{fontFamily:F.b,fontSize:11,color:V.esp}}>{dayN}</div></div>
            <div style={{background:V.mozz,borderRadius:8,padding:"5px 8px"}}><div style={{fontFamily:F.b,fontSize:7,color:"#999"}}>天気</div><div style={{fontFamily:F.b,fontSize:11,color:V.esp}}>{weather}</div></div>
          </div>
          {ev && <div style={{background:"#FFFDE7",borderRadius:8,padding:"4px 8px",marginTop:6}}><div style={{fontFamily:F.b,fontSize:7,color:"#999"}}>イベント</div><div style={{fontFamily:F.b,fontSize:10,color:V.esp}}>{ev}</div></div>}
        </div>
        <Btn onClick={onNext}>🏪 マルシェへ仕入れに行く</Btn>
      </div>
    </div>
  );
}

/* ═══════ MARCHE ═══════ */
function Marche({money,stock,onDone}){
  const [cart,setCart]=useState({});
  const [exp,setExp]=useState(0);
  const spent=Object.entries(cart).reduce((s,[id,q])=>s+(INGS[id]?.price||0)*q,0);
  const rem=money-spent;

  return(
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:"#E8D5B8"}}>
      <div style={{background:"linear-gradient(180deg,#4A7C3F,#3A6530)",padding:"7px 12px",borderBottom:"3px solid #2D4F24",flexShrink:0,textAlign:"center"}}>
        <div style={{fontFamily:F.b,color:"#FFF",fontSize:13}}>🏪 マルシェ通り</div>
      </div>
      <div style={{background:"#FFF8EE",padding:"4px 12px",display:"flex",justifyContent:"space-between",borderBottom:"1px solid #D4A76A",flexShrink:0}}>
        <span style={{fontFamily:F.b,fontSize:10}}>💰 残り: <b style={{color:rem<3000?V.terra:V.basil}}>¥{rem.toLocaleString()}</b></span>
        <span style={{fontFamily:F.b,fontSize:10}}>🧺 {Object.values(cart).reduce((s,v)=>s+v,0)}点</span>
      </div>
      <div style={{flex:1,overflow:"auto",padding:"5px 10px"}}>
        {SUPPLIERS.map((sup,si)=>(
          <div key={si} style={{background:"#FFF",borderRadius:10,marginBottom:6,border:`2px solid ${V.birch}`,overflow:"hidden"}}>
            <div onClick={()=>setExp(exp===si?-1:si)} style={{padding:"7px 10px",display:"flex",alignItems:"center",gap:7,cursor:"pointer",background:exp===si?"#FFF8EE":"#FFF"}}>
              <span style={{fontSize:20}}>{sup.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontFamily:F.b,fontSize:11,fontWeight:"bold",color:V.esp}}>{sup.name}</div>
                <div style={{fontFamily:F.b,fontSize:8,color:"#888"}}>{sup.desc}</div>
                <div style={{display:"flex",gap:1,marginTop:1}}>{Array.from({length:5}).map((_,i)=><span key={i} style={{fontSize:8,opacity:i<sup.trust?1:.2}}>⭐</span>)}</div>
              </div>
              <span style={{fontSize:11,color:"#BBB"}}>{exp===si?"▲":"▼"}</span>
            </div>
            {exp===si&&<div style={{borderTop:"1px solid #EEE"}}>
              {sup.items.map((iid,ii)=>{
                const ing=INGS[iid]; if(!ing) return null;
                const cnt=cart[iid]||0;
                return(
                  <div key={ii} style={{padding:"5px 10px",display:"flex",alignItems:"center",gap:6,borderBottom:ii<sup.items.length-1?"1px solid #F5F5F5":"none"}}>
                    <span style={{fontSize:18}}>{ing.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:F.b,fontSize:10,color:V.esp}}>{ing.name}</div>
                      <div style={{display:"flex",gap:6}}>
                        <span style={{fontFamily:F.b,fontSize:10,color:V.terra}}>¥{ing.price}</span>
                        <span style={{fontFamily:F.b,fontSize:8,color:"#AAA",background:"#F5F5F5",padding:"0 4px",borderRadius:4}}>在庫:{stock[iid]||0}</span>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:3}}>
                      {cnt>0&&<button onClick={()=>setCart(p=>{const n={...p};if(n[iid]>1)n[iid]--;else delete n[iid];return n;})} style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${V.terra}`,background:"#FFF",color:V.terra,fontSize:12,fontWeight:"bold",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>}
                      {cnt>0&&<span style={{fontFamily:F.b,fontSize:12,fontWeight:"bold",minWidth:12,textAlign:"center"}}>{cnt}</span>}
                      <button onClick={()=>{if(rem>=ing.price)setCart(p=>({...p,[iid]:(p[iid]||0)+1}));}} disabled={rem<ing.price} style={{width:22,height:22,borderRadius:"50%",border:"none",background:rem>=ing.price?V.basil:"#CCC",color:"#FFF",fontSize:12,fontWeight:"bold",cursor:rem>=ing.price?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>}
          </div>
        ))}
      </div>
      <div style={{background:"#FFF",padding:"6px 12px",borderTop:`3px solid ${V.oil}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div><div style={{fontFamily:F.b,fontSize:8,color:"#888"}}>合計</div><div style={{fontFamily:F.b,fontSize:15,fontWeight:"bold",color:V.terra}}>¥{spent.toLocaleString()}</div></div>
        <Btn onClick={()=>onDone(cart,spent)} style={{width:"auto",padding:"8px 18px"}}>購入 → 仕込み</Btn>
      </div>
    </div>
  );
}

/* ═══════ PREP ═══════ */
function Prep({stock,onDone}){
  const maxDough=Math.floor((stock.flour_bag||0)*25);
  const maxSauce=Math.floor((stock.tomato||0)/3);
  const [dough,setDough]=useState(Math.min(8,maxDough));
  const [sauce,setSauce]=useState(Math.min(6,maxSauce));
  const [cuts,setCuts]=useState({mozz_block:0,salami_log:0,shrimp_pack:0,olive_jar:0});
  const adj=(k,d)=>{const per=INGS[k]?.perUnit||1;const mx=(stock[k]||0)*per;setCuts(p=>({...p,[k]:clamp((p[k]||0)+d,0,mx)}));};
  const waste=(k)=>{const per=INGS[k]?.perUnit||1;const c=cuts[k]||0;if(c===0)return 0;const r=c%per;return r>0?per-r:0;};
  const CUT_ITEMS=[
    {k:"mozz_block",name:"モッツァレラ",icon:"🧀",u:"塊",su:"枚"},
    {k:"salami_log",name:"サラミ",icon:"🥩",u:"本",su:"枚"},
    {k:"shrimp_pack",name:"エビ",icon:"🦐",u:"パック",su:"尾"},
    {k:"olive_jar",name:"オリーブ",icon:"🫒",u:"瓶",su:"個"},
  ];

  return(
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:V.flour}}>
      <div style={{background:`linear-gradient(180deg,#4A2A15,${V.walnutDk})`,padding:"7px 12px",borderBottom:`3px solid ${V.birch}`,flexShrink:0,textAlign:"center"}}>
        <div style={{fontFamily:F.b,color:"#FFF",fontSize:13}}>🔪 仕込み</div>
      </div>
      <div style={{background:"#FFFDE7",padding:"3px 12px",borderBottom:"1px solid #EEE",flexShrink:0}}>
        <span style={{fontFamily:F.b,fontSize:8,color:"#888"}}>⚠️ 在庫の範囲内で。仕込んだ分だけ今日使えます</span>
      </div>
      <div style={{flex:1,overflow:"auto",padding:"6px 10px"}}>
        <div style={{background:"#FFF",borderRadius:10,padding:8,border:`2px solid ${V.birch}`,marginBottom:6}}>
          <div style={{fontFamily:F.b,fontSize:10,fontWeight:"bold",color:V.esp,marginBottom:4}}>🫓 生地 & 🥫 ソース</div>
          <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 0",borderBottom:"1px solid #F5F5F5"}}>
            <span style={{fontSize:14}}>🫓</span>
            <div style={{flex:1}}><div style={{fontFamily:F.b,fontSize:10,color:V.esp}}>レギュラー生地</div><div style={{fontFamily:F.b,fontSize:7,color:"#AAA"}}>最大{maxDough}枚（小麦粉{stock.flour_bag||0}袋）</div></div>
            <button onClick={()=>setDough(d=>Math.max(0,d-1))} style={{width:22,height:22,borderRadius:5,border:`1px solid ${V.terra}`,background:"#FFF",color:V.terra,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
            <span style={{fontFamily:F.b,fontSize:12,fontWeight:"bold",minWidth:28,textAlign:"center"}}>{dough}枚</span>
            <button onClick={()=>setDough(d=>Math.min(maxDough,d+1))} disabled={dough>=maxDough} style={{width:22,height:22,borderRadius:5,border:"none",background:dough<maxDough?V.basil:"#CCC",color:"#FFF",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 0"}}>
            <span style={{fontSize:14}}>🍅</span>
            <div style={{flex:1}}><div style={{fontFamily:F.b,fontSize:10,color:V.esp}}>トマトソース</div><div style={{fontFamily:F.b,fontSize:7,color:"#AAA"}}>最大{maxSauce}食分（トマト3個/食分）</div></div>
            <button onClick={()=>setSauce(d=>Math.max(0,d-1))} style={{width:22,height:22,borderRadius:5,border:`1px solid ${V.terra}`,background:"#FFF",color:V.terra,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
            <span style={{fontFamily:F.b,fontSize:12,fontWeight:"bold",minWidth:32,textAlign:"center"}}>{sauce}食分</span>
            <button onClick={()=>setSauce(d=>Math.min(maxSauce,d+1))} disabled={sauce>=maxSauce} style={{width:22,height:22,borderRadius:5,border:"none",background:sauce<maxSauce?V.basil:"#CCC",color:"#FFF",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
          </div>
          <div style={{fontFamily:F.b,fontSize:7,color:"#999",marginTop:3,background:"#FFFDE7",borderRadius:5,padding:"3px 6px"}}>
            使用: トマト<b>{sauce*3}</b>個(在庫{stock.tomato||0}) / 小麦粉から生地<b>{dough}</b>枚分
          </div>
        </div>
        <div style={{background:"#FFF",borderRadius:10,padding:8,border:`2px solid ${V.birch}`,marginBottom:6}}>
          <div style={{fontFamily:F.b,fontSize:10,fontWeight:"bold",color:V.esp,marginBottom:3}}>🔪 トッピングのカット</div>
          <div style={{fontFamily:F.b,fontSize:7,color:"#999",marginBottom:4}}>⚠️ カット済み=今日のみ。端数は廃棄</div>
          {CUT_ITEMS.map(ci=>{
            const per=INGS[ci.k]?.perUnit||1;
            const stk=stock[ci.k]||0;
            const mx=stk*per;
            const w=waste(ci.k);
            return(
              <div key={ci.k} style={{padding:"3px 0",borderBottom:"1px solid #F5F5F5"}}>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{fontSize:14}}>{ci.icon}</span>
                  <div style={{flex:1}}><div style={{fontFamily:F.b,fontSize:10,color:V.esp}}>{ci.name}</div><div style={{fontFamily:F.b,fontSize:7,color:"#AAA"}}>在庫{stk}{ci.u}(1{ci.u}={per}{ci.su})</div></div>
                  <button onClick={()=>adj(ci.k,-1)} style={{width:20,height:20,borderRadius:4,border:`1px solid ${V.terra}`,background:"#FFF",color:V.terra,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                  <span style={{fontFamily:F.b,fontSize:11,fontWeight:"bold",minWidth:28,textAlign:"center"}}>{cuts[ci.k]||0}{ci.su}</span>
                  <button onClick={()=>adj(ci.k,1)} disabled={(cuts[ci.k]||0)>=mx} style={{width:20,height:20,borderRadius:4,border:"none",background:(cuts[ci.k]||0)<mx?V.basil:"#CCC",color:"#FFF",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                </div>
                {w>0&&<div style={{fontFamily:F.b,fontSize:7,color:V.terra,marginLeft:20,marginTop:1}}>⚠️ 端数{w}{ci.su}が廃棄</div>}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{padding:"6px 12px",borderTop:`3px solid ${V.oil}`,background:"#FFF",flexShrink:0}}>
        <Btn onClick={()=>onDone({dough,sauce,cuts})}>🍕 仕込み完了 → 営業開始！</Btn>
      </div>
    </div>
  );
}

/* ═══════ CSS TOPPING RENDERERS ═══════ */
function SalamiCSS({size,style:st={}}){
  return <div style={{width:size,height:size,borderRadius:"50%",background:"radial-gradient(circle at 40% 35%,#E04030,#B22020)",position:"relative",boxShadow:"inset 0 -2px 4px rgba(0,0,0,.2)",...st}}>
    {[{x:30,y:25,s:4},{x:55,y:40,s:3},{x:40,y:60,s:5},{x:65,y:20,s:3},{x:20,y:50,s:4}].map((d,i)=>
      <div key={i} style={{position:"absolute",left:`${d.x}%`,top:`${d.y}%`,width:d.s,height:d.s,borderRadius:"50%",background:"rgba(255,255,255,.6)"}}/>
    )}
  </div>;
}

function MushroomCSS({size,style:st={}}){
  return <div style={{width:size,height:size,position:"relative",...st}}>
    <div style={{position:"absolute",top:0,left:"10%",width:"80%",height:"55%",borderRadius:"50% 50% 10% 10%",background:"linear-gradient(180deg,#8B6914,#6B4E12)"}}/>
    <div style={{position:"absolute",bottom:0,left:"35%",width:"30%",height:"55%",borderRadius:"4px 4px 2px 2px",background:"linear-gradient(180deg,#F5F0E0,#E0D8C0)"}}/>
  </div>;
}

function AnchovyCSS({style:st={}}){
  return <div style={{width:30,height:12,borderRadius:"6px/4px",background:"linear-gradient(90deg,#7B5530,#5A3A1A,#7B5530)",boxShadow:"inset 0 1px 2px rgba(255,255,255,.15)",...st}}/>;
}

/* ═══════ PIZZA RENDERER ═══════ */
function PizzaView({pizzaData,cx,cy,baked,scale=1}){
  const {doughVertices,sauceType,sauceBlobs,cheeses,toppings,honeyDrops,oilDrops,bakeLevel}=pizzaData;
  const avgR=doughVertices.reduce((a,b)=>a+b,0)/doughVertices.length;
  const points=doughVertices.map((r,i)=>{
    const angle=(i/doughVertices.length)*Math.PI*2-Math.PI/2;
    return `${cx+r*scale*Math.cos(angle)},${cy+r*scale*Math.sin(angle)}`;
  }).join(" ");

  const sauceColor=COOK.sauceTypes[sauceType]?.color||"#D4392B";
  const bk=baked?(bakeLevel||0):0;
  const doughFill=bk>0?`hsl(35,${60+bk*10}%,${72-bk*18}%)`:"#F0DDB0";
  const filter=bk>0.5?`saturate(${1-bk*0.3}) brightness(${1-bk*0.15})`:"none";

  return <g>
    <polygon points={points} fill={doughFill} stroke="#C9A06C" strokeWidth={2*scale}/>
    {sauceBlobs.map((b,i)=>
      <ellipse key={`s${i}`} cx={cx+(b.x-cx)*scale*0.9} cy={cy+(b.y-cy)*scale*0.9} rx={b.rx*scale} ry={b.ry*scale} fill={sauceColor} opacity={b.opacity} style={{filter}}/>
    )}
    {cheeses.map((c,i)=>{
      const col=COOK.cheeseTypes[c.type]?.color||"#FFF9C4";
      const w=(bk>0?COOK.cheeseW*(1+bk*0.15):COOK.cheeseW)*scale;
      const h=(bk>0?COOK.cheeseH*(1+bk*0.15):COOK.cheeseH)*scale;
      return <ellipse key={`c${i}`} cx={cx+(c.x-cx)*scale} cy={cy+(c.y-cy)*scale} rx={w/2} ry={h/2}
        fill={bk>0?`color-mix(in srgb, ${col} ${100-bk*20}%, #F0C860)`:col}
        opacity={0.85} style={{filter}}/>;
    })}
    {toppings.map((t,i)=>{
      const def=COOK.toppings[t.type];
      if(!def) return null;
      const tx=cx+(t.x-cx)*scale;
      const ty=cy+(t.y-cy)*scale;
      const sz=(def.size||24)*scale;
      if(def.type==="emoji") return <text key={`t${i}`} x={tx} y={ty} fontSize={sz} textAnchor="middle" dominantBaseline="central" transform={`rotate(${t.rotation},${tx},${ty})`} style={{filter}}>{def.emoji}</text>;
      return null;
    })}
    {honeyDrops.map((d,i)=>
      <circle key={`h${i}`} cx={cx+(d.x-cx)*scale} cy={cy+(d.y-cy)*scale} r={d.size*scale} fill="#DAA520" opacity={0.7} style={{filter}}/>
    )}
    {(oilDrops||[]).map((d,i)=>
      <circle key={`o${i}`} cx={cx+(d.x-cx)*scale} cy={cy+(d.y-cy)*scale} r={d.size*scale} fill={COOK.oilColor} opacity={0.5}/>
    )}
  </g>;
}

/* ═══════ COOKING (6-STEP) ═══════ */
function Cooking({order,prepStock,onDone,onBack}){
  const menu=MENUS.find(m=>m.id===order.menuId)||MENUS[0];
  const noDough=(prepStock.dough||0)<=0;
  const noSauce=(prepStock.sauce||0)<=0;

  const [cookStep,setCookStep]=useState("dough");
  const [pizzaData,setPizzaData]=useState({
    doughVertices:Array(COOK.doughVertices).fill(COOK.doughInitialRadius),
    sauceType:"tomato",sauceBlobs:[],cheeses:[],toppings:[],honeyDrops:[],oilDrops:[],
    bakeLevel:0,bakeQuality:null,
  });
  const areaRef=useRef(null);
  const CX=155, CY=140, SVG_W=310, SVG_H=280;

  const getPos=useCallback(e=>{
    const r=areaRef.current?.getBoundingClientRect();
    if(!r) return null;
    const t=e.touches?e.touches[0]:e;
    return {x:t.clientX-r.left, y:t.clientY-r.top};
  },[]);

  /* ──── Step 1: DOUGH ──── */
  const [dragging,setDragging]=useState(false);
  const doughDown=e=>{setDragging(true); e.preventDefault();};
  const doughMove=useCallback(e=>{
    if(!dragging) return;
    const p=getPos(e);
    if(!p) return;
    const dx=p.x-CX, dy=p.y-CY;
    const dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<5) return;
    const angle=Math.atan2(dy,dx);
    setPizzaData(prev=>{
      const verts=[...prev.doughVertices];
      for(let i=0;i<verts.length;i++){
        const va=(i/verts.length)*Math.PI*2-Math.PI/2;
        let diff=Math.abs(angle-va);
        if(diff>Math.PI) diff=Math.PI*2-diff;
        const influence=Math.max(0,1-diff/1.2);
        if(influence>0){
          const stretch=COOK.stretchSpeed*influence*(dist/80);
          verts[i]=Math.max(verts[i],verts[i]+stretch);
        }
      }
      return {...prev,doughVertices:verts};
    });
  },[dragging,getPos]);
  const doughUp=()=>setDragging(false);

  /* ──── Step 2: SAUCE ──── */
  const [saucePhase,setSaucePhase]=useState("select");
  const [selectedSauce,setSelectedSauce]=useState("tomato");
  const [sauceBudget,setSauceBudget]=useState(0);
  const [scooping,setScooping]=useState(false);
  const [scoopVal,setScoopVal]=useState(0);
  const scoopIv=useRef(null);
  const lastPosRef=useRef(null);
  const lastTimeRef=useRef(0);

  const startScoop=()=>{setScooping(true);setScoopVal(0);
    scoopIv.current=setInterval(()=>setScoopVal(v=>Math.min(100,v+2)),30);};
  const endScoop=()=>{clearInterval(scoopIv.current);setScooping(false);
    setSauceBudget(scoopVal);setSaucePhase("paint");
    setPizzaData(p=>({...p,sauceType:selectedSauce,
      sauceBlobs:[{x:CX,y:CY,rx:18,ry:14,opacity:0.8}]}));};

  const sauceMove=useCallback(e=>{
    if(saucePhase!=="paint"||sauceBudget<=0) return;
    const p=getPos(e);
    if(!p) return;
    const now=Date.now();
    const lp=lastPosRef.current;
    const lt=lastTimeRef.current;
    let speed=3;
    if(lp&&lt){
      const d=Math.sqrt((p.x-lp.x)**2+(p.y-lp.y)**2);
      const dt=Math.max(1,now-lt);
      speed=clamp(d/dt*16,1,20);
    }
    lastPosRef.current=p;
    lastTimeRef.current=now;
    const slow=speed<4;
    const rx=slow?clamp(6+Math.random()*4,6,10):clamp(10+speed*1.2,10,24);
    const ry=rx*0.7;
    const opacity=slow?0.75:clamp(0.6-speed*0.015,0.3,0.6);
    const cost=slow?1.5:2+speed*0.3;

    setPizzaData(prev=>({...prev,sauceBlobs:[...prev.sauceBlobs,
      {x:p.x,y:p.y,rx:rx+Math.random()*3,ry:ry+Math.random()*2,opacity}]}));
    setSauceBudget(b=>{
      const nb=Math.max(0,b-cost);
      if(speed>8){
        setPizzaData(prev=>({...prev,sauceBlobs:[...prev.sauceBlobs,
          {x:p.x+(Math.random()-0.5)*30,y:p.y+(Math.random()-0.5)*30,rx:3+Math.random()*3,ry:2+Math.random()*2,opacity:0.5}]}));
      }
      return nb;
    });
  },[saucePhase,sauceBudget,getPos]);

  /* ──── Step 3: CHEESE ──── */
  const [selectedCheese,setSelectedCheese]=useState("mozzarella");
  const cheeseTap=useCallback(e=>{
    const p=getPos(e);
    if(!p) return;
    setPizzaData(prev=>({...prev,cheeses:[...prev.cheeses,
      {x:p.x,y:p.y,type:selectedCheese,key:Date.now()+Math.random()}]}));
  },[getPos,selectedCheese]);

  /* ──── Step 4: TOPPING ──── */
  const [selectedTopping,setSelectedTopping]=useState("basil");
  const [isDrizzling,setIsDrizzling]=useState(false);
  const toppingTap=useCallback(e=>{
    const p=getPos(e);
    if(!p) return;
    const def=COOK.toppings[selectedTopping];
    if(!def) return;
    if(def.type==="drizzle") return;
    setPizzaData(prev=>({...prev,toppings:[...prev.toppings,
      {x:p.x,y:p.y,type:selectedTopping,rotation:Math.random()*30-15,key:Date.now()+Math.random()}]}));
  },[getPos,selectedTopping]);
  const drizzleMove=useCallback(e=>{
    if(!isDrizzling) return;
    const p=getPos(e);
    if(!p) return;
    if(Math.random()>0.4) return;
    const isOil=cookStep==="oil";
    const color=isOil?COOK.oilColor:"#DAA520";
    const field=isOil?"oilDrops":"honeyDrops";
    setPizzaData(prev=>({...prev,[field]:[...prev[field],
      {x:p.x,y:p.y,size:3+Math.random()*3,key:Date.now()+Math.random()}]}));
  },[isDrizzling,getPos,cookStep]);

  /* ──── Step 5: BAKE ──── */
  const [temp,setTemp]=useState(COOK.ovenInitialTemp);
  const [bakeTicks,setBakeTicks]=useState(0);
  const [baking,setBaking]=useState(false);
  const bakeIv=useRef(null);

  useEffect(()=>{
    if(!baking) return;
    bakeIv.current=setInterval(()=>{
      setBakeTicks(t=>t+1);
      setTemp(t=>Math.max(100,t-COOK.ovenDecayRate));
    },200);
    return()=>clearInterval(bakeIv.current);
  },[baking]);

  const tz=temp<200?"cold":temp<COOK.optimalLow?"low":temp<=COOK.optimalHigh?"perfect":temp<420?"hot":"burning";
  const tzColor={cold:"#5DADE2",low:V.oil,perfect:V.basil,hot:"#E67E22",burning:V.terra}[tz];
  const bakeSeconds=Math.round(bakeTicks*0.2);

  const finishBake=()=>{
    clearInterval(bakeIv.current);
    setBaking(false);
    const qual=bakeTicks<75?"raw":
      bakeTicks<=125&&(tz==="perfect"||tz==="hot")?"perfect":
      bakeTicks<=200?"good":"burnt";
    const bl=qual==="perfect"?0.85:qual==="good"?0.6:qual==="raw"?0.2:1.0;
    setPizzaData(p=>({...p,bakeLevel:bl,bakeQuality:qual}));
    setCookStep("oil");
  };

  /* ──── Score Calculation ──── */
  const calcScore=()=>{
    let s=50;
    const verts=pizzaData.doughVertices;
    const avgR=verts.reduce((a,b)=>a+b,0)/verts.length;
    const variance=verts.reduce((a,r)=>a+(r-avgR)**2,0)/verts.length;
    s+=variance<100?10:variance<300?5:0;
    s+=clamp(Math.round(pizzaData.sauceBlobs.length*0.8),0,10);
    s+=clamp(pizzaData.cheeses.length*2,0,10);
    s+=clamp(pizzaData.toppings.length*1.5,0,10);
    s+=pizzaData.bakeQuality==="perfect"?20:
       pizzaData.bakeQuality==="good"?10:
       pizzaData.bakeQuality==="raw"?-15:-10;
    return clamp(Math.round(s),0,100);
  };

  /* ──── Insufficient stock check ──── */
  if((noDough||noSauce)&&cookStep==="dough"){
    return(
      <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:V.mozz}}>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:32}}>⚠️</div>
            <div style={{fontFamily:F.b,fontSize:12,color:V.terra,fontWeight:"bold",marginTop:4}}>仕込み不足！</div>
            <div style={{fontFamily:F.b,fontSize:9,color:"#888",marginTop:2}}>生地: {prepStock.dough||0}枚 / ソース: {prepStock.sauce||0}食分</div>
          </div>
        </div>
        <div style={{padding:"5px 8px 6px",borderTop:`3px solid ${V.oil}`,flexShrink:0}}>
          <Btn onClick={onBack} color="sec">← 戻る</Btn>
        </div>
      </div>
    );
  }

  /* ──── HEADER ──── */
  const stepNames={dough:"① 生地を伸ばす",sauce:"② ソースを塗る",cheese:"③ チーズを乗せる",topping:"④ トッピング",bake:"⑤ 窯で焼く",oil:"⑥ オリーブオイル",done:"完成！"};
  const stepProgress={dough:1,sauce:2,cheese:3,topping:4,bake:5,oil:6,done:7};

  const header=(
    <div style={{padding:"4px 8px",display:"flex",alignItems:"center",gap:5,borderBottom:`2px solid ${V.birch}`,flexShrink:0,background:V.mozz}}>
      <span style={{fontSize:13}}>{order.icon}</span>
      <div style={{flex:1}}>
        <div style={{fontFamily:F.b,fontSize:10,fontWeight:"bold",color:V.esp}}>🍕 {menu.name}</div>
        <div style={{fontFamily:F.b,fontSize:7,color:V.terra}}>{stepNames[cookStep]}</div>
      </div>
      <div style={{display:"flex",gap:1}}>
        {[1,2,3,4,5,6].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:i<=stepProgress[cookStep]?V.terra:"#DDD"}}/>)}
      </div>
    </div>
  );

  /* ──── STEP: DOUGH ──── */
  if(cookStep==="dough"){
    const avgR=pizzaData.doughVertices.reduce((a,b)=>a+b,0)/pizzaData.doughVertices.length;
    const pct=Math.round(avgR/COOK.guideRadius*100);
    return(
      <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:V.mozz}}>
        {header}
        <div ref={areaRef} style={{flex:1,position:"relative",overflow:"hidden",touchAction:"none",
          background:`repeating-conic-gradient(rgba(200,50,50,.04) 0% 25%,transparent 0% 50%) 0 0/22px 22px, radial-gradient(circle at 50% 48%,#FFF8EE,#EEDFC0)`}}
          onMouseDown={doughDown} onMouseMove={doughMove} onMouseUp={doughUp} onMouseLeave={doughUp}
          onTouchStart={doughDown} onTouchMove={doughMove} onTouchEnd={doughUp}>
          <svg width="100%" height="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{position:"absolute",top:0,left:0}}>
            <circle cx={CX} cy={CY} r={COOK.guideRadius} fill="none" stroke={V.birch} strokeWidth={1.5} strokeDasharray="6 4" opacity={0.5}/>
            <PizzaView pizzaData={pizzaData} cx={CX} cy={CY} baked={false}/>
          </svg>
          <div style={{position:"absolute",top:8,right:8,fontFamily:F.b,fontSize:10,color:V.esp,background:"rgba(255,255,255,.8)",padding:"2px 6px",borderRadius:6}}>
            📏 {pct}%
          </div>
          {avgR<35&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontFamily:F.b,fontSize:9,color:"rgba(0,0,0,.2)",pointerEvents:"none"}}>
            👆 外へドラッグして伸ばす
          </div>}
        </div>
        <div style={{padding:"5px 8px 6px",borderTop:`3px solid ${V.oil}`,background:V.mozz,flexShrink:0,display:"flex",gap:5}}>
          <Btn onClick={onBack} color="sec" style={{flex:1,padding:"7px"}}>← 戻る</Btn>
          <Btn onClick={()=>setCookStep("sauce")} style={{flex:2,padding:"7px"}}>次へ → ソース</Btn>
        </div>
      </div>
    );
  }

  /* ──── STEP: SAUCE ──── */
  if(cookStep==="sauce"){
    return(
      <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:V.mozz}}>
        {header}
        {saucePhase==="select"?(
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,padding:16}}>
            <div style={{fontFamily:F.b,fontSize:11,color:V.esp,fontWeight:"bold"}}>ソースを選ぶ</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,width:"100%",maxWidth:250}}>
              {Object.entries(COOK.sauceTypes).map(([k,v])=>(
                <button key={k} onClick={()=>{setSelectedSauce(k);setSaucePhase("scoop");}}
                  style={{padding:"10px 8px",borderRadius:10,border:`2px solid ${selectedSauce===k?V.terra:V.birch}`,
                    background:selectedSauce===k?"#FFF8EE":"#FFF",cursor:"pointer",textAlign:"center"}}>
                  <div style={{fontSize:20}}>{v.icon}</div>
                  <div style={{fontFamily:F.b,fontSize:9,color:V.esp,marginTop:2}}>{v.name}</div>
                  <div style={{width:20,height:10,borderRadius:4,background:v.color,margin:"3px auto 0"}}/>
                </button>
              ))}
            </div>
            <Btn onClick={()=>setSaucePhase("scoop")} style={{maxWidth:200}}>決定</Btn>
          </div>
        ):saucePhase==="scoop"?(
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,padding:16}}>
            <div style={{fontFamily:F.b,fontSize:11,color:V.esp}}>🥄 長押しですくう量を決める</div>
            <div style={{width:200,height:20,background:"#EEE",borderRadius:10,overflow:"hidden",position:"relative"}}>
              <div style={{width:`${scoopVal}%`,height:"100%",borderRadius:10,
                background:`linear-gradient(90deg,${COOK.sauceTypes[selectedSauce].color}66,${COOK.sauceTypes[selectedSauce].color})`,
                transition:"width 30ms"}}/>
            </div>
            <div style={{fontFamily:F.d,fontSize:24,fontWeight:700,color:V.esp}}>{scoopVal}%</div>
            <button onMouseDown={startScoop} onMouseUp={endScoop} onMouseLeave={()=>{if(scooping)endScoop();}}
              onTouchStart={startScoop} onTouchEnd={endScoop}
              style={{width:120,height:120,borderRadius:"50%",border:`4px solid ${COOK.sauceTypes[selectedSauce].color}`,
                background:"#FFF",cursor:"pointer",fontFamily:F.b,fontSize:11,color:V.esp}}>
              {scooping?"すくい中...":"ここを長押し！"}
            </button>
          </div>
        ):(
          <div ref={areaRef} style={{flex:1,position:"relative",overflow:"hidden",touchAction:"none",
            background:`repeating-conic-gradient(rgba(200,50,50,.04) 0% 25%,transparent 0% 50%) 0 0/22px 22px, radial-gradient(circle at 50% 48%,#FFF8EE,#EEDFC0)`}}
            onMouseMove={sauceMove} onTouchMove={sauceMove}>
            <svg width="100%" height="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{position:"absolute",top:0,left:0}}>
              <PizzaView pizzaData={pizzaData} cx={CX} cy={CY} baked={false}/>
            </svg>
            <div style={{position:"absolute",top:8,right:8,fontFamily:F.b,fontSize:10,color:V.esp,background:"rgba(255,255,255,.8)",padding:"2px 6px",borderRadius:6}}>
              🥄 残り: {Math.round(sauceBudget)}%
            </div>
          </div>
        )}
        <div style={{padding:"5px 8px 6px",borderTop:`3px solid ${V.oil}`,background:V.mozz,flexShrink:0,display:"flex",gap:5}}>
          <Btn onClick={()=>{setCookStep("dough");setSaucePhase("select");setSauceBudget(0);setScoopVal(0);}} color="sec" style={{flex:1,padding:"7px"}}>← 生地</Btn>
          {saucePhase==="paint"&&<Btn onClick={()=>setCookStep("cheese")} style={{flex:2,padding:"7px"}}>次へ → チーズ</Btn>}
        </div>
      </div>
    );
  }

  /* ──── STEP: CHEESE ──── */
  if(cookStep==="cheese"){
    return(
      <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:V.mozz}}>
        {header}
        <div ref={areaRef} style={{flex:1,position:"relative",overflow:"hidden",touchAction:"none",
          background:`repeating-conic-gradient(rgba(200,50,50,.04) 0% 25%,transparent 0% 50%) 0 0/22px 22px, radial-gradient(circle at 50% 48%,#FFF8EE,#EEDFC0)`}}
          onClick={cheeseTap} onTouchEnd={e=>{e.preventDefault();cheeseTap(e);}}>
          <svg width="100%" height="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{position:"absolute",top:0,left:0}}>
            <PizzaView pizzaData={pizzaData} cx={CX} cy={CY} baked={false}/>
          </svg>
          <div style={{position:"absolute",top:8,right:8,fontFamily:F.b,fontSize:10,color:V.esp,background:"rgba(255,255,255,.8)",padding:"2px 6px",borderRadius:6}}>
            🧀 {pizzaData.cheeses.length}枚
          </div>
        </div>
        <div style={{padding:"3px 8px",background:V.mozz,flexShrink:0}}>
          <div style={{display:"flex",gap:4,marginBottom:4}}>
            {Object.entries(COOK.cheeseTypes).map(([k,v])=>(
              <button key={k} onClick={()=>setSelectedCheese(k)}
                style={{flex:1,padding:"4px 2px",borderRadius:8,border:`2px solid ${selectedCheese===k?V.terra:V.birch}`,
                  background:selectedCheese===k?"#FFF8EE":"#FFF",cursor:"pointer",textAlign:"center"}}>
                <div style={{width:16,height:12,borderRadius:3,background:v.color,margin:"0 auto"}}/>
                <div style={{fontFamily:F.b,fontSize:7,color:V.esp,marginTop:1}}>{v.name}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={{padding:"2px 8px 6px",borderTop:`3px solid ${V.oil}`,background:V.mozz,flexShrink:0,display:"flex",gap:5}}>
          <Btn onClick={()=>setCookStep("sauce")} color="sec" style={{flex:1,padding:"7px"}}>← ソース</Btn>
          <Btn onClick={()=>setCookStep("topping")} style={{flex:2,padding:"7px"}}>次へ → トッピング</Btn>
        </div>
      </div>
    );
  }

  /* ──── STEP: TOPPING ──── */
  if(cookStep==="topping"){
    const def=COOK.toppings[selectedTopping];
    const isDrizzleMode=def?.type==="drizzle";
    return(
      <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:V.mozz}}>
        {header}
        <div ref={areaRef} style={{flex:1,position:"relative",overflow:"hidden",touchAction:"none",
          background:`repeating-conic-gradient(rgba(200,50,50,.04) 0% 25%,transparent 0% 50%) 0 0/22px 22px, radial-gradient(circle at 50% 48%,#FFF8EE,#EEDFC0)`}}
          onClick={isDrizzleMode?undefined:toppingTap}
          onTouchEnd={isDrizzleMode?undefined:e=>{e.preventDefault();toppingTap(e);}}
          onMouseDown={isDrizzleMode?()=>setIsDrizzling(true):undefined}
          onMouseUp={isDrizzleMode?()=>setIsDrizzling(false):undefined}
          onMouseLeave={isDrizzleMode?()=>setIsDrizzling(false):undefined}
          onMouseMove={isDrizzleMode?drizzleMove:undefined}
          onTouchStart={isDrizzleMode?()=>setIsDrizzling(true):undefined}
          onTouchEnd2={isDrizzleMode?()=>setIsDrizzling(false):undefined}
          onTouchMove={isDrizzleMode?drizzleMove:undefined}>
          <svg width="100%" height="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{position:"absolute",top:0,left:0}}>
            <PizzaView pizzaData={pizzaData} cx={CX} cy={CY} baked={false}/>
          </svg>
          {/* Render CSS toppings on top of SVG */}
          {pizzaData.toppings.filter(t=>COOK.toppings[t.type]?.type==="css").map((t,i)=>{
            const d=COOK.toppings[t.type];
            const style={position:"absolute",left:t.x-d.size/2,top:t.y-d.size/2,
              transform:`rotate(${t.rotation}deg)`,pointerEvents:"none",animation:"popIn .2s"};
            if(t.type==="salami") return <SalamiCSS key={t.key} size={d.size} style={style}/>;
            if(t.type==="mushroom") return <MushroomCSS key={t.key} size={d.size} style={style}/>;
            if(t.type==="anchovy") return <AnchovyCSS key={t.key} style={{...style,left:t.x-15,top:t.y-6}}/>;
            return null;
          })}
          <div style={{position:"absolute",top:8,right:8,fontFamily:F.b,fontSize:10,color:V.esp,background:"rgba(255,255,255,.8)",padding:"2px 6px",borderRadius:6}}>
            🍕 {pizzaData.toppings.length}個
          </div>
        </div>
        <div style={{padding:"3px 8px",background:V.mozz,flexShrink:0}}>
          <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
            {Object.entries(COOK.toppings).map(([k,v])=>(
              <button key={k} onClick={()=>setSelectedTopping(k)}
                style={{padding:"3px 6px",borderRadius:6,border:`2px solid ${selectedTopping===k?V.terra:V.birch}`,
                  background:selectedTopping===k?"#FFF8EE":"#FFF",cursor:"pointer",textAlign:"center",minWidth:40}}>
                <div style={{fontSize:12}}>{v.emoji||"🔧"}</div>
                <div style={{fontFamily:F.b,fontSize:6,color:V.esp}}>{v.name}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={{padding:"2px 8px 6px",borderTop:`3px solid ${V.oil}`,background:V.mozz,flexShrink:0,display:"flex",gap:5}}>
          <Btn onClick={()=>setCookStep("cheese")} color="sec" style={{flex:1,padding:"7px"}}>← チーズ</Btn>
          <Btn onClick={()=>{setCookStep("bake");setBaking(true);}} style={{flex:2,padding:"7px"}}>🔥 窯へ</Btn>
        </div>
      </div>
    );
  }

  /* ──── STEP: BAKE ──── */
  if(cookStep==="bake"){
    const isOptimal=tz==="perfect";
    return(
      <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:V.mozz}}>
        {header}
        <div style={{flex:1,position:"relative",overflow:"hidden",background:"linear-gradient(180deg,#2D1A0E,#1A0F08)"}}>
          {/* Oven structure */}
          <div style={{position:"absolute",top:6,left:"50%",transform:"translateX(-50%)",width:220,height:120,borderRadius:"110px 110px 0 0",
            background:`repeating-linear-gradient(0deg,transparent,transparent 18px,rgba(80,40,15,.12) 18px,rgba(80,40,15,.12) 20px),
              repeating-linear-gradient(90deg,transparent,transparent 38px,rgba(80,40,15,.08) 38px,rgba(80,40,15,.08) 40px),
              linear-gradient(180deg,#8B6040,#4A2A15)`,
            border:"3px solid #3A1A08"}}>
            {/* Oven opening */}
            <div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",width:140,height:70,
              borderRadius:"70px 70px 0 0",background:"#0D0400",border:"2px solid #2A1508",borderBottom:"none"}}>
              {/* Flames */}
              <div style={{position:"absolute",bottom:2,left:"50%",transform:"translateX(-50%)",display:"flex",gap:2}}>
                {[11,16,13,15,10].map((h,i)=><div key={i} style={{width:5+i,height:h*(temp/300),
                  background:"linear-gradient(180deg,#FF6600,#CC0000)",borderRadius:"50% 50% 20% 20%",
                  opacity:temp>150?.8:.3,transition:"height .3s",animation:"fireFlicker .4s infinite"}}/>)}
              </div>
              {/* Mini pizza in oven */}
              <svg width={80} height={60} viewBox={`${CX-40} ${CY-30} 80 60`} style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)"}}>
                <PizzaView pizzaData={pizzaData} cx={CX} cy={CY} baked={true} scale={0.4}/>
              </svg>
            </div>
          </div>

          {/* Temperature display */}
          <div style={{position:"absolute",top:140,left:"50%",transform:"translateX(-50%)",textAlign:"center"}}>
            <div style={{fontFamily:F.d,fontSize:28,fontWeight:700,color:tzColor}}>{Math.round(temp)}°C</div>
            <div style={{fontFamily:F.b,fontSize:9,color:tzColor,marginTop:2}}>
              {tz==="cold"?"🥶 低い":tz==="low"?"🔥 もう少し":tz==="perfect"?"✨ 最高！":tz==="hot"?"⚠️ 熱い":"🔥🔥 熱すぎ"}
            </div>
            <div style={{width:180,height:8,background:"#333",borderRadius:4,overflow:"hidden",margin:"6px auto"}}>
              <div style={{height:"100%",width:`${clamp((temp-100)/350*100,0,100)}%`,borderRadius:4,
                background:`linear-gradient(90deg,#5DADE2,${V.oil} 35%,${V.basil} 55%,#E67E22 75%,${V.terra})`}}/>
            </div>
            <div style={{fontFamily:F.b,fontSize:10,color:"#888"}}>⏱ {bakeSeconds}秒</div>
          </div>
        </div>
        <div style={{padding:"5px 8px 6px",borderTop:`3px solid ${V.oil}`,background:V.mozz,flexShrink:0,display:"flex",gap:5}}>
          <button onClick={()=>setTemp(t=>Math.min(COOK.maxTemp,t+COOK.logTempBoost))}
            style={{flex:1,padding:"7px",borderRadius:10,border:"none",background:"linear-gradient(180deg,#8B6040,#6B4020)",
              color:"#FFF",fontFamily:F.b,fontSize:10,fontWeight:"bold",cursor:"pointer"}}>🪵 薪をくべる</button>
          <Btn onClick={finishBake} disabled={bakeTicks<30} color="basil"
            style={{flex:1.2,padding:"7px",...(isOptimal&&bakeTicks>=75?{animation:"glow 1s infinite"}:{})}}>
            🍕 窯から出す
          </Btn>
        </div>
      </div>
    );
  }

  /* ──── STEP: OIL (Bonus) ──── */
  if(cookStep==="oil"){
    return(
      <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:V.mozz}}>
        {header}
        <div ref={areaRef} style={{flex:1,position:"relative",overflow:"hidden",touchAction:"none",
          background:`repeating-conic-gradient(rgba(200,50,50,.04) 0% 25%,transparent 0% 50%) 0 0/22px 22px, radial-gradient(circle at 50% 48%,#FFF8EE,#EEDFC0)`}}
          onMouseDown={()=>setIsDrizzling(true)} onMouseUp={()=>setIsDrizzling(false)} onMouseLeave={()=>setIsDrizzling(false)}
          onMouseMove={drizzleMove}
          onTouchStart={()=>setIsDrizzling(true)} onTouchEnd={()=>setIsDrizzling(false)} onTouchMove={drizzleMove}>
          <svg width="100%" height="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{position:"absolute",top:0,left:0}}>
            <PizzaView pizzaData={pizzaData} cx={CX} cy={CY} baked={true}/>
          </svg>
          {/* CSS toppings with baked filter */}
          {pizzaData.toppings.filter(t=>COOK.toppings[t.type]?.type==="css").map((t)=>{
            const d=COOK.toppings[t.type];
            const style={position:"absolute",left:t.x-d.size/2,top:t.y-d.size/2,
              transform:`rotate(${t.rotation}deg)`,pointerEvents:"none",filter:"saturate(0.7) brightness(0.85)"};
            if(t.type==="salami") return <SalamiCSS key={t.key} size={d.size} style={style}/>;
            if(t.type==="mushroom") return <MushroomCSS key={t.key} size={d.size} style={style}/>;
            if(t.type==="anchovy") return <AnchovyCSS key={t.key} style={{...style,left:t.x-15,top:t.y-6}}/>;
            return null;
          })}
          <div style={{position:"absolute",top:8,left:"50%",transform:"translateX(-50%)",fontFamily:F.b,fontSize:9,color:V.esp,
            background:"rgba(255,255,255,.8)",padding:"2px 8px",borderRadius:6}}>
            🫒 ドラッグでオリーブオイルをかける（任意）
          </div>
        </div>
        <div style={{padding:"5px 8px 6px",borderTop:`3px solid ${V.oil}`,background:V.mozz,flexShrink:0,display:"flex",gap:5}}>
          <Btn onClick={()=>setCookStep("done")} color="sec" style={{flex:1,padding:"7px"}}>スキップ</Btn>
          <Btn onClick={()=>setCookStep("done")} color="basil" style={{flex:2,padding:"7px"}}>🍕 完成！</Btn>
        </div>
      </div>
    );
  }

  /* ──── STEP: DONE ──── */
  if(cookStep==="done"){
    const sc=calcScore();
    const qual=pizzaData.bakeQuality;
    return(
      <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:V.mozz}}>
        {header}
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:16}}>
          <svg width={180} height={180} viewBox={`${CX-90} ${CY-90} 180 180`}>
            <PizzaView pizzaData={pizzaData} cx={CX} cy={CY} baked={true} scale={0.9}/>
          </svg>
          <div style={{fontFamily:F.d,fontSize:22,fontWeight:700,marginTop:8,
            color:qual==="perfect"?V.basil:qual==="good"?V.oil:V.terra}}>
            {qual==="perfect"?"Perfetto!":qual==="good"?"Buono!":qual==="raw"?"Crudo...":"Bruciato..."}
          </div>
          <div style={{fontFamily:F.b,fontSize:12,fontWeight:"bold",color:V.esp,marginTop:6}}>満足度: {sc}%</div>
          <div style={{width:140,height:10,background:"#EEE",borderRadius:5,overflow:"hidden",marginTop:4}}>
            <div style={{width:`${sc}%`,height:"100%",borderRadius:5,
              background:sc>70?V.basil:sc>50?V.oil:V.terra,transition:"width .5s"}}/>
          </div>
        </div>
        <div style={{padding:"5px 8px 6px",borderTop:`3px solid ${V.oil}`,background:V.mozz,flexShrink:0}}>
          <Btn onClick={()=>onDone(sc)}>🍕 提供する！</Btn>
        </div>
      </div>
    );
  }

  return null;
}

/* ═══════ OPS ═══════ */
function Ops({day,money,setMoney,prep,onEnd}){
  const [tick,setTick]=useState(0);
  const [spd,setSpd]=useState(1);
  const [custs,setCusts]=useState([]);
  const [orders,setOrders]=useState([]);
  const [evts,setEvts]=useState(["☀️ 営業開始！"]);
  const [nServed,setNServed]=useState(0);
  const [rev,setRev]=useState(0);
  const [satLog,setSatLog]=useState([]);
  const [cooking,setCooking]=useState(null);
  const [tab,setTab]=useState("orders");
  const [pStock,setPStock]=useState({dough:prep.dough,sauce:prep.sauce});

  const gH=11+Math.floor(tick/180);
  const gM=Math.floor((tick%180)/3).toString().padStart(2,"0");
  const closing=gH>=21;

  useEffect(()=>{
    if(closing||cooking)return;
    if(tick>0&&tick%35===0){
      const p=PERSONAS[Math.floor(Math.random()*PERSONAS.length)];
      const nc={id:++gid,...p,st:"approach",timer:0,tbl:null,sat:60+Math.floor(Math.random()*30),mid:MENUS[Math.floor(Math.random()*MENUS.length)].id,el:0};
      setCusts(pr=>[...pr,nc]);
      setEvts(pr=>[`${p.icon}${p.name}(${p.tag})が来た`,...pr.slice(0,4)]);
    }
  },[tick,closing,cooking]);

  useEffect(()=>{
    if(cooking)return;
    const iv=setInterval(()=>{
      setTick(t=>t+spd);
      setCusts(prev=>{
        const occ=prev.filter(c=>c.tbl!==null&&c.st!=="gone").map(c=>c.tbl);
        return prev.map(c=>{
          if(c.st==="gone")return c;
          const n={...c,timer:c.timer+spd};
          switch(c.st){
            case "approach": if(n.timer>16){const fr=TABLES.filter(t=>!occ.includes(t.id));if(fr.length>0){n.tbl=fr[0].id;n.st="seat";n.timer=0;}else if(n.timer>40){n.st="gone";}}break;
            case "seat": if(n.timer>c.oTime){n.st="order";n.timer=0;}break;
            case "order": if(n.timer>10){n.st="wait";n.timer=0;n.el=0;}break;
            case "wait": n.el=(c.el||0)+spd;if(n.el>c.patience)n.sat=Math.max(10,n.sat-12);break;
            case "eat": if(n.timer>c.eTime){n.st="pay";n.timer=0;}break;
            case "pay": if(n.timer>8){n.st="leave";n.timer=0;n.tbl=null;}break;
            case "leave": if(n.timer>12)n.st="gone";break;
          }
          return n;
        });
      });
    },100);
    return()=>clearInterval(iv);
  },[spd,cooking]);

  useEffect(()=>{
    custs.forEach(c=>{
      if(c.st==="wait"&&c.timer<2&&!orders.find(o=>o.id===c.id)){
        const m=MENUS.find(mm=>mm.id===c.mid)||MENUS[0];
        setOrders(pr=>[...pr,{id:c.id,icon:c.icon,name:c.name,tag:c.tag,menuId:c.mid,menuName:m.name,patience:c.patience,elapsed:0}]);
        setEvts(pr=>[`🎫${c.icon}が${m.name}を注文`,...pr.slice(0,4)]);
      }
    });
  },[custs]);

  useEffect(()=>{
    if(cooking)return;
    const iv=setInterval(()=>{setOrders(pr=>pr.map(o=>({...o,elapsed:o.elapsed+spd})));},100);
    return()=>clearInterval(iv);
  },[spd,cooking]);

  useEffect(()=>{
    custs.forEach(c=>{
      if(c.st==="pay"&&c.timer<2){
        const m=MENUS.find(mm=>mm.id===c.mid)||MENUS[0];
        setMoney(mm=>mm+m.price);
        setRev(r=>r+m.price);
        setNServed(s=>s+1);
        setSatLog(pr=>[...pr,{icon:c.icon,name:c.name,tag:c.tag,sat:c.sat}]);
        setEvts(pr=>[`💰+¥${m.price} ${c.icon}${c.sat>70?"😊":"😐"}`,...pr.slice(0,4)]);
      }
    });
  },[custs]);

  const serve=(oid,score)=>{
    setCusts(pr=>pr.map(c=>c.id===oid?{...c,st:"eat",timer:0,sat:clamp(c.sat+(score>70?15:score>50?5:-10),0,100)}:c));
    setOrders(pr=>pr.filter(o=>o.id!==oid));
    setPStock(pr=>({dough:Math.max(0,(pr.dough||0)-1),sauce:Math.max(0,(pr.sauce||0)-1)}));
    setEvts(pr=>[`🍕提供完了！`,...pr.slice(0,4)]);
    setCooking(null);
  };

  const active=custs.filter(c=>c.st!=="gone");

  if(cooking) return <Cooking order={cooking} prepStock={pStock} onDone={s=>serve(cooking.id,s)} onBack={()=>setCooking(null)}/>;

  return(
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:V.walnut}}>
      <div style={{background:`linear-gradient(180deg,#4A2A15,${V.walnutDk})`,padding:"4px 8px",display:"flex",alignItems:"center",gap:4,borderBottom:`2px solid ${V.birch}`,flexShrink:0}}>
        <span style={{fontFamily:F.b,color:V.oil,fontSize:9,fontWeight:"bold"}}>Day{day}</span>
        <span style={{fontFamily:F.b,color:"#FFF",fontSize:9}}>💰¥{money.toLocaleString()}</span>
        <span style={{fontFamily:F.b,color:"#FFF",fontSize:9}}>⏱{gH}:{gM}</span>
        <div style={{marginLeft:"auto",display:"flex",gap:2}}>
          {[1,2,3].map(s=><button key={s} onClick={()=>setSpd(s)} style={{background:spd===s?V.terra:"transparent",color:"#FFF",border:`1px solid ${V.birch}`,borderRadius:3,padding:"0 4px",fontSize:7,fontFamily:F.b,cursor:"pointer"}}>{"▶".repeat(s)}</button>)}
        </div>
      </div>
      <div style={{background:"#FFFDE7",padding:"2px 8px",borderBottom:"1px solid #EEE",flexShrink:0,fontFamily:F.b,fontSize:7,color:"#888"}}>
        残り: 🫓{pStock.dough}枚 🍅{pStock.sauce}食分
      </div>

      <div style={{height:"34%",position:"relative",overflow:"hidden",flexShrink:0,background:`repeating-conic-gradient(${V.flour} 0% 25%,#EDD9BD 0% 50%) 0 0/24px 24px`,borderLeft:`4px solid ${V.walnut}`,borderRight:`4px solid ${V.walnut}`}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:V.walnut,zIndex:1}}/>
        {TABLES.map(t=>{const o=active.find(c=>c.tbl===t.id);return <div key={t.id} style={{position:"absolute",left:t.x,top:t.y,width:t.w,height:t.h,background:"linear-gradient(135deg,#C0813A,#A06A2E)",borderRadius:4,border:`1.5px solid ${o?"#7A4A18":"#B8956A"}`,zIndex:1}}>{o?.st==="eat"&&<div style={{position:"absolute",top:4,left:"50%",transform:"translateX(-50%)",fontSize:12}}>🍕</div>}</div>;})}
        {active.map(c=>{const t=c.tbl!=null?TABLES[c.tbl]:null;let cx=270,cy=45;if(t){cx=t.x+t.w/2-7;cy=t.y-2;}return <div key={c.id} style={{position:"absolute",left:cx,top:cy,zIndex:3,transition:"left .3s,top .3s"}}><div style={{fontSize:14}}>{c.icon}</div>{["order","wait","eat","pay"].includes(c.st)&&<div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",background:"#FFF",border:`1px solid ${c.st==="wait"&&(c.el||0)>c.patience*.5?V.terra:V.birch}`,borderRadius:4,padding:"0 2px",fontFamily:F.b,fontSize:5,whiteSpace:"nowrap",zIndex:10}}>{c.st==="order"?"🤔":c.st==="wait"?((c.el||0)>c.patience*.5?"😤":"⏱"):c.st==="eat"?"😋":"💰"}</div>}</div>;})}
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:18,background:"linear-gradient(0deg,#D4D4D4,#C0813A)",borderTop:`2px solid ${V.walnut}`,zIndex:1,display:"flex",alignItems:"center",padding:"0 5px",gap:2}}><span style={{fontSize:10}}>👨‍🍳</span><span style={{fontSize:10}}>👩‍🍳</span><span style={{fontFamily:F.b,fontSize:6,color:V.walnut}}>KITCHEN</span></div>
      </div>

      <div style={{background:`linear-gradient(90deg,${V.walnutDk},${V.walnut})`,padding:"2px 8px",display:"flex",alignItems:"center",gap:3,flexShrink:0}}>
        <span style={{fontSize:9}}>📢</span>
        <div style={{fontFamily:F.b,color:V.mozz,fontSize:7,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",flex:1}}>{evts[0]}</div>
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",background:V.mozz,overflow:"hidden"}}>
        <div style={{display:"flex",borderBottom:`2px solid ${V.birch}`,flexShrink:0}}>
          {[{id:"orders",l:`🎫(${orders.length})`},{id:"info",l:"📊"}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"3px",fontFamily:F.b,fontSize:8,fontWeight:"bold",border:"none",cursor:"pointer",background:tab===t.id?"#FFF":"#F5F0E5",color:tab===t.id?V.terra:"#999",borderBottom:tab===t.id?`2px solid ${V.terra}`:"2px solid transparent"}}>{t.l}</button>
          ))}
        </div>
        <div style={{flex:1,overflow:"auto",padding:"3px 8px"}}>
          {tab==="orders"&&<>{orders.length===0?<div style={{fontFamily:F.b,fontSize:9,color:"#BBB",textAlign:"center",marginTop:10}}>注文を待っています...</div>:orders.map(o=>{
            const pct=clamp(100-o.elapsed/o.patience*100,0,100);
            const urg=pct<30?"urgent":pct<60?"warn":"ok";
            return <div key={o.id} onClick={()=>{setCooking(o);}} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 5px",marginBottom:2,borderRadius:7,background:urg==="urgent"?"#FFF0F0":urg==="warn"?"#FFFDE7":"#FFF",border:`1.5px solid ${urg==="urgent"?V.terra:urg==="warn"?V.oil:"#EEE"}`,cursor:"pointer"}}>
              <span style={{fontSize:14}}>{o.icon}</span>
              <div style={{flex:1}}><div style={{fontFamily:F.b,fontSize:9,fontWeight:"bold",color:V.esp}}>{o.menuName}</div><div style={{fontFamily:F.b,fontSize:6,color:"#AAA"}}>{o.name}・{o.tag}</div></div>
              <div style={{width:40,height:4,background:"#EEE",borderRadius:2,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",borderRadius:2,background:urg==="urgent"?V.terra:urg==="warn"?V.oil:V.basil}}/></div>
              <span style={{fontFamily:F.b,fontSize:9,color:V.terra}}>→</span>
            </div>;
          })}</>}
          {tab==="info"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:3,padding:"4px 0"}}>
            {[{l:"提供",v:`${nServed}`,i:"🍕"},{l:"売上",v:`¥${rev.toLocaleString()}`,i:"💰"},{l:"生地残",v:`${pStock.dough}枚`,i:"🫓"}].map((s,i)=>(
              <div key={i} style={{background:"#FFF",borderRadius:6,padding:"3px",textAlign:"center",border:`1px solid ${V.birch}`}}>
                <div style={{fontSize:11}}>{s.i}</div><div style={{fontFamily:F.b,fontSize:9,fontWeight:"bold",color:V.esp}}>{s.v}</div><div style={{fontFamily:F.b,fontSize:6,color:"#888"}}>{s.l}</div>
              </div>
            ))}
          </div>}
        </div>
      </div>

      <div style={{padding:"3px 8px 5px",borderTop:`3px solid ${V.oil}`,background:`linear-gradient(180deg,#4A2A15,#2D1A0E)`,flexShrink:0}}>
        {closing&&orders.length===0?<Btn onClick={()=>onEnd({nServed,rev,satLog,pStock})} color="grape" style={{padding:"7px"}}>🌙 営業終了</Btn>
        :<div style={{fontFamily:F.b,fontSize:7,color:"#888",textAlign:"center"}}>{closing?`残り${orders.length}件...`:"注文をタップ → 調理！"}</div>}
      </div>
    </div>
  );
}

/* ═══════ NIGHT ═══════ */
function Night({day,money,data,onNext}){
  const avg=data.satLog.length>0?Math.round(data.satLog.reduce((s,c)=>s+c.sat,0)/data.satLog.length):0;
  const matCost=Math.round(data.rev*.38);
  const rent=3000;
  const waste=Math.round(((data.pStock?.dough||0)*80+((data.pStock?.sauce||0)*60))*0.5);
  const profit=data.rev-matCost-rent-waste;

  return(
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:V.night}}>
      <div style={{background:`linear-gradient(180deg,${V.dusk},${V.night})`,padding:"7px 12px",borderBottom:`3px solid ${V.grape}`,flexShrink:0,textAlign:"center"}}>
        <div style={{fontFamily:F.b,color:V.moon,fontSize:13}}>🌙 Day {day} の振り返り</div>
      </div>
      <div style={{flex:1,overflow:"auto",padding:"8px 14px"}}>
        <div style={{textAlign:"center",marginBottom:8,padding:"10px 0",background:`linear-gradient(135deg,${V.dusk},#3D2060)`,borderRadius:10}}>
          <div style={{fontFamily:F.b,fontSize:8,color:"#AAA"}}>本日の利益</div>
          <div style={{fontFamily:F.d,fontSize:28,fontWeight:700,color:profit>0?V.basil:V.terra}}>¥{profit.toLocaleString()}</div>
        </div>
        <div style={{background:"rgba(255,255,255,.05)",borderRadius:10,padding:7,marginBottom:8}}>
          {[{l:"売上",v:data.rev,c:V.basil,p:"+"},{l:"原材料",v:matCost,c:V.terra,p:"-"},{l:"家賃",v:rent,c:V.terra,p:"-"},{l:"廃棄ロス",v:waste,c:"#E67E22",p:"-"}].map((i,idx)=>(
            <div key={idx} style={{display:"flex",justifyContent:"space-between",padding:"2px 4px",borderBottom:idx<3?"1px solid rgba(255,255,255,.05)":"none"}}>
              <span style={{fontFamily:F.b,fontSize:8,color:"#AAA"}}>{i.l}</span>
              <span style={{fontFamily:F.b,fontSize:9,fontWeight:"bold",color:i.c}}>{i.p}¥{i.v.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,marginBottom:8}}>
          {[{l:"提供",v:`${data.nServed}食`,i:"🍕"},{l:"満足度",v:`${avg}%`,i:avg>70?"😊":"😐"},{l:"生地残",v:`${data.pStock?.dough||0}枚`,i:"🫓"}].map((s,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,.05)",borderRadius:7,padding:"4px 2px",textAlign:"center"}}>
              <div style={{fontSize:13}}>{s.i}</div><div style={{fontFamily:F.b,fontSize:9,fontWeight:"bold",color:V.moon}}>{s.v}</div><div style={{fontFamily:F.b,fontSize:6,color:"#888"}}>{s.l}</div>
            </div>
          ))}
        </div>
        {data.satLog.length>0&&<div style={{background:"rgba(255,255,255,.05)",borderRadius:10,padding:7}}>
          <div style={{fontFamily:F.b,fontSize:9,fontWeight:"bold",color:V.moon,marginBottom:3}}>😊 お客様の声</div>
          {data.satLog.slice(-5).map((c,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:5,padding:"2px 0",borderBottom:i<Math.min(data.satLog.length,5)-1?"1px solid rgba(255,255,255,.05)":"none"}}>
              <span style={{fontSize:12}}>{c.icon}</span>
              <span style={{fontFamily:F.b,fontSize:8,color:V.moon,flex:1}}>{c.name}<span style={{fontSize:6,color:"#555",marginLeft:3}}>{c.tag}</span></span>
              <span style={{fontFamily:F.b,fontSize:9,fontWeight:"bold",color:c.sat>70?V.basil:c.sat>50?V.oil:V.terra}}>{c.sat}%</span>
            </div>
          ))}
        </div>}
      </div>
      <div style={{padding:"6px 12px",borderTop:`3px solid ${V.grape}`,background:V.night,flexShrink:0}}>
        <Btn onClick={()=>onNext(profit)} color="grape">🌅 翌日へ → Day {day+1}</Btn>
      </div>
    </div>
  );
}

/* ═══════ MAIN ═══════ */
export default function PizzaTycoon(){
  const [ph,setPh]=useState("morning");
  const [day,setDay]=useState(1);
  const [money,setMoney]=useState(50000);
  const [stock,setStock]=useState({tomato:8,basil_i:5,mozz_block:3,flour_bag:2,salami_log:2,shrimp_pack:1,olive_jar:1});
  const [prep,setPrep]=useState(null);
  const [nData,setNData]=useState(null);

  return(
    <div style={{width:"100%",height:"100vh",background:"#1a1a2e",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
      <div style={{width:"min(390px,100vw)",height:"min(780px,calc(100vh - 24px))",borderRadius:"min(28px,4vw)",overflow:"hidden",border:"3px solid #333",boxShadow:"0 8px 32px rgba(0,0,0,.5)",background:"#000",display:"flex",flexDirection:"column"}}>
        {ph==="morning"&&<Morning day={day} money={money} onNext={()=>setPh("marche")}/>}
        {ph==="marche"&&<Marche money={money} stock={stock} onDone={(cart,cost)=>{
          setMoney(m=>m-cost);
          const ns={...stock};Object.entries(cart).forEach(([id,q])=>{ns[id]=(ns[id]||0)+q;});setStock(ns);
          setPh("prep");
        }}/>}
        {ph==="prep"&&<Prep stock={stock} onDone={(pd)=>{
          setPrep(pd);
          const ns={...stock};
          ns.flour_bag=Math.max(0,(ns.flour_bag||0)-Math.ceil(pd.dough/25));
          ns.tomato=Math.max(0,(ns.tomato||0)-pd.sauce*3);
          setStock(ns);
          setPh("ops");
        }}/>}
        {ph==="ops"&&prep&&<Ops day={day} money={money} setMoney={setMoney} prep={prep} onEnd={(d)=>{setNData(d);setPh("night");}}/>}
        {ph==="night"&&nData&&<Night day={day} money={money} data={nData} onNext={(profit)=>{
          setDay(d=>d+1);setNData(null);setPrep(null);setPh("morning");
        }}/>}
      </div>
    </div>
  );
}
