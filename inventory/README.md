# Comparador de existencias Shopify + IW

Web estática en HTML, CSS y JavaScript puro para cruzar productos de Shopify, inventario de Shopify y existencias de IW, con el objetivo de generar un CSV de actualización de inventario por sucursal para Shopify.

## Interfaz

La app usa un panel de administración: barra superior con el estado de los archivos, menú lateral con las vistas de resultados (con su contador) y las descargas, y el área central con la configuración en tres tarjetas, el resumen en tarjetas de métricas y la tabla de revisión. El icono de engranaje a la derecha lleva a la configuración y el botón de las tres líneas oculta el menú. El tema claro u oscuro sigue la configuración de Windows.

## Uso

1. Abre la carpeta con un servidor local o publica esta carpeta en GitHub Pages.
2. El export y la importación de inventario de Shopify solo incluyen variantes con seguimiento de inventario activo; el resto no se puede actualizar por CSV. Activa el seguimiento en Shopify para los productos que aplique antes de exportar. La app lista en la descarga `Sin seguimiento` del menú lateral las variantes activas que no lo tienen (y en `Revisión` solo las que además tienen existencia en IW).
3. **Exporta los tres archivos juntos y justo antes de subir**: productos Shopify, inventario Shopify (All states) y existencias IW. Si creas, eliminas o renombras productos después de exportar, vuelve a exportar antes de generar el CSV.
4. Carga los archivos en la app. Debajo de cada archivo se muestra su fecha; la app avisa si alguno es más de 12 horas más antiguo que el resto y, si el export de productos es más de 24 horas más viejo que el inventario, desactiva sola la opción de poner en 0.
5. Revisa el mapeo de sucursales. Cada sucursal puede tomar **varias bodegas de IW** (Ctrl+clic para seleccionar más de una; las cantidades se suman):
   - `Sucursal Chalchuapa` -> `ALMACEN`
   - `Sucursal Santa Ana Independencia` -> `ALMACEN SANTA ANA`
   - `Sucursal Santa Ana Zarzamora` -> `ALMACEN ZARZAMORA`

   Las bodegas de IW que no asignes a ninguna sucursal (SALA DE VENTAS, RESERVA PUNTUALES, PRODUCTO CON DETALLE, DEMO...) no se suben, y la app te dice cuántas unidades quedan fuera en `Revisión` -> "Almacén IW sin mapear". Si una de esas bodegas vende, agrégala a su sucursal.
6. Elige el **Precio IW de referencia** para el reporte de precios. La app selecciona `Precio 4` por defecto cuando existe. Mantén activadas las opciones "Eliminar 'On hand (current)'" e "Incluir en el CSV solo las filas con existencia nueva". Deja "Poner en 0 las variantes cuyo UPC no existe en IW" en "Todos los productos" salvo que quieras revisar primero.
7. Ejecuta `Comparar y generar archivos`.
8. Lee el mensaje de resultado. Si dice que hay productos del inventario que no están en el export de productos, reexporta productos Shopify y repite.
9. Descarga `UPC por corregir` si el mensaje lo pide: trae las variantes sin UPC o con UPC que no existe en IW, junto al código y UPC que IW parece tener para ese producto. Descarga `Puestos en 0` y revisa esa lista (son las variantes que Shopify mostraba con existencia y que IW no tiene). Revisa también la vista `Actualizados` del menú lateral.
10. Descarga el CSV de inventario generado.
11. Ve a la sección de Inventario en Shopify y haz clic en Importar, subiendo el archivo generado.

Para probar localmente:

```powershell
py -3 -m http.server 8766 --bind 127.0.0.1
```

Luego abre `http://127.0.0.1:8766/index.html`.

## Comparación de precios

- Al cargar Existencias IW, el selector muestra todas las listas detectadas (`Precio 1`, `Precio 2`, etc.) y usa `Precio 4` como referencia inicial. Cambia la lista y ejecuta de nuevo para recalcular.
- La pestaña `Precios` compara `Variant Price` de Shopify con la lista elegida y muestra la diferencia con signo: un valor positivo significa que Shopify está más alto; uno negativo, que está más bajo.
- Solo existe una oferta real cuando `Variant Compare At Price` es mayor que el precio actual. En ese caso se muestra el precio regular y se compara también contra IW. Los compare-at vacíos, en cero o iguales al precio actual no cuentan como oferta.
- Si el precio actual no coincide con la referencia elegida, pero sí con otra lista de IW que tiene un importe distinto, el reporte indica cuál lista coincide. No intenta adivinar entre listas que tienen exactamente el mismo valor.
- Los filtros separan coincidencias, ofertas reales, diferencias, precios más altos o bajos, precios faltantes/inválidos y productos sin coincidencia IW. El resumen de la vista siempre indica la lista con la que fue calculado.
- `Reporte de precios` descarga un CSV cuyo nombre incluye la lista utilizada. Esta comparación es informativa: no modifica precios en Shopify ni en IW y no altera el CSV de inventario.

## Cómo se ubica cada fila del inventario

- Cada fila del export de inventario se busca en el export de productos por **Handle + valores de opciones** (Option1/2/3 Value, sin distinguir mayúsculas, acentos ni guiones). Si el producto tiene un solo candidato, se usa el SKU para confirmar.
- Si el handle no aparece en el export de productos, la fila se marca como "Producto fuera del export de productos" y queda en la métrica **Sin export productos**. Es la señal de que el export de productos está desactualizado.
- Si el handle no aparece pero el SKU sí y apunta a una ficha provisional con el mismo nombre (producto renombrado o recreado), se usa el SKU para tomar el UPC y la fila se marca como "Producto ubicado solo por SKU". Si ese SKU pertenece a otro producto que sí está en el inventario, no se usa (evita escribir la existencia de otro producto).
- Un SKU repetido entre varios productos ya no bloquea la actualización, porque la variante se ubica por Handle + opciones.
- Los UPC repetidos entre variantes o productos Shopify se reportan en `Revisión` ("UPC compartido"): todos reciben la misma existencia de IW, así que conviene corregir los UPC o eliminar el duplicado.

## El archivo de inventario solo cubre productos con seguimiento activo

El export y la importación de inventario de Shopify solo incluyen variantes con "Track quantity" activo. Una variante sin seguimiento no aparece en el export, no se puede actualizar por CSV y Shopify la vende sin límite. La app las lista en la descarga `Sin seguimiento` del menú lateral (agrupadas en "UPC encontrado en IW", "UPC no existe en IW" y "Sin UPC") y avisa en el mensaje final solo cuando IW tiene existencia para alguna de ellas. Actívalas en Shopify con el editor masivo y vuelve a exportar.

## Cómo se busca en IW

- La búsqueda es por UPC normalizado (sin apóstrofes, espacios, guiones ni ceros iniciales). El archivo IW se lee por nombre de columna, así que columnas nuevas como `Categoría` o `Costo Unitario Prom` no afectan; las cantidades se leen como número aunque Excel las muestre con separador de miles (`1,618.00`).
- Si el UPC no aparece y tiene 7, 11, 12 o 13 dígitos, se prueba con el dígito verificador GS1 calculado ("UPC + dígito verificador").
- Si el UPC no aparece y el SKU coincide con un único UPC de IW (SKU de al menos 5 caracteres con letras y números), se usa el SKU ("SKU = UPC IW").
- Si IW tiene el mismo UPC en varias filas y como máximo una tiene existencia, se usa esa fila ("UPC repetido en IW combinado"). Si dos o más filas tienen existencias distintas, no se escribe y aparece en `Revisión` como "UPC repetido en IW con existencias en conflicto".
- Si IW trae una cantidad no numérica en un almacén, esa sucursal no se escribe.

## Poner en 0 cuando IW no tiene el UPC

IW es la fuente de verdad. Con la opción activa, una variante cuyo UPC numérico no existe en IW se escribe con 0 en las sucursales que hoy tienen existencia. Reglas fijas, independientes de la opción:

- Solo UPC numéricos de 8 a 14 dígitos. Los UPC no numéricos (modelos, códigos internos) y las variantes sin UPC no se tocan: aparecen en `Revisión` como "UPC no válido en Shopify" o "Sin UPC en Shopify", con el candidato de IW cuando el nombre o el SKU lo sugieren. La casilla "Poner en 0 también las variantes sin UPC válido" está apagada por defecto.
- Solo variantes ubicadas por Handle + opciones (nunca por SKU suelto) y con seguimiento de inventario activo.
- Nunca sobre sucursales "not stocked" ni sobre sucursales que ya están en 0.
- Antes de poner en 0 se intentan las recuperaciones (dígito verificador, SKU = UPC IW, UPC repetido en IW).
- En productos activos, si IW parece tener el producto con otro UPC y con existencia, no se pone en 0; queda en `Revisión` como "UPC sugerido desde IW".
- Cortafuegos: si el archivo IW tiene menos de 3,000 filas o menos del 50% de las variantes con existencia y UPC numérico aparecen en IW, no se pone en 0 nada ("Puesta en 0 desactivada" en `Revisión`).
- El alcance "Solo productos archivados o en borrador" limita el 0 a productos que no se venden.
- El CSV de estados solo propone cambios cuando todas las variantes del producto tienen coincidencia segura en IW y aparecen en el inventario cargado, tienen seguimiento activo, las cantidades IW son numéricas y no hay stock IW fuera de las bodegas mapeadas. En caso contrario queda como "Revisar" y no se incluye en ese CSV.

Cada fila puesta en 0 aparece en la vista `Subida` del menú lateral y `Actualizados` con Motivo "Puesto en 0: UPC no existe en IW", en `Revisión` con el tipo "Puesto en 0", y en el CSV `Puestos en 0`. Al descargar el CSV de inventario, la app pide confirmación si hay productos activos puestos en 0.

Para revertir una subida, importa el export de inventario original copiando `On hand (current)` en `On hand (new)`.

## Reglas principales

- La validación contra IW se hace estrictamente por UPC (Código de barras). El SKU solo confirma la variante dentro del handle o sirve de UPC alterno con las guardas anteriores.
- En formato Shopify `All states`, solo se llena `On hand (new)` para las tres sucursales mapeadas.
- Con "Incluir en el CSV solo las filas con existencia nueva" activo, el CSV solo lleva filas cuya cantidad difiere de Shopify. Las coincidencias sin cambio siguen apareciendo en la auditoría, pero no se suben. Las filas vacías no aportan nada y son las que Shopify rechaza cuando el producto ya no existe.
- Si el tracking no está activo en Shopify, la app te avisará pero **no bloqueará** la generación del CSV.
- Los productos ambiguos o no ubicables quedan omitidos y pasan a revisión.
- Si no hay coincidencia segura ni aplica el 0, se deja `On hand (new)` vacío para evitar sobrescrituras accidentales.
- No se editan precios ni otros datos del producto.

## Errores comunes al importar en Shopify

- **"Couldn't be updated because the handle doesn't match what's in Shopify"**: el handle de esa fila ya no existe en la tienda. Pasa cuando el CSV se generó con un export de inventario viejo y después se eliminaron o renombraron productos (por ejemplo, fichas provisionales con el UPC como nombre que luego se reemplazaron por el producto real). Solución: reexportar inventario y productos, y volver a generar el CSV. Con la opción de solo filas con cambio activa, las filas vacías de productos borrados ya no viajan en el CSV.
- **La importación termina bien pero nada cambia**: el CSV tenía `On hand (new)` vacío en todas las filas. Revisa la métrica "Listas CSV" antes de descargar; si es 0, el export de productos no trae la columna `Variant Barcode(s)` o ningún UPC coincidió con IW.
- **Productos nuevos que no se actualizan**: no estaban en el export de inventario o de productos usado. Reexporta ambos después de crear productos.
- **Un producto muestra en Shopify una cantidad distinta a la que ves ahora en IW**: revisa la fecha del archivo IW que usaste. La app escribe exactamente lo que dice ese archivo; si vendiste o moviste unidades después de exportarlo, Shopify queda con el número del export. Ejemplo real: la impresora EPSON L14150 tenía `ALMACEN` 4 en el export del 2 de septiembre, la app escribió 4 en Chalchuapa, y dos días después IW mostraba 2. La solución es exportar IW justo antes de generar el CSV.
- **Productos que siguen mostrando existencia aunque IW no tiene**: su UPC no existe en IW (se resuelven con "Poner en 0"), no tienen UPC válido (corrige el UPC en Shopify) o no tienen seguimiento de inventario (actívalo en Shopify con el listado `Sin seguimiento`).
