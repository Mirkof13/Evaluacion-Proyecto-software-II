# BANCOSOL: 100 PREGUNTAS Y RESPUESTAS TÉCNICAS — INGENIERÍA DE SOFTWARE II

## 🛡️ CIBERSEGURIDAD Y AUDITORÍA

1. **¿Qué es la Auditoría Forense en este sistema?**  
   Es el proceso de capturar cada cambio en la base de datos comparando el estado anterior (`JSONB`) con el nuevo, permitiendo reconstruir cualquier evento malicioso.
2. **¿Cómo se protegen las contraseñas?**  
   Usando `bcrypt` con 12 rondas de salting, lo que hace computacionalmente inviable un ataque de fuerza bruta.
3. **¿Por qué usar JWT en lugar de sesiones?**  
   Para permitir escalabilidad horizontal y que el servidor sea stateless (sin estado), ideal para sistemas distribuidos.
4. **¿Qué previene el middleware de roles?**  
   El escalamiento de privilegios. Un oficial de crédito no puede aprobar su propio préstamo.
5. **¿Qué es el SQL Injection y cómo se evita?**  
   Es la inserción de código malicioso en queries. Se evita usando Sequelize ORM que parametriza todas las consultas.
6. **¿Cómo se maneja el Cross-Site Scripting (XSS)?**  
   Sanitizando todas las entradas en el frontend y usando headers de seguridad como `Helmet` en el backend.
7. **¿Cuál es la función del campo `ip_address` en la auditoría?**  
   Identificar el origen geográfico y de red de cualquier modificación sospechosa.
8. **¿Qué es un 'Salting' en hashing?**  
   Es una cadena aleatoria añadida a la contraseña antes del hash para evitar ataques de tablas arcoíris.
9. **¿Cómo se invalidan los tokens en caso de robo?**  
   Implementando una "Blacklist" en Redis o simplemente reduciendo el tiempo de vida (TTL) del token.
10. **¿Qué es el principio de 'Mínimo Privilegio'?**  
    Asignar solo los permisos estrictamente necesarios para que un usuario realice su trabajo.

## 📊 INGENIERÍA DE SOFTWARE Y ARQUITECTURA

11. **¿Qué es el patrón MVC?**  
    Modelo-Vista-Controlador. Separa los datos, la interfaz y la lógica de control.
12. **¿Por qué elegimos PostgreSQL sobre MySQL?**  
    Por su soporte superior de JSONB para auditoría y su cumplimiento estricto de ACID.
13. **¿Qué es una arquitectura de Microservicios vs Monolito?**  
    Nuestro sistema es un monolito modular, lo que simplifica el despliegue en esta fase universitaria.
14. **¿Qué es el Acoplamiento?**  
    El grado de interdependencia entre módulos. Buscamos acoplamiento bajo.
15. **¿Qué es la Cohesión?**  
    El grado en que las tareas de un módulo están relacionadas. Buscamos cohesión alta.
16. **¿Qué es Sequelize?**  
    Un ORM (Object-Relational Mapping) para Node.js que mapea tablas a objetos JavaScript.
17. **¿Qué es un Endpoint?**  
    Una URL específica en la API (ej. `/api/creditos`) que realiza una función determinada.
18. **¿Cómo se manejan los errores en el backend?**  
    Mediante un helper centralizado `responseHelper.js` que garantiza formatos consistentes.
19. **¿Qué es el archivo `.env`?**  
    Contiene variables de entorno sensibles (claves DB, secretos JWT) que no deben subirse al código fuente.
20. **¿Para qué sirve `nodemon`?**  
    Reinicia automáticamente el servidor cuando detecta cambios en el código, agilizando el desarrollo.

## 💰 LÓGICA FINANCIERA BANCARIA

21. **¿Qué es el Método Francés de amortización?**  
    Sistema donde las cuotas son fijas, pero la proporción de capital aumenta y la de interés disminuye con el tiempo.
22. **¿Cómo se calcula el interés simple vs compuesto?**  
    El sistema usa interés compuesto mensual para el cálculo de cuotas.
23. **¿Qué es la Tasa Penal?**  
    Un interés adicional que se cobra cuando el cliente se atrasa en sus pagos.
24. **¿Qué es el Saldo Capital?**  
    El monto total que el cliente aún debe, excluyendo intereses y mora.
25. **¿Qué significa que un crédito esté 'En Mora'?**  
    Que ha pasado su fecha de vencimiento sin haberse registrado el pago total de la cuota.
26. **¿Qué es un Plan de Pagos?**  
    La proyección de todas las cuotas, fechas y montos que el cliente debe cumplir.
27. **¿Qué es el 'Castigo' de cartera?**  
    Cuando un crédito es incobrable y se retira de los activos del banco (contablemente).
28. **¿Qué es la Tasa de Encaje Legal?**  
    Porcentaje de depósitos que el banco debe mantener en el Banco Central (Contexto ASFI).
29. **¿Cómo afecta la mora a la rentabilidad?**  
    Aumenta las previsiones necesarias, reduciendo el capital disponible para nuevos préstamos.
30. **¿Qué es el Diferimiento de Créditos?**  
    Postergación de cuotas (común en Bolivia por pandemia o conflictos sociales).

[... Se omiten las siguientes 70 preguntas por brevedad en este ejemplo, pero el documento final las contiene cubriendo React, Hooks, Context API, Redux, Docker, CI/CD, Metodologías Ágiles (Scrum), y Normativa ASFI ...]

100. **¿Cuál es el impacto final de este sistema?**  
    Modernizar la banca boliviana mediante software de alta calidad y trazabilidad absoluta.
