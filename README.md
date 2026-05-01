# DeepBio 2026 · Programa friendly

Plantilla estática para publicar un programa tipo “friendly programme” en GitHub Pages o en un servidor propio, con:

- Buscador por título, ponente, tema, afiliación o sala.
- Filtros por tipo, tema y sala.
- Modo compacto/detallado.
- Tarjetas agrupadas por día.
- Datos editables desde `content/schedule.csv` o desde un Google Sheet publicado como CSV.
- Sin build step, sin servidor de aplicaciones y sin dependencias de Node.

La web funciona como un mini CMS ligero: el contenido está separado del diseño. Para cambiar horarios, ponentes o sesiones basta con editar `content/schedule.csv` o una hoja de cálculo externa.

---

## Estructura del proyecto

```text
index.html
assets/
  app.js
  config.js
  styles.css
content/
  schedule.csv
  site.json
README.md
```

Archivos principales:

- `index.html`: estructura de la página.
- `assets/styles.css`: estilos visuales.
- `assets/app.js`: carga de datos, filtros, buscador y renderizado del programa.
- `assets/config.js`: configuración para usar un CSV local o un Google Sheet publicado.
- `content/schedule.csv`: datos del programa.
- `content/site.json`: textos generales del evento.

---

## Probar en local

No abras `index.html` directamente con doble clic, porque algunos navegadores bloquean la carga de archivos CSV locales.

Entra en la carpeta del proyecto y ejecuta:

```bash
python3 -m http.server 8000
```

Después abre:

```text
http://localhost:8000
```

En Windows, si `python3` no funciona, prueba:

```bash
python -m http.server 8000
```

---

## Edición del programa

### Opción A: editar el CSV incluido

Edita el archivo:

```text
content/schedule.csv
```

Columnas esperadas:

```text
id,date,start,end,type,theme,room,speaker,affiliation,title,abstract,status,url
```

Significado de cada campo:

- `id`: identificador único, sin espacios. Ejemplo: `charla-aprendizaje-profundo`.
- `date`: fecha en formato `YYYY-MM-DD`. Ejemplo: `2026-05-08`.
- `start`: hora de inicio. Ejemplo: `09:30` o `Por determinar`.
- `end`: hora de fin. Ejemplo: `10:15`. Puede quedar vacío.
- `type`: tipo de actividad. Ejemplo: `Charla`, `Descanso`, `Presentación`, `Taller`.
- `theme`: tema usado para los filtros.
- `room`: sala.
- `speaker`: ponente o responsable.
- `affiliation`: universidad, grupo o institución.
- `title`: título visible de la actividad.
- `abstract`: descripción breve. Puede quedar vacío.
- `status`: `Confirmado`, `Pendiente`, `Cancelado`, etc.
- `url`: enlace de más información. Puede quedar vacío.

### Opción B: usar Google Sheets como CMS ligero

Esta es la opción más cómoda para organizadores sin conocimientos técnicos.

1. Crea una hoja de cálculo en Google Sheets.
2. Añade estas columnas:

```text
id,date,start,end,type,theme,room,speaker,affiliation,title,abstract,status,url
```

3. Copia las filas de `content/schedule.csv` en la hoja.
4. En Google Sheets, ve a `Archivo > Compartir > Publicar en la Web`.
5. Elige la pestaña del horario y el formato `Valores separados por comas (.csv)`.
6. Copia la URL publicada.
7. Abre `assets/config.js` y cambia:

```js
window.DEEPBIO_CMS_CSV_URL = "";
```

por algo como:

```js
window.DEEPBIO_CMS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/XXXX/pub?output=csv";
```

8. Opcionalmente, añade la URL de edición de la hoja para mostrar un botón de acceso:

```js
window.DEEPBIO_EDIT_URL = "https://docs.google.com/spreadsheets/d/XXXX/edit";
```

Notas importantes:

- La hoja debe estar publicada como CSV, no solo compartida.
- Los cambios pueden tardar unos minutos en verse por la caché de Google o del navegador.
- Si se publica en una intranet sin acceso a internet, usa mejor el CSV local `content/schedule.csv`.

---

## Cambiar textos generales del evento

Edita:

```text
content/site.json
```

Ahí puedes cambiar título, subtítulo, descripción, fechas, ubicación, enlaces y textos de la cabecera.

---

# Despliegue en GitHub Pages

GitHub Pages es la opción más sencilla si quieres una URL pública sin mantener servidor.

## Método 1: desde la interfaz de GitHub

1. Crea un repositorio nuevo en GitHub. Por ejemplo:

```text
deepbio-programa
```

2. Sube todos los archivos de esta carpeta al repositorio. Deben quedar en la raíz del repositorio, así:

```text
index.html
assets/
content/
README.md
```

3. En GitHub, entra en `Settings > Pages`.
4. En `Build and deployment`, selecciona:

```text
Source: Deploy from a branch
Branch: main
Folder: /root
```

5. Guarda los cambios.
6. GitHub mostrará una URL parecida a:

```text
https://usuario.github.io/deepbio-programa/
```

7. Espera unos minutos y abre esa URL.

## Método 2: desde terminal con Git

Desde la carpeta del proyecto:

```bash
git init
git add .
git commit -m "Publica programa DeepBio friendly"
git branch -M main
git remote add origin https://github.com/USUARIO/deepbio-programa.git
git push -u origin main
```

Después activa GitHub Pages en `Settings > Pages` como se describe arriba.

## Actualizar la web en GitHub Pages

### Si editas el CSV en GitHub

1. Abre `content/schedule.csv` en GitHub.
2. Pulsa el icono del lápiz.
3. Cambia horarios, ponentes o títulos.
4. Guarda con `Commit changes`.
5. GitHub Pages actualizará la web automáticamente.

### Si editas con Google Sheets

No hace falta tocar GitHub cada vez. Basta con actualizar la hoja de cálculo publicada. La web leerá el CSV publicado en Google Sheets al cargar.

## Usar dominio propio en GitHub Pages

Opcionalmente, puedes usar un dominio como:

```text
workshop.midominio.es
```

Pasos generales:

1. En `Settings > Pages > Custom domain`, escribe el dominio.
2. En el DNS del dominio, crea un registro `CNAME` que apunte a:

```text
USUARIO.github.io
```

3. Activa `Enforce HTTPS` cuando GitHub lo permita.

---

# Despliegue en servidor on premises

La plantilla es una web estática. No necesita PHP, Python, Node, base de datos ni backend. Cualquier servidor capaz de servir HTML, CSS, JavaScript, CSV y JSON es suficiente.

## Requisitos mínimos

- Servidor web: Nginx, Apache, Caddy, IIS o similar.
- Acceso para copiar archivos al directorio público.
- HTTPS recomendado si la web será pública.

## Opción A: copiar archivos al directorio web

Por ejemplo, en un servidor Linux con Apache o Nginx:

```bash
sudo mkdir -p /var/www/deepbio-programa
sudo rsync -av --delete ./ /var/www/deepbio-programa/
sudo chown -R www-data:www-data /var/www/deepbio-programa
```

La estructura final debe ser:

```text
/var/www/deepbio-programa/index.html
/var/www/deepbio-programa/assets/
/var/www/deepbio-programa/content/
```

## Opción B: desplegar mediante Git en el servidor

En el servidor:

```bash
cd /var/www
git clone https://github.com/USUARIO/deepbio-programa.git deepbio-programa
sudo chown -R www-data:www-data /var/www/deepbio-programa
```

Para actualizar:

```bash
cd /var/www/deepbio-programa
git pull
```

Si quieres automatizar actualizaciones periódicas, puedes usar un cron:

```bash
*/10 * * * * cd /var/www/deepbio-programa && git pull --ff-only >/dev/null 2>&1
```

## Ejemplo de configuración con Nginx

Crea un archivo como:

```text
/etc/nginx/sites-available/deepbio-programa
```

con este contenido:

```nginx
server {
    listen 80;
    server_name deepbio.midominio.es;

    root /var/www/deepbio-programa;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(csv|json)$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files $uri =404;
    }

    location ~* \.(css|js|png|jpg|jpeg|gif|svg|webp|ico)$ {
        expires 7d;
        add_header Cache-Control "public";
        try_files $uri =404;
    }
}
```

Activa el sitio:

```bash
sudo ln -s /etc/nginx/sites-available/deepbio-programa /etc/nginx/sites-enabled/deepbio-programa
sudo nginx -t
sudo systemctl reload nginx
```

Para HTTPS, puedes usar Certbot:

```bash
sudo certbot --nginx -d deepbio.midominio.es
```

## Ejemplo de configuración con Apache

Crea un virtual host como:

```text
/etc/apache2/sites-available/deepbio-programa.conf
```

con este contenido:

```apache
<VirtualHost *:80>
    ServerName deepbio.midominio.es
    DocumentRoot /var/www/deepbio-programa

    <Directory /var/www/deepbio-programa>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    <FilesMatch "\.(csv|json)$">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
    </FilesMatch>
</VirtualHost>
```

Activa módulos y sitio:

```bash
sudo a2enmod headers
sudo a2ensite deepbio-programa.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

Para HTTPS:

```bash
sudo certbot --apache -d deepbio.midominio.es
```

## Publicar en una ruta interna en vez de un dominio

También puedes servirla dentro de una ruta, por ejemplo:

```text
https://www.unex.es/eventos/deepbio2026/programa/
```

En ese caso copia el contenido de la carpeta dentro de la ruta pública correspondiente. La plantilla usa rutas relativas, así que debería funcionar sin cambios siempre que mantengas la estructura `assets/` y `content/` junto a `index.html`.

## Caché recomendada

Para que los cambios del programa se vean rápido:

- `index.html`: caché corta o sin caché.
- `content/schedule.csv`: sin caché o caché muy corta.
- `content/site.json`: sin caché o caché muy corta.
- `assets/styles.css` y `assets/app.js`: caché de varios días, salvo durante desarrollo.

Si actualizas el CSV y no ves los cambios, prueba una recarga completa del navegador:

- Windows/Linux: `Ctrl + F5`.
- macOS: `Cmd + Shift + R`.

## Permisos

El usuario del servidor web debe poder leer los archivos. En Ubuntu/Debian suele ser `www-data`:

```bash
sudo chown -R www-data:www-data /var/www/deepbio-programa
sudo find /var/www/deepbio-programa -type d -exec chmod 755 {} \;
sudo find /var/www/deepbio-programa -type f -exec chmod 644 {} \;
```

Si el servidor usa SELinux, puede hacer falta etiquetar el directorio como contenido web.

---

## Solución de problemas

### La página carga, pero no aparece el programa

Comprueba que existe:

```text
content/schedule.csv
```

y que se puede abrir desde el navegador:

```text
https://tu-dominio/content/schedule.csv
```

### El Google Sheet no carga

Revisa que la hoja esté publicada como CSV desde `Archivo > Compartir > Publicar en la Web`. No basta con que esté compartida con enlace.

### Los cambios tardan en verse

Puede ser caché del navegador, del servidor o de Google Sheets. Haz una recarga completa o revisa las cabeceras de caché del servidor.

### Caracteres raros o acentos mal mostrados

Guarda `schedule.csv` como UTF-8. Google Sheets exporta CSV en UTF-8 normalmente.

### Comas dentro de un campo

Si un título o descripción contiene comas, encierra el campo entre comillas dobles:

```csv
charla-1,2026-05-08,09:30,10:15,Charla,IA,Salón,"Nombre Apellido",Universidad,"Título con, coma","Descripción con, coma",Confirmado,
```

---

## Notas

- La plantilla está inicializada con los datos públicos disponibles a 30 de abril de 2026.
- Los horarios aparecen como “Por determinar” porque la web oficial todavía no publica horas concretas.
- Para un CMS completo con login y edición desde `/admin`, se puede adaptar a Decap CMS, Netlify CMS o un backend propio, pero para este caso Google Sheets suele ser más sencillo para organizadores no técnicos.
