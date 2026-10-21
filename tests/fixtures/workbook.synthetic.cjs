/* Purely fictional workbook cells, not derived from any Scout roster. */
'use strict';
function fakeWorkbook(){
 return {
  SheetNames:['Overview','Stage 1 - Camping (in progress)','Stage 2 - Bushcraft (in progress)'],
  Sheets:{
   Overview:{'!ref':'A1:B2',A1:{v:'Ignore this sheet'}},
   'Stage 1 - Camping (in progress)':{
    '!ref':'A1:D7',
    B1:{v:'Fictional Cub Pack'},
    B3:{v:'Stage 1 - Camping'},
    C4:{v:'Example Scout'},D4:{v:'Another Example'},
    A5:{v:'Plan'},B5:{v:'I know about the buddy system'},
    C5:{v:45000,s:{fill:{patternType:'solid',fgColor:{rgb:'FFFFAA00'}}}},
    D5:{s:{fill:{patternType:'solid',fgColor:{rgb:'FF34AA44'}}}},
    A6:{v:'Do'},B6:{v:'I can identify a synthetic shelter site.'},
    C6:{w:'19/10/2026',v:'19/10/2026'},
    D6:{v:'',s:{fill:{patternType:'none',fgColor:{rgb:'FF0000FF'}}}},
    B7:{v:'I know to stop when I get lost while camping.'},
    D7:{w:'2026-10-20',v:'2026-10-20'}
   },
   'Stage 2 - Bushcraft (in progress)':{
    '!ref':'A1:D5',
    C4:{v:'Example Scout'},D4:{v:'Another Example'},
    A5:{v:'Verify'},B5:{v:'Synthetic second-stage requirement.'},
    C5:{v:'21/10/2026',w:'21/10/2026'}
   }
  }
 };
}
function fakeSheetJs(){
 const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
 return {
  utils:{
   decode_range:ref=>{
    const [start,end]=ref.split(':');
    const parse=x=>({c:letters.indexOf(x.match(/[A-Z]+/)[0]),r:Number(x.match(/\d+/)[0])-1});
    return {s:parse(start),e:parse(end)};
   },
   encode_cell:({r,c})=>letters[c]+(r+1)
  },
  SSF:{parse_date_code:n=>n===45000?{y:2023,m:3,d:15}:null}
 };
}
module.exports={fakeWorkbook,fakeSheetJs};
