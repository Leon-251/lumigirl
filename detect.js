function faceCount(rgba,width,height){
  const pixels=new Uint8Array(width*height);
  for(let i=0;i<pixels.length;i++){
    const j=i*4;
    pixels[i]=(2*rgba[j]+7*rgba[j+1]+rgba[j+2])/10;
  }
  const cascade=pico.unpack_cascade(Int8Array.from(atob(self.faceCascade),c=>c.charCodeAt(0)));
  const boxes=pico.run_cascade({pixels,nrows:height,ncols:width,ldim:width},cascade,
    {shiftfactor:0.05,minsize:22,maxsize:Math.min(width,height),scalefactor:1.07});
  return pico.cluster_detections(boxes,0.2).filter(box=>box[3]>60).length;
}
if(typeof importScripts==="function"){
  importScripts("vendor/pico.js","vendor/facefinder.js");
  self.onmessage=({data})=>self.postMessage(faceCount(data.rgba,data.width,data.height));
}
