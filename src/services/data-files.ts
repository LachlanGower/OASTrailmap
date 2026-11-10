import { dump, load } from 'js-yaml';
import type { ImportKind } from './import-validation.js';
const fields:Partial<Record<ImportKind,string>>={requirements:'requirements',activities:'activities',schedule:'weeks',progress:'scoutRecords'};
export function encodeFile(kind:ImportKind,bundle:Record<string,unknown>,format:string):string {
  if(format==='json')return JSON.stringify(bundle,null,2);
  if(format==='yaml')return dump(bundle,{lineWidth:120,noRefs:true});
  const field=fields[kind];if(!field)throw new Error('Use JSON or YAML for full backups and trees.');
  const value=bundle[field];
  const values=field==='scoutRecords'?Object.entries(value as Record<string,unknown>):(value as Array<Record<string,unknown>>).map(x=>[x.id,x]);
  const rows=[['id','record_json'],['__oas_metadata__',JSON.stringify({type:kind,shell:{...bundle,[field]:field==='scoutRecords'?{}:[]}})],...values.map(([id,record])=>[String(id),JSON.stringify(record)])];
  return rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n')+'\r\n';
}
export function decodeFile(kind:ImportKind,text:string,name:string):unknown {
  if(!/\.csv$/i.test(name))return /\.json$/i.test(name)?JSON.parse(text):load(text);
  if(text.length>15000000)throw new Error('CSV exceeds 15 MB; use JSON.');
  const rows:string[][]=[],row:string[]=[];let value='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(value);value='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);if(row.some(x=>x!==''))rows.push([...row]);row.length=0;value='';}else value+=c;}
  if(quoted)throw new Error('Unclosed CSV quote.');if(value||row.length){row.push(value);rows.push(row);}
  if(rows[0]?.join('|')!=='id|record_json'||rows[1]?.[0]!=='__oas_metadata__')throw new Error('Expected OAS CSV header and metadata.');
  const meta=JSON.parse(rows[1][1]) as {type:string;shell:Record<string,unknown>};
  if(meta.type!==kind)throw new Error('CSV dataset does not match selected importer.');
  const field=fields[kind];if(!field)throw new Error('CSV unsupported for this dataset.');
  const out=meta.shell;if(!out||typeof out!=='object'||Array.isArray(out))throw new Error('Invalid CSV metadata.');
  out[field]=field==='scoutRecords'?{}:[];const ids=new Set<string>();
  for(const record of rows.slice(2)){if(record.length!==2)throw new Error('Malformed CSV row.');const [id,json]=record;if(!id||ids.has(id))throw new Error('Missing or duplicate CSV ID.');ids.add(id);const obj=JSON.parse(json) as Record<string,unknown>;if(field==='scoutRecords'){Object.defineProperty(out[field],id,{value:obj,enumerable:true,configurable:true,writable:true});}else{if(obj.id!==id)throw new Error('CSV row ID mismatch.');(out[field] as unknown[]).push(obj);}}
  return out;
}
export function downloadFile(name:string,text:string):void {const url=URL.createObjectURL(new Blob([text],{type:'application/octet-stream'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
