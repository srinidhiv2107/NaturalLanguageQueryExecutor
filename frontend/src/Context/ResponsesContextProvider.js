import React, { useState, createContext, useContext } from 'react';

const ResponsesContext = createContext(null);

export const useResponsesContext = () => useContext(ResponsesContext);

const ResponsesContextProvider = ({ children }) => {
  const [responses, setResponses] = useState([]);

  const updateResponsesForWait = (type) => {
    setResponses(prevResponses => [{ type, info: "Waiting for the response..." }, ...prevResponses]);
  }

  const finalUpdateWithInfo = (info) => {
    setResponses(prevResponses => {
      const newResponses = [...prevResponses];
      newResponses[0].info = info;
      return newResponses;
    });
  }

  const contextValues = {
    responses, updateResponsesForWait, finalUpdateWithInfo
  };

  return (
    <ResponsesContext.Provider value={contextValues}>
      {children}
    </ResponsesContext.Provider>
  );
};

export default ResponsesContextProvider;
