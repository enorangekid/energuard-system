const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('path').join(__dirname,'../../../js/pricing-check-test.js'),'utf8');
const start=source.indexOf('  function mappingMatchesCategory(');
const end=source.indexOf('  function compareExtensionVersions(',start);
const context={};
vm.createContext(context);
vm.runInContext(source.slice(start,end),context);

const jun={product_type:'fr',grade_id:'fr_jun'};
const bul={product_type:'fr',grade_id:'fr_bul'};
assert.equal(context.mappingMatchesCategory(jun,'fr_jun'),true);
assert.equal(context.mappingMatchesCategory(jun,'fr_bul'),false);
assert.equal(context.mappingMatchesCategory(bul,'fr_bul'),true);
assert.equal(context.mappingMatchesCategory(bul,'fr_jun'),false);
assert.equal(context.mappingMatchesCategory(jun,'all'),true);
assert.equal(context.mappingMatchesCategory({product_type:'pf',grade_id:'imi_s'},'pf'),true);
console.log('PASS split reflective-insulation category mapping');
