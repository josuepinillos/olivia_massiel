(() => {
  const data = window.OLIVIA_EVENT;
  const q = (s) => document.querySelector(s);
  const set = (s, v) => { const el=q(s); if(el) el.textContent=v; };

  set("#dateLabel", data.dateLabel);
  set("#timeLabel", data.timeLabel);
  set("#venueLabel", data.venue);
  set("#addressLabel", data.address);
  set("#venueLabel2", data.venue);
  set("#addressLabel2", data.address);
  set("#footerDate", data.dateLabel);
  ["#mapsButton","#routeButton"].forEach(s => { const el=q(s); if(el) el.href=data.mapsUrl; });
  const rsvp=q("#rsvpButton"); if(rsvp) rsvp.href=data.rsvpUrl;

  const scene=q("#heroScene");
  const layers=[...document.querySelectorAll(".layer")];
  const title=q(".hero-title");
  let tx=0,ty=0,cx=0,cy=0,raf=0;

  function animate(){
    cx += (tx-cx)*0.075; cy += (ty-cy)*0.075;
    layers.forEach(layer=>{
      const d=Number(layer.dataset.depth||0);
      layer.style.transform=`translate3d(${cx*d}px,${cy*d}px,0)`;
    });
    if(title) title.style.transform=`translate3d(calc(-50% + ${cx*0.12}px),${cy*0.12}px,0)`;
    raf=requestAnimationFrame(animate);
  }
  function pointer(e){
    const r=scene.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-.5;
    const y=(e.clientY-r.top)/r.height-.5;
    tx=x*24; ty=y*18;
  }
  scene.addEventListener("pointermove", pointer);
  scene.addEventListener("pointerleave",()=>{tx=0;ty=0});
  animate();

  document.querySelectorAll("[data-toy]").forEach(toy=>{
    toy.addEventListener("pointerenter",()=>{
      toy.animate(
        [{transform:"translateY(0) rotate(0deg)"},{transform:"translateY(-7px) rotate(-2deg)"},{transform:"translateY(0) rotate(1deg)"},{transform:"translateY(0) rotate(0deg)"}],
        {duration:850,easing:"cubic-bezier(.22,1,.36,1)"}
      );
    });
  });

  const name=q(".name-trigger");
  if(name){
    name.addEventListener("pointerenter",()=>{
      name.animate(
        [{transform:"scale(1)"},{transform:"scale(1.035) rotate(-.5deg)"},{transform:"scale(1) rotate(0)"}],
        {duration:700,easing:"cubic-bezier(.22,1,.36,1)"}
      );
    });
  }

  // Gentle continuous sway on the toy layers.
  document.querySelectorAll(".toy").forEach((toy,i)=>{
    const delay=i*180;
    toy.animate(
      [{transform:"rotate(-1deg) translateY(0)"},{transform:"rotate(1deg) translateY(-3px)"},{transform:"rotate(-.5deg) translateY(1px)"},{transform:"rotate(0deg) translateY(0)"}],
      {duration:5200+i*420,delay,iterations:Infinity,easing:"ease-in-out"}
    );
  });

  const target = new Date(data.isoDate).getTime();
  function countdown(){
    let diff=Math.max(0,target-Date.now());
    const d=Math.floor(diff/86400000); diff%=86400000;
    const h=Math.floor(diff/3600000); diff%=3600000;
    const m=Math.floor(diff/60000); diff%=60000;
    const s=Math.floor(diff/1000);
    set("#days",String(d).padStart(2,"0"));
    set("#hours",String(h).padStart(2,"0"));
    set("#minutes",String(m).padStart(2,"0"));
    set("#seconds",String(s).padStart(2,"0"));
  }
  countdown(); setInterval(countdown,1000);

  // Mobile tilt/parallax when permission is already available.
  if(window.DeviceOrientationEvent){
    window.addEventListener("deviceorientation",(e)=>{
      if(e.gamma==null || e.beta==null) return;
      tx=Math.max(-10,Math.min(10,e.gamma*.35));
      ty=Math.max(-8,Math.min(8,(e.beta-45)*.12));
    },{passive:true});
  }
})();