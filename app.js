import { contrastRatio, parseProgress, completeLesson, validateAlias, lessons } from './domain.js';
const $ = selector => document.querySelector(selector), key = 'accesslab.progress.v1';
let progress = { format: 'accesslab-progress', version: 1, completed: [] }, current = 'forms', baseline = null, blocked = false;
const notice = text => { $('#notice').textContent = text; };
try { baseline = localStorage.getItem(key); if (baseline) progress = parseProgress(JSON.parse(baseline)); } catch { blocked = true; notice('No se pudo leer el progreso. No sobrescribiremos los datos guardados. Exporta tu sesión o importa un respaldo válido.'); }
function updateProgress() { $('#progress').textContent = `${progress.completed.length} de 3 ejercicios completados`; }
function save(next) { try { if (blocked || localStorage.getItem(key) !== baseline) { blocked = true; notice('Respuesta correcta, pero no se guardó: hay cambios en otra pestaña o datos inválidos. Exporta tu progreso.'); progress = next; updateProgress(); return; } const serialized = JSON.stringify(next); localStorage.setItem(key, serialized); baseline = serialized; progress = next; updateProgress(); notice('Respuesta correcta. Progreso guardado en este navegador.'); } catch { progress = next; updateProgress(); notice('Respuesta correcta, pero falló el guardado. Exporta el progreso antes de cerrar.'); } }
for (const button of document.querySelectorAll('[data-lesson]')) button.addEventListener('click', () => {
  current = button.dataset.lesson;
  for (const lesson of lessons) $(`#${lesson}`).hidden = lesson !== current;
  for (const item of document.querySelectorAll('[data-lesson]')) item.removeAttribute('aria-current');
  button.setAttribute('aria-current', 'step'); $('#bad-box').hidden = true; $('#bad-toggle').setAttribute('aria-expanded', 'false'); $('#bad-toggle').textContent = 'Mostrar ejemplo defectuoso'; $('#bad-demo').src = `./bad-examples.html?lesson=${current}`; $('#audit-result').replaceChildren(); notice(''); $(`#${current}-title`).focus();
});
$('#alias-form').addEventListener('submit', event => { event.preventDefault(); const error = validateAlias($('#alias').value); $('#alias-error').textContent = error; $('#alias').setAttribute('aria-invalid', String(Boolean(error))); $('#form-result').textContent = error ? '' : 'Ejercicio completado. El alias no se guardó ni se envió.'; if (error) $('#alias').focus(); });
$('#alias').addEventListener('input', () => { $('#alias').removeAttribute('aria-invalid'); $('#alias-error').textContent = ''; $('#form-result').textContent = ''; });
const dialog = $('#practice-dialog'); $('#open-dialog').addEventListener('click', () => dialog.showModal()); for (const id of ['dialog-confirm','dialog-close']) $(`#${id}`).addEventListener('click', () => dialog.close()); dialog.addEventListener('close', () => $('#open-dialog').focus());
function calculate() { try { const foreground = $('#foreground').value, background = $('#background').value, ratio = contrastRatio(foreground, background); $('#contrast-result').textContent = `${ratio.toFixed(2)}:1 · ${ratio >= 4.5 ? 'Alcanza' : 'No alcanza'} 4.5:1 para texto normal. No es una certificación.`; $('#swatch').style.color = foreground; $('#swatch').style.backgroundColor = background; } catch (error) { $('#contrast-result').textContent = error.message; } }
$('#contrast-form').addEventListener('submit', event => { event.preventDefault(); calculate(); }); calculate();
$('#answer').addEventListener('click', () => { const answer = document.querySelector(`input[name="${current}-answer"]:checked`); const correct = { forms: 'label', dialog: 'opener', contrast: 'no' }; if (!answer) return notice('Selecciona una respuesta antes de comprobarla.'); if (answer.value !== correct[current]) return notice('Todavía no. Revisa la explicación y prueba otra vez; no hay penalización.'); save(completeLesson(progress, current)); });
$('#bad-toggle').addEventListener('click', () => { $('#bad-box').hidden = !$('#bad-box').hidden; const expanded = !$('#bad-box').hidden; $('#bad-toggle').setAttribute('aria-expanded', String(expanded)); $('#bad-toggle').textContent = expanded ? 'Ocultar ejemplo defectuoso' : 'Mostrar ejemplo defectuoso'; });
$('#audit').addEventListener('click', async () => {
  // Freeze navigation/import only; the example's controls remain enabled for axe.
  const controls = [...document.querySelectorAll('[data-lesson],#audit,#import')];
  controls.forEach(control => {control.disabled=true;});
  $('#audit-result').textContent = 'Revisión en curso…';
  try {
    if (!window.axe) throw Error('No se cargó axe-core. Reinicia el servidor o revisa los archivos de distribución.');
    const result = await window.axe.run({ exclude: [['#bad-demo']] }, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa'] } });
    $('#audit-result').replaceChildren();
    const summary = document.createElement('p');
    summary.textContent = `${result.violations.length} incidencias automáticas · ${result.incomplete.length} reglas requieren revisión manual. Alcance: laboratorio y ejemplo correcto visible, sin el marco defectuoso. No certifica WCAG.`;
    $('#audit-result').append(summary);
    for (const violation of result.violations) {
      const item = document.createElement('p');
      item.textContent = `${violation.id}: ${violation.help} (${violation.nodes.length} elementos)`;
      $('#audit-result').append(item);
    }
  } catch (error) { $('#audit-result').textContent = error.message; }
  finally { controls.forEach(control => {control.disabled=false;}); }
});
$('#export').addEventListener('click', () => { const url = URL.createObjectURL(new Blob([JSON.stringify(progress,null,2)], {type:'application/json'})); const link = document.createElement('a'); link.href = url; link.download = 'accesslab-progreso.json'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url),1000); notice('Descarga solicitada al navegador. Revisa Descargas o su diálogo de guardado.'); });
$('#import').addEventListener('change', async event => { const input = event.target, file = input.files?.[0]; if (!file) return; const controls = [...document.querySelectorAll('button,input')]; controls.forEach(control => {control.disabled=true;}); try { if(file.size>10_000)throw Error('El respaldo supera 10 KB.'); const value = parseProgress(JSON.parse(await file.text())); if(!confirm('¿Reemplazar el progreso local? Exporta primero si deseas conservarlo.'))return; const serialized=JSON.stringify(value);localStorage.setItem(key,serialized);baseline=serialized;blocked=false;progress=value;updateProgress();notice('Progreso importado y guardado.'); }catch(error){notice(`No se importó: ${error.message}`);}finally{input.value='';controls.forEach(control=>{control.disabled=false;});} });
window.addEventListener('storage',event=>{if(event.key===key||event.key===null){blocked=true;notice('Otra pestaña cambió el progreso. Exporta tu sesión o recarga; no sobrescribiremos esos cambios.');}}); updateProgress();
