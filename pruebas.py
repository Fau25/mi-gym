import subprocess, time, sys
from playwright.sync_api import sync_playwright
srv = subprocess.Popen(['python3','-m','http.server','8771'],cwd='/home/claude/mi-gym',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2)
    pg=c.new_page(); pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    pg.clock.install(time=__import__('datetime').datetime(2026,11,2,18,0))  # lunes
    pg.goto('http://localhost:8771/'); pg.wait_for_timeout(500)
    assert 'empuje' in pg.inner_text('h1').lower(), pg.inner_text('h1')
    # registrar 4 series de banca a 60x10
    pg.screenshot(path='/home/claude/pruebas-gym/lista0.png')
    pg.click('.ejfila >> nth=0'); pg.wait_for_timeout(300)
    for k in range(3):
        f=pg.locator('#hoja .serie').nth(k)
        f.locator('[data-c=kg]').fill('60'); f.locator('[data-c=kg]').dispatch_event('change')
        f.locator('[data-c=reps]').fill('10'); f.locator('[data-c=reps]').dispatch_event('change')
        f.locator('.check').click()
    pg.screenshot(path='/home/claude/pruebas-gym/hoja.png')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300); assert pg.is_hidden('#hoja')
    pg.screenshot(path='/home/claude/pruebas-gym/hoy.png')
    # peso
    pg.click('.menu [data-v=peso]'); pg.fill('#inPeso','72,4'); pg.click('#fPeso .btn')
    # jueves: sugerencia debe subir a 62.5
    pg.clock.set_system_time(__import__('datetime').datetime(2026,11,5,18,0)); pg.reload(); pg.wait_for_timeout(400)
    pg.click('.ejfila >> nth=0'); pg.wait_for_timeout(300); sug=pg.locator('#hoja .a-consejo span').inner_text(); pg.keyboard.press('Escape'); print('jueves:',sug); assert '62' in sug
    pg.click('.menu [data-v=peso]'); pg.fill('#inPeso','72,8'); pg.click('#fPeso .btn')
    # domingo: semana nueva
    pg.clock.set_system_time(__import__('datetime').datetime(2026,11,8,11,0)); pg.reload(); pg.wait_for_timeout(400)
    pg.click('.menu [data-v=hoy]'); pg.wait_for_timeout(1500); print('domingo:',pg.inner_text('h1')); pg.screenshot(path='/home/claude/pruebas-gym/domingo.png',full_page=True)
    pl=pg.evaluate("JSON.parse(localStorage.getItem('migym-v1')).planes"); print(pl)
    ks=sorted(pl); a,bb=pl[ks[0]],pl[ks[1]]
    PL=pg.evaluate("PLANTILLA")
    for t in a:
        for i,(x,y) in enumerate(zip(a[t],bb[t])):
            h=PL[t]['huecos'][i]
            assert x!=y or len(h['pool'])==1, (t,i,x,y)
    pg.click('.menu [data-v=progreso]'); pg.wait_for_timeout(200); pg.screenshot(path='/home/claude/pruebas-gym/progreso.png',full_page=True)
    pg.click('.menu [data-v=peso]'); pg.screenshot(path='/home/claude/pruebas-gym/peso.png',full_page=True)
    # sin repetidos en el día, 9 ejercicios en empuje, y cambiar un fijo por alternativa
    pg.clock.set_system_time(__import__('datetime').datetime(2026,11,12,18,0)); pg.reload(); pg.wait_for_timeout(400)
    pl=pg.evaluate("JSON.parse(localStorage.getItem('migym-v1')).planes")
    for sem in pl:
        for tt,ids in pl[sem].items(): assert len(ids)==len(set(ids)), (sem,tt,ids)
    assert pg.locator('.ejfila').count()==9, pg.locator('.ejfila').count()
    pg.click('.ejfila >> nth=0'); pg.wait_for_timeout(200); n0=pg.inner_text('#hojaT'); pg.click('#hoja [data-cambiar]'); pg.wait_for_timeout(200)
    assert n0!=pg.inner_text('#hojaT');
    ej=pg.evaluate('Object.keys(EJ)'); assert all(i in ej for s in pl.values() for d in s.values() for i in d); pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    pg.click('.menu [data-v=ajustes]'); pg.click('#renovar'); pg.wait_for_timeout(100)
    print('errores:',errs); assert not errs
    b.close()
srv.terminate(); print('TODO BIEN')
# prueba de importación de imágenes
srv = subprocess.Popen(['python3','-m','http.server','8771'],cwd='/home/claude/mi-gym',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.clock.install(time=__import__('datetime').datetime(2026,11,3,18,0))
    pg.goto('http://localhost:8771/'); pg.click('.menu [data-v=ajustes]')
    pg.set_input_files('#importarImg','/mnt/user-data/outputs/mi-gym-imagenes.json'); pg.wait_for_timeout(1500)
    print(pg.inner_text('#aviso')); pg.click('.menu [data-v=hoy]'); pg.wait_for_timeout(500)
    n=pg.locator('.ejfila .propia').count(); print('propias',n); assert n==6
    pg.screenshot(path='/home/claude/pruebas-gym/propias.png'); pg.click('.ejfila >> nth=0'); pg.wait_for_timeout(300); pg.screenshot(path='/home/claude/pruebas-gym/propias-hoja.png')
    assert not errs, errs; b.close()
srv.terminate(); print('IMG OK')
