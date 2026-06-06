import { useState, useEffect, useCallback, useRef } from 'react';
export function useUndoRedo(initial) {
  const resolved = typeof initial === 'function' ? initial() : initial;
  const [hist, setHist] = useState([resolved]);
  const [cur, setCur] = useState(0);
  const ref = useRef({hist:[resolved],cur:0});
  useEffect(()=>{ref.current={hist,cur};},[hist,cur]);
  const state = hist[cur];
  const set = useCallback((v)=>{
    const {hist:h,cur:c}=ref.current;
    const next=typeof v==='function'?v(h[c]):v;
    const trimmed=h.slice(0,c+1);
    const bounded=trimmed.length>=60?trimmed.slice(1):trimmed;
    const nh=[...bounded,next];
    setHist(nh);
    setCur(nh.length-1);
  },[]);
  const undo=useCallback(()=>{
    const{cur:c}=ref.current;
    if(c>0) setCur(c-1);
  },[]);
  const redo=useCallback(()=>{
    const{hist:h,cur:c}=ref.current;
    if(c<h.length-1) setCur(c+1);
  },[]);
  useEffect(()=>{
    const fn=(e)=>{
      if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT') return;
      const mod=navigator.platform.toUpperCase().includes('MAC')?e.metaKey:e.ctrlKey;
      if(!mod) return;
      if(e.key==='z'&&!e.shiftKey){e.preventDefault();e.stopPropagation();undo();}
      else if((e.key==='z'&&e.shiftKey)||e.key==='y'){e.preventDefault();e.stopPropagation();redo();}
    };
    document.addEventListener('keydown',fn,true);
    return()=>document.removeEventListener('keydown',fn,true);
  },[undo,redo]);
  return{state,set,undo,redo,canUndo:cur>0,canRedo:cur<hist.length-1};
}

