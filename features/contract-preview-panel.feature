# language: es
# HU-90129: Implementar componente de previsualización en la gestión de minuta SP10
# Casos de ejecución MANUAL (rules/automation-policy.md): juicio visual/UX sobre
# renderizado, paginación, zoom y sincronización de scroll — no automatizable de
# forma determinística. No tienen step definitions ni se ejecutan en `npm test`
# (cucumber.json excluye "@manual").
Característica: Vista previa del contrato en el editor de minuta

  Como usuario del módulo de contratos
  Quiero visualizar una previsualización fiel del contrato mientras lo edito
  Para validar su formato y estructura antes de generarlo, revisarlo, aprobarlo o firmarlo

  Antecedentes:
    Dado que el usuario está en el editor de minuta de un contrato

  @hu:90129 @manual @smoke @ac:4 @testcase:91532
  Escenario: CP_01 - TC91532 - [AC 4] El botón de Vista previa está disponible en la barra de herramientas
    Dado que el editor de minuta tiene contenido escrito
    Entonces el botón "Vista previa" debe estar visible en la barra de herramientas del editor

  @hu:90129 @manual @critical @smoke @ac:6,7 @testcase:91534
  Escenario: CP_02 - TC91534 - [AC 6,7] Activar la vista previa muestra una visual dividida con ambas vistas activas
    Cuando el usuario activa la "Vista previa"
    Entonces el editor debe mostrarse en la columna izquierda
    Y la previsualización debe mostrarse en la columna derecha
    Y ambas vistas deben permanecer activas simultáneamente

  @hu:90129 @manual @ac:5 @testcase:91535
  Escenario: CP_03 - TC91535 - [AC 5] El usuario puede ocultar la vista previa y volver al editor simple
    Dado que la vista previa está activa
    Cuando el usuario oculta la "Vista previa"
    Entonces el editor debe volver a mostrarse en modo simple, sin la columna de previsualización

  @hu:90129 @manual @ac:5 @testcase:91536
  Escenario: CP_04 - TC91536 - [AC 5] El usuario puede alternar libremente entre editor simple y editor con vista previa
    Cuando el usuario alterna repetidamente entre editor simple y editor con vista previa
    Entonces el sistema debe reflejar el modo seleccionado en cada alternancia sin perder el contenido editado

  @hu:90129 @manual @ac:8 @testcase:91537
  Escenario: CP_05 - TC91537 - [AC 8] El usuario puede ajustar el ancho de las columnas del editor y la previsualización
    Dado que la vista previa está activa
    Cuando el usuario arrastra el divisor entre el editor y la previsualización
    Entonces el ancho de ambas columnas debe ajustarse de acuerdo con la posición del divisor

  @hu:90129 @manual @critical @ac:2 @testcase:91538
  Escenario: CP_06 - TC91538 - [AC 2] La previsualización respeta el formato del contenido del editor
    Dado que el contrato contiene texto en negrilla, cursiva, tablas, listas, numeraciones y saltos de página
    Cuando el usuario activa la "Vista previa"
    Entonces la previsualización debe representar fielmente cada uno de esos formatos y la estructura documental

  @hu:90129 @manual @critical @ac:9,19 @testcase:91539
  Escenario: CP_07 - TC91539 - [AC 9,19] La previsualización muestra encabezados, pie de página y distribución de firmas según el holding
    Dado que el contrato pertenece a un holding con encabezados y pies de página configurados
    Cuando el usuario activa la "Vista previa"
    Entonces la previsualización debe mostrar el encabezado, el pie de página, la numeración de páginas, los márgenes y la distribución de firmas definidos para ese holding

  @hu:90129 @manual @ac:10 @testcase:91540
  Escenario: CP_08 - TC91540 - [AC 10] La previsualización se muestra paginada con continuidad documental
    Cuando el usuario activa la "Vista previa" de un contrato con contenido extenso
    Entonces la previsualización debe mostrar una separación visual entre páginas
    Y cada página debe mostrar su número
    Y el contenido debe mantener continuidad entre una página y la siguiente

  @hu:90129 @manual @ac:11 @testcase:91541
  Escenario: CP_09 - TC91541 - [AC 11] El sistema distribuye automáticamente el contenido entre páginas
    Cuando el usuario activa la "Vista previa" de un contrato con contenido extenso
    Entonces el sistema debe calcular automáticamente en qué página debe ubicarse cada sección del contenido, sin intervención manual del usuario

  @hu:90129 @manual @ac:12 @testcase:91542
  Escenario: CP_10 - TC91542 - [AC 12] El modo lectura enfoca la visualización en el contenido de una sola página
    Cuando el usuario activa el "Modo lectura" de la previsualización
    Entonces debe mostrarse una única página principal de lectura enfocada en el contenido

  @hu:90129 @manual @ac:13,14 @testcase:91543
  Escenario: CP_11 - TC91543 - [AC 13,14] Los controles de zoom permiten aumentar, disminuir y restablecer el acercamiento
    Dado que la vista previa está activa
    Cuando el usuario utiliza los controles de "Aumentar zoom", "Disminuir zoom" y "Restablecer zoom"
    Entonces el nivel de acercamiento de la previsualización debe cambiar en cada acción
    Y el contenido debe mantenerse legible en todos los niveles de zoom

  @hu:90129 @manual @critical @ac:15 @testcase:91544
  Escenario: CP_12 - TC91544 - [AC 15] Al hacer scroll en el editor la previsualización se desplaza a la sección correspondiente
    Dado que la vista previa está activa
    Cuando el usuario hace scroll sobre el editor Quill
    Entonces la previsualización debe desplazarse automáticamente hasta la sección correspondiente del documento

  @hu:90129 @manual @critical @ac:17 @testcase:91545
  Escenario: CP_13 - TC91545 - [AC 17] La previsualización se actualiza automáticamente al modificar el contenido del editor
    Dado que la vista previa está activa
    Cuando el usuario modifica el contenido en el editor Quill
    Entonces la previsualización debe actualizarse automáticamente para reflejar el cambio

  @hu:90129 @manual @ac:18 @testcase:91546
  Escenario: CP_14 - TC91546 - [AC 18] La previsualización muestra la información corporativa y los metadatos del contrato
    Cuando el usuario activa la "Vista previa"
    Entonces la previsualización debe mostrar el logo, la razón social, la información corporativa y los metadatos contractuales del holding correspondiente

  @hu:90129 @manual @regression @ac:20 @testcase:91547
  Escenario: CP_15 - TC91547 - [AC 20] La barra de herramientas y el botón de solicitud del contrato mantienen su funcionamiento actual
    Entonces la barra de herramientas del editor debe conservar sus funciones actuales
    Y el botón para desplegar la solicitud del contrato debe conservar su funcionamiento actual

  @hu:90129 @manual @testcase:91552
  Escenario: CP_16 - TC91552 - Los controles de expandir y pantalla completa amplían la previsualización
    Dado que la vista previa está activa
    Cuando el usuario utiliza los controles de "Expandir" y "Pantalla completa"
    Entonces la previsualización debe ampliarse ocupando más espacio en la pantalla en cada caso
