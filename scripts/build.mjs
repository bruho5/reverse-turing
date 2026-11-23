import {readFile,readdir,mkdir,writeFile,copyFile} from 'node:fs/promises';
const assets={};
const pages=process.argv.includes("--pages");
for(const file of await readdir('public')){
 const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'};
 const type=types[file.slice(file.lastIndexOf('.'))];if(type)assets['/'+file]=[type+'; charset=utf-8',await readFile('public/'+file,'utf8')];
}
if(!assets['/index.html'])throw Error('Missing public/index.html');
const content=(await readFile('worker/content.js','utf8')).replaceAll(/^export (?=const )/gm,'');
const worker=(await readFile('worker/main.js','utf8')).replace(/^import .+\n/,'').replace('export function makeWorker','function makeWorker');
const output=content+'\n'+worker+'\nexport default makeWorker('+JSON.stringify(assets)+');\n';
if(pages){
 await mkdir('dist-pages',{recursive:true});
 await writeFile('dist-pages/_worker.js',output);
 // Direct Upload needs a visible asset; the Worker serves all real UI paths.
 await writeFile('dist-pages/robots.txt','User-agent: *\nDisallow: /\n');
}else{
 await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
 await writeFile('dist/server/index.js',output);
 await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
}
