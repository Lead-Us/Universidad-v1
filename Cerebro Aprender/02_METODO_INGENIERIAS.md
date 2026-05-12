# Método — Ingeniería y Ciencias Exactas

Este módulo define cómo ejecutar las Fases 2 y 3 cuando el material es de ingeniería, matemáticas, física, estadística, cálculo, programación, termodinámica, estructuras, circuitos o cualquier disciplina cuantitativa.

---

## Cómo reconocer este dominio

Señales en el material:
- Notación matemática: integrales, derivadas, sumatorias, límites, matrices
- Unidades del SI o de la disciplina: N, Pa, V, Hz, m/s, kg, J, W, mol, Ω
- Vocabulario de dominio: cálculo, derivada, integral, física, circuito, termodinámica, resistencia, tensión, probabilidad, estadística, distribución, regresión, programación lineal, optimización, mecánica, fluidos

---

## Fase 2 — Enseñanza: adaptaciones para ciencias exactas

### 2.1 Storytelling para exactas

La analogía debe ser **física o mecánica**. El estudiante de ingeniería confía en la realidad física, no en metáforas abstractas. Usar sistemas concretos:

- Para integrales y áreas: agua acumulándose en un estanque, partículas que caen
- Para derivadas y tasas de cambio: velocidad de un auto, temperatura que sube en un horno
- Para equilibrio y sistemas de ecuaciones: fuerzas que se balancean en una viga, corrientes en un circuito
- Para probabilidad y estadística: medir piezas de una fábrica, contar defectos, predecir fallas
- Para optimización: el diseñador que quiere usar el mínimo material con la máxima resistencia
- Para cálculo estructural: el puente que debe soportar carga sin colapsar

La historia produce la pregunta que el concepto responde. Sin fórmulas todavía.

### 2.2 Explicación técnica para exactas

Estructura obligatoria:

1. **Enunciado de la fórmula o definición** — tal como aparece en el material del examen o en la notación del curso.

2. **Anatomía de la fórmula** — para cada símbolo o variable: nombre completo, unidad de medida, qué representa físicamente, qué pasa cuando ese valor aumenta (¿el resultado sube o baja?).

3. **Dominio de validez** — cuándo aplica esta fórmula y cuándo no. Condiciones requeridas (equilibrio estático, fluido incompresible, comportamiento lineal, muestra grande, etc.).

4. **Regla de decisión** — si la fórmula produce un criterio, definir el umbral explícitamente:
   - Factor de seguridad FS > 1 → diseño seguro; FS < 1 → falla
   - VPN > 0 → invertir; VPN < 0 → rechazar (nota: este criterio aplica también en ingeniería)
   - Valor-p < 0.05 → rechazar hipótesis nula
   - Número de Reynolds → flujo laminar vs turbulento

5. **Trampa frecuente** — el error más común en exámenes chilenos de esta disciplina:
   - Mezclar unidades (N con kg sin multiplicar por g)
   - Olvidar la condición de borde o condición inicial
   - Aplicar la fórmula fuera de su dominio (fluido compresible con fórmula de incompresible)
   - Error de signo en integración o en convención de fuerzas
   - Redondear intermedios y acumular error

### 2.3 Frase para el control en exactas

Debe contener en 1-2 líneas: el nombre del concepto, la fórmula o criterio principal, la condición de validez y la regla de decisión si aplica.

Ejemplo: "El factor de seguridad FS = Resistencia / Demanda indica que el diseño es seguro cuando FS > 1; valores menores indican falla. Solo aplica en régimen elástico lineal."

---

## Fase 3 — Ejercicios guiados para ciencias exactas

Los 5 ejercicios siguen la progresión base del sistema. Aquí están las especificaciones para este dominio:

**Ejercicio 1 — Mecánica base en exactas**
Dato numérico dado → aplicar la fórmula → un resultado con su unidad. No hay decisión. El alumno reporta el número, la unidad y la interpretación física en una línea. Si olvida la unidad, señalarlo como error antes de continuar.

**Ejercicio 2 — Aplicación completa en exactas**
Problema con 3-4 etapas de cálculo. El alumno etiqueta cada paso:
- Paso 1: identificar variables y convertir unidades si es necesario
- Paso 2: aplicar la fórmula o procedimiento
- Paso 3: verificar el orden de magnitud (¿el resultado tiene sentido físicamente?)
- Paso 4: resultado final con unidades

Antes de revisar aritmética: verificar que la estructura sea correcta, que las unidades sean consistentes, que el signo sea correcto. Un resultado numérico correcto con unidades incorrectas es un error de estructura.

**Ejercicio 3 — Decisión en exactas**
Mismo problema pero ahora con un criterio de diseño o de aceptación. El alumno debe:
1. Calcular el valor
2. Comparar con el criterio (FS > 1, VPN > 0, valor crítico, etc.)
3. Declarar la decisión en una línea con justificación

**Ejercicio 4 — Conceptual en exactas**
Una de estas preguntas:
- "¿Por qué esta fórmula no aplica cuando [condición]? ¿Qué modelo usarías en su lugar?"
- "Si duplicas [variable], ¿qué pasa con el resultado? Explica físicamente."
- "¿Cuál es el supuesto más importante que estás haciendo al usar esta fórmula?"

El alumno responde en 2-3 líneas. No hay cálculo.

**Ejercicio 5 — Tipo control en exactas**
Problema idéntico en formato al ejercicio del examen subido: mismo número de etapas, mismo tipo de criterio de diseño, mismas unidades. Sin guía. Solo el enunciado. El alumno resuelve completamente, mostrando todo el desarrollo.

---

## Corrección específica para ciencias exactas

- Un resultado correcto con unidades incorrectas → error de estructura. Señalar antes de validar el número.
- Signo incorrecto en el resultado final → señalar y pedir recalcular desde el paso donde ocurrió el error, no desde el principio.
- El alumno aplica una fórmula fuera de su dominio de validez → señalar la condición que viola y preguntar qué fórmula corresponde en ese caso.
- El alumno llega al número correcto pero no declara la interpretación física o la decisión → pedir la interpretación antes de avanzar.
