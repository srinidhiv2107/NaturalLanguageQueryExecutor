import React, { useState, createContext, useContext } from 'react';

const HistoryContext = createContext(null);

export const useHistoryContext = () => useContext(HistoryContext);

const HistoryContextProvider = ({ children }) => {
  const [history, setHistory] = useState([]);

  const updateHistory = (NLQ, SQL) => {
    setHistory(prevHistory => [{ NLQ, SQL }, ...prevHistory]);
  }

  const contextValues = { history, updateHistory };

  return (
    <HistoryContext.Provider value={contextValues}>
      { children }
    </HistoryContext.Provider>
  );
};

export default HistoryContextProvider;
