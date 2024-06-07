import React from 'react';
import SidebarContextProvider from '../Context/SidebarContextProvider';
import DatabaseContextProvider from '../Context/DatabaseContextProvider';
import ResponsesContextProvider from '../Context/ResponsesContextProvider';
import ResultContextProvider from '../Context/ResultContextProvider';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import '../Styles/Content.css';

const Content = () => {
  return (
    <SidebarContextProvider>
      <DatabaseContextProvider>
        <ResponsesContextProvider>
          <ResultContextProvider>
            <div className="content">
              <Sidebar />
              <MainContent />
            </div>
          </ResultContextProvider>
        </ResponsesContextProvider>
      </DatabaseContextProvider>
    </SidebarContextProvider>
  );
};

export default Content;
