# language: es
# HU-89930: Implementar menú principal de navegación SP1
Característica: Menú principal de navegación

  Como usuario del módulo de Evaluación de Proveedores
  Quiero un menú principal organizado por módulos funcionales
  Para acceder de forma rápida y centralizada a las diferentes opciones

  Antecedentes:
    Dado que el usuario está en el módulo de Evaluación de Proveedores

  @hu:89930 @regression @smoke @testcase:91421
  Escenario: CP_01 - TC91421 - El menú lateral está visible con las tres categorías principales
    Entonces el menú lateral debe estar visible
    Y el menú debe mostrar las categorías "Evaluación 360", "PQRS" y "Configuraciones"

  @hu:89930 @regression @testcase:91422
  Escenario: CP_02 - TC91422 - La categoría Evaluación 360 muestra sus submenús
    Entonces la categoría "Evaluación 360" debe contener los submenús "Consultar", "Ranking de proveedores", "Ranking de usuarios" y "Reportes"

  @hu:89930 @regression @critical @testcase:91423
  Escenario: CP_03 - TC91423 - La categoría PQRS muestra sus submenús
    Entonces la categoría "PQRS" debe contener los submenús "Crear" y "Mis PQRS"

  @hu:89930 @regression @testcase:91424
  Escenario: CP_04 - TC91424 - La categoría Configuraciones muestra su submenú
    Entonces la categoría "Configuraciones" debe contener el submenú "Administración de evaluaciones"
