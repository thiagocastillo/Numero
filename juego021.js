/* Juego 021: fracciones equivalentes (con contraseña). Usa el motor de juego.js */
(function(){
  "use strict";
  var CLAVE = "equivalencias";

  function mcd(a, b){ return b ? mcd(b, a % b) : a; }
  function equiv(n1, d1, n2, d2){ return n1 * d2 === n2 * d1; }
  function f(n, d){ return n + "/" + d; }

  // fracciones base (irreducibles) según el nivel
  function base(nivel, U){
    var n, d, g = 0;
    while(g++ < 200){
      if(nivel === "facil"){ d = U.elegir([2,3,4,5]); n = U.azar(1, d-1); }
      else if(nivel === "medio"){ d = U.azar(2,8); n = U.azar(1, d-1); }
      else{ d = U.azar(3,12); n = U.azar(1, d-1); }
      if(mcd(n, d) === 1){ return [n, d]; }
    }
    return [1,2];
  }
  function factor(nivel, U){ return nivel === "facil" ? U.azar(2,4) : nivel === "medio" ? U.azar(2,5) : U.azar(2,6); }

  // 3 opciones de texto: la correcta + 2 distractores distintos (se completan si faltan)
  function armar(p, ok, dist, r, U){
    var ops = [ok], i, g = 0;
    dist = U.mezclar(dist);
    for(i=0;i<dist.length && ops.length<3;i++){ if(dist[i] && ops.indexOf(dist[i]) < 0){ ops.push(dist[i]); } }
    while(ops.length < 3 && g++ < 100){
      var c = String(parseInt(ok,10) + U.azar(1,6) * (Math.random() < .5 ? -1 : 1));
      if(parseInt(c,10) > 0 && ops.indexOf(c) < 0){ ops.push(c); }
    }
    ops = U.mezclar(ops);
    return {p:p, o:ops, c:ops.indexOf(ok), r:r};
  }
  function armarFrac(p, ok, dist, r, U, n, d){
    // completa con fracciones no equivalentes a n/d
    var g = 0;
    while(dist.length < 4 && g++ < 60){
      var n2 = U.azar(1,15), d2 = U.azar(2,20);
      var s = f(n2, d2);
      if(!equiv(n2, d2, n, d) && s !== ok && dist.indexOf(s) < 0){ dist.push(s); }
    }
    return armar(p, ok, dist, r, U);
  }

  var gen = {
    equivalente: function(nivel, U){
      var b = base(nivel, U), n = b[0], d = b[1], k = factor(nivel, U);
      var ok = f(n*k, d*k), dist = [], cand = [f(n+k, d+k), f(n*k, d+k), f(n*k, d), f(n, d*k), f(n*k+1, d*k), f(n*k, d*k+1), f(n+1, d+1)];
      cand.forEach(function(s){ var p = s.split("/"); if(!equiv(+p[0], +p[1], n, d)){ dist.push(s); } });
      return armarFrac("¿Cuál fracción es equivalente a " + f(n,d) + "?", ok, dist, f(n,d)+" = "+ok+": multiplicamos arriba y abajo por "+k, U, n, d);
    },
    faltaNum: function(nivel, U){
      var b = base(nivel, U), n = b[0], d = b[1], k = factor(nivel, U), ok = String(n*k);
      return armar("¿Qué número falta? " + f(n,d) + " = ▢/" + (d*k), ok, [String(n+k), String(n*k+1), String(n*k-1), String(n+1)], f(n,d)+" = "+f(n*k,d*k)+": "+d+" × "+k+" = "+(d*k)+", así que "+n+" × "+k+" = "+(n*k), U);
    },
    faltaDen: function(nivel, U){
      var b = base(nivel, U), n = b[0], d = b[1], k = factor(nivel, U), ok = String(d*k);
      return armar("¿Qué número falta? " + f(n,d) + " = " + (n*k) + "/▢", ok, [String(d+k), String(d*k+1), String(d*k-1), String(d+1)], f(n,d)+" = "+f(n*k,d*k)+": "+n+" × "+k+" = "+(n*k)+", así que "+d+" × "+k+" = "+(d*k), U);
    },
    simplificar: function(nivel, U){
      var b = base(nivel === "facil" ? "medio" : nivel, U), n = b[0], d = b[1], k = U.elegir([2,3,4,6]);
      var ok = f(n,d), dist = [];
      [2,3].forEach(function(j){ if(k % j === 0 && k / j > 1){ dist.push(f(n*(k/j), d*(k/j))); } });
      [f(n+1,d), f(n,d+1), f(n+1,d+1)].forEach(function(s){ var p = s.split("/"); if(!equiv(+p[0], +p[1], n, d)){ dist.push(s); } });
      return armarFrac("¿Cuál es la fracción más simple equivalente a " + f(n*k, d*k) + "?", ok, dist, f(n*k,d*k)+" = "+ok+": dividimos arriba y abajo por "+k, U, n, d);
    },
    noEquiv: function(nivel, U){
      var b = base(nivel, U), n = b[0], d = b[1], ks = U.mezclar([2,3,4,5]).slice(0,2);
      var a = f(n*ks[0], d*ks[0]), c = f(n*ks[1], d*ks[1]);
      var ok = U.elegir([f(n+1, d+1), f(n*ks[0], d*ks[0]+1), f(n+ks[0], d+ks[0]), f(n, d*ks[1])]);
      var p = ok.split("/");
      if(equiv(+p[0], +p[1], n, d)){ ok = f(n+1, d*ks[0]); }
      return armar("¿Cuál NO es equivalente a " + f(n,d) + "?", ok, [a, c], ok + " no es equivalente a " + f(n,d) + " (" + a + " y " + c + " sí)", U);
    }
  };

  window.JUEGO_MANUAL = true;
  window.JUEGO_CFG = {
    prefijo: "frac-record",
    eyebrow: "Juego 021 · Fracciones equivalentes",
    titulo: "Ayudá a la rana con las fracciones",
    consigna: "Elegí un nivel. En cada hoja hay una respuesta: llevá a la rana a la hoja correcta. Si te equivocás, ¡la hoja se hunde y se acaba el juego!",
    niveles: [
      ["facil","🌱","Fácil","Encontrá la fracción equivalente y completá fracciones sencillas. Sin apuro."],
      ["medio","🌿","Medio","Empezás con equivalentes y, a medida que acertás, aparecen más fracciones, denominadores que faltan, la que NO es equivalente y simplificar."],
      ["dificil","🔥","Difícil","Fracciones más grandes y todos los desafíos mezclados, con solo 10 segundos por pregunta."]
    ],
    generar: function(nivel, ronda, U){
      var pool;
      if(nivel === "facil"){ pool = ["equivalente","equivalente","equivalente","faltaNum","faltaNum"]; }
      else if(nivel === "medio"){
        pool = ["equivalente","equivalente","faltaNum"];
        if(ronda >= 4){ pool.push("faltaDen"); }
        if(ronda >= 7){ pool.push("noEquiv"); }
        if(ronda >= 10){ pool.push("simplificar"); }
      }else{ pool = ["equivalente","faltaNum","faltaDen","noEquiv","simplificar","simplificar"]; }
      return gen[U.elegir(pool)](nivel, U);
    }
  };

  function norm(s){
    s = String(s).toLowerCase().replace(/^\s+|\s+$/g,"");
    if(s.normalize){ s = s.normalize("NFD").replace(/[̀-ͯ]/g,""); }
    return s;
  }

  function compuerta(){
    var cont = document.getElementById("juego");
    var ok = false;
    try{ ok = sessionStorage.getItem("juego021-ok") === "1"; }catch(e){}
    if(ok){ window.iniciarJuego(); return; }
    cont.innerHTML =
      '<div class="clave-caja">' +
      '<div class="clave-ico">🔒</div>' +
      '<h2>Juego 021</h2>' +
      '<p>Este juego es con contraseña. Pedísela a tu docente.</p>' +
      '<input id="clave-in" type="text" autocomplete="off" spellcheck="false" placeholder="Contraseña" aria-label="Contraseña">' +
      '<div class="fila"><button class="btn btn-1" id="clave-ok" type="button">Entrar</button></div>' +
      '<p class="clave-error" id="clave-error" role="alert"></p>' +
      '</div>';
    var inp = document.getElementById("clave-in"), err = document.getElementById("clave-error");
    function entrar(){
      if(norm(inp.value) === CLAVE){
        try{ sessionStorage.setItem("juego021-ok","1"); }catch(e){}
        window.iniciarJuego();
      }else{
        err.textContent = "Esa no es la contraseña. Probá de nuevo.";
        inp.value = ""; inp.focus();
      }
    }
    document.getElementById("clave-ok").addEventListener("click", entrar);
    inp.addEventListener("keydown", function(ev){ if(ev.key === "Enter"){ entrar(); } });
    inp.focus();
  }
  window.addEventListener("DOMContentLoaded", compuerta);
})();
