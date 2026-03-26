import { useState, useEffect, useRef, useCallback } from "react";
import { F, V, clamp } from "../../config/design.js";
import { COOK } from "../../config/cooking.js";
import { DEFAULT_MENUS } from "../../config/menus.js";
import Btn from "../shared/Btn.jsx";
import PizzaView from "../cooking/PizzaView.jsx";
import SalamiCSS from "../cooking/SalamiCSS.jsx";
import MushroomCSS from "../cooking/MushroomCSS.jsx";
import AnchovyCSS from "../cooking/AnchovyCSS.jsx";

export default function Cooking({order,prepStock,onConsumeCuts,onDone,onBack,unlockedFeatures,compact=false}){
  const noDough=(prepStock.dough||0)<=0;
  const noSauce=(prepStock.sauce||0)<=0;

  const [cookStep,setCookStep]=useState("dough");
  const [pizzaData,setPizzaData]=useState({
    doughVertices:Array(COOK.doughVertices).fill(COOK.doughInitialRadius),
    sauceType:"tomato",sauceBlobs:[],cheeses:[],toppings:[],honeyDrops:[],oilDrops:[],
    bakeLevel:0,bakeQuality:null,
  });
  const areaRef=useRef(null);

  /* Dynamic sizing: use smaller viewBox in compact (split-view) mode */
  const SVG_W=compact?220:310;
  const SVG_H=compact?180:280;
  const CX=SVG_W/2;
  const CY=SVG_H/2;

  /* BUG-04 fix: convert DOM pixel coords → SVG viewBox coords */
  const getPos=useCallback(e=>{
    const r=areaRef.current?.getBoundingClientRect();
    if(!r) return null;
    /* touchEnd has empty touches — use changedTouches */
    const t=e.touches?.length?e.touches[0]:e.changedTouches?.[0]||e;
    if(!t||t.clientX==null) return null;
    const domX=t.clientX-r.left;
    const domY=t.clientY-r.top;
    return {x:domX/r.width*SVG_W, y:domY/r.height*SVG_H};
  },[SVG_W,SVG_H]);

  /* ──── Step 1: DOUGH ──── */
  /* Fix: use window-level listeners so dragging works even outside the area */
  const [dragging,setDragging]=useState(false);
  const draggingRef=useRef(false);

  const doughMoveHandler=useCallback(e=>{
    if(!draggingRef.current) return;
    const r=areaRef.current?.getBoundingClientRect();
    if(!r) return;
    const t=e.touches?e.touches[0]:e;
    /* Allow coords outside the area — clamp to SVG bounds */
    const domX=t.clientX-r.left;
    const domY=t.clientY-r.top;
    const px=Math.max(0,Math.min(SVG_W, domX/r.width*SVG_W));
    const py=Math.max(0,Math.min(SVG_H, domY/r.height*SVG_H));
    const dx=px-CX, dy=py-CY;
    const dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<5) return;
    /* #10 fix: correct for non-square viewBox aspect ratio.
       SVG viewBox may be wider than tall (e.g. 220×180 in compact mode).
       atan2 of raw SVG coords would produce skewed angles because
       the same visual angle maps to different dx/dy ratios.
       Normalize to a square coordinate space before computing angle. */
    const aspect=SVG_W/SVG_H;
    const dragAngle=Math.atan2(dy, dx*aspect);
    setPizzaData(prev=>{
      const verts=[...prev.doughVertices];
      const n=verts.length;
      for(let i=0;i<n;i++){
        /* Vertex angle: same basis as PizzaView, but also aspect-corrected */
        const rawAngle=(i/n)*Math.PI*2-Math.PI/2;
        const vx=Math.cos(rawAngle);
        const vy=Math.sin(rawAngle);
        const va=Math.atan2(vy, vx*aspect);
        let diff=Math.abs(dragAngle-va);
        if(diff>Math.PI) diff=Math.PI*2-diff;
        /* #10 fix: wider influence cone (1.2 rad ≈ 69°) + stronger stretch */
        const influence=Math.max(0,1-diff/1.2);
        if(influence>0){
          /* scale denominator by viewBox so compact mode stretches equally */
          const refSize=Math.min(SVG_W,SVG_H)*0.45;
          const stretch=COOK.stretchSpeed*3.0*influence*(dist/refSize);
          verts[i]=Math.max(verts[i],verts[i]+stretch);
        }
      }
      return {...prev,doughVertices:verts};
    });
  },[SVG_W,SVG_H,CX,CY]);

  const doughUpHandler=useCallback(()=>{
    draggingRef.current=false;
    setDragging(false);
    window.removeEventListener("mousemove",doughMoveHandler);
    window.removeEventListener("mouseup",doughUpHandler);
    window.removeEventListener("touchmove",doughMoveHandler);
    window.removeEventListener("touchend",doughUpHandler);
  },[doughMoveHandler]);

  const doughDown=useCallback(e=>{
    draggingRef.current=true;
    setDragging(true);
    e.preventDefault();
    window.addEventListener("mousemove",doughMoveHandler);
    window.addEventListener("mouseup",doughUpHandler);
    window.addEventListener("touchmove",doughMoveHandler,{passive:false});
    window.addEventListener("touchend",doughUpHandler);
  },[doughMoveHandler,doughUpHandler]);

  /* cleanup on unmount */
  useEffect(()=>()=>{
    window.removeEventListener("mousemove",doughMoveHandler);
    window.removeEventListener("mouseup",doughUpHandler);
    window.removeEventListener("touchmove",doughMoveHandler);
    window.removeEventListener("touchend",doughUpHandler);
  },[doughMoveHandler,doughUpHandler]);

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
  /* BUG-02 fix: scoopVal(0-100) → budget(0-150) so 100% scoop covers whole pizza */
  const endScoop=()=>{clearInterval(scoopIv.current);setScooping(false);
    setSauceBudget(scoopVal*1.5);setSaucePhase("paint");
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
    /* BUG-02 fix: much lower sauce cost per blob */
    const slow=speed<5;
    const fast=speed>10;
    const rx=slow?clamp(6+Math.random()*4,6,10):clamp(10+speed*1.2,10,24);
    const ry=rx*0.7;
    const opacity=slow?0.75:clamp(0.6-speed*0.015,0.3,0.6);
    const cost=slow?0.3:fast?1.0:0.6;

    setPizzaData(prev=>({...prev,sauceBlobs:[...prev.sauceBlobs,
      {x:p.x,y:p.y,rx:rx+Math.random()*3,ry:ry+Math.random()*2,opacity}]}));
    setSauceBudget(b=>{
      const nb=Math.max(0,b-cost);
      if(fast){
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
    if((prepStock.mozz_block||0)<=0) return;
    if(onConsumeCuts) onConsumeCuts("mozz_block");
    setPizzaData(prev=>({...prev,cheeses:[...prev.cheeses,
      {x:p.x,y:p.y,type:selectedCheese,key:Date.now()+Math.random()}]}));
  },[getPos,selectedCheese,prepStock,onConsumeCuts]);

  /* ──── Step 4: TOPPING ──── */
  const [selectedTopping,setSelectedTopping]=useState("basil");
  const [isDrizzling,setIsDrizzling]=useState(false);
  const toppingTap=useCallback(e=>{
    const p=getPos(e);
    if(!p) return;
    const def=COOK.toppings[selectedTopping];
    if(!def) return;
    if(def.type==="drizzle") return;
    if(def.stockKey){
      if((prepStock[def.stockKey]||0)<=0) return;
      if(onConsumeCuts) onConsumeCuts(def.stockKey);
    }
    setPizzaData(prev=>({...prev,toppings:[...prev.toppings,
      {x:p.x,y:p.y,type:selectedTopping,rotation:Math.random()*30-15,key:Date.now()+Math.random()}]}));
  },[getPos,selectedTopping,prepStock,onConsumeCuts]);
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
    const qual=bakeTicks<40?"raw":
      bakeTicks<=60&&(tz==="perfect"||tz==="hot")?"perfect":
      bakeTicks<=100?"good":"burnt";
    const bl=qual==="perfect"?0.85:qual==="good"?0.6:qual==="raw"?0.2:1.0;
    setPizzaData(p=>({...p,bakeLevel:bl,bakeQuality:qual}));
    setCookStep("oil");
  };

  /* ──── Score Calculation (#44: recipe-based) ──── */
  const calcScore=()=>{
    const menu=[...DEFAULT_MENUS].find(m=>m.id===order.menuId);
    const recipe=menu?.recipe;

    /* A. Recipe match (40 pts) */
    let recipeScore=0;
    if(recipe){
      const sauceMatch=pizzaData.sauceType===recipe.sauce?8:0;
      const placedCheeses={};
      pizzaData.cheeses.forEach(c=>{placedCheeses[c.type]=(placedCheeses[c.type]||0)+1;});
      const rc=recipe.cheese||{};
      const totalRC=Object.values(rc).reduce((a,b)=>a+b,0);
      let cheeseMatch=totalRC>0?0:1;
      if(totalRC>0){let correct=0;for(const[t,q]of Object.entries(rc)){correct+=Math.min(placedCheeses[t]||0,q);}cheeseMatch=correct/totalRC;}
      const placedTops={};
      pizzaData.toppings.forEach(t=>{placedTops[t.type]=(placedTops[t.type]||0)+1;});
      const rt=recipe.toppings||{};
      const totalRT=Object.values(rt).reduce((a,b)=>a+b,0);
      let topMatch=totalRT>0?0:1;
      if(totalRT>0){let correct=0;for(const[t,q]of Object.entries(rt)){correct+=Math.min(placedTops[t]||0,q);}topMatch=correct/totalRT;
        const wrong=Object.entries(placedTops).filter(([k])=>!(k in rt)).reduce((a,[,v])=>a+v,0);
        topMatch=Math.max(0,topMatch-wrong*0.1);}
      recipeScore=Math.round(sauceMatch+cheeseMatch*16+topMatch*16);
    }else{
      recipeScore=clamp(Math.round(pizzaData.cheeses.length*3+pizzaData.toppings.length*2),0,40);
    }

    /* B. Dough shape (15 pts) */
    const verts=pizzaData.doughVertices;
    const avgR=verts.reduce((a,b)=>a+b,0)/verts.length;
    const variance=verts.reduce((a,r)=>a+(r-avgR)**2,0)/verts.length;
    const sizeBonus=avgR>COOK.guideRadius*0.8?5:avgR>COOK.guideRadius*0.5?3:0;
    const doughScore=clamp((variance<100?10:variance<300?5:0)+sizeBonus,0,15);

    /* C. Sauce coverage (15 pts) */
    const sauceScore=clamp(Math.round(pizzaData.sauceBlobs.length*0.6),0,15);

    /* D. Bake quality (30 pts) */
    const bakeScore=pizzaData.bakeQuality==="perfect"?30:
       pizzaData.bakeQuality==="good"?20:
       pizzaData.bakeQuality==="raw"?5:0;

    return clamp(Math.round(recipeScore+doughScore+sauceScore+bakeScore),0,100);
  };

  /* ──── Filtered sauce/cheese based on unlocked features ──── */
  const availableSauces = Object.entries(COOK.sauceTypes).filter(([k]) => {
    if (k === "tomato") return true;
    if (k === "genovese") return unlockedFeatures.has("genoveseSauce");
    if (k === "white") return unlockedFeatures.has("whiteSauce");
    if (k === "soy") return unlockedFeatures.has("soySauce");
    return false;
  });

  const availableCheeses = Object.entries(COOK.cheeseTypes).filter(([k]) => {
    if (k === "mozzarella") return true;
    if (k === "cheddar") return unlockedFeatures.has("cheddar");
    if (k === "gorgonzola") return unlockedFeatures.has("gorgonzola");
    return false;
  });

  /* ──── Insufficient stock check ──── */
  if((noDough||noSauce)&&cookStep==="dough"){
    return(
      <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:V.mozz}}>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:32}}>⚠️</div>
            <div style={{fontFamily:F.b,fontSize:14,color:V.terra,fontWeight:"bold",marginTop:4}}>仕込み不足！</div>
            <div style={{fontFamily:F.b,fontSize:11,color:"#888",marginTop:2}}>生地: {prepStock.dough||0}枚 / ソース: {prepStock.sauce||0}食分</div>
          </div>
        </div>
        <div style={{padding:"5px 8px 6px",borderTop:`3px solid ${V.oil}`,flexShrink:0}}>
          <Btn onClick={onBack} color="sec">← 戻る</Btn>
        </div>
      </div>
    );
  }

  /* ──── HEADER ──── */
  const stepNames={dough:"① 生地",sauce:"② ソース",cheese:"③ チーズ",topping:"④ トッピング",bake:"⑤ 窯",oil:"⑥ オイル",done:"完成！"};
  const stepProgress={dough:1,sauce:2,cheese:3,topping:4,bake:5,oil:6,done:7};

  const patiencePct=clamp(100-(order.elapsed||0)/(order.patience||200)*100,0,100);
  const patienceColor=patiencePct>70?V.basil:patiencePct>40?V.oil:V.terra;

  const header=(
    <div style={{padding:compact?"1px 4px":"4px 8px",display:"flex",alignItems:"center",gap:3,borderBottom:`2px solid ${V.birch}`,flexShrink:0,background:V.mozz}}>
      <span style={{fontSize:compact?10:13}}>{order.icon}</span>
      <span style={{fontFamily:F.b,fontSize:compact?9:12,fontWeight:"bold",color:V.esp}}>🍕 {order.menuName}</span>
      <span style={{fontFamily:F.b,fontSize:compact?8:10,color:V.terra}}>{stepNames[cookStep]}</span>
      <div style={{flex:1,height:4,background:"#EEE",borderRadius:2,overflow:"hidden",margin:"0 2px"}}>
        <div style={{width:`${patiencePct}%`,height:"100%",borderRadius:2,
          background:patienceColor,transition:"width .3s",
          ...(patiencePct<40?{animation:"pulse 0.5s infinite"}:{})}}/>
      </div>
      <div style={{display:"flex",gap:1}}>
        {[1,2,3,4,5,6].map(i=><div key={i} style={{width:compact?5:8,height:compact?5:8,borderRadius:"50%",background:i<=stepProgress[cookStep]?V.terra:"#DDD"}}/>)}
      </div>
    </div>
  );

  /* ──── Compact bottom bar styling ──── */
  const btnBar={padding:compact?"2px 4px 3px":"5px 8px 6px",borderTop:`3px solid ${V.oil}`,background:V.mozz,flexShrink:0,display:"flex",gap:4};
  const btnSt=compact?{padding:"5px 6px",fontSize:11}:{padding:"7px"};

  /* ──── STEP: DOUGH ──── */
  if(cookStep==="dough"){
    const avgR=pizzaData.doughVertices.reduce((a,b)=>a+b,0)/pizzaData.doughVertices.length;
    const pct=Math.round(avgR/COOK.guideRadius*100);
    return(
      <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:V.mozz}}>
        {header}
        <div ref={areaRef} style={{flex:1,position:"relative",overflow:"hidden",touchAction:"none",
          background:`repeating-conic-gradient(rgba(200,50,50,.04) 0% 25%,transparent 0% 50%) 0 0/22px 22px, radial-gradient(circle at 50% 48%,#FFF8EE,#EEDFC0)`}}
          onMouseDown={doughDown} onTouchStart={doughDown}>
          <svg width="100%" height="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{position:"absolute",top:0,left:0}}>
            <circle cx={CX} cy={CY} r={COOK.guideRadius} fill="none" stroke={V.birch} strokeWidth={1.5} strokeDasharray="6 4" opacity={0.5}/>
            <PizzaView pizzaData={pizzaData} cx={CX} cy={CY} baked={false}/>
          </svg>
          <div style={{position:"absolute",top:8,right:8,fontFamily:F.b,fontSize:12,color:V.esp,background:"rgba(255,255,255,.8)",padding:"2px 6px",borderRadius:6}}>
            📏 {pct}%
          </div>
          {avgR<35&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontFamily:F.b,fontSize:11,color:"rgba(0,0,0,.2)",pointerEvents:"none"}}>
            👆 外へドラッグして伸ばす
          </div>}
        </div>
        <div style={btnBar}>
          <Btn onClick={onBack} color="sec" style={{flex:1,...btnSt}}>← 戻る</Btn>
          <Btn onClick={()=>setCookStep("sauce")} style={{flex:2,...btnSt}}>次へ → ソース</Btn>
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
            <div style={{fontFamily:F.b,fontSize:13,color:V.esp,fontWeight:"bold"}}>ソースを選ぶ</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,width:"100%",maxWidth:250}}>
              {availableSauces.map(([k,v])=>(
                <button key={k} onClick={()=>{setSelectedSauce(k);setSaucePhase("scoop");}}
                  style={{padding:"10px 8px",borderRadius:10,border:`2px solid ${selectedSauce===k?V.terra:V.birch}`,
                    background:selectedSauce===k?"#FFF8EE":"#FFF",cursor:"pointer",textAlign:"center"}}>
                  <div style={{fontSize:20}}>{v.icon}</div>
                  <div style={{fontFamily:F.b,fontSize:11,color:V.esp,marginTop:2}}>{v.name}</div>
                  <div style={{width:20,height:10,borderRadius:4,background:v.color,margin:"3px auto 0"}}/>
                </button>
              ))}
            </div>
            <Btn onClick={()=>setSaucePhase("scoop")} style={{maxWidth:200}}>決定</Btn>
          </div>
        ):saucePhase==="scoop"?(
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,padding:16}}>
            <div style={{fontFamily:F.b,fontSize:13,color:V.esp}}>🥄 長押しですくう量を決める</div>
            <div style={{width:200,height:20,background:"#EEE",borderRadius:10,overflow:"hidden",position:"relative"}}>
              <div style={{width:`${scoopVal}%`,height:"100%",borderRadius:10,
                background:`linear-gradient(90deg,${COOK.sauceTypes[selectedSauce].color}66,${COOK.sauceTypes[selectedSauce].color})`,
                transition:"width 30ms"}}/>
            </div>
            <div style={{fontFamily:F.d,fontSize:24,fontWeight:700,color:V.esp}}>{scoopVal}%</div>
            <button onMouseDown={startScoop} onMouseUp={endScoop} onMouseLeave={()=>{if(scooping)endScoop();}}
              onTouchStart={startScoop} onTouchEnd={endScoop}
              style={{width:120,height:120,borderRadius:"50%",border:`4px solid ${COOK.sauceTypes[selectedSauce].color}`,
                background:"#FFF",cursor:"pointer",fontFamily:F.b,fontSize:13,color:V.esp}}>
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
            <div style={{position:"absolute",top:8,right:8,fontFamily:F.b,fontSize:12,color:V.esp,background:"rgba(255,255,255,.8)",padding:"2px 6px",borderRadius:6}}>
              🥄 残り: {Math.round(sauceBudget)}%
            </div>
          </div>
        )}
        <div style={btnBar}>
          <Btn onClick={()=>{setCookStep("dough");setSaucePhase("select");setSauceBudget(0);setScoopVal(0);}} color="sec" style={{flex:1,...btnSt}}>← 生地</Btn>
          {saucePhase==="paint"&&<Btn onClick={()=>setCookStep("cheese")} style={{flex:2,...btnSt}}>次へ → チーズ</Btn>}
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
          <div style={{position:"absolute",top:8,right:8,fontFamily:F.b,fontSize:12,color:V.esp,background:"rgba(255,255,255,.8)",padding:"2px 6px",borderRadius:6}}>
            🧀 {pizzaData.cheeses.length}枚 (残{prepStock.mozz_block||0})
          </div>
        </div>
        <div style={{padding:"3px 8px",background:V.mozz,flexShrink:0}}>
          <div style={{display:"flex",overflowX:"auto",gap:6,padding:"2px 0",
            WebkitOverflowScrolling:"touch",scrollSnapType:"x mandatory",
            msOverflowStyle:"none",scrollbarWidth:"none"}}>
            {availableCheeses.map(([k,v])=>(
              <button key={k} onClick={()=>setSelectedCheese(k)}
                style={{flexShrink:0,scrollSnapAlign:"center",width:52,padding:"4px 2px",borderRadius:8,
                  border:`2px solid ${selectedCheese===k?V.terra:V.birch}`,
                  background:selectedCheese===k?"#FFF8EE":"#FFF",cursor:"pointer",textAlign:"center",
                  transform:selectedCheese===k?"scale(1.1)":"scale(1)",transition:"transform .15s"}}>
                <div style={{width:16,height:12,borderRadius:3,background:v.color,margin:"0 auto"}}/>
                <div style={{fontFamily:F.b,fontSize:10,color:V.esp,marginTop:1}}>{v.name}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={btnBar}>
          <Btn onClick={()=>setCookStep("sauce")} color="sec" style={{flex:1,...btnSt}}>← ソース</Btn>
          <Btn onClick={()=>setCookStep("topping")} style={{flex:2,...btnSt}}>次へ → トッピング</Btn>
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
          <div style={{position:"absolute",top:8,right:8,fontFamily:F.b,fontSize:12,color:V.esp,background:"rgba(255,255,255,.8)",padding:"2px 6px",borderRadius:6}}>
            🍕 {pizzaData.toppings.length}個
          </div>
        </div>
        <div style={{padding:"3px 8px",background:V.mozz,flexShrink:0}}>
          <div style={{display:"flex",overflowX:"auto",gap:6,padding:"2px 0",
            WebkitOverflowScrolling:"touch",scrollSnapType:"x mandatory",
            msOverflowStyle:"none",scrollbarWidth:"none"}}>
            {Object.entries(COOK.toppings).map(([k,v])=>{
              const remaining=v.stockKey?(prepStock[v.stockKey]||0):Infinity;
              const disabled=v.stockKey&&remaining<=0;
              return(
              <button key={k} onClick={()=>!disabled&&setSelectedTopping(k)}
                style={{flexShrink:0,scrollSnapAlign:"center",width:52,height:52,padding:"3px 2px",
                  borderRadius:8,border:`2px solid ${selectedTopping===k?V.terra:V.birch}`,
                  background:selectedTopping===k?"#FFF8EE":"#FFF",cursor:disabled?"default":"pointer",textAlign:"center",
                  transform:selectedTopping===k?"scale(1.1)":"scale(1)",transition:"transform .15s",
                  opacity:disabled?0.3:1,pointerEvents:disabled?"none":"auto"}}>
                <div style={{fontSize:16}}>{v.emoji||"🔧"}</div>
                <div style={{fontFamily:F.b,fontSize:9,color:V.esp,lineHeight:1}}>{v.name}</div>
                {v.stockKey&&<div style={{fontFamily:F.b,fontSize:8,color:remaining<=2?V.terra:"#888"}}>{remaining}</div>}
              </button>
              );
            })}
          </div>
        </div>
        <div style={btnBar}>
          <Btn onClick={()=>setCookStep("cheese")} color="sec" style={{flex:1,...btnSt}}>← チーズ</Btn>
          <Btn onClick={()=>{setCookStep("bake");setBaking(true);}} style={{flex:2,...btnSt}}>🔥 窯へ</Btn>
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
          <div style={{position:"absolute",top:compact?2:6,left:"50%",transform:"translateX(-50%)",width:compact?160:220,height:compact?80:120,borderRadius:compact?"80px 80px 0 0":"110px 110px 0 0",
            background:`repeating-linear-gradient(0deg,transparent,transparent 18px,rgba(80,40,15,.12) 18px,rgba(80,40,15,.12) 20px),
              repeating-linear-gradient(90deg,transparent,transparent 38px,rgba(80,40,15,.08) 38px,rgba(80,40,15,.08) 40px),
              linear-gradient(180deg,#8B6040,#4A2A15)`,
            border:"3px solid #3A1A08"}}>
            {/* Oven opening */}
            <div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",width:compact?100:140,height:compact?45:70,
              borderRadius:compact?"50px 50px 0 0":"70px 70px 0 0",background:"#0D0400",border:"2px solid #2A1508",borderBottom:"none"}}>
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
          <div style={{position:"absolute",top:compact?88:140,left:"50%",transform:"translateX(-50%)",textAlign:"center"}}>
            <div style={{fontFamily:F.d,fontSize:compact?20:28,fontWeight:700,color:tzColor}}>{Math.round(temp)}°C</div>
            <div style={{fontFamily:F.b,fontSize:compact?10:11,color:tzColor,marginTop:compact?1:2}}>
              {tz==="cold"?"🥶 低い":tz==="low"?"🔥 もう少し":tz==="perfect"?"✨ 最高！":tz==="hot"?"⚠️ 熱い":"🔥🔥 熱すぎ"}
            </div>
            <div style={{width:180,height:8,background:"#333",borderRadius:4,overflow:"hidden",margin:"6px auto"}}>
              <div style={{height:"100%",width:`${clamp((temp-100)/350*100,0,100)}%`,borderRadius:4,
                background:`linear-gradient(90deg,#5DADE2,${V.oil} 35%,${V.basil} 55%,#E67E22 75%,${V.terra})`}}/>
            </div>
            <div style={{fontFamily:F.b,fontSize:12,color:"#888"}}>⏱ {bakeSeconds}秒</div>
          </div>
        </div>
        <div style={btnBar}>
          <button onClick={()=>setTemp(t=>Math.min(COOK.maxTemp,t+COOK.logTempBoost))}
            style={{flex:1,...btnSt,borderRadius:10,border:"none",background:"linear-gradient(180deg,#8B6040,#6B4020)",
              color:"#FFF",fontFamily:F.b,fontSize:compact?11:12,fontWeight:"bold",cursor:"pointer"}}>🪵 薪をくべる</button>
          <Btn onClick={finishBake} disabled={bakeTicks<15} color="basil"
            style={{flex:1.2,...btnSt,...(isOptimal&&bakeTicks>=30?{animation:"glow 1s infinite"}:{})}}>
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
          <div style={{position:"absolute",top:8,left:"50%",transform:"translateX(-50%)",fontFamily:F.b,fontSize:11,color:V.esp,
            background:"rgba(255,255,255,.8)",padding:"2px 8px",borderRadius:6}}>
            🫒 ドラッグでオリーブオイルをかける（任意）
          </div>
        </div>
        <div style={btnBar}>
          <Btn onClick={()=>setCookStep("done")} color="sec" style={{flex:1,...btnSt}}>スキップ</Btn>
          <Btn onClick={()=>setCookStep("done")} color="basil" style={{flex:2,...btnSt}}>🍕 完成！</Btn>
        </div>
      </div>
    );
  }

  /* ──── STEP: DONE (FEAT-05: improved satisfaction display) ──── */
  if(cookStep==="done"){
    const sc=calcScore();
    const qual=pizzaData.bakeQuality;
    /* #44: recipe-based breakdown */
    const menu2=[...DEFAULT_MENUS].find(m=>m.id===order.menuId);
    const recipe2=menu2?.recipe;
    let bdRecipe=0;
    if(recipe2){
      const sauceM=pizzaData.sauceType===recipe2.sauce?8:0;
      const pC={};pizzaData.cheeses.forEach(c=>{pC[c.type]=(pC[c.type]||0)+1;});
      const rc=recipe2.cheese||{};const tRC=Object.values(rc).reduce((a,b)=>a+b,0);
      let cM=tRC>0?0:1;if(tRC>0){let cor=0;for(const[t,q]of Object.entries(rc))cor+=Math.min(pC[t]||0,q);cM=cor/tRC;}
      const pT={};pizzaData.toppings.forEach(t=>{pT[t.type]=(pT[t.type]||0)+1;});
      const rt=recipe2.toppings||{};const tRT=Object.values(rt).reduce((a,b)=>a+b,0);
      let tM=tRT>0?0:1;if(tRT>0){let cor=0;for(const[t,q]of Object.entries(rt))cor+=Math.min(pT[t]||0,q);tM=cor/tRT;
        const wr=Object.entries(pT).filter(([k])=>!(k in rt)).reduce((a,[,v])=>a+v,0);tM=Math.max(0,tM-wr*0.1);}
      bdRecipe=Math.round(sauceM+cM*16+tM*16);
    }else{bdRecipe=clamp(Math.round(pizzaData.cheeses.length*3+pizzaData.toppings.length*2),0,40);}
    const verts2=pizzaData.doughVertices;const avgR2=verts2.reduce((a,b)=>a+b,0)/verts2.length;
    const var2=verts2.reduce((a,r)=>a+(r-avgR2)**2,0)/verts2.length;
    const bdDough=clamp((var2<100?10:var2<300?5:0)+(avgR2>COOK.guideRadius*0.8?5:avgR2>COOK.guideRadius*0.5?3:0),0,15);
    const bdSauce=clamp(Math.round(pizzaData.sauceBlobs.length*0.6),0,15);
    const bdBake=qual==="perfect"?30:qual==="good"?20:qual==="raw"?5:0;
    const qualComment=qual==="perfect"?"完璧な焼き上がり！":qual==="good"?"いい感じの焼き色！":qual==="raw"?"もう少し焼きたかった…":"焦がしてしまった…";
    const breakdown=[
      {l:"レシピ一致度",v:`+${bdRecipe}/40`,c:bdRecipe>25?V.basil:bdRecipe>15?V.oil:"#888"},
      {l:"生地の形",v:`+${bdDough}/15`,c:bdDough>8?V.basil:"#888"},
      {l:"ソースの塗り",v:`+${bdSauce}/15`,c:bdSauce>8?V.basil:"#888"},
      {l:`焼き加減: ${qual==="perfect"?"Perfect":qual==="good"?"Good":qual==="raw"?"Raw":"Burnt"}`,v:`+${bdBake}/30`,c:bdBake>15?V.basil:bdBake>0?V.oil:V.terra},
    ];
    return(
      <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:V.mozz}}>
        {header}
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:12,overflow:"auto"}}>
          <svg width={140} height={140} viewBox={`${CX-70} ${CY-70} 140 140`}>
            <PizzaView pizzaData={pizzaData} cx={CX} cy={CY} baked={true} scale={0.7}/>
          </svg>
          <div style={{fontFamily:F.d,fontSize:20,fontWeight:700,marginTop:4,
            color:qual==="perfect"?V.basil:qual==="good"?V.oil:V.terra}}>
            {qual==="perfect"?"Perfetto!":qual==="good"?"Buono!":qual==="raw"?"Crudo...":"Bruciato..."}
          </div>
          <div style={{fontFamily:F.b,fontSize:10,color:"#888",marginTop:2}}>{qualComment}</div>
          <div style={{width:"100%",maxWidth:220,marginTop:6,background:"#FFF",borderRadius:8,padding:6,border:`1px solid ${V.birch}`}}>
            {breakdown.map((b,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"1px 4px",borderBottom:i<breakdown.length-1?"1px solid #F5F5F5":"none"}}>
                <span style={{fontFamily:F.b,fontSize:10,color:"#666"}}>{b.l}</span>
                <span style={{fontFamily:F.b,fontSize:10,fontWeight:"bold",color:b.c}}>{b.v}</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",padding:"3px 4px 0",borderTop:`1px solid ${V.birch}`,marginTop:2}}>
              <span style={{fontFamily:F.b,fontSize:11,fontWeight:"bold",color:V.esp}}>総合満足度</span>
              <span style={{fontFamily:F.d,fontSize:18,fontWeight:700,color:sc>70?V.basil:sc>50?V.oil:V.terra}}>{sc}%</span>
            </div>
          </div>
          <div style={{width:160,height:8,background:"#EEE",borderRadius:4,overflow:"hidden",marginTop:4}}>
            <div style={{width:`${sc}%`,height:"100%",borderRadius:4,
              background:sc>70?V.basil:sc>50?V.oil:V.terra,transition:"width .5s"}}/>
          </div>
        </div>
        <div style={{...btnBar,justifyContent:"center"}}>
          <Btn onClick={()=>onDone(sc)} style={btnSt}>🍕 提供する！</Btn>
        </div>
      </div>
    );
  }

  return null;
}
