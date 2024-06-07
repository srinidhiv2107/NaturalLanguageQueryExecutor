import React, { useState, createContext, useContext } from 'react';

const DatabaseContext = createContext(null);
const DatabaseUpdateContext = createContext(null);

export const useDB = () => useContext(DatabaseContext);
export const useUpdateDB = () => useContext(DatabaseUpdateContext);

const DatabaseContextProvider = ({ children }) => {
  const [DB, setDB] = useState("");

  const updateDB = (newDB) => setDB(newDB);

  return (
    <DatabaseContext.Provider value={DB}>
      <DatabaseUpdateContext.Provider value={updateDB}>
        { children }
      </DatabaseUpdateContext.Provider>
    </DatabaseContext.Provider>
  );
};

export default DatabaseContextProvider;
