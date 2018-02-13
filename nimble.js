/*
 * Nimble - Simple Input and Step-handle Library
 * Version 1.2.6
 * Updates:
 *  1.2.6:
 *  Assigned mouse button values to false on start
 *  1.2.5:
 *  Added support for pointer locking and locked pointer tracking
 *  1.2.3:
 *  Better mousewheel support for Firefox
 *  Anti-aliasing canvas option
 */

var nimble = new (function(){'use strict';
	var nimble = this;

	var browser = (function(){var u=navigator.userAgent,m,b,v,fv; if((b="edge",m=u.match(/(?:Edge\/((\d+)[\d\.]*))/)) || (b="chrome",m=u.match(/Chrome\/((\d+)[\d\.]*)/))
		|| (b="firefox",m=u.match(/Firefox\/((\d+)[\d\.]*)/)) || (b="ie",m=u.match(/(?:MSIE |Trident.*?rv:?\s*)((\d+)[\d\.]*)/))
		|| (b="opera",m=u.match(/(?:Opera |Opera\/.*?Version )((\d+)[\d\.]*)/)) || (b="safari",m=u.match(/(?:Version\/((\d+)[\d\.]*))?.*Safari/)) || (b="other",false)) v=m[2],fv=m[1]; else v=null,fv=null;
		return {browser:b,version:+v,fullversion:fv,valueOf:function(){return b}}})();
	var anifr_prefix = ('requestAnimationFrame' in window ? ''
					: 'msRequestAnimationFrame' in window ? 'ms'
					: 'mozRequestAnimationFrame' in window ? 'moz'
					: 'webkitRequestAnimationFrame' in window ? 'webkit'
					: 'oRequestAnimationFrame' in window ? 'o'
					: '');
	var requestAF = anifr_prefix + (anifr_prefix ? 'R' : 'r') + 'equestAnimationFrame',
		cancelAF = anifr_prefix + (anifr_prefix ? 'C' : 'c') + 'ancelAnimationFrame';
	var plock_prefix = ('pointerLockElement' in document ? ''
					: 'msPointerLockElement' in document ? 'ms'
					: 'mozPointerLockElement' in document ? 'moz'
					: 'webkitPointerLockElement' in document ? 'webkit'
					: '');
	var requestPL = plock_prefix + (plock_prefix ? 'R' : 'r') + 'equestPointerLock',
		exitPL = plock_prefix + (plock_prefix ? 'E' : 'e') + 'xitPointerLock',
		PLelement = plock_prefix + (plock_prefix ? 'P' : 'p') + 'ointerLockElement',
		PLchange = plock_prefix + "pointerlockchange",
		PLerror = plock_prefix + "pointerlockerror";
	
	nimble.enableByDefault = true;

	function addHooks(t,hooks) {
		function run(ev) {
			for(var ar=hooks[ev],l=ar.length,i=0;i<l;i++)
				ar[i].apply(undefined,arguments);
		}
		t.hook = function(ev,fn) {
			if(typeof fn=="function" && ev in hooks) hooks[ev].push(fn);
		}
		t.unhook = function(ev,fn) {
			if(ev in hooks) {
				var i=hooks[ev].indexOf(fn);
				if(i>-1) hooks[ev].splice(i,1);
			}
		}
		return run;
	}
	function addListens(t,ta,lists) {
		var en=false;
		t.enable = function() {
			if(en) return;
			var lst;
			for(var i in lists) {
				lst = i.split(" ");
				for(var n=0;n<lst.length;n++)
					ta.addEventListener(lst[n],lists[i]);
			}
			en=true;
		}
		t.disable = function() {
			if(!en) return;
			var lst;
			for(var i in lists) {
				lst = i.split(" ");
				for(var n=0;n<lst.length;n++)
					ta.removeEventListener(lst[n],lists[i]);
			}
			en=false;
		}
		t.isenabled = function() {return en}
		if(nimble.enableByDefault) t.enable();
	}
	
	var Canvas = function(context) {var t=this; if(!(t instanceof Canvas)) throw "Bad instantiation of object nimble.Canvas";
		context=context||window;
		var cnv=null,mode="2d";
		var ctx=null,wid,hgt;
		t.context=null;
		t.width=0; t.height=0;
		t.antialias = true;
		function resize(ev) {
			if(!cnv || !cnv.getContext) return;
			t.width=wid=cnv.width=context.innerWidth||context.offsetWidth;
			t.height=hgt=cnv.height=context.innerHeight||context.offsetHeight;
			ctx=cnv.getContext(mode);
			if(!t.antialiasing) ctx.imageSmoothingEnabled = false;
			t.context=ctx;
			run("resize",wid,hgt,ev);
			t.redraw();
		}
		addListens(t,window,{
			resize:resize
		});
		
		t.update = function() {
			resize(null);
		}
		t.canvas = function(c,dims) {
			if(c===undefined) return cnv;
			cnv=c; mode=dims==3?"webgl":"2d"; resize();
		}
		t.stepclear = function() {t.clear()}
		t.clear = function(col) {
			if(!col) col = t.back;
			if(!col) ctx.clearRect(-1,-1,wid+2,hgt+2);
			else {
				ctx.fillStyle=col;
				ctx.fillRect(-1,-1,wid+2,hgt+2);
			}
		}
		t.redraw = function() {
			run("draw",ctx,wid,hgt);
		}
		t.back = null;
		
		var run = addHooks(t,{draw:[],resize:[]});
	};
	
	var Steps = function(context) {var t=this; if(!(t instanceof Steps)) throw "Bad instantiation of object nimble.Steps";
		context=context||window;
		var tm=null,fps=30,running=false;
		
		function step() {
			if(!running) return;
			run("step",fps);
			tm=window[requestAF](step);
		}
		t.enable = t.start = function(newfps) {
			if(tm!==null) return;
			if(+newfps===newfps) fps=Math.max(1,newfps);
			tm=window[requestAF](step);
			//tm=setInterval(step,1000/fps);
			running=true;
		}
		t.disable = t.stop = function() {
			if(tm===null) return;
			//clearInterval(tm); tm=null;
			window[cancelAF](tm); tm=null;
			running=false;
		}
		t.fps = function(newfps) {
			if(+newfps!==newfps) return fps;
			fps=Math.max(newfps);
		}
		
		var run = addHooks(t,{step:[]});
	};
	
	var Keyboard = function(context) {var t=this; if(!(t instanceof Keyboard)) throw "Bad instantiation of object nimble.Keyboard";
		context=context||window;
		var codes = (function(){ // generate codetable
			var tb={backspace:8,tab:9,numclear:12,enter:13,shift:16,control:17,alt:18,
				space:32,pageup:33,pagedown:34,end:35,home:36,left:37,up:38,right:39,down:40,
				pausebreak:19,capslock:20,escape:27,printscreen:44,insert:45,del:46,windows:91,
				numpad0:96,numpad1:97,numpad2:98,numpad3:99,numpad4:100,numpad5:101,numpad6:102,numpad7:103,numpad8:104,numpad9:105,
				multiply:106,add:107,subtract:109,decimal:110,divide:111,
				f1:112,f2:113,f3:114,f4:115,f5:116,f6:117,f7:118,f8:119,f9:120,f10:121,f11:122,f12:123,
				numlock:144,scrolllock:145,semicolon:186,colon:186,plus:187,equals:187,comma:188,lessthan:188,
				period:190,greaterthan:190,minus:189,underscore:189,slash:191,question:191,
				atilda:192,lbracket:219,rbracket:221,quote:222,backslash:220,verticalbar:220};
			for(var chrs="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",i=0;i<chrs.length;i++) tb[chrs[i]]=chrs.charCodeAt(i);
			return tb;
		})();
		var icodes={}; for(var i in codes) {t[i]=false; icodes[codes[i]]=i}
		
		t.codes = Object.create(codes);
		t.icodes = Object.create(icodes);
		t.pressed = {};
		t.released = {};
		
		addListens(t,context,{
			keydown:function(ev){
				var k=icodes[ev.which];
				if(t[k]) return;
				t[k]=true;
				if(t.steps) t.pressed[k]=true;
				run("down",ev.which,k,ev);
			},
			keyup:function(ev){
				var k=icodes[ev.which];
				t[k]=false;
				if(t.steps) t.released[k]=true;
				run("up",ev.which,k,ev);
			}
		});
		
		t.stepclear = function() {
			t.pressed={};
			t.released={};
		}
		t.steps = false;
		
		var run = addHooks(t,{down:[],up:[]});
	};
	
	var Mouse = function(context) {var t=this; if(!(t instanceof Mouse)) throw "Bad instantiation of object nimble.Mouse";
		context=context||window;
		var plockel = requestPL in context ? context : document.documentElement;
		
		var codes={left:1,middle:2,right:3};
		var icodes={}; for(var i in codes) {t[i]=false; icodes[codes[i]]=i}

		t.codes = Object.create(codes);
		t.icodes = Object.create(icodes);
		t.pressed = {};
		t.released = {};
		t.wheeldelta = {x:0,y:0,d:0};
		t.x = -10000;
		t.y = -10000;
		t.xdelta = 0;
		t.ydelta = 0;
		t.xwheel = 0;
		t.ywheel = 0;
		t.wheel = 0;
		
		var plock = false, plocked = false;
		t.pointerlock = function(pl) {
			if(!arguments.length) return plock;
			plock = !!pl;
			if(!plock && plocked) t.exitpointerlock();			
		}
		t.ispointerlocked = function() {
			return plocked;
		}
		t.exitpointerlock = function() {
			if(plocked) {
				plockel[exitPL]();
			}
		}
		
		var en1 = {}, en2 = {};
		t.enable = function() {
			en1.enable();
			en2.enable();
		}
		t.disable = function() {
			en1.disable();
			en2.disable();
		}
		t.isenabled = function() {
			return en1.isenabled();
		}
		;(function(){
			var o = {};
			o[PLchange] = function(){
				plocked = document[PLelement]==plockel;
			}
			o[PLerror] = function(){
				console.log("error obtaining pointerlock");
			}
			addListens(en1,document,o);
		})();
		
		addListens(en2,context,{
			mousedown:function(ev){
				if(plock && !plocked) plockel[requestPL]();
				var k=icodes[ev.which];
				t[k]=true;
				if(t.steps) t.pressed[k]=true;
				t.x=ev.clientX-(context.offsetLeft||0);
				t.y=ev.clientY-(context.offsetTop||0);
				run("down",ev.which,k,ev);
			},
			mouseup:function(ev){
				var k=icodes[ev.which];
				t[k]=false;
				if(t.steps) t.released[k]=true;
				t.x=ev.clientX-(context.offsetLeft||0);
				t.y=ev.clientY-(context.offsetTop||0);
				run("up",ev.which,k,ev);
			},
			mousemove:function(ev){
				t.x=ev.clientX-(context.offsetLeft||0);
				t.y=ev.clientY-(context.offsetTop||0);
				if(t.steps) {
					t.xdelta += +ev.movementX===ev.movementX ? ev.movementX
							: +ev.mozMovementX===ev.mozMovementX ? ev.mozMovementX
							: +ev.webkitMovementX===ev.webkitMovementX ? ev.webkitMovementX : 0;
					t.ydelta += +ev.movementY===ev.movementY ? ev.movementY
							: +ev.mozMovementY===ev.mozMovementY ? ev.mozMovementY
							: +ev.webkitMovementY===ev.webkitMovementY ? ev.webkitMovementY : 0;
				}
				run("move",t.x,t.y,ev);
			},
			wheel:function mousewheel(ev){
				if(browser == "firefox") {
					t.xwheel=-ev.deltaX*24;
					t.ywheel=-ev.deltaY*24;
					t.wheel=-ev.deltaY*24;
				} else {
					t.xwheel=ev.wheelDeltaX;
					t.ywheel=ev.wheelDeltaY;
					t.wheel=ev.wheelDelta;
				}
				
				t.wheeldelta.x+=t.xwheel;
				t.wheeldelta.y+=t.ywheel;
				t.wheeldelta.d+=t.wheel;
				
				run("wheel",t.wheel,t.xwheel,t.ywheel,ev);
			}
		});
		
		t.stepclear = function() {
			t.pressed={};
			t.released={};
			t.wheeldelta={x:0,y:0,d:0};
			t.xdelta = t.ydelta = 0;
		}
		t.steps = false;
		
		var run = addHooks(t,{wheel:[],down:[],up:[],move:[]});
	};
	
	var Touch = function(context) {var t=this; if(!(t instanceof Touch)) throw "Bad instantiation of object nimble.Touch";
		context=context||window;
		function Finger(x,y,id) {var tt=this;
			fingers[id] = tt;
			if(t.steps) t.pressed.push(tt);
			tt.x=x;tt.y=y; tt.identifier=id;
			tt.ended=false;
			tt._move = function(x,y) {tt.x=x; tt.y=y; run("move",tt.x,tt.y)}
			tt._end = function(x,y,canc) {tt.x=x; tt.y=y;
				delete fingers[id]; tt.ended=true;
				if(t.steps) t.released.push(tt); run("end",tt.x,tt.y,canc);
			}
			var run = addHooks(tt,{move:[],end:[]});
		}
		
		var fingers={};
		
		t.pressed = [];
		t.released = [];
		
		addListens(t,context,{
			touchstart:function(ev){
				ev.preventDefault();
				var X_=context.offsetLeft||0,Y_=context.offsetTop;
				for(var chg=ev.changedTouches,ls=[],l=chg.length,i=0;i<l;i++)
					ls.push(new Finger(chg[i].clientX-X_,chg[i].clientY-Y_,chg[i].identifier));
				run("start",ls,ev);
			},
			touchmove:function(ev){
				ev.preventDefault();
				var X_=context.offsetLeft||0,Y_=context.offsetTop;
				for(var chg=ev.changedTouches,ls=[],l=chg.length,i=0;i<l;i++) {
					ls.push(fingers[chg[i].identifier]);
					fingers[chg[i].identifier]._move(chg[i].clientX-X_,chg[i].clientY-Y_);
				}
				run("move",ls,ev);
			},
			touchend:function(ev){
				ev.preventDefault();
				var X_=context.offsetLeft||0,Y_=context.offsetTop;
				for(var chg=ev.changedTouches,ls=[],l=chg.length,i=0;i<l;i++) {
					ls.push(fingers[chg[i].identifier]);
					fingers[chg[i].identifier]._end(chg[i].clientX-X_,chg[i].clientY-Y_,false);
				}
				run("end",ls,false,ev);
			},
			touchcancel:function(ev){
				ev.preventDefault();
				var X_=context.offsetLeft||0,Y_=context.offsetTop;
				for(var chg=ev.changedTouches,ls=[],l=chg.length,i=0;i<l;i++) {
					ls.push(fingers[chg[i].identifier]);
					fingers[chg[i].identifier]._end(chg[i].clientX-X_,chg[i].clientY-Y_,true);
				}
				run("end",ls,true,ev);
			}
		});
		
		t.clear = function() {
			for(var i in fingers) fingers[i]._end(null,null,2);
		}
		
		t.stepclear = function() {
			t.pressed=[];
			t.released=[];
		}
		t.steps = false;
		
		var run = addHooks(t,{start:[],move:[],end:[]});
	};
	
	var Orientation = function(context) {var t=this; if(!(t instanceof Orientation)) throw "Bad instantiation of object nimble.Orientation";
		context=context||window;
		t.alpha=0; t.beta=0; t.gamma=0;
		t.xgrav=0; t.ygrav=0; t.zgrav=0;
		t.xacc=0; t.yacc=0; t.zacc=0;
		t.xorient = {x:0,y:0,z:0};
		t.yorient = {x:0,y:0,z:0};
		t.zorient = {x:0,y:0,z:0};
		t.xreal = {x:0,y:0,z:0};
		t.yreal = {x:0,y:0,z:0};
		t.zreal = {x:0,y:0,z:0};
		
		var dtr=Math.PI/180,cos=Math.cos,sin=Math.sin;
		
		addListens(t,context,{
			deviceorientation:function(ev){
				t.alpha=ev.alpha; t.beta=ev.beta; t.gamma=ev.gamma;
				var roll=t.alpha*dtr,ptch=t.beta*dtr,yaw=t.gamma*dtr;
				
				// calculate orientation base vectors
				var cr=cos(roll),sr=sin(roll),cp=cos(ptch),sp=sin(ptch),cy=cos(yaw),sy=sin(yaw);
				//console.log(cr,sr,cp,sp,cy,sy);
				t.xorient.x = cy*cp; t.yorient.x = cy*sp*sr-cr*sy; t.zorient.x = sy*sr+cy*cr*sp;
				t.xorient.y = cp*sy; t.yorient.y = cy*cr+sy*sp*sr; t.zorient.y = cr*sy*sp-cy*sr;
				t.xorient.z = -sp;   t.yorient.z = cp*sr;          t.zorient.z = cp*cr;
				// calculate reality base vectors
				sr=-sr; sp=-sp; sy=-sy;
				t.xreal.x = cp*cy;          t.yreal.x = -cp*sy;         t.zreal.x = sp;
				t.xreal.y = cr*sy+cy*sr*sp; t.yreal.y = cr*cy-sr*sp*sy; t.zreal.y = -cp*sr;
				t.xreal.z = sr*sy-cr*cy*sp; t.yreal.z = cy*sr+cr*sp*sy; t.zreal.z = cr*cp;
				run("rotate",t.alpha,t.beta,t.gamma,ev);
			},
			devicemotion:function(ev){
				var accg,acc;
				accg=ev.accelerationIncludingGravity;
				acc=ev.acceleration;
				if(acc.x===null && accg.x===null) return;
				if(accg.x===null)
					accg={x:acc.x+t.zreal.x*9.81,y:acc.y+t.zreal.y*9.81,z:acc.z+t.zreal.z*9.81};
				if(ev.acceleration.x===null)
					acc={x:accg.x-t.zreal.x*9.81,y:accg.y-t.zreal.y*9.81,z:accg.z-t.zreal.z*9.81};
				
				//acc.x=Math.sign(acc.x)*Math.max(Math.abs(acc.x)-0.2,0);
				//acc.y=Math.sign(acc.y)*Math.max(Math.abs(acc.y)-0.2,0);
				//acc.z=Math.sign(acc.z)*Math.max(Math.abs(acc.z)-0.2,0);
				
				t.xgrav=accg.x; t.ygrav=accg.y; t.zgrav=accg.z;
				t.xacc=acc.x; t.yacc=acc.y; t.zacc=acc.z;
				run("move",t.xacc,t.yacc,t.zacc,ev);
			}
		});
		t.stepclear = function() {}
		t.steps = false;
		
		var run = addHooks(t,{rotate:[],move:[]});
	};
	
	return {
		Canvas:Canvas,
		Steps:Steps,
		Keyboard:Keyboard,
		Mouse:Mouse,
		Touch:Touch,
		Orientation:Orientation
	};
})();