# language: es
# HU-90060: Implementar tabla de resultados en el Ranking de usuarios SP1
Característica: Tabla de resultados del Ranking de usuarios

  Como usuario del módulo de Evaluación de Proveedores
  Quiero ver los resultados del Ranking de Usuarios en una tabla ordenada por desempeño
  Para identificar rápidamente a los usuarios con más reclamos asignados

  Antecedentes:
    Dado que el usuario está en la pantalla de Ranking de Usuarios con resultados cargados

  @hu:90060 @regression @critical @ac:5 @testcase:91438
  Escenario: CP_01 - TC91438 - [AC 5] La tabla de resultados muestra todas las columnas esperadas
    Entonces la tabla de resultados debe mostrar las columnas "N°", "Nombre", "Correo", "Asignados", "Creados", "Felicitaciones" y "Acción"

  @hu:90060 @regression @critical @ac:3,4 @testcase:91439
  Escenario: CP_02 - TC91439 - [AC 3,4] Los resultados se ordenan de forma descendente por Asignados
    Entonces los resultados deben ordenarse de forma descendente por la columna "Asignados"
    Y el usuario en la posición 1 debe tener la mayor cantidad de Asignados

  @hu:90060 @regression @ac:8,9 @testcase:91440
  Escenario: CP_03 - TC91440 - [AC 8,9] Las primeras 10 posiciones muestran el indicador de ranking destacado
    Entonces las posiciones 1 a 10 deben mostrar el indicador de ranking destacado
    Y las posiciones posteriores a la 10 deben mostrar el mismo indicador con apariencia suavizada

  @hu:90060 @regression @ac:15,17 @testcase:91441
  Escenario: CP_04 - TC91441 - [AC 15,17] La columna Acción permanece fija y abre el detalle del usuario
    Cuando el usuario hace clic en el ícono de Acción de una fila
    Entonces debe mostrarse el detalle de ese usuario
    Y la columna Acción debe permanecer fija durante el desplazamiento horizontal

  @hu:90060 @regression @ac:19,20,21 @testcase:91442
  Escenario: CP_05 - TC91442 - [AC 19,20,21] La tabla soporta scroll vertical y paginación
    Entonces los encabezados de columna deben permanecer visibles durante el desplazamiento vertical
    Y la paginación debe mostrarse en la parte inferior de la tabla
