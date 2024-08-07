 // GlobalLight jest zmienna ktora przechowuje value układów kolorow i zmienia sie gdy owa wartosc sie zmieni
 let globalLight;
 let mode = "Triady";
 let touchscreen = false;
 let canvasMap;
 if ("ontouchstart" in document.documentElement)
     touchscreen = true;
 if (touchscreen)
     document.getElementById("ColorWheelFull").innerHTML = '<canvas id="gradient" width="40" height="320"></canvas><canvas id="colorWheel" width="320" height="320"></canvas>';
 else
     canvasMap = document.getElementById("colorWheelMap");
 // Na urzadzeniach dotykowych okrągły tag map przysłania koło kolorow (jest on potrzebny tylko na kompueterach)
 let canvas = document.getElementById("colorWheel");
 let canvasSlider = document.getElementById("gradient");
 let ctx = canvas.getContext('2d');
 let sliderCtx = canvasSlider.getContext('2d');
 // Klasa konwersji kolorów
 ColorsConvert = class {
     // Funkcja przyjmuje wartosc HEX koloru (#FFFFFF) i oddaje obiekt RGB (R: 255, G: 255, B: 255)
     static HEX2RGB(HEX)
     {
         try {
             if(HEX.length != 7) throw "HEX value is of improper length";
             if(HEX[0] != '#') throw "HEX is coded improperly - missing #";
             let RGB = {R: HEX.slice(1,3), G: HEX.slice(3,5), B: HEX.slice(5,7)};
             if(!RGB.R.match(/[0-9a-f]+$/i) || !RGB.B.match(/[0-9a-f]+$/i) || !RGB.G.match(/[0-9a-f]+$/i)) throw "HEX is coded improperly - not a HEX number";
             RGB.R = parseInt(RGB.R,16);
             RGB.G = parseInt(RGB.G,16);
             RGB.B = parseInt(RGB.B,16);
             return RGB;
         }
         catch(err) {
             console.error("Error HEX2RGB: " + err + ".");
         }

     }
     // Funkcja przyjmuje obiekt wartosci RGB kolorow (R: 255, G: 255, B: 255) i oddaje obiekt HSV (H: 360, S: 0, V: 1)
     static RGB2HSV(RGB)
     {
         try {
             if(RGB.R == NaN || RGB.G == NaN || RGB.B == NaN) throw "Invalid or non-numerical data stored in RGB";
             let R = RGB.R/255;
             let G = RGB.G/255;
             let B = RGB.B/255;
             if(R > 1 || G > 1 || B > 1 || R < 0 || G < 0 || B < 0 ) throw "Numerical data in RGB is out of optimal range [0-255]";
             let Cmax = Math.max(R,G,B);
             let Cmin = Math.min(R,G,B);
             let Del = Cmax - Cmin;
             let HUE = 0;
             if (Del!=0)
             {
                 if (Cmax==R)
                     HUE = 60*(((G-B)/Del)%6);
                 else if (Cmax==G)
                     HUE = 60*((B-R)/Del+2);
                 else if (Cmax == B)
                     HUE = 60*((R-G)/Del+4);
             }
             // Przybliżenie wartosci do int i poprawka nad wartosciami spoza zakresu <0,360>
             HUE = Math.round(HUE);
             HUE = (HUE + 360) % 360;
             let SAT = 0;
             if (Cmax !=0)
                 SAT = Del/Cmax;
             let VAL = Cmax;
             return {Hue : HUE, Sat : SAT, Val : VAL};
         }
         catch(err) {
             console.error("Error RGB2HSV: " + err + ".");
         }
     }
     // Funkcja przyjmuje obiekt wartosci HSV kolorow (H: 360, S: 0, V: 1) i oddaje obiekt koła kolorów (H:360, S: 0, V: 1)
     static HSV2CWH(HSV)
     {
         try {
             if(HSV.Hue == NaN || HSV.Sat == NaN || HSV.Val == NaN) throw "Invalid or non-numerical data stored in HSV";
             let H = HSV.Hue;
             if(H > 360 || H < 0) throw "HSV hue is coded out of optimal range [0:360]";
             if (H<=60)
                 H=H*2;
             else if (H>60 && H<=120)
                 H = parseFloat(H) + 60;
             else if (H>120 &&  H<=240)
                 H = 180 + (H-120)*3/4;
             else if (H>240 && H<=300)
                 H = parseFloat(H) + 30;
             else if (H>300 && H<360)
                 H = 330 + (H-300)/2;
             return {Hue: H, Sat: HSV.Sat, Val: HSV.Val}
         }
         catch(err) {
             console.error("Error HSV2CWH: " + err + ".");
         }
     }
     // Funkcja przyjmuje obiekt wartosci kola kolorow kolorow (H: 360, S: 0, V: 1) i oddaje obiekt HSV (H:360, S: 0, V: 1)
     static CWH2HSV(CWH)
     {
         try {
             if(CWH.Hue == NaN || CWH.Sat == NaN || CWH.Val == NaN) throw "Invalid or non-numerical data stored in CWH";
             let H = CWH.Hue;
             if(H > 360 || H < 0) throw "CWH hue is coded out of optimal range [0:360]";
             if (H<=120)
                 H = H/2;
             else if (H>120 && H<=180)
                 H = H - 60;
             else if (H>180 && H<=270)
                 H = 120 + (H-180)*1.333;
             else if (H>270 && H<=330)
                 H = H - 30;
             else if (H>330 && H<360)
                 H = 300 + (H-330)*2;
             return {Hue: H, Sat: CWH.Sat, Val: CWH.Val}
         }
         catch(err) {
             console.error("Error CWH2HSV: " + err + ".");
         }
     }
     // Funkcja przyjmuje obiekt wartosci HSV kolorow (H: 360, S: 0, V: 1) i oddaje obiekt HEX kolorów (#FFFFFF)
     static HSV2HEX(HSV)
     {
         let C = HSV.Val * HSV.Sat;
         let X = C*(1- Math.abs((HSV.Hue/60)%2-1));
         let m = HSV.Val - C;
         let RGB;
         if (HSV.Hue>=0 && HSV.Hue < 60)
             RGB = {R: C, G: X, B: 0};
         else if (HSV.Hue>=60 && HSV.Hue < 120)
             RGB = {R: X, G: C, B: 0};
         else if (HSV.Hue>=120 && HSV.Hue < 180)
             RGB = {R: 0, G: C, B: X};
         else if (HSV.Hue>=180 && HSV.Hue < 240)
             RGB = {R: 0, G: X, B: C};
         else if (HSV.Hue>=240 && HSV.Hue < 300)
             RGB = {R: X, G: 0, B: C};
         else if (HSV.Hue>=300 && HSV.Hue < 360)
             RGB = {R: C, G: 0, B: X};
         RGB = {R: parseInt(255*(RGB.R+m)), G: parseInt(255*(RGB.G+m)), B: parseInt(255*(RGB.B+m))};
         let hex = "#";
         for (let i in RGB)
             {
                 let temp;
                 if (RGB[i]<16)
                     temp = "0" + RGB[i].toString(16);
                 else
                     temp = RGB[i].toString(16);
                 hex += temp;
             }
         return hex;
     }
 }
 // Klasa obsługi koła barw
 class ColorWheel
 {
     static cordsToHEX(x,y)
     {
         let center = 160;
         let X = x-center;
         let Y = -1*(y-center);
         let radius = Math.sqrt(Math.pow(X,2) + Math.pow(Y,2));
         if (radius<=150)
         {
             let hue;
             let val
             let sat;
             let degs = Math.acos(X/radius);
             if (Y<0)
                 hue = parseFloat((2*Math.PI - degs)/Math.PI*180);
             else
                 hue = parseFloat(degs/Math.PI*180);
             val = globalLight;
             sat = parseFloat(radius/150);
             let cwh = {Hue: hue,Sat: sat,Val: val};
             let hsv = ColorsConvert.CWH2HSV(cwh);
             let hex = ColorsConvert.HSV2HEX(hsv)
             return hex;
         }
     }
     static adjustWheelColorValue(HSV)
     {
         ctx.beginPath();
         ctx.arc(160,160,151,0,2*Math.PI);
         let alpha = 1 - HSV.Val;
         ctx.fillStyle = "rgba(0,0,0," + alpha +  ")";
         ctx.fill();
         globalLight = HSV.Val;
     }
     static drawPoint(ColorWheel, i)
     {
         let HEX = ColorsConvert.HSV2HEX(ColorsConvert.CWH2HSV(ColorWheel));
         let center = {x: 160, y: 160};
         let radius = 150*ColorWheel.Sat;
         let cords = {x: center.x + radius*Math.cos(ColorWheel.Hue*Math.PI/180), y: center.y - radius*Math.sin(ColorWheel.Hue*Math.PI/180)};
         ctx.beginPath();
         ctx.arc(cords.x,cords.y,5,0,2*Math.PI);
         ctx.fillStyle = HEX;
         ctx.fill();
         ctx.lineWidth = 3;
         ctx.stroke();
         document.getElementById("colors" + i).style.backgroundColor = HEX; 
         document.getElementById("colors" + i).setAttribute("name",HEX);
     }
     static spreadPoints(mainHEX, degs, nums,center)
     {
         let mainHSV = ColorsConvert.RGB2HSV(ColorsConvert.HEX2RGB(mainHEX));
         ColorWheel.adjustWheelColorValue(mainHSV);
         let colorWheelHSV = ColorsConvert.HSV2CWH(mainHSV);
         let start = 0;
         let end = nums-1;
         document.getElementById("colors").innerHTML = "";
         if (center)
         {
             start = -parseInt(nums/2);
             end = parseInt(nums/2);
         }
         for (let i = start; i<=end; i++)
         {
             let tempHue = colorWheelHSV.Hue + i*degs;
             tempHue = (tempHue + 360) % 360;
             document.getElementById("colors").innerHTML += ("<div class='pal' name='nienawidzeKurwaJS' onclick='changeMainPal(" + (i-start) + ")' id='colors" + (i-start) + "' ></div>");
             if (i==0)
                 document.getElementById("colors" + (i-start)).style.transform = "scale(1.1)";
             ColorWheel.drawPoint({Hue: tempHue, Sat: colorWheelHSV.Sat, Val: colorWheelHSV.Val}, i-start);
         }
     }
     static draw()
     {
         let pickedColor = document.getElementById("pick").value;
         let img = new Image();
         img.onload = () => {
             ctx.rect(0,0,320,320)
             ctx.fillStyle = "white";
             ctx.fill();
             ctx.drawImage(img, 10, 10);
             if (mode=="Triady")
                 ColorWheel.spreadPoints(pickedColor, 120, 3, true);
             else if (mode=="Uzupelniajace")
                 ColorWheel.spreadPoints(pickedColor, 150, 3, true);
             else if (mode=="Kwadrat")
                 ColorWheel.spreadPoints(pickedColor, 90, 4, false);
             else if (mode=="Analogiczne")
                 ColorWheel.spreadPoints(pickedColor, 30, 3, true);
         }
         img.src = "wheel.png";
         let img1 = new Image();
         img1.onload = () => {
             sliderCtx.rect(0,0,40,320);
             let tempColor = ColorsConvert.RGB2HSV(ColorsConvert.HEX2RGB(pickedColor));
             tempColor.Val = 1;
             tempColor = ColorsConvert.HSV2HEX(tempColor);
             sliderCtx.fillStyle = tempColor;
             sliderCtx.fill();
             sliderCtx.drawImage(img1, 0, 0);
             let height = (1-globalLight)*320;
             sliderCtx.beginPath();
             sliderCtx.rect(0,height,40,4);
             sliderCtx.fillStyle = 'black';
             sliderCtx.fill();
             sliderCtx.beginPath();
             sliderCtx.rect(1,height+1,38,2);
             sliderCtx.fillStyle = 'white';
             sliderCtx.fill();
         }
         img1.src = "gradient.png";
     }
 }
 function update()
 {
     ColorWheel.draw();
     document.getElementById("colorHEX").innerHTML= document.getElementById("pick").value;
 }
 function start()
 {
     document.getElementById('pick').addEventListener('input', function() {update()} );
     let mouse = false;
     let mouse1 = false;
     ['mousedown', 'touchstart'].forEach(function(e) { 
         if (!touchscreen)
             (canvasMap.addEventListener(e, (event)=>{ mouse = true; }, false,));
         else 
             (canvas.addEventListener(e, (event)=>{ mouse = true; }, false,));});
     ['mouseup', 'touchend', 'touchcancel'].forEach(function(e) { 
         if (!touchscreen)
             (canvasMap.addEventListener(e, (event)=>{ mouse = false; }, false,));
         else 
             (canvas.addEventListener(e, (event)=>{ mouse = false; }, false,));});
     ['mousemove', 'touchmove'].forEach(function(e) {
     if (!touchscreen)
         canvasMap.addEventListener(e, (event)=>
         {
             if (mouse==true)
             {
                 let mouseX = event.offsetX;
                 let mouseY = event.offsetY;
                 let radius = Math.sqrt(Math.pow(mouseX-160,2) + Math.pow(mouseY-160,2));
                 if (mouseX>10&&mouseY>10&&mouseY<310&&mouseX<310&&radius<150)
                 {
                     let HEX = ColorWheel.cordsToHEX(mouseX,mouseY);
                     document.getElementById("pick").value = HEX;
                     update();
                 }
                 else if (mouseX<5 || mouseY<5 || mouseX>315 || mouseY>315)
                     mouse = false;

             }
         }
         , false,);
     else if (touchscreen)
         canvas.addEventListener(e, (event)=>
         {
             if (mouse==true)
             {
                 let bcr = event.target.getBoundingClientRect();
                 let mouseX = event.targetTouches[0].clientX - bcr.x;
                 let mouseY = event.targetTouches[0].clientY - bcr.y;
                 let radius = Math.sqrt(Math.pow(mouseX-160,2) + Math.pow(mouseY-160,2));
                 if (mouseX>10&&mouseY>10&&mouseY<310&&mouseX<310&&radius<150)
                 {
                     let HEX = ColorWheel.cordsToHEX(mouseX,mouseY);
                     document.getElementById("pick").value = HEX;
                     update();
                 }
                 else if (mouseX<5 || mouseY<5 || mouseX>315 || mouseY>315)
                     mouse = false;
             }
         }
         , false,);
     });
     ['mousedown', 'touchstart'].forEach(function(e) { canvasSlider.addEventListener(e, (event)=> { mouse1 = true; }, false,);});
     ['mouseup', 'touchend', 'touchcancel'].forEach(function(e) { canvasSlider.addEventListener(e, (event)=> { mouse1 = false; }, false,);});
     ['mousemove', 'touchmove'].forEach(function(e) { canvasSlider.addEventListener(e, (event)=>
     {
         if (mouse1)
         {
             let mouseY;
             let mouseX;
             if (touchscreen)
             {
                 let bcr = event.target.getBoundingClientRect();
                 mouseY = event.targetTouches[0].clientY - bcr.y;
                 mouseX = event.targetTouches[0].clientX - bcr.x;
             }
             else
             {
                 mouseY = event.offsetY;
                 mouseX = event.offsetX;
             }
             if (mouseY>320 || mouseY < 0 || mouseX<5 || mouseX>35)
                 mouse1 = false;
             let Value = 1 - mouseY/320;
             let hex = document.getElementById("pick").value;
             let hsv = ColorsConvert.RGB2HSV(ColorsConvert.HEX2RGB(hex));
             let newHSV = {Hue: hsv.Hue, Sat: hsv.Sat, Val: Value}
             hex = ColorsConvert.HSV2HEX(newHSV);
             document.getElementById("pick").value = hex;
             globalLight=Value;
             update();
         }
     }
     , false,);});
     update();
 }
 function changeMode(modeName)
 {
     mode = modeName;
     update();
 }
 function changeMainPal(num)
 {
     temp = document.getElementById("colors" + num);
     document.getElementById("pick").value = temp.getAttribute("name");
     for (let i =0; i<temp.parentNode.children.length;i++)
         document.getElementById("colors" + i).style.transform = "scale(1.0)";
     temp.style.transform = "scale(1.1)";
     document.getElementById("colorHEX").innerHTML = document.getElementById("pick").value;
 }
 function losuj()
 {
     let randH = Math.floor(Math.random() * 360);
     let randS = Math.floor(Math.random()*1000)/1000;
     let mainHSV = {Hue: randH, Sat: randS, Val: globalLight}
     let HEX = ColorsConvert.HSV2HEX(mainHSV);
     document.getElementById("pick").value = HEX;
     update();
 }
 requestAnimationFrame(start);