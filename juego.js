(function(){
  "use strict";
  // Configuración opcional (la usa el juego 021 de fracciones): prefijo del récord, textos, niveles y generador de preguntas
  var CFG = window.JUEGO_CFG || {};
  var ICO = {
    tilde: svg('<path d="M4.8 12.4l4.8 4.8L19.2 7"/>'),
    circulo: svg('<circle cx="12" cy="12" r="7"/>'),
    lampara: svg('<path d="M9.6 18.1h4.8"/><path d="M10.5 20.9h3"/><path d="M12 3.3a5.9 5.9 0 0 0-3.4 10.7c.5.4.8 1 .8 1.6v.5h5.2v-.5c0-.6.3-1.2.8-1.6A5.9 5.9 0 0 0 12 3.3z"/>'),
    flecha: svg('<path d="M5 12h13M13.2 6.6L18.6 12l-5.4 5.4"/>')
  };

  function svg(d, extra){
    return '<svg class="svg-ico' + (extra ? ' ' + extra : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
  }

  function el(tag, clase, texto){
    var e = document.createElement(tag);
    if(clase){ e.className = clase; }
    if(texto !== undefined && texto !== null){ e.textContent = texto; }
    return e;
  }

  function html(tag, clase, markup){
    var e = document.createElement(tag);
    if(clase){ e.className = clase; }
    if(markup !== undefined){ e.innerHTML = markup; }
    return e;
  }

  function mezclar(arr){
    var a = arr.slice();
    for(var i=a.length-1;i>0;i--){
      var j = Math.floor(Math.random()*(i+1));
      var t=a[i]; a[i]=a[j]; a[j]=t;
    }
    return a;
  }

  function reduceMotion(){
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function celebrar(x, y){
    if(reduceMotion()){ return; }
    var cols = ["#2FA05E","#F2B02A","#5CC488","#EC5F92","#9268D6","#F0813C"];
    for(var i=0;i<14;i++){
      (function(i){
        var p = el("div","particula");
        p.style.background = cols[i % cols.length];
        p.style.left = x + "px";
        p.style.top = y + "px";
        p.style.borderRadius = (i % 2 ? "50%" : "2px");
        document.body.appendChild(p);
        var ang = (Math.PI*2)*(i/14) + Math.random()*0.5;
        var dist = 52 + Math.random()*62;
        p.animate([
          {transform:"translate(0,0) scale(1)", opacity:1},
          {transform:"translate("+(Math.cos(ang)*dist)+"px,"+(Math.sin(ang)*dist-26)+"px) rotate(180deg) scale(.4)", opacity:0}
        ], {duration:640 + Math.random()*260, easing:"cubic-bezier(.22,.7,.25,1)"});
        setTimeout(function(){ if(p.parentNode){ p.parentNode.removeChild(p); } }, 950);
      })(i);
    }
  }

  function feedback(tipo, titulo, texto, pistaHTML){
    var d = el("div", "fb fb-" + tipo + " on");
    d.appendChild(html("span","ic", tipo === "ok" ? ICO.tilde : (tipo === "casi" ? ICO.lampara : ICO.circulo)));
    var c = el("div");
    c.appendChild(el("div","tit", titulo));
    c.appendChild(el("div","txt", texto));
    if(pistaHTML){ c.appendChild(html("div","pista", pistaHTML)); }
    d.appendChild(c);
    return d;
  }

  /* ============================================================
     SALTO: cruzar el estanque saltando de hoja en hoja
     ============================================================ */
  function juegoSalto(host, act, alTerminar){
    var nivel = act.nivel || "facil", LIMITE = 10000, META = 15, ORDEN = ["facil","medio","dificil"], claveRec = nivel === "facil" ? (CFG.prefijo || "rana-record") : (CFG.prefijo || "rana-record") + "-" + nivel;
    var COLS = 3, FILAS = 5, BASE = 80, STEP = 66, ALTO = 470;
    function pct(px){ return (px / ALTO * 100) + "%"; } // el estanque se escala según el alto de la pantalla
    var ronda = 0, cruce = 0, fila = -1, selc = 1, actual = null, bloqueado = false;
    var pads = [];

    function azar(a, b){ return a + Math.floor(Math.random()*(b-a+1)); }
    function elegirUno(arr){ return arr[azar(0,arr.length-1)]; }
    // arma la pregunta: la correcta + 2 distractores distintos (se rellenan con cercanos si faltan)
    function armar(p, ok, dist, r){
      var ops = [ok], i, g = 0;
      dist = mezclar(dist.slice());
      for(i=0;i<dist.length && ops.length<COLS;i++){ if(dist[i] > 0 && ops.indexOf(dist[i]) < 0){ ops.push(dist[i]); } }
      while(ops.length < COLS && g++ < 80){
        var c = ok + azar(1,10) * (Math.random() < 0.5 ? -1 : 1);
        if(c > 0 && ops.indexOf(c) < 0){ ops.push(c); }
      }
      ops = mezclar(ops);
      return {p:p, o:ops, c:ops.indexOf(ok), r:r};
    }
    function num3(lugar, dig){ // lugar: 0 unidades, 1 decenas, 2 centenas
      var d = [azar(0,9), azar(0,9), azar(1,9)];
      d[lugar] = dig;
      return d[2]*100 + d[1]*10 + d[0];
    }
    var LUGARES = ["unidades","decenas","centenas"];
    var generadores = {
      tabla: function(){
        var a, b, tablas;
        if(nivel === "medio"){
          tablas = [2,3,4,5,10];
          if(ronda >= 4){ tablas.push(6); }
          if(ronda >= 8){ tablas.push(9); }
          if(ronda >= 12){ tablas.push(7); }
          if(ronda >= 16){ tablas.push(8); }
          a = elegirUno(tablas); b = azar(2,10);
          if(Math.random() < 0.5){ var x = a; a = b; b = x; }
        }else{ a = azar(2,10); b = azar(2,10); }
        var res = a*b;
        var cerca = nivel === "facil" ? [] : [res+a, res-a, res+b, res-b];
        var dist = cerca.length ? cerca : [res+azar(1,10), res-azar(1,10), res+azar(1,10)];
        return armar("¿Cuánto es " + a + " × " + b + "?", res, dist, a+" × "+b+" = "+res);
      },
      ext: function(){
        var m = elegirUno([10,10,100,11,12]), a = m >= 100 ? azar(2,20) : m === 10 ? azar(11,40) : azar(2,10);
        var res = a*m, dist = m === 10 ? [res*10, res/10, res+10] : m === 100 ? [res*10, res/10, res+100] : [res+a, res-a, res+10];
        return armar("¿Cuánto es " + a + " × " + m + "?", res, dist, a+" × "+m+" = "+res);
      },
      div: function(){
        var b = azar(2,10), q = azar(2,10), a = b*q;
        return armar("¿Cuánto es " + a + " ÷ " + b + "?", q, [q+1, q-1, q+2, q-2, b], a+" ÷ "+b+" = "+q);
      },
      falta: function(){
        var a = azar(2,10), b = azar(2,10), res = a*b;
        return armar("¿Qué número falta? " + a + " × ▢ = " + res, b, [b+1, b-1, b+2, a], a+" × "+b+" = "+res);
      },
      doble: function(){
        if(Math.random() < 0.5){
          var n = nivel === "dificil" ? azar(25,250) : azar(12,60);
          return armar("¿Cuál es el doble de " + n + "?", 2*n, [2*n+10, 2*n-10, 2*n+2, 2*n-2, n+2], "El doble de "+n+" es "+(2*n));
        }
        var m = azar(6,nivel === "dificil" ? 120 : 50);
        return armar("¿Cuál es la mitad de " + (2*m) + "?", m, [m+10, m-10, m+1, m-1, 2*m], "La mitad de "+(2*m)+" es "+m);
      },
      multiplo: function(){
        var k = elegirUno(nivel === "facil" ? [2,5,10] : [2,3,4,5,6,10]), ok = k*azar(3,12), dist = [];
        for(var i=0;i<6;i++){ dist.push(k*azar(3,12) + azar(1,k-1)); }
        return armar("¿Cuál de estos números es múltiplo de " + k + "?", ok, dist, ok+" = "+k+" × "+(ok/k));
      },
      divisor: function(){
        var N = elegirUno([12,18,20,24,30,36,40,42,48,60]), ds = [], nds = [], d;
        for(d=3; d<N; d++){ if(N % d === 0){ ds.push(d); } else if(d <= 14){ nds.push(d); } }
        var ok = elegirUno(ds);
        return armar("¿Cuál de estos números es divisor de " + N + "?", ok, nds, N+" ÷ "+ok+" = "+(N/ok)+" exacto");
      },
      pos: function(){
        var lugar = azar(0,2), dig = azar(1,9), ok = num3(lugar, dig), dist = [];
        for(var i=0;i<8;i++){
          var otro = (lugar + azar(1,2)) % 3, n = num3(otro, dig);
          if(Math.floor(n / Math.pow(10,lugar)) % 10 !== dig){ dist.push(n); }
        }
        return armar("¿Cuál tiene un " + dig + " en el lugar de las " + LUGARES[lugar] + "?", ok, dist, "En "+ok+" el "+dig+" ocupa las "+LUGARES[lugar]);
      },
      entre: function(){
        var lo = 10*azar(20,95), hi = lo+10, ok = lo+azar(1,9);
        return armar("¿Cuál número está entre " + lo + " y " + hi + "?", ok, [lo-azar(1,9), hi+azar(1,9), lo-azar(10,20), hi+azar(10,20)], ok+" está entre "+lo+" y "+hi);
      }
    };
    function nuevaPregunta(){
      if(CFG.generar){ return CFG.generar(nivel, ronda, {azar:azar, elegir:elegirUno, mezclar:mezclar}); }
      var pool;
      if(nivel === "facil"){
        pool = ["tabla","tabla","tabla","tabla","tabla","ext","doble","multiplo","div"];
      }else if(nivel === "medio"){
        pool = ["tabla","tabla","tabla"];
        if(ronda >= 3){ pool.push("div"); }
        if(ronda >= 5){ pool.push("multiplo","doble"); }
        if(ronda >= 7){ pool.push("ext"); }
        if(ronda >= 9){ pool.push("pos"); }
        if(ronda >= 11){ pool.push("falta"); }
        if(ronda >= 13){ pool.push("entre"); }
        if(ronda >= 15){ pool.push("divisor"); }
      }else{
        pool = ["tabla","tabla","ext","div","falta","doble","multiplo","divisor","pos","entre"];
      }
      return generadores[elegirUno(pool)]();
    }
    function hojaSVG(){
      return '<svg viewBox="-42 -30 84 60" aria-hidden="true">' +
        '<ellipse cx="0" cy="3" rx="38" ry="25" fill="#1E6E42"/>' +
        '<ellipse cx="0" cy="0" rx="38" ry="25" fill="#3AAE6B"/>' +
        '<ellipse cx="0" cy="-2" rx="30" ry="18" fill="#52C583" opacity=".7"/>' +
        '<path d="M0 0 L36 -8 M0 0 L-36 -8 M0 0 L-24 20 M0 0 L24 20 M0 0 L0 -24" stroke="#2A8F58" stroke-width="1.3" opacity=".6"/>' +
        '<g transform="translate(-22 -12)"><circle r="7" fill="#EC5F92"/><circle r="7" cx="6" cy="-4" fill="#F58AB3"/><circle r="7" cx="-6" cy="-4" fill="#F58AB3"/><circle r="3" fill="#FFD873"/></g>' +
        '<g class="num"><circle cx="4" cy="3" r="13" fill="#FFFDF5"/><circle cx="4" cy="3" r="13" fill="none" stroke="#227A48" stroke-width="2" opacity=".5"/>' +
        '<text class="t" x="4" y="8.4" text-anchor="middle" font-family="ui-monospace,monospace" font-weight="700" font-size="15" fill="#10261C"></text></g></svg>';
    }

    var globo = el("p","rio-globo");
    var rio = el("div","rio");
    rio.appendChild(el("div","orilla abajo"));
    rio.appendChild(html("div","orilla arriba","<span>🪷</span>"));
    for(var r=0;r<FILAS;r++){
      pads[r] = [];
      for(var c=0;c<COLS;c++){
        var h = html("div","hoja-n futura", hojaSVG());
        h.style.left = ((c+0.5)/COLS*100) + "%";
        h.style.bottom = pct(BASE + r*STEP);
        h.setAttribute("data-r", r); h.setAttribute("data-c", c);
        pads[r].push(h); rio.appendChild(h);
      }
    }
    var rana = html("div","rana-r",
      '<svg viewBox="-34 -34 68 52" aria-hidden="true">' +
      '<ellipse cx="-19" cy="9" rx="10.4" ry="5.6" fill="#227A48"/><ellipse cx="19" cy="9" rx="10.4" ry="5.6" fill="#227A48"/>' +
      '<ellipse cx="0" cy="0" rx="25" ry="17.4" fill="#3AA96A"/><ellipse cx="0" cy="5.4" rx="15.6" ry="9.2" fill="#DDF4E5" opacity=".72"/>' +
      '<circle cx="-10" cy="-17.4" r="8.8" fill="#3AA268"/><circle cx="10" cy="-17.4" r="8.8" fill="#3AA268"/>' +
      '<circle cx="-10" cy="-18.6" r="5.6" fill="#FFFDF5"/><circle cx="10" cy="-18.6" r="5.6" fill="#FFFDF5"/>' +
      '<circle cx="-8.6" cy="-18.6" r="2.9" fill="#10261C"/><circle cx="11.4" cy="-18.6" r="2.9" fill="#10261C"/>' +
      '<path d="M-7.4 3 q 7.4 6 14.8 0" stroke="#16532F" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>');
    rio.appendChild(rana);
    var hud = el("div","hud");
    var chipA = html("div","hud-chip","<small>🪷 Aciertos</small><b>0</b>");
    var chipR = html("div","hud-chip rec","<small>🏆 Récord</small><b>0</b>");
    hud.appendChild(chipA); hud.appendChild(chipR);
    var barra = null, barraI = null, timer = null;
    if(nivel === "dificil"){
      barra = el("div","tiempo"); barraI = el("i"); barra.appendChild(barraI);
      barra.setAttribute("role","timer"); barra.setAttribute("aria-label","Tiempo para responder: 10 segundos");
    }
    var cab = el("div","rio-cab"); cab.appendChild(globo); cab.appendChild(hud);
    host.appendChild(cab);
    if(barra){ host.appendChild(barra); }
    host.appendChild(rio);

    var ctrl = el("div","fila salto-ctrl");
    var bIzq = html("button","btn btn-2","←"), bSel = html("button","btn btn-1","↑ Saltar a esta hoja"), bDer = html("button","btn btn-2","→");
    bIzq.setAttribute("aria-label","Mover a la izquierda"); bDer.setAttribute("aria-label","Mover a la derecha");
    ctrl.appendChild(bIzq); ctrl.appendChild(bSel); ctrl.appendChild(bDer);
    host.appendChild(ctrl);
    host.appendChild(el("p","salto-ayuda","Teclado: ← y → para elegir la hoja, ↑ para saltar."));
    var zonaFB = el("div"); host.appendChild(zonaFB);

    function posRana(r, c){
      rana.style.left = ((c+0.5)/COLS*100) + "%";
      rana.style.bottom = pct(r < 0 ? 14 : r >= FILAS ? BASE + FILAS*STEP - 8 : BASE + r*STEP + 8);
    }
    function saltito(){ rana.classList.remove("salta"); void rana.offsetWidth; rana.classList.add("salta"); }
    function marcarSel(){
      var sig = fila + 1;
      if(sig >= FILAS){ return; }
      for(var c=0;c<COLS;c++){ pads[sig][c].classList.toggle("sel", c === selc); }
    }
    function mejor(){ try{ return parseInt(localStorage.getItem(claveRec),10) || 0; }catch(e){ return 0; } }
    function pintarPasos(sube){
      var bA = chipA.querySelector("b"), bR = chipR.querySelector("b");
      bA.textContent = ronda; bR.textContent = Math.max(mejor(), ronda);
      if(sube){ bA.classList.remove("sube"); void bA.offsetWidth; bA.classList.add("sube"); }
    }
    function pararTimer(){ if(timer){ clearInterval(timer); timer = null; } }
    function arrancarTimer(){
      pararTimer();
      if(!barra){ return; }
      var ini = Date.now();
      barraI.style.width = "100%"; barra.classList.remove("poco");
      timer = setInterval(function(){
        if(!host.isConnected){ pararTimer(); return; }
        var resto = LIMITE - (Date.now() - ini);
        barraI.style.width = Math.max(0, resto/LIMITE*100) + "%";
        barra.classList.toggle("poco", resto < 3500);
        if(resto <= 0){ pararTimer(); if(!bloqueado){ perder(true); } }
      }, 80);
    }
    function prepararFila(){
      var sig = fila + 1;
      actual = nuevaPregunta(); bloqueado = false;
      globo.textContent = "🐸 " + actual.p;
      arrancarTimer();
      for(var c=0;c<COLS;c++){
        var h = pads[sig][c];
        h.className = "hoja-n" + (c === selc ? " sel" : "");
        var tx = String(actual.o[c]), larga = tx.length > 3;
        h.querySelector(".t").textContent = tx;
        h.querySelector(".t").setAttribute("font-size", tx.length <= 3 ? 15 : tx.length <= 5 ? 11.5 : 9.5);
        var cs = h.querySelectorAll(".num circle"); for(var q=0;q<cs.length;q++){ cs[q].setAttribute("r", larga ? 16 : 13); }
      }
    }
    function nuevoCruce(){
      fila = -1; selc = 1; bloqueado = true;
      for(var r=0;r<FILAS;r++){ for(var c=0;c<COLS;c++){ pads[r][c].className = "hoja-n futura"; } }
      rana.classList.remove("cae"); rana.style.opacity = "";
      posRana(-1, 1); saltito();
      zonaFB.innerHTML = "";
      prepararFila(); pintarPasos();
    }
    function mover(d){
      if(bloqueado){ return; }
      var n = Math.max(0, Math.min(COLS-1, selc + d));
      if(n === selc){ return; }
      selc = n; marcarSel();
    }
    function chapoteo(c, r){
      var ch = el("div","chapoteo","💦");
      ch.style.left = ((c+0.5)/COLS*100) + "%"; ch.style.bottom = pct(BASE + r*STEP + 6);
      rio.appendChild(ch);
      setTimeout(function(){ if(ch.parentNode){ ch.parentNode.removeChild(ch); } }, 1000);
    }
    function saltar(c){
      if(bloqueado){ return; }
      bloqueado = true; pararTimer(); selc = c; marcarSel();
      var sig = fila + 1, h = pads[sig][c];
      zonaFB.innerHTML = "";
      var lento = reduceMotion() ? 200 : 1;
      posRana(sig, c); saltito();
      if(c === actual.c){
        setTimeout(function(){
          if(!host.isConnected){ return; }
          for(var k=0;k<COLS;k++){ pads[sig][k].classList.remove("sel"); pads[sig][k].classList.add(k === c ? "pasada" : "otra"); }
          var rc = h.getBoundingClientRect();
          celebrar(rc.left + rc.width/2, rc.top + 10);
          ronda++; fila = sig; pintarPasos(true);
          if(ronda === META){ hito(function(){ continuar(c); }); }
          else{ continuar(c); }
        }, 380);
      }else{
        setTimeout(function(){ perder(false, h, c, sig); }, 380);
      }
    }
    function continuar(c){
      bloqueado = true;
      {
          if(fila >= FILAS-1){
            globo.textContent = "🪷 ¡Cruzaste el estanque!"; pararTimer();
            setTimeout(function(){
              if(!host.isConnected){ return; }
              posRana(FILAS, c); saltito();
              setTimeout(function(){ if(host.isConnected){ cruce++; nuevoCruce(); } }, 1100);
            }, 600);
          }else{
            prepararFila();
          }
      }
    }
    // al llegar a META aciertos: guarda el récord y ofrece subir de nivel (o la medalla en el último)
    function hito(seguir){
      bloqueado = true; pararTimer();
      var rec = mejor();
      if(ronda > rec){ try{ localStorage.setItem(claveRec, String(ronda)); }catch(e){} }
      var sigNivel = ORDEN[ORDEN.indexOf(nivel) + 1], final = !sigNivel;
      if(final){ try{ localStorage.setItem(claveRec + "-medalla", "1"); }catch(e){} }
      var p = el("div","hito"), caja = el("div","hito-caja");
      if(final){
        caja.appendChild(el("div","medalla","🏅"));
        caja.appendChild(el("h3",null,"¡Campeón/a del estanque!"));
        caja.appendChild(el("p",null,"Llegaste a " + META + " aciertos seguidos en el último nivel. ¡Ganaste la medalla de campeón/a!"));
      }else{
        caja.appendChild(el("div","medalla","🏆"));
        caja.appendChild(el("h3",null,"¡" + META + " aciertos seguidos!"));
        caja.appendChild(el("p",null,"¿Querés subir la dificultad y pasar al nivel siguiente?"));
      }
      var f = el("div","fila");
      var bSub = sigNivel ? html("button","btn btn-1","Subir de nivel" + ICO.flecha) : null;
      var bSeg = html("button", sigNivel ? "btn btn-2" : "btn btn-1", "Seguir jugando");
      var bMenu = html("button","btn btn-2","Elegir nivel");
      if(bSub){ bSub.addEventListener("click", function(){ cerrar(); act.alReintentar(sigNivel); }); f.appendChild(bSub); }
      bSeg.addEventListener("click", function(){ if(p.parentNode){ p.parentNode.removeChild(p); } seguir(); });
      bMenu.addEventListener("click", function(){ cerrar(); act.alReintentar(); });
      f.appendChild(bSeg); f.appendChild(bMenu);
      caja.appendChild(f); p.appendChild(caja); rio.appendChild(p);
      (bSub || bSeg).focus();
      if(!reduceMotion()){ var rc = caja.getBoundingClientRect(); celebrar(rc.left + rc.width/2, rc.top + 30); }
      function cerrar(){ document.removeEventListener("keydown", tecla); }
    }
    function perder(tiempo, hoja, c, sig){
      bloqueado = true; pararTimer();
      if(!hoja && fila >= 0){ c = pasadaCol(); hoja = pads[fila][c]; sig = fila; }
      if(!host.isConnected){ return; }
      if(hoja){ hoja.classList.remove("sel"); hoja.classList.add("hunde"); chapoteo(c, sig); }
      else{ chapoteo(selc, -0.6); }
      rana.classList.add("cae");
      setTimeout(function(){
        if(!host.isConnected){ return; }
        document.removeEventListener("keydown", tecla);
        var rec = mejor();
        if(ronda > rec){ try{ localStorage.setItem(claveRec, String(ronda)); }catch(e){} }
        host.innerHTML = "";
        var cuenta = actual.r;
        host.appendChild(feedback("casi", tiempo ? "¡Se acabó el tiempo! ⏱️" : "¡Game over! 💦",
          (tiempo ? "La hoja se hundió. " : "La hoja se hundió: ") + cuenta + ". Respondiste " + ronda + " seguidas bien" + (ronda > rec ? " ¡y es un nuevo récord! 🏆" : ". Tu récord es " + rec + "."), null));
        var f = el("div","fila");
        var b = html("button","btn btn-1","Reintentar" + ICO.flecha);
        b.addEventListener("click", function(){ act.alReintentar(nivel); });
        var b2 = html("button","btn btn-2","Cambiar de nivel");
        b2.addEventListener("click", function(){ act.alReintentar(); });
        f.appendChild(b); f.appendChild(b2); host.appendChild(f);
        b.focus();
      }, 1000);
    }
    function pasadaCol(){
      for(var c=0;c<COLS;c++){ if(pads[fila][c].classList.contains("pasada")){ return c; } }
      return 1;
    }

    function tecla(ev){
      if(!host.isConnected){ document.removeEventListener("keydown", tecla); return; }
      if(!host.offsetParent){ return; }
      var t = ev.target && ev.target.tagName;
      if(t === "INPUT" || t === "TEXTAREA"){ return; }
      var c = ev.key || "";
      if(c === "ArrowLeft"){ ev.preventDefault(); mover(-1); }
      else if(c === "ArrowRight"){ ev.preventDefault(); mover(1); }
      else if(c === "ArrowUp"){ ev.preventDefault(); saltar(selc); }
    }
    document.addEventListener("keydown", tecla);
    bIzq.addEventListener("click", function(){ mover(-1); });
    bDer.addEventListener("click", function(){ mover(1); });
    bSel.addEventListener("click", function(){ saltar(selc); });
    rio.addEventListener("click", function(ev){
      var n = ev.target.closest ? ev.target.closest(".hoja-n") : null;
      if(!n || bloqueado || parseInt(n.getAttribute("data-r"),10) !== fila+1){ return; }
      saltar(parseInt(n.getAttribute("data-c"),10));
    });
    nuevoCruce();
  }

  var NIVELES = CFG.niveles || [
    ["facil","🌱","Fácil","Sobre todo tablas del 2 al 10, con algunas preguntas fáciles de variedad. Sin apuro."],
    ["medio","🌿","Medio","Empezás con tablas fáciles y, a medida que acertás, se suman más tablas y preguntas nuevas: divisiones, múltiplos, dobles, 12 × 10…"],
    ["dificil","🔥","Difícil","Tablas y todo tipo de desafíos mezclados desde el inicio, con solo 10 segundos por pregunta: si se acaba el tiempo, la hoja se hunde."]
  ];
  function montarJuego(nivel){
    var cont = document.getElementById("juego");
    cont.innerHTML = ""; cont.classList.remove("jugando");
    var enc = el("div","enc");
    enc.appendChild(el("p","eyebrow", CFG.eyebrow || "Juego · Cruzar el estanque"));
    enc.appendChild(el("h2",null, CFG.titulo || "Ayudá a la rana a cruzar el estanque"));
    cont.appendChild(enc);
    if(typeof nivel !== "string"){
      cont.appendChild(html("p","consigna", CFG.consigna || "Elegí un nivel. Cada hoja de nenúfar tiene un número: llevá a la rana a la hoja con el resultado correcto. Si te equivocás, ¡la hoja se hunde y se acaba el juego!"));
      var g = el("div","niveles");
      NIVELES.forEach(function(n){
        var pre = CFG.prefijo || "rana-record";
        var rec = 0; try{ rec = parseInt(localStorage.getItem(n[0] === "facil" ? pre : pre + "-" + n[0]),10) || 0; }catch(e){}
        var medalla = ""; try{ if(localStorage.getItem((n[0] === "facil" ? pre : pre + "-" + n[0]) + "-medalla")){ medalla = " 🏅"; } }catch(e){}
        var b = html("button","nivel","<span class=\"em\">"+n[1]+"</span><strong>"+n[2]+"</strong><span class=\"d\">"+n[3]+"</span><span class=\"r\">🏆 Récord: "+rec+medalla+"</span>");
        b.addEventListener("click", function(){ montarJuego(n[0]); });
        g.appendChild(b);
      });
      cont.appendChild(g);
      return;
    }
    cont.appendChild(html("p","consigna","Elegí con <strong>←</strong> y <strong>→</strong> la hoja con la respuesta correcta y apretá <strong>↑</strong> para saltar." + (nivel === "dificil" ? " ¡Tenés 10 segundos por pregunta!" : "")));
    cont.classList.add("jugando");
    var host = el("div","lienzo");
    cont.appendChild(host);
    juegoSalto(host, {nivel:nivel, alReintentar:montarJuego}, function(){});
  }
  window.iniciarJuego = montarJuego;
  if(!window.JUEGO_MANUAL){ montarJuego(); }
})();
