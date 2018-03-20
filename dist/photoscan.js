!function(t){function e(o){if(r[o])return r[o].exports;var a=r[o]={i:o,l:!1,exports:{}};return t[o].call(a.exports,a,a.exports,e),a.l=!0,a.exports}var r={};e.m=t,e.c=r,e.d=function(t,r,o){e.o(t,r)||Object.defineProperty(t,r,{configurable:!1,enumerable:!0,get:o})},e.n=function(t){var r=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(r,"a",r),r},e.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},e.p="dist/",e(e.s=20)}({20:function(t,e,r){t.exports=r(21)},21:function(t,e,r){"use strict";function o(t){if(Array.isArray(t)){for(var e=0,r=Array(t.length);e<t.length;e++)r[e]=t[e];return r}return Array.from(t)}function a(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function n(t){for(var e=0,r=1/0,o=-1/0,a=1/0,n=void 0,i=void 0,s=void 0,l=void 0,h=0;h<t.length;h+=1){var u=t[h],c=u[0]+u[1],d=u[0]-u[1];c>e&&(e=c,n=h),c<r&&(r=c,i=h),d>o&&(o=d,s=h),d<a&&(a=d,l=h)}return[t[i],t[s],t[n],t[l]]}function i(t){var e,r=(e=[]).concat.apply(e,o(t));return r.some(Array.isArray)?i(r):r}function s(t,e,r){var o=n(r),a=h(o,4),s=a[0],l=a[1],u=a[2],c=a[3],d=Math.sqrt(Math.pow(u[0]-c[0],2)+Math.pow(u[1]-c[1],2)),v=Math.sqrt(Math.pow(l[0]-s[0],2)+Math.pow(l[1]-s[1],2)),g=Math.max(Math.floor(d),Math.floor(v)),f=Math.sqrt(Math.pow(l[0]-u[0],2)+Math.pow(l[1]-u[1],2)),w=Math.sqrt(Math.pow(s[0]-c[0],2)+Math.pow(s[1]-c[1],2)),p=Math.max(Math.floor(f),Math.floor(w)),M=[[0,0],[g-1,0],[g-1,p-1],[0,p-1]],y=t.matFromArray(4,1,t.CV_32FC2,i(o)),m=t.matFromArray(4,1,t.CV_32FC2,i(M)),C=t.getPerspectiveTransform(y,m),b=new t.Size(e.cols,e.rows),A=new t.Mat;return t.warpPerspective(e,A,C,b,t.INTER_LINEAR,t.BORDER_CONSTANT,new t.Scalar),y.delete(),m.delete(),C.delete(),{warped:A,width:g,height:p}}function l(t,e,r){var o=null,a=e.cols,n=e.rows;if(void 0===r.width&&void 0===r.height)return e;if(void 0===r.width){var i=r.height/n;o=[Math.floor(a*i),r.height]}else{var s=r.width/a;o=[r.width,Math.floor(n*s)]}var l=new t.Size(o[0],o[1]),h=new t.Mat;return t.resize(e,h,l,0,0,t.INTER_AREA),h}Object.defineProperty(e,"__esModule",{value:!0});var h=function(){function t(t,e){var r=[],o=!0,a=!1,n=void 0;try{for(var i,s=t[Symbol.iterator]();!(o=(i=s.next()).done)&&(r.push(i.value),!e||r.length!==e);o=!0);}catch(t){a=!0,n=t}finally{try{!o&&s.return&&s.return()}finally{if(a)throw n}}return r}return function(e,r){if(Array.isArray(e))return e;if(Symbol.iterator in Object(e))return t(e,r);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),u=function(){function t(t,e){for(var r=0;r<e.length;r++){var o=e[r];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(t,o.key,o)}}return function(e,r,o){return r&&t(e.prototype,r),o&&t(e,o),e}}(),c=[255,0,0,0],d={A4:[210,297]},v=function(){function t(e,r){a(this,t),this.cv=e,this.options=r,this.debug=!!this.options.logCallback}return u(t,[{key:"logProgress",value:function(t,e,r){if(this.logCount+=1,this.options.progressCallback&&this.options.progressCallback({progress:Math.floor(this.logCount/10*100),message:e,points:r}),this.options.logCallback&&t){var o=this.toImageData(t);this.options.logCallback({progress:Math.floor(this.logCount/10*100),message:e,width:t.cols,height:t.rows,imageData:o})}}},{key:"toImageData",value:function(t){var e=this.cv,r=new e.Mat,o=t.type()%8,a=o<=e.CV_8S?1:o<=e.CV_32S?1/256:255,n=o===e.CV_8S||o===e.CV_16S?128:0;switch(t.convertTo(r,e.CV_8U,a,n),r.type()){case e.CV_8UC1:e.cvtColor(r,r,e.COLOR_GRAY2RGBA);break;case e.CV_8UC3:e.cvtColor(r,r,e.COLOR_RGB2RGBA);break;case e.CV_8UC4:break;default:throw new Error("Bad number of channels (Source image must have 1, 3 or 4 channels)")}return new ImageData(new Uint8ClampedArray(r.data),r.cols,r.rows)}},{key:"resize",value:function(t,e){return l(this.cv,t,e)}},{key:"prepareImage",value:function(t){var e=this.cv,r=new this.cv.Mat,o=new this.cv.Mat,a=new this.cv.Mat,n={gaussianBlurSize:5,cannyThreshold1:145,cannyThreshold2:310,cannyApertureSize:5,cannyL2Gradient:!1};return e.cvtColor(t,r,e.COLOR_RGBA2GRAY),this.logProgress(r,"Gray"),e.GaussianBlur(r,o,{width:n.gaussianBlurSize,height:n.gaussianBlurSize},0,0,e.BORDER_DEFAULT),this.logProgress(o,"Blurred"),e.Canny(o,a,n.cannyThreshold1,n.cannyThreshold2,n.cannyApertureSize,n.cannyL2Gradient),this.logProgress(a,"Edge detection"),r.delete(),a}},{key:"getPoints",value:function(t,e){function r(t,e){return t.val<e.val?1:t.val>e.val?-1:0}var o=this.cv,a={contoursMode:o.RETR_TREE,contoursMethod:o.CHAIN_APPROX_SIMPLE},n=new o.MatVector,i=new o.Mat;o.findContours(t,n,i,Number(a.contoursMode),Number(a.contoursMethod),{x:0,y:0});var s=[],l=void 0;this.debug&&(l=o.Mat.zeros(t.rows,t.cols,o.CV_8UC3));for(var h=0;h<n.size();++h){this.debug&&o.drawContours(l,n,h,c,1,o.LINE_8,i);var u=o.contourArea(n.get(h));s.push({val:u,index:h}),s.sort(r),s=s.slice(0,3)}this.debug&&(this.logProgress(l,"all contours"),l.delete());var d=void 0;this.debug&&(d=o.Mat.zeros(t.rows,t.cols,o.CV_8UC3));var v=void 0,g=null,f=!0,w=!1,p=void 0;try{for(var M,y=s[Symbol.iterator]();!(f=(M=y.next()).done);f=!0){var m=M.value,C=n.get(m.index);this.debug&&o.drawContours(d,n,m.index,c,1,o.LINE_8,i);var b=new o.Mat,A=o.arcLength(C,!0);if(o.approxPolyDP(C,b,.02*A,!0),console.log(m.index,b.rows),C.delete(),4===b.rows){v=b,g=m.index;break}}}catch(t){w=!0,p=t}finally{try{!f&&y.return&&y.return()}finally{if(w)throw p}}if(this.debug&&(this.logProgress(d,"top contours"),d.delete()),n.delete(),i.delete(),null===g){var _=new o.Mat,P=Math.floor(.5*(t.rows?e:t.cols));o.HoughLinesP(t,_,1,Math.PI/360,60,P,30);for(var R=0,S=0,E=1/0,k=1/0,x=1/0,O=1/0,z=0,B=0,I=0;I<_.rows;++I){var T=[_.data32S[4*I],_.data32S[4*I+1]],L=[_.data32S[4*I+2],_.data32S[4*I+3]];if(Math.abs(T[0]-L[0])>Math.abs(T[1]-L[1])){var V=void 0,D=void 0;T[0]<L[0]?(V=T[1],D=L[1]):(V=L[1],D=T[1]),O=Math.min(O,V),x=Math.min(x,D),z=Math.max(z,V),B=Math.max(B,D)}else{var G=void 0,N=void 0;T[1]<L[1]?(G=T[0],N=L[0]):(G=L[0],N=T[0]),R=Math.max(R,G),S=Math.max(S,N),E=Math.min(E,G),k=Math.min(k,N)}}if(this.debug){for(var U=o.Mat.zeros(t.rows,t.cols,o.CV_8UC3),F=0;F<_.rows;++F){var j=new o.Point(_.data32S[4*F],_.data32S[4*F+1]),q=new o.Point(_.data32S[4*F+2],_.data32S[4*F+3]);o.line(U,j,q,[Math.floor(255*Math.random()),255,Math.floor(255*Math.random()),0])}this.logProgress(U,"Fall back lines!"),U.delete()}_.delete();var H=[[E,O],[R,x],[S,B],[k,z]];return t.delete(),H}t.delete(),console.log(v);var W=v.data32S;return[[W[0],W[1]],[W[2],W[3]],[W[4],W[5]],[W[6],W[7]]]}},{key:"crop",value:function(t,e,r){var o=this.cv,a=t.size(),n=new o.Rect(0,0,Math.min(a.width,e),Math.min(a.height,r));console.log(n,t.size(),t.cols,t.rows);var i=o.Mat.zeros(n.width,n.height,o.CV_8UC3);return i=t.roi(n),this.logProgress(i,"Cropped"),i}},{key:"fillEdge",value:function(t,e,r,o,a,n,i,s){s=s||10;for(var l=!0,h=0;l&&h<s;){for(l=!1;e<t.cols&&r<t.rows&&e>=0&&r>=0;){var u=r*t.cols+e;t.data[u]<255&&(l=!0,t.data[u]=255),e+=o,r+=a}e+=n,r+=i,h+=1}}},{key:"makeBlackWhite",value:function(t){var e=this.cv;e.cvtColor(t,t,e.COLOR_RGBA2GRAY,0);var r=new e.Mat;return e.GaussianBlur(t,r,{width:0,height:0},3,0,e.BORDER_DEFAULT),e.addWeighted(t,1.5,r,-.5,0,r,-1),e.threshold(r,r,150,255,e.THRESH_BINARY),this.logProgress(r,"Thresholded"),this.fillEdge(r,r.cols-1,0,0,1,-1,-r.rows),this.fillEdge(r,0,0,1,0,-r.cols,1),this.fillEdge(r,0,r.rows-1,1,0,-r.cols,-1),this.fillEdge(r,0,0,0,1,1,-r.rows),this.logProgress(r,"Edge clean"),r}},{key:"process",value:function(t,e,r,o){var a=this.cv;this.logCount=0;var n=a.matFromImageData(t);t=null;var i=!1;e>r&&(i=!0);var l=void 0,h=void 0;i?(h={width:800},l=n.cols/800):(h={height:800},l=n.rows/800);var u=this.resize(n,h),v=this.prepareImage(u),g=this.getPoints(v,i);if(u.delete(),console.log(g),g=g.map(function(t){return[t[0]*l,t[1]*l]}),console.log(l,g),this.logProgress(null,"points",g),this.debug){for(var f=n.clone(),w=0;w<g.length;w++)a.line(f,new a.Point(g[w][0],g[w][1]),new a.Point(g[(w+1)%4][0],g[(w+1)%4][1]),c,10,a.LINE_AA,0);this.logProgress(f,"annotated"),f.delete()}var p=s(a,n,g),M=p.warped;this.logProgress(M,"Warped");var y=this.crop(M,p.width,p.height);this.logProgress(y,"Cropped"),M.delete(),o.blackwhite&&(y=this.makeBlackWhite(y));var m=d.A4;h=i?{width:Math.floor(1/25.4*150*m[1])}:{width:Math.floor(1/25.4*150*m[0])};var C=this.resize(y,h);y.delete(),t=this.toImageData(C);var b={imageData:t,width:C.cols,height:C.rows};return C.delete(),b}}]),t}();e.default=v}});
//# sourceMappingURL=photoscan.js.map