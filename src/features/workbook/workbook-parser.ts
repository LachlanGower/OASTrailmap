/** 
 * Original Cub Pack workbook interpretation, extracted into a pure TypeScript
 * parser. Only SheetJS decodes XLSX bytes; this module neither reads storage
 * nor mutates the requirements/Scout data while a preview is being reviewed.
 */
export interface RequirementRow {
 id:string; stage:number; stream:string; text:string; workflow?:string;
 prerequisites?:string[]; suggested_links?:unknown[]; tags?:string[];
 source?:string; supplemental?:boolean; [key:string]:unknown;
}
export interface CellValue {
 v?:string|number|Date|null;
 w?:string;
 s?: {fill?:{patternType?:string;pattern?:string;fgColor?:{rgb?:string};bgColor?:{rgb?:string}}};
}
export interface SheetLike { [address:string]:CellValue|string|undefined; '!ref'?:string }
export interface WorkbookLike {SheetNames:string[]; Sheets:Record<string,SheetLike>}
export interface SpreadsheetDecoder {
 utils:{
  decode_range:(ref:string)=>{s:{r:number;c:number};e:{r:number;c:number}};
  encode_cell:(point:{r:number;c:number})=>string;
 };
 SSF?:{parse_date_code?:(value:number)=>{y:number;m:number;d:number}|null};
}
export interface ImportedRow {
 scout:string;id:string;completed:true;date:string;source:'workbook';
 sourceSheet:string;sourceRow:number;workflow:string;highlighted:boolean;
}
export interface UnmatchedRow {sheet:string;row:number;text:string;workflow:string}
export interface WorkbookPreviewData {
 rows:ImportedRow[];scouts:string[];unmatched:UnmatchedRow[];
 extraReqs:RequirementRow[];
 /** Apply these missing workflow tags only after user confirms the import. */
 workflows:Array<{id:string;workflow:string}>;
}
const normalize=(value:unknown):string=>String(value??'').toLowerCase().normalize('NFKD')
 .replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
function dateFromCell(cell:CellValue|undefined,decoder:SpreadsheetDecoder):string {
 if(!cell)return '';
 if(cell.v instanceof Date)return cell.v.toISOString().slice(0,10);
 if(typeof cell.v==='number'&&decoder.SSF?.parse_date_code){
  const date=decoder.SSF.parse_date_code(cell.v);
  if(date)return `${date.y}-${String(date.m).padStart(2,'0')}-${String(date.d).padStart(2,'0')}`;
 }
 const s=String(cell.w??cell.v??'').trim();if(!s)return '';
 let match=s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
 if(match)return `${match[3]}-${String(+match[2]).padStart(2,'0')}-${String(+match[1]).padStart(2,'0')}`;
 match=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
 return match?match[0]:'';
}
export function isHighlighted(cell:CellValue|undefined):boolean {
 const fill=cell?.s?.fill;
 if(!fill)return false;
 const pattern=fill.patternType||fill.pattern||'';
 if(!pattern||String(pattern).toLowerCase()==='none')return false;
 const color=fill.fgColor||fill.bgColor;
 if(!color)return false;
 const rgb=String(color.rgb||'').replace(/^FF/i,'').toUpperCase();
 return !['FFFFFF','FFFFF2','F2F2F2','000000',''].includes(rgb);
}
function findRequirement(requirements:readonly RequirementRow[],stage:number,stream:string,text:string):
 RequirementRow|undefined {
 const key=normalize(text);
 const exact=requirements.find(r=>r.stage===stage&&r.stream===stream&&normalize(r.text)===key);
 if(exact)return exact;
 const matches=requirements.filter(r=>r.stage===stage&&r.stream===stream&&
  (normalize(r.text).includes(key)||key.includes(normalize(r.text)))&&
  Math.min(normalize(r.text).length,key.length)/Math.max(normalize(r.text).length,key.length)>.86);
 return matches.length===1?matches[0]:undefined;
}
export function parseCubWorkbook(wb:WorkbookLike,decoder:SpreadsheetDecoder,
 requirements:readonly RequirementRow[]):WorkbookPreviewData {
 if(!wb||!Array.isArray(wb.SheetNames)||!wb.Sheets)throw new Error('Not a valid workbook');
 const rows:ImportedRow[]=[],scoutNames=new Set<string>(),unmatched:UnmatchedRow[]=[];
 const extraReqs:RequirementRow[]=[],workflows:Array<{id:string;workflow:string}>=[];
 for(const sheetName of wb.SheetNames){
  const match=sheetName.match(/Stage\s*(\d).*?(Camping|Bushwalking|Bushcraft)/i);
  if(!match)continue;
  const stage=+match[1],stream=match[2].replace(/^./,char=>char.toUpperCase());
  const sheet=wb.Sheets[sheetName];if(!sheet)continue;
  const range=decoder.utils.decode_range(sheet['!ref']||'A1:A1');
  const cell=(row:number,col:number):CellValue|undefined=>{
   const value=sheet[decoder.utils.encode_cell({r:row,c:col})];
   return typeof value==='object'&&value!==null?value as CellValue:undefined;
  };
  let headerRow=-1;
  for(let row=range.s.r;row<=Math.min(range.e.r,12);row++){
   let count=0;
   for(let col=2;col<=range.e.c;col++){
    const value=cell(row,col)?.v;
    if(typeof value==='string'&&value.trim()&&
      !/stage|cub pack|in progress|1st hoppers/i.test(value.toLowerCase()))count++;
   }
   if(count>=2){headerRow=row;break;}
  }
  if(headerRow<0)continue;
  const roster:Array<{col:number;name:string}>=[];
  for(let col=2;col<=range.e.c;col++){
   const value=cell(headerRow,col)?.v;
   if(typeof value==='string'&&value.trim()){
    roster.push({col,name:value.trim()});scoutNames.add(value.trim());
   }
  }
  let workflow='Plan';
  for(let row=headerRow+1;row<=range.e.r;row++){
   const stageValue=String(cell(row,0)?.v??'').trim();
   const text=String(cell(row,1)?.v??'').trim();
   if(['Plan','Do','Review','Verify'].includes(stageValue))workflow=stageValue;
   if(!text)continue;
   let req=findRequirement(requirements,stage,stream,text);
   if(!req){
    const id=`s${stage}-${stream.toLowerCase()}-${normalize(text).replace(/[^a-z0-9]+/g,'-').slice(0,48)}`;
    req={id,stage,stream,text,workflow,prerequisites:[],suggested_links:[],tags:[],
     source:`${sheetName} · row ${row+1}`,supplemental:true};
    extraReqs.push(req);
    unmatched.push({sheet:sheetName,row:row+1,text,workflow});
   } else if(!req.workflow){
    workflows.push({id:req.id,workflow});
   }
   for(const scout of roster){
    const value=cell(row,scout.col);if(!value)continue;
    const date=dateFromCell(value,decoder),highlighted=isHighlighted(value);
    if(date||highlighted)rows.push({
     scout:scout.name,id:req.id,completed:true,date,source:'workbook',
     sourceSheet:sheetName,sourceRow:row+1,workflow,highlighted:!!highlighted
    });
   }
  }
 }
 return {rows,scouts:[...scoutNames].sort(),unmatched,extraReqs,workflows};
}
export function validateWorkbookPreview(parsed:WorkbookPreviewData):WorkbookPreviewData {
 if(!parsed.scouts.length)throw new Error('No Scout roster found. Check that this is an OAS progress workbook.');
 return parsed;
}
export function uniqueEvidencePairs(rows:readonly ImportedRow[]):number {
 return new Set(rows.map(r=>r.scout+'::'+r.id)).size;
}
