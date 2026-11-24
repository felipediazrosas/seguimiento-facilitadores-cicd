/* ============================================================
   config.js — CONFIGURACIÓN DE LA PLATAFORMA
   ============================================================

   ╔══════════════════════════════════════════════════════════╗
   ║  CONEXIÓN CONDICIONAL A LA BASE DE DATOS                 ║
   ║                                                          ║
   ║  La plataforma NO está amarrada a una base de datos.     ║
   ║  CONFIG.DATA_SOURCE decide dónde se leen y guardan los   ║
   ║  datos. Para desplegarla en otro entorno basta con       ║
   ║  cambiar este archivo o escribir un adaptador nuevo en   ║
   ║  js/store.js con la misma interfaz.                      ║
   ╚══════════════════════════════════════════════════════════╝

   Valores de DATA_SOURCE:
   · 'auto'   → prueba en este orden y usa el primero disponible:
                1) API REST (si CONFIG.REST.BASE_URL responde en /health)
                2) almacenamiento local del navegador
   · 'rest'   → solo API REST propia (ver server/ y db/contrato-api.md)
   · 'local'  → solo este navegador (localStorage); sin servidor, un usuario

   Si la fuente elegida no está disponible, la plataforma cae en modo
   local y lo indica en la barra de estado (FALLBACK_TO_LOCAL).
   ============================================================ */
const CONFIG = {
  APP_NAME: 'Guía de estandarización y seguimiento de facilitadores',
  VERSION: '1.2.0',

  /* ---------- >>> FUENTE DE DATOS (CONDICIONAL) <<< ---------- */
  DATA_SOURCE: 'auto', // 'auto' | 'rest' | 'local'
  FALLBACK_TO_LOCAL: true, // si la fuente elegida falla, usar modo local

  /* ---------- API REST (usada cuando DATA_SOURCE es 'rest' o 'auto') ---------- */
  REST: {
    BASE_URL: '/api', // misma URL del servidor; o 'https://servidor.ejemplo.edu.co/api'
    TOKEN: '', // token Bearer opcional para un backend que lo exija
    POLL_MS: 3000, // cada cuánto se consultan cambios (tiempo casi real)
    TIMEOUT_MS: 2500 // espera máxima para detectar el servidor
  },

  /* ---------- Almacenamiento local ---------- */
  LOCAL: {
    PREFIX: 'guia3:' // prefijo de las llaves en localStorage
  },

  /* ---------- Colecciones que la plataforma necesita ----------
     Deben existir (o poder crearse) en cualquier base de datos que se conecte.
     Ver db/esquema.sql y la documentación, sección «Modelo de datos». */
  COLLECTIONS: ['excel', 'asig', 'nov', 'seg', 'cierre', 'rutina'],

  /* ---------- Librerías para leer y escribir Excel ----------
     Primero se intenta la copia local (vendor/) y si no existe, la CDN. */
  LIBS: {
    XLSX: ['vendor/xlsx.full.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'],
    JSZIP: ['vendor/jszip.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js']
  }
};
