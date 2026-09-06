# language: es
# HU-91279: Guardado por ID en listas desplegables SP2
# Backend/integridad de datos — sin UI. Ver rules/automation-policy.md: son ideas
# de verificación de API/BD, no de UI.
Característica: Guardado de opciones de listas desplegables por ID

  Como la plataforma
  Quiero que las selecciones de listas desplegables se guarden por su ID de data maestra y no por su texto
  Para garantizar la integridad y normalización de la información

  @hu:91279 @regression @critical @testcase:91498
  Escenario: Seleccionar una opción de lista desplegable guarda su ID, no su valor de texto
    Dado que el usuario selecciona una opción en una lista desplegable respaldada por data maestra
    Cuando la selección se persiste
    Entonces el valor almacenado debe ser el ID de data maestra de la opción
    Y el valor almacenado no debe ser el valor de texto/string de la opción

  @hu:91279 @regression @critical @testcase:91499
  Escenario: Mostrar una selección guardada resuelve su nombre a partir del ID
    Dado que un registro se guardó con un ID de lista desplegable de data maestra
    Cuando se consulta la información de ese registro
    Entonces el nombre visible de la opción debe resolverse a partir del ID almacenado
