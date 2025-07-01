import { useState } from 'react';
import axios from 'axios';
import { type CSSProperties } from 'react';

const API_URL = 'http://localhost:3001';

type QueryResult = {
  columns: string[];
  data: any[];
};

// Tipos para los parámetros adicionales
type QueryParams = {
  min_materials?: number;
  min_reviews?: number;
};

const App = () => {
  const [selectedQuery, setSelectedQuery] = useState<string>('');
  const [queryResults, setQueryResults] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [queryParams, setQueryParams] = useState<QueryParams>({});

  const queries = [
    { id: 'bd/personas', name: 'Personas' },
    { id: 'bd/usuario', name: 'Usuarios' },
    { id: 'bd/asistente', name: 'Asistentes' },
    { id: 'bd/admin', name: 'Administradores' },
    { id: 'bd/curso', name: 'Cursos' },
    { id: 'bd/material', name: 'Materiales' },
    { id: 'bd/revision', name: 'Revisiones' },
    { id: 'bd/busqueda', name: 'Busquedas' },
    { id: 'queries/pending-materials', name: 'Materiales Pendientes'},
    { id: 'queries/active-users', name: 'Usuarios Activos'},
    { id: 'queries/approved', name: 'Eficiencia de aprobacion'},
    { id: 'queries/ranking', name: 'Ranking de contribuyentes', needsParams: true}
  ];

  const executeQuery = async () => {
    if (!selectedQuery) {
      setError('Por favor selecciona una consulta');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`${API_URL}/${selectedQuery}`, {
        params: queryParams
      });
      setQueryResults({
        columns: Object.keys(response.data[0] || {}),
        data: response.data
      });
    } catch (err) {
      setError('Error al ejecutar la consulta');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Maneja cambios en los parámetros adicionales
  const handleParamChange = (key: keyof QueryParams, value: any) => {
    setQueryParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Renderiza los controles adicionales según la query seleccionada
  const renderAdditionalControls = () => {
    const currentQuery = queries.find(q => q.id === selectedQuery);
    
    if (!currentQuery?.needsParams) return null;

    switch (selectedQuery) {
      case 'queries/ranking':
        return (
          <div style={styles.additionalControls}>
            <label style={styles.paramLabel}>
              Materiales minimos:
              <input
                type="number"
                value={queryParams.min_materials || ''}
                onChange={(e) => handleParamChange('min_materials', e.target.value)}
                style={styles.paramInput}
              />
            </label>
          </div>
        );
      default:
        return null;
    }
  };

  // Estilos con tipos CSSProperties
  const styles: Record<string, CSSProperties> = {
    appContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    },
    querySelector: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
      alignItems: 'center'
    },
    select: {
      padding: '8px 12px',
      fontSize: '16px',
      minWidth: '300px'
    },
    button: {
      padding: '8px 16px',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '16px'
    },
    buttonDisabled: {
      backgroundColor: '#cccccc',
      cursor: 'not-allowed'
    },
    errorMessage: {
      color: '#d32f2f',
      margin: '10px 0',
      padding: '10px',
      backgroundColor: '#fde0e0',
      borderRadius: '4px'
    },
    resultsContainer: {
      marginTop: '20px'
    },
    resultsTable: {
      overflowX: 'auto' as 'auto', // Tipo específico para overflowX
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      borderRadius: '8px',
      marginTop: '20px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px'
    },
    th: {
      backgroundColor: '#f8f9fa',
      padding: '12px 16px',
      textAlign: 'left',
      borderBottom: '2px solid #e9ecef',
      position: 'sticky',
      top: 0,
      fontWeight: 600,
      color: '#495057'
    },
    td: {
      padding: '12px 16px',
      borderBottom: '1px solid #e9ecef',
      color: '#212529'
    },
    trEven: {
      backgroundColor: '#f8f9fa'
    },
    trHover: {
      backgroundColor: '#f1f3f5'
    },
    header: {
      color: '#2c3e50',
      marginBottom: '24px',
      paddingBottom: '10px',
      borderBottom: '2px solid #eee'
    },
    additionalControls: {
      display: 'flex',
      gap: '15px',
      margin: '15px 0',
      padding: '15px',
      backgroundColor: '#f5f7fa',
      borderRadius: '8px',
      flexWrap: 'wrap'
    },
    paramLabel: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#4a5568'
    },
    paramInput: {
      padding: '8px 12px',
      border: '1px solid #e2e8f0',
      borderRadius: '4px',
      fontSize: '14px'
    }
  };

  return (
    <div style={styles.appContainer}>
      <h1 style={styles.header}>Administrador de Consultas</h1>
      
      <div style={styles.querySelector}>
        <select 
          value={selectedQuery}
          onChange={(e) => {
            setSelectedQuery(e.target.value);
            setQueryParams({}); // Resetear parámetros al cambiar query
          }}
          style={styles.select}
        >
          <option value="">Selecciona una consulta</option>
          {queries.map((query) => (
            <option key={query.id} value={query.id}>
              {query.name}
            </option>
          ))}
        </select>
        
        <button 
          onClick={executeQuery} 
          disabled={!selectedQuery || loading}
          style={{
            ...styles.button,
            ...(!selectedQuery || loading ? styles.buttonDisabled : {})
          }}
        >
          {loading ? 'Ejecutando...' : 'Ejecutar Consulta'}
        </button>
      </div>

      {/* Controles adicionales */}
      {renderAdditionalControls()}

      {error && <div style={styles.errorMessage}>{error}</div>}

      {queryResults && (
        <div style={styles.resultsContainer}>
          <h2>Resultados</h2>
          <div style={styles.resultsTable}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {queryResults.columns.map((column) => (
                    <th key={column} style={styles.th}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {queryResults.data.map((row, index) => (
                  <tr 
                    key={index}
                    style={{
                      ...(index % 2 === 0 ? styles.trEven : {}),
                      ...styles.trHover
                    }}
                  >
                    {queryResults.columns.map((column) => (
                      <td key={`${index}-${column}`} style={styles.td}>
                        {typeof row[column] === 'object' 
                          ? JSON.stringify(row[column]) 
                          : row[column]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;