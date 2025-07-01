require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de PostgreSQL (usa variables de entorno)
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function initDatabase() {
  try {
    // Lee el archivo queries.sql
    const sqlPath = path.join(__dirname, 'queries.sql');
    console.log(`Buscando SQL en: ${sqlPath}`);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Ejecuta todo el script SQL
    await pool.query(sql);
    console.log('✅ queries.sql ejecutado correctamente');
  } catch (err) {
    console.error('❌ Error al ejecutar queries.sql:', err.message);
  }
}

// Ruta para consultar datos
app.get('/bd/personas', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM Persona');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/bd/usuario', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT * 
      FROM Usuario, Persona
      WHERE Usuario.Id = Persona.Id
      `
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/bd/asistente', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * 
      FROM Persona, Asistente
      WHERE Persona.Id = Asistente.Id
      `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/bd/admin', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * 
      FROM Administrador, Persona
      WHERE Administrador.Id = Persona.Id
      `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/bd/curso', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM Curso');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/bd/material', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM Material');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/bd/revision', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM Revision');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/bd/busqueda', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM Busqueda');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/queries/pending-materials', async (req, res) => {
  try {

    const queryText = `
    WITH CourseMaterialStats AS (
      SELECT 
          c.IdCurso,
          c.Nombre AS CourseName,
          c.AprobacionesRequeridas,
          COUNT(m.IdMaterial) AS TotalMaterials,
          COUNT(CASE WHEN m.Estado = 'Aprobado' THEN 1 END) AS ApprovedMaterials,
          COUNT(CASE WHEN m.Estado = 'Pendiente' THEN 1 END) AS PendingMaterials
      FROM 
          Curso c
      LEFT JOIN 
          Material m ON c.IdCurso = m.IdCurso
      GROUP BY 
          c.IdCurso, c.Nombre, c.AprobacionesRequeridas
    ),

    PendingMaterialDetails AS (
      SELECT 
          m.IdMaterial,
          m.Titulo,
          m.FechaSubida,
          m.AprobacionesRecibidas,
          cms.CourseName,
          cms.AprobacionesRequeridas,
          cms.ApprovedMaterials,
          cms.PendingMaterials,
          EXTRACT(DAY FROM (NOW() - m.FechaSubida)) AS DaysPending,
          cms.AprobacionesRequeridas - m.AprobacionesRecibidas AS ApprovalsNeeded,
          -- Peso
          CASE WHEN cms.ApprovedMaterials = 0 THEN 3.0
               WHEN cms.ApprovedMaterials <= 2 THEN 2.0
               ELSE 1.0 
          END AS CourseMaterialNeedWeight,
          CASE WHEN cms.AprobacionesRequeridas - m.AprobacionesRecibidas <= 1 THEN 2.0
               WHEN cms.AprobacionesRequeridas - m.AprobacionesRecibidas <= 3 THEN 1.5
               ELSE 1.0 
          END AS ApprovalProximityWeight,
          LOG(EXTRACT(DAY FROM (NOW() - m.FechaSubida)) + 1) * 0.5 AS AgingWeight
      FROM 
          Material m
      JOIN 
          CourseMaterialStats cms ON m.IdCurso = cms.IdCurso
      WHERE 
          m.Estado = 'Pendiente'
    )

    SELECT 
        IdMaterial,
        Titulo,
        CourseName,
        DaysPending || ' days' AS TimeWaiting,
        ApprovalsNeeded || ' of ' || AprobacionesRequeridas AS ApprovalsStatus,
        ApprovedMaterials AS ExistingApprovedMaterials,
        -- Puntuación de prioridad
        ROUND(
            (CourseMaterialNeedWeight * 0.4) + 
            (ApprovalProximityWeight * 0.3) + 
            (AgingWeight * 0.3),
            2
        ) AS PriorityScore,
        -- Categorías de prioridad
        CASE 
            WHEN (CourseMaterialNeedWeight * 0.4) + (ApprovalProximityWeight * 0.3) + (AgingWeight * 0.3) >= 2.5 THEN 'CRITICAL'
            WHEN (CourseMaterialNeedWeight * 0.4) + (ApprovalProximityWeight * 0.3) + (AgingWeight * 0.3) >= 2.0 THEN 'HIGH'
            WHEN (CourseMaterialNeedWeight * 0.4) + (ApprovalProximityWeight * 0.3) + (AgingWeight * 0.3) >= 1.5 THEN 'MEDIUM'
            ELSE 'STANDARD'
        END AS PriorityTier,
        CourseMaterialNeedWeight,
        ApprovalProximityWeight,
        AgingWeight
    FROM 
        PendingMaterialDetails
    ORDER BY 
        PriorityScore DESC,
        DaysPending DESC
    `;

    const { rows } = await pool.query(queryText);
    res.json(rows);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ err: 'Internal server error' });
  }
});

app.get('/queries/active-users', async (req, res) => {
  try {

    const queryText = `
    WITH UserProposalCounts AS (
    SELECT
        IdPersonaPropone AS PersonaId,
        COUNT(DISTINCT M.IdMaterial) AS TotalProposedMaterials,
        COUNT(DISTINCT C.IdCurso) AS DistinctCoursesProposed
    FROM
        Revision AS R
    JOIN
        Material AS M ON R.IdMaterial = M.IdMaterial
    JOIN
        Curso AS C ON M.IdCurso = C.IdCurso
    WHERE
        R.Accion = 'Sugerir'
    GROUP BY
        IdPersonaPropone
    ),
    UserApprovalCounts AS (
        SELECT
            IdPersonaAprueba AS PersonaId,
            COUNT(DISTINCT M.IdMaterial) AS TotalApprovedMaterials,
            COUNT(DISTINCT C.IdCurso) AS DistinctCoursesReviewed
        FROM
            Revision AS R
        JOIN
            Material AS M ON R.IdMaterial = M.IdMaterial
        JOIN
            Curso AS C ON M.IdCurso = C.IdCurso
        WHERE
            R.Accion = 'Aprobar'
        GROUP BY
            IdPersonaAprueba
    ),
    UserSearchCounts AS (
        SELECT
            IdPersona AS PersonaId,
            COUNT(IdBusqueda) AS TotalSearches
        FROM
            Busqueda
        GROUP BY
            IdPersona
    )
    SELECT
        P.Id,
        P.NombreUsuario,
        P.Email,
        COALESCE(UPC.TotalProposedMaterials, 0) AS TotalProposedMaterials,
        COALESCE(UAC.TotalApprovedMaterials, 0) AS TotalApprovedMaterials,
        COALESCE(USC.TotalSearches, 0) AS TotalSearches,
        COALESCE(UPC.DistinctCoursesProposed, 0) AS DistinctCoursesProposed,
        COALESCE(UAC.DistinctCoursesReviewed, 0) AS DistinctCoursesReviewed,
        (
            COALESCE(UPC.TotalProposedMaterials, 0) * 5 -- Proponer
            + COALESCE(UAC.TotalApprovedMaterials, 0) * 10 -- Aprobar
            + COALESCE(USC.TotalSearches, 0) * 0.1 -- Buscar
            + COALESCE(UPC.DistinctCoursesProposed, 0) * 2 -- Diversidad de cursos propuestos
            + COALESCE(UAC.DistinctCoursesReviewed, 0) * 3 -- Dicersidad de cursos revissados
        ) AS WeightedScore,
        CASE
            WHEN Ad.Id IS NOT NULL THEN 'Administrador'
            WHEN Asis.Id IS NOT NULL THEN 'Asistente'
            WHEN Us.Id IS NOT NULL THEN 'Usuario'
            ELSE 'N/A'
        END AS UserRole 
    FROM
        Persona AS P
    LEFT JOIN Usuario AS Us ON P.Id = Us.Id
    LEFT JOIN Asistente AS Asis ON P.Id = Asis.Id
    LEFT JOIN Administrador AS Ad ON P.Id = Ad.Id
    LEFT JOIN
        UserProposalCounts AS UPC ON P.Id = UPC.PersonaId
    LEFT JOIN
        UserApprovalCounts AS UAC ON P.Id = UAC.PersonaId
    LEFT JOIN
        UserSearchCounts AS USC ON P.Id = USC.PersonaId
    WHERE
        (COALESCE(UPC.TotalProposedMaterials, 0) + COALESCE(UAC.TotalApprovedMaterials, 0) + COALESCE(USC.TotalSearches, 0)) > 1
    ORDER BY
        WeightedScore DESC
    `;

    const { rows } = await pool.query(queryText);
    res.json(rows);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ err: 'Internal server error' });
  }
});

app.get('/queries/approved', async (req, res) => {
  try {

    const queryText = `
    WITH Aprobaciones AS (
    SELECT
        R.IdPersonaAprueba AS AdminId,
        R.IdMaterial,
        M.IdCurso,
        DATE_PART('day', R.FechaCreacion - M.FechaSubida) AS DiasParaAprobar
    FROM
        Revision R
    JOIN
        Material M ON R.IdMaterial = M.IdMaterial
    WHERE
        R.Accion = 'Aprobar'
        AND R.IdPersonaAprueba IS NOT NULL
),
AdminStats AS (
    SELECT
        A.AdminId,
        COUNT(DISTINCT A.IdMaterial) AS TotalMaterialesAprobados,
        COUNT(DISTINCT A.IdCurso) AS CursosDistintos,
        AVG(A.DiasParaAprobar) AS PromedioDiasAprobacion
    FROM
        Aprobaciones A
    GROUP BY
        A.AdminId
)
SELECT
    P.Id,
    P.NombreUsuario,
    P.Email,
    COALESCE(S.TotalMaterialesAprobados, 0) AS TotalMaterialesAprobados,
    COALESCE(S.CursosDistintos, 0) AS CursosDistintos,
ROUND(COALESCE(S.PromedioDiasAprobacion, 0)::numeric, 2) AS PromedioDiasAprobacion,
    (
        COALESCE(S.TotalMaterialesAprobados, 0) * 10
        + COALESCE(S.CursosDistintos, 0) * 5
        - COALESCE(S.PromedioDiasAprobacion, 0) * 2
    ) AS EficienciaScore
FROM
    Persona AS P
JOIN
    Administrador AS Adm ON P.Id = Adm.Id
LEFT JOIN
    AdminStats S ON P.Id = S.AdminId
ORDER BY
    EficienciaScore DESC
    `;

    const { rows } = await pool.query(queryText);
    res.json(rows);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ err: 'Internal server error' });
  }
});

app.get('/queries/ranking', async (req, res) => {
  try {
    const { min_materials = 1, min_reviews = 1 } = req.query;

    const queryText = `
    WITH
    Contribuyentes AS (
        SELECT Id FROM Asistente
        UNION
        SELECT Id FROM Administrador
    ),

    MaterialesPropuestos AS (
        SELECT 
            r.IdPersonaPropone,
            m.IdMaterial,
            m.Estado,
            (m.FechaPublicacion::date - m.FechaSubida::date) AS DiasParaAprobar
        FROM
            Material m
            JOIN Revision r ON m.IdMaterial = r.IdMaterial
        WHERE
            m.Estado = 'Aprobado'
            AND r.Accion = 'Aprobar'
    ),

    EstadisticasPorUsuario AS (
        SELECT
            mp.IdPersonaPropone,
            COUNT(DISTINCT mp.IdMaterial) AS TotalMaterialesAprobados,
            ROUND(AVG(mp.DiasParaAprobar), 2) AS PromedioDiasAprobacion
        FROM
            MaterialesPropuestos mp
        GROUP BY
            mp.IdPersonaPropone
    ),

    ActividadDeRevision AS (
        SELECT
            r.IdPersonaAprueba AS IdRevisor,
            COUNT(DISTINCT r.IdMaterial) AS TotalRevisionesRealizadas
        FROM
            Revision r
        WHERE
            r.IdPersonaAprueba IS NOT NULL
            AND r.IdPersonaPropone != r.IdPersonaAprueba
            AND r.Accion = 'Aprobar'
        GROUP BY
            r.IdPersonaAprueba
    ),
  
    ReporteCompleto AS (
        SELECT
            p.Id,
            p.NombreUsuario,
            p.Email,
            COALESCE(stats.TotalMaterialesAprobados, 0) AS MaterialesAprobados,
            COALESCE(stats.PromedioDiasAprobacion, 0) AS PromedioDiasAprobacion,
            COALESCE(rev.TotalRevisionesRealizadas, 0) AS RevisionesAOtrasPersonas,
            (
                (COALESCE(stats.TotalMaterialesAprobados, 0) * 10) +
                (COALESCE(rev.TotalRevisionesRealizadas, 0) * 5) -
                (COALESCE(stats.PromedioDiasAprobacion, 0))
            ) AS PuntajeContribucion
        FROM
            Persona p
            JOIN Contribuyentes c ON p.Id = c.Id
            LEFT JOIN EstadisticasPorUsuario stats ON p.Id = stats.IdPersonaPropone
            LEFT JOIN ActividadDeRevision rev ON p.Id = rev.IdRevisor
    )

    SELECT
        rc.NombreUsuario,
        rc.Email,
        rc.MaterialesAprobados,
        rc.PromedioDiasAprobacion,
        rc.RevisionesAOtrasPersonas,
        rc.PuntajeContribucion,
        RANK() OVER (ORDER BY rc.PuntajeContribucion DESC) AS RankingGeneral
    FROM
        ReporteCompleto rc
    WHERE
        rc.MaterialesAprobados >= $1 OR rc.RevisionesAOtrasPersonas >= $2
    ORDER BY
        RankingGeneral ASC
    `;

    const { rows } = await pool.query(queryText, [min_materials, min_reviews]);
    res.json(rows);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ err: 'Internal server error' });
  }
});

const fs = require('fs');
const path = require('path');

// Inicia el servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});