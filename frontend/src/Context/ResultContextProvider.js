import React, { useState, createContext, useContext } from 'react';

const ResultContext = createContext(null);

export const useResultContext = () => useContext(ResultContext);

const ResultContextProvider = ({ children }) => {
  const [results, setResults] = useState([]);

  const updateResultsSuccess = (tableName, tableData) => {
    setResults(prevResults => [...prevResults, {type: "success", tableName, tableData}]);
  }

  const updateResultsError = (errorMessage) => {
    setResults(prevResults => [...prevResults, {type: "error", errorMessage}]);
  }

  const removeResult = (index) => {
    const filteredResults = results.filter((_, i) => i !== index);
    setResults(filteredResults);
  }

  const contextValues = {
    results, updateResultsSuccess, updateResultsError, removeResult
  }

  return (
    <ResultContext.Provider value={contextValues}>
      { children }
    </ResultContext.Provider>
  );
};

export default ResultContextProvider;
