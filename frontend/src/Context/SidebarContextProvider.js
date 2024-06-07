import React, { useState, createContext, useContext } from 'react';

const SidebarContext = createContext(null);

export const useSidebarContext = () => useContext(SidebarContext);

const SidebarContextProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);

  const contextValues = {
    isCollapsed, setIsCollapsed, selectedOption, setSelectedOption
  };

  return (
    <SidebarContext.Provider value={contextValues}>
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarContextProvider;
