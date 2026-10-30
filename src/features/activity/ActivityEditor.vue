<script setup lang="ts">
import {computed,reactive} from 'vue';
export interface ActivityField {name:string;value:string}
export interface ActivityOption {value:string;label:string;description?:string}
export interface ActivityEditorModel {index:number;fields:ActivityField[];locations:string[];tags:ActivityOption[];coverage:ActivityOption[]}
const props=defineProps<{state:{current:ActivityEditorModel};update:(name:string,value:string)=>void;toggle:(name:string,value:string,checked:boolean)=>void;suggest:()=>void;save:()=>void;cancel:()=>void}>();
const model=computed(()=>props.state.current);
const fields=computed(()=>Object.fromEntries(model.value.fields.map(f=>[f.name,f.value])));
const multi=['equipment','preparation','instructions','safety','review'];
</script>
<template>
 <section class="studio-editor">
  <h3>{{ model.index>=0?'Edit':'Create' }} activity</h3>
  <form @submit.prevent="save">
   <label>Activity title<input name="title" required :value="fields.title" @input="update('title',($event.target as HTMLInputElement).value)"></label>
   <label>Description<textarea name="description" :value="fields.description" @input="update('description',($event.target as HTMLTextAreaElement).value)"></textarea></label>
   <label>Duration (minutes)<input name="duration" type="number" min="5" :value="fields.duration" @input="update('duration',($event.target as HTMLInputElement).value)"></label>
   <label>Location<select name="location" :value="fields.location" @change="update('location',($event.target as HTMLSelectElement).value)"><option v-for="loc in model.locations" :key="loc" :value="loc">{{ loc }}</option></select></label>
   <fieldset><legend>Tags</legend><div class="studio-tag-list"><label v-for="tag in model.tags" :key="tag.value"><input type="checkbox" name="tags" :value="tag.value" :checked="tag.label==='selected'" @change="toggle('tags',tag.value,($event.target as HTMLInputElement).checked)">{{ tag.value }}</label></div></fieldset>
   <label v-for="field in multi" :key="field">{{ field[0].toUpperCase()+field.slice(1) }}<textarea :name="field" rows="3" :value="fields[field]" @input="update(field,($event.target as HTMLTextAreaElement).value)"></textarea></label>
   <button class="button secondary" type="button" @click="suggest">Suggest coverage from tags + location</button>
   <fieldset><legend>Confirmed requirement coverage</legend><div class="studio-prereqs"><label v-for="req in model.coverage" :key="req.value"><input type="checkbox" name="covers" :value="req.value" :checked="req.label==='selected'" @change="toggle('covers',req.value,($event.target as HTMLInputElement).checked)">{{ req.description||req.value }}</label></div></fieldset>
   <button class="button primary" type="submit">Save activity locally</button>
   <button class="button secondary" type="button" @click="cancel">Cancel</button>
  </form>
 </section>
</template>
